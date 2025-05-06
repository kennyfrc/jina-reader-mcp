# Using Jina Reader with npx

This guide explains how to use the Jina Reader package using npx, both for users and developers.

## For Users: Running Jina Reader from npm

The easiest way to use Jina Reader is directly from npm without installing it globally.

### Prerequisites

- Node.js (v18+)
- A Jina API key (sign up at [Jina AI](https://jina.ai/) if you don't have one)

### Running with npx

Run the Jina Reader server with a single command:

```bash
JINA_API_KEY=your_jina_api_key npx -y @kennyfrc/jina-reader
```

This command:
1. Sets your Jina API key as an environment variable
2. Uses npx to run the package without installing it
3. The `-y` flag automatically confirms any prompts

### Integrating with Claude Desktop

To use Jina Reader with Claude Desktop:

1. Create or edit your `claude-desktop-config.json` file:

```json
{
  "mcpServers": {
    "jina-reader": {
      "command": "npx",
      "args": ["-y", "@kennyfrc/jina-reader"],
      "env": {
        "JINA_API_KEY": "your_jina_api_key_here"
      }
    }
  }
}
```

2. Place this file in:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

3. Restart Claude Desktop to load your MCP server.

## For Developers: Testing Local Changes

If you're developing new features or fixing bugs, you'll want to test your local changes before publishing.

### Testing Local Changes with npx

1. Make your changes to the code
2. Build the package:
   ```bash
   npm run build
   ```
3. Test the local package with npx:
   ```bash
   JINA_API_KEY=your_jina_api_key npx -y .
   ```

This will run the package from your local directory instead of downloading it from npm.

### Linking for Development

For more extended development, you can use npm link:

1. In your project directory, run:
   ```bash
   npm link
   ```
2. Now you can run it as if it were globally installed:
   ```bash
   JINA_API_KEY=your_jina_api_key jina-reader
   ```

When you're done developing, unlink with:
```bash
npm unlink
```

## Testing with Claude Desktop

To test your local development version with Claude Desktop:

1. Update your `claude-desktop-config.json`:

```json
{
  "mcpServers": {
    "jina-reader": {
      "command": "node",
      "args": ["/absolute/path/to/your/jina-reader/dist/index.js"],
      "env": {
        "JINA_API_KEY": "your_jina_api_key_here"
      }
    }
  }
}
```

2. Restart Claude Desktop after every change and rebuild.

## Common Issues and Solutions

### Permission Denied

If you get a permission denied error when running with npx:

```
Error: EACCES: permission denied
```

Make sure your `dist/index.js` file is executable:

```bash
chmod +x dist/index.js
```

### API Key Not Found

If you see an error about the API key not being found:

```
Error: JINA_API_KEY environment variable not set
```

Make sure you're properly setting the environment variable before running the command.

### Version Conflicts

If you're experiencing issues with dependencies, try using the `--ignore-existing` flag:

```bash
JINA_API_KEY=your_jina_api_key npx -y --ignore-existing @kennyfrc/jina-reader
```

## Next Steps

After you've successfully got the package running with npx, try:

1. Using the available tools in Claude
2. Creating your own MCP tools (see [how-to-create-mcp-server.md](how-to-create-mcp-server.md))
3. Contributing to the project by adding new features or improving documentation