#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools.js";

async function main() {
  const server = new McpServer({
    name: "hyperwhisper",
    version: "0.1.1",
  });
  registerTools(server);
  await server.connect(new StdioServerTransport());
}

main().catch((err) => {
  console.error("[hyperwhisper-mcp] fatal:", err);
  process.exit(1);
});
