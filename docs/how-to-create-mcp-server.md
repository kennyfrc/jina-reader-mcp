# Creating Your Own Model Context Protocol (MCP) Server

This tutorial walks you through creating a basic MCP server using the [Model Context Protocol](https://modelcontextprotocol.io), enabling AI assistants like Claude to interact with your custom tools.

## What You'll Build

We'll create a simple but functional MCP server that:
1. Connects to the MCP protocol
2. Provides a basic tool functionality
3. Handles API requests and returns formatted responses

By the end, you'll understand the key components of an MCP server and be ready to create your own custom tools.

## Prerequisites

- Node.js (v18+)
- Basic understanding of TypeScript/JavaScript

## Step 1: Set Up Your Project

Let's start by creating the project structure:

```bash
# Create a new directory for your project
mkdir my-mcp-server
cd my-mcp-server

# Initialize a new Node.js project
npm init -y

# Install required dependencies
npm install @modelcontextprotocol/sdk zod node-fetch
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

Configure your `package.json`:

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "my-mcp": "dist/index.js"
  },
  "scripts": {
    "build": "tsc && chmod +x dist/index.js",
    "start": "node dist/index.js",
    "dev": "tsc -w"
  }
}
```

## Step 2: Create a Minimal MCP Server

Create a file at `src/index.ts` with this basic server:

```typescript
#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create your MCP server
const server = new McpServer({
  name: "My MCP Server",
  version: "1.0.0",
});

// Register a simple hello world tool
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

## Step 3: Understanding Tool Structure

Each MCP tool follows a consistent pattern:

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
    // Your tool implementation logic goes here
    
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

## Step 4: API Integration Example

Let's create a practical example by adding a weather API integration:

```typescript
import fetch from "node-fetch";

// Helper function for API calls
async function getWeather(location: string) {
  try {
    // Replace with your actual API endpoint and key
    const apiKey = process.env.WEATHER_API_KEY;
    
    if (!apiKey) {
      throw new Error("WEATHER_API_KEY environment variable not set");
    }
    
    const response = await fetch(
      `https://api.example.com/weather?location=${encodeURIComponent(location)}&appid=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Weather API call failed:", error);
    throw error;
  }
}

// Register the weather tool
server.tool(
  "get_weather",
  "Get current weather for a location",
  {
    location: z.string().describe("City name or location"),
  },
  async ({ location }) => {
    try {
      const weather = await getWeather(location);
      
      return {
        content: [
          {
            type: "text",
            text: `Current weather in ${location}: ${weather.description}, temperature: ${weather.temp}°C`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }
);
```

## Step 5: Response Formatting

You can return different types of content in your responses:

```typescript
// Simple text response
return {
  content: [
    {
      type: "text",
      text: "This is a simple text response",
    },
  ],
};

// Rich formatted response
return {
  content: [
    {
      type: "text",
      text: "# Weather Report\n\nHere's your weather information:",
    },
    {
      type: "code",
      language: "json",
      text: JSON.stringify(weatherData, null, 2),
    },
  ],
};
```

## Step 6: Build and Run

Build and run your MCP server:

```bash
# Build the project
npm run build

# Run the server
npm start
```

## Step 7: Using with Claude Desktop

To integrate with Claude Desktop:

1. Create a `claude-desktop-config.json` file:

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "node",
      "args": ["/absolute/path/to/your/dist/index.js"],
      "env": {
        "WEATHER_API_KEY": "your_api_key_here"
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

## Best Practices

1. **Error Handling**: Always include robust error handling in your tools
2. **Environment Variables**: Use environment variables for API keys and sensitive information
3. **Clear Documentation**: Provide clear descriptions for your tools and parameters
4. **Descriptive Tool Names**: Use verb_noun format for tools (e.g., `get_weather`, `search_database`)
5. **Consistent Responses**: Format your responses consistently for better user experience

## Next Steps

You now have a functional MCP server! Here are some ways to enhance it:

- Add more tools to expand functionality
- Implement caching for API responses
- Add validation and better error messages
- Create a more complex response formatter

## Additional Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [MCP SDK Reference](https://modelcontextprotocol.io/docs/javascript-sdk)
- [Claude Desktop Documentation](https://claude.ai/docs/desktop)
