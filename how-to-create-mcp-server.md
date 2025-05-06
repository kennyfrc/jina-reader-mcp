# Creating Your Own Model Context Protocol (MCP) Server

This guide explains how to create your own MCP server based on the [Model Context Protocol](https://modelcontextprotocol.io), which allows AI models to interact with custom tools.

## Prerequisites

- Node.js (v18+)
- Basic understanding of TypeScript/JavaScript
- Familiarity with the MCP specification

## Getting Started

### 1. Set Up Your Project

```bash
# Create a new directory for your project
mkdir my-mcp-server
cd my-mcp-server

# Initialize a new Node.js project
npm init -y

# Install required dependencies
npm install @modelcontextprotocol/sdk zod dotenv
npm install --save-dev typescript @types/node

# Initialize TypeScript configuration
npx tsc --init
```

Update your `tsconfig.json` to include:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "outDir": "./dist",
    "strict": true
  },
  "include": ["src/**/*"]
}
```

Update your `package.json`:

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc && chmod +x dist/index.js",
    "start": "node dist/index.js",
    "dev": "tsc -w"
  }
}
```

### 2. Create Your Server Structure

Create a basic MCP server in `src/index.ts`:

```typescript
#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create your MCP server
const server = new McpServer({
  name: "My MCP Server",
  version: "1.0.0",
});

// Register your first tool
server.tool(
  "hello_world",
  "A simple greeting tool",
  {
    name: z.string().describe("The name to greet"),
  },
  async ({ name }) => {
    return {
      content: [
        {
          type: "text",
          text: `Hello, ${name}!`,
        },
      ],
    };
  }
);

// Start the server
async function main() {
  console.error("Starting MCP Server...");
  
  // Use stdio transport by default
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("MCP Server running");
}

// Handle errors
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

### 3. Building Tools

Each tool follows this structure:

```typescript
server.tool(
  "tool_name",                // Unique identifier for the tool
  "Tool description",         // Description of what the tool does
  {
    // Parameters schema using Zod
    param1: z.string().describe("Description of param1"),
    param2: z.number().optional().describe("Optional parameter"),
  },
  async ({ param1, param2 }) => {
    // Tool implementation
    // This is where you put your logic

    // Return response in MCP format
    return {
      content: [
        {
          type: "text",
          text: "Result of the tool execution",
        },
      ],
    };
  }
);
```

### 4. Adding External API Integration

If your tool needs to call external APIs, you can add the necessary logic:

```typescript
async function callExternalAPI(endpoint, params) {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.API_KEY}`,
      },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
}

// Then use this in your tool
server.tool(
  "api_tool",
  "Tool that calls an external API",
  {
    query: z.string().describe("Query to send to the API"),
  },
  async ({ query }) => {
    try {
      const result = await callExternalAPI("https://api.example.com/endpoint", { query });
      
      return {
        content: [
          {
            type: "text",
            text: `API returned: ${JSON.stringify(result)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }
);
```

### 5. Response Formatting

MCP supports various content types:

```typescript
// Text response
return {
  content: [
    {
      type: "text",
      text: "Simple text response",
    },
  ],
};

// Rich formatted response with multiple elements
return {
  content: [
    {
      type: "text",
      text: "Result header",
    },
    {
      type: "code",
      language: "json",
      text: JSON.stringify(data, null, 2),
    },
    {
      type: "image",
      url: "data:image/png;base64,..." // Base64 encoded image
    }
  ],
};
```

## Integrating with Claude Desktop

To use your MCP server with Claude Desktop:

1. Configure `claude-desktop-config.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node /path/to/your/dist/index.js"
    }
  }
}
```

2. Place this file in:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

3. Restart Claude Desktop to load your MCP server.

## Best Practices

1. **Error Handling**: Always include robust error handling in your tools to avoid crashes.

2. **Logging**: Add detailed logging for debugging issues during development.

3. **Security**: Never expose sensitive credentials or API keys in your server's responses.

4. **Documentation**: Provide clear descriptions for your tools and parameters so models can use them appropriately.

5. **Performance**: Keep tool execution efficient, especially for tools that may be called frequently.

6. **Tool Naming**: Use descriptive, verb_noun naming format for your tools (e.g., `get_weather`, `search_database`).

## Example: Complete MCP Server

For a complete working example, refer to the OneCompiler MCP server which allows running code snippets in various programming languages through the OneCompiler API.

## Additional Resources

- [MCP Official Documentation](https://modelcontextprotocol.io)
- [MCP SDK Documentation](https://modelcontextprotocol.io/docs/javascript-sdk)
- [MCP Server Quickstart Guide](https://modelcontextprotocol.io/quickstart/server)
