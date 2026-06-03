import { discover, HyperWhisperNotRunningError } from "./discovery.js";

export interface ApiResult {
  status: number;
  body: unknown;
}

export interface RequestOptions {
  method?: "GET" | "POST";
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  requiresAuth?: boolean;
}

function buildUrl(
  baseUrl: string,
  path: string,
  query?: RequestOptions["query"],
): string {
  const url = new URL(path, baseUrl);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function callApi(opts: RequestOptions): Promise<ApiResult> {
  const { baseUrl, token } = discover();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.requiresAuth !== false) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const url = buildUrl(baseUrl, opts.path, opts.query);

  let response: Response;
  try {
    response = await fetch(url, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
  } catch (err) {
    throw new HyperWhisperNotRunningError(
      `fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const text = await response.text();
  let parsed: unknown = text;
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      /* leave as raw text */
    }
  }
  return { status: response.status, body: parsed };
}
