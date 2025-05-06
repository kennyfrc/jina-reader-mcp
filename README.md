# Jina Reader MCP

A Model Context Protocol (MCP) server for integrating with Jina Reader API, allowing Claude and other AI assistants to read and extract content from webpages, HTML, and PDF files.

## Features

- Read content from URLs
- Process HTML content directly
- Extract information from PDF files (base64 encoded)
- Format responses with links and metadata

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Using with npx

The easiest way to use this package is with npx. You need to provide your Jina API key as an environment variable:

```bash
# Set the API key directly in the command
JINA_API_KEY=your_jina_api_key npx -y @kennyfrc/jina-mcp
```

### Starting the server locally

If you've cloned the repository:

```bash
# Provide the API key when running
JINA_API_KEY=your_jina_api_key npm start
```

### Integrating with Claude Desktop

Add this to your `claude-desktop-config.json`:

```json
{
  "mcpServers": {
    "jina-reader": {
      "command": "npx",
      "args": ["-y", "@kennyfrc/jina-mcp"],
      "env": {
        "JINA_API_KEY": "your_jina_api_key_here"
      }
    }
  }
}
```

Or if you've cloned the repository:

```json
{
  "mcpServers": {
    "jina-reader": {
      "command": "node",
      "args": ["/absolute/path/to/your/dist/index.js"],
      "env": {
        "JINA_API_KEY": "your_jina_api_key_here"
      }
    }
  }
}
```

Place this file in:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

Restart Claude Desktop to load your MCP server.

## Available Tools

Each tool accepts the following optional parameters:

### Common Parameters

- `engine`: Control the rendering engine:
  - `none`: Default rendering engine (good balance of quality and speed)
  - `direct`: Speed-optimized rendering
  - `browser`: Quality-optimized rendering
  - `cf-browser-rendering`: Experimental rendering

- `max_length`: Maximum number of characters to return (default is 20000)
  - **Important**: This parameter is essential for controlling token usage, especially with large documents like research papers
  - By default, content is truncated to 20,000 characters to prevent excessive token consumption
  - The response includes pagination information when content is clipped
  - Pagination details show the current character range and guidance for subsequent requests

- `start_index`: Start content from the character index (default is 0)
  - Essential for paginating through large documents
  - Works with the pagination info provided in clipped responses
  - For example, to get the next page of content after seeing "Currently showing characters 0-20000", use `start_index=20000`

### Tools

- `jina_read_url`: Read and extract content from a webpage
  ```javascript
  {
    "url": "https://example.com",
    "engine": "browser", // Optional, for best quality
    "max_length": 10000, // Optional, limit output length
    "start_index": 0     // Optional, pagination starting point
  }
  ```

- `jina_read_html`: Read and extract content from HTML
  ```javascript
  {
    "html": "<html>...</html>",
    "engine": "direct",  // Optional, for faster processing
    "max_length": 10000, // Optional, limit output length
    "start_index": 0     // Optional, pagination starting point
  }
  ```

- `jina_read_pdf`: Read and extract content from a PDF file
  ```javascript
  {
    "pdf": "base64_encoded_pdf_content",
    "engine": "none",    // Optional, uses default engine
    "max_length": 10000, // Optional, limit output length
    "start_index": 0     // Optional, pagination starting point
  }
  ```

### Pagination

When dealing with large documents (like research papers or lengthy articles), the content will be automatically clipped to control token usage. The response includes clear pagination information:

```
[PAGINATION INFO]
- Content clipped: Currently showing characters 0-20000 of approximately 78000 total
- To view the next section, use start_index=20000 with the same max_length
- Complete content can be accessed by making multiple paginated requests
```

To retrieve subsequent pages, make additional requests with updated `start_index` values:

```javascript
// First request (page 1)
{
  "url": "https://arxiv.org/html/2401.14196v1",
  "max_length": 20000
  // start_index defaults to 0
}

// Second request (page 2)
{
  "url": "https://arxiv.org/html/2401.14196v1",
  "max_length": 20000,
  "start_index": 20000
}

// Third request (page 3)
{
  "url": "https://arxiv.org/html/2401.14196v1",
  "max_length": 20000,
  "start_index": 40000
}
```

### Caching

This MCP server implements two levels of caching:

1. **Local Memory Cache**: Responses are cached in memory for 3 hours to improve performance and reduce API calls
   - Optimized for documentation content which changes infrequently
   - Significantly reduces API usage for repeated queries
2. **Jina API Server Cache**: The Jina API also caches responses using the `X-Cache` header

The caching system helps to:
- Improve response times
- Reduce API usage
- Decrease latency for repeated requests
- Minimize costs when working with large documentation

## Development

For development with automatic rebuilding:

```bash
npm run dev
```

For publishing instructions, see the [docs/publishing.md](docs/publishing.md) file.
