# @hyperwhisper/mcp

Model Context Protocol server that lets Cursor, Claude Desktop, Claude Code, and any other MCP-capable agent talk to a running [HyperWhisper](https://hyperwhisper.com) app. The agent gets seven tools: `health`, `list_models`, `list_modes`, `transcribe`, `post_process`, `search_recordings`, and `get_recording`.

## Prerequisites

1. Install HyperWhisper for macOS.
2. Open **Settings → Local API** and turn the toggle on.
3. Make sure `node` (>= 18) is on your `PATH` so `npx` can run the bridge.

The MCP server discovers the local API automatically by reading `~/Library/Application Support/HyperWhisper/local-api.json`, which the HyperWhisper app writes when the toggle is on.

## Install

The bridge is published as `@hyperwhisper/mcp`. No global install needed:

```bash
npx -y @hyperwhisper/mcp
```

## Client configuration

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "hyperwhisper": {
      "command": "npx",
      "args": ["-y", "@hyperwhisper/mcp"]
    }
  }
}
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "hyperwhisper": {
      "command": "npx",
      "args": ["-y", "@hyperwhisper/mcp"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add hyperwhisper -- npx -y @hyperwhisper/mcp
```

## Verify

In a fresh agent session ask:

> Use hyperwhisper to transcribe `/Users/me/voice.wav`.

The agent should call the `transcribe` tool and return the text.

## Docs

Full setup guide and troubleshooting: <https://hyperwhisper.com/docs/api-reference/local-api/mcp-setup>.

## License

MIT
