import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callApi, type ApiResult } from "./client.js";
import { HyperWhisperNotRunningError } from "./discovery.js";

type ToolReturn = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

function ok(payload: unknown): ToolReturn {
  const text =
    typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  return { content: [{ type: "text", text }] };
}

function err(payload: unknown): ToolReturn {
  const text =
    typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  return { content: [{ type: "text", text }], isError: true };
}

function envelope(result: ApiResult): ToolReturn {
  const { status, body } = result;
  if (status >= 400) {
    return err({ http_status: status, body });
  }
  if (
    body &&
    typeof body === "object" &&
    "ok" in body &&
    (body as { ok: unknown }).ok === false
  ) {
    return err(body);
  }
  if (
    body &&
    typeof body === "object" &&
    "text" in body &&
    typeof (body as { text: unknown }).text === "string"
  ) {
    return ok((body as { text: string }).text);
  }
  return ok(body);
}

async function safeCall(fn: () => Promise<ApiResult>): Promise<ToolReturn> {
  try {
    return envelope(await fn());
  } catch (e) {
    if (e instanceof HyperWhisperNotRunningError) {
      return err({ code: e.code, message: e.message });
    }
    return err({
      code: "UNEXPECTED_ERROR",
      message: e instanceof Error ? e.message : String(e),
    });
  }
}

export function registerTools(server: McpServer): void {
  server.registerTool(
    "health",
    {
      title: "Health check",
      description:
        "Check whether HyperWhisper is running. Returns app version, server status, provider health, and installed local models. No auth required.",
      inputSchema: {},
    },
    async () =>
      safeCall(() => callApi({ path: "/health", requiresAuth: false })),
  );

  server.registerTool(
    "list_models",
    {
      title: "List models",
      description:
        "List every speech-to-text and post-processing model HyperWhisper knows about.",
      inputSchema: {
        kind: z
          .enum(["voice", "text", "all"])
          .optional()
          .describe("Filter by model kind."),
        installed_only: z
          .boolean()
          .optional()
          .describe("If true, only return models that are installed locally."),
      },
    },
    async ({ kind, installed_only }) =>
      safeCall(() =>
        callApi({
          path: "/models",
          query: { kind, installed_only },
        }),
      ),
  );

  server.registerTool(
    "list_modes",
    {
      title: "List modes",
      description: "List saved HyperWhisper transcription modes.",
      inputSchema: {},
    },
    async () => safeCall(() => callApi({ path: "/modes" })),
  );

  server.registerTool(
    "transcribe",
    {
      title: "Transcribe audio",
      description:
        "Transcribe an audio file. `file` must be an absolute path readable by the HyperWhisper app.",
      inputSchema: {
        file: z.string().describe("Absolute path to an audio file."),
        engine: z
          .string()
          .optional()
          .describe("Optional engine override, e.g. `whisperLocal`, `openai`."),
        model: z
          .string()
          .optional()
          .describe("Optional model override, e.g. `large-v3`."),
        language: z
          .string()
          .optional()
          .describe("BCP-47 language tag or `auto` (default)."),
      },
    },
    async ({ file, engine, model, language }) =>
      safeCall(() =>
        callApi({
          method: "POST",
          path: "/transcribe",
          body: { file, engine, model, language },
        }),
      ),
  );

  server.registerTool(
    "post_process",
    {
      title: "Post-process text",
      description:
        "Rewrite transcribed text via an AI preset or a free-form prompt. Provide exactly one of `preset` or `prompt`.",
      inputSchema: {
        text: z.string().describe("Raw transcript to rewrite."),
        preset: z
          .enum(["hyper", "note", "email", "commit", "prompt"])
          .optional()
          .describe("Built-in rewriting preset."),
        prompt: z
          .string()
          .optional()
          .describe("Free-form system prompt. Mutually exclusive with preset."),
        provider: z
          .string()
          .optional()
          .describe("Optional LLM provider override."),
        model: z
          .string()
          .optional()
          .describe("Optional LLM model override."),
      },
    },
    async ({ text, preset, prompt, provider, model }) =>
      safeCall(() =>
        callApi({
          method: "POST",
          path: "/post-process",
          body: { text, preset, prompt, provider, model },
        }),
      ),
  );

  server.registerTool(
    "search_recordings",
    {
      title: "Search recordings",
      description:
        "Substring search across past HyperWhisper transcripts. All filters optional.",
      inputSchema: {
        q: z.string().optional().describe("Substring to match."),
        since: z
          .string()
          .optional()
          .describe("ISO 8601 lower bound, inclusive."),
        until: z
          .string()
          .optional()
          .describe("ISO 8601 upper bound, exclusive."),
        limit: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Maximum rows to return."),
      },
    },
    async ({ q, since, until, limit }) =>
      safeCall(() =>
        callApi({
          path: "/recordings/search",
          query: { q, since, until, limit },
        }),
      ),
  );

  server.registerTool(
    "get_recording",
    {
      title: "Get recording",
      description: "Fetch a single recording's transcript and metadata by ID.",
      inputSchema: {
        id: z.string().describe("Recording UUID."),
      },
    },
    async ({ id }) =>
      safeCall(() =>
        callApi({ path: `/recordings/${encodeURIComponent(id)}` }),
      ),
  );
}
