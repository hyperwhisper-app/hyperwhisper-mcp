import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface DiscoveryInfo {
  port: number;
  token: string;
  baseUrl: string;
}

const DISCOVERY_PATH = join(
  homedir(),
  "Library/Application Support/HyperWhisper/local-api.json",
);

export class HyperWhisperNotRunningError extends Error {
  readonly code = "HYPERWHISPER_NOT_RUNNING";
  constructor(reason: string) {
    super(
      `HyperWhisper local API not reachable: ${reason}. ` +
        `Open HyperWhisper, then enable Settings → Local API.`,
    );
    this.name = "HyperWhisperNotRunningError";
  }
}

export function discover(): DiscoveryInfo {
  let raw: string;
  try {
    raw = readFileSync(DISCOVERY_PATH, "utf8");
  } catch {
    throw new HyperWhisperNotRunningError(
      `discovery file missing at ${DISCOVERY_PATH}`,
    );
  }

  let parsed: { port?: number; token?: string };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new HyperWhisperNotRunningError("discovery file is not valid JSON");
  }

  const { port, token } = parsed;
  if (typeof port !== "number" || typeof token !== "string" || !token) {
    throw new HyperWhisperNotRunningError(
      "discovery file is missing `port` or `token`",
    );
  }

  return { port, token, baseUrl: `http://127.0.0.1:${port}` };
}
