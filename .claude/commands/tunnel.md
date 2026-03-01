Start a Cloudflare tunnel to expose the local MCP server for claude.ai testing.

1. Run `bunx cloudflared tunnel --url http://localhost:4545`
2. Print the tunnel URL when it's ready
3. Remind the user to add the tunnel URL + `/mcp` as a custom MCP connector in claude.ai
