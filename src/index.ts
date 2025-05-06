#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import fetch from "node-fetch";

// Load environment variables
dotenv.config();

// Engine types for Jina Reader
type JinaEngineType = "none" | "direct" | "browser" | "cf-browser-rendering";

// Create your MCP server
const server = new McpServer({
  name: "Jina Reader MCP",
  version: "1.0.0",
});

// Simple cache implementation with TTL
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache: Record<string, CacheEntry> = {};
const CACHE_TTL = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

// Helper function for Jina Reader API
async function callJinaReaderAPI(
  params: any, 
  engine: JinaEngineType = "none", 
  max_length?: number, 
  start_index?: number, 
  useCache: boolean = true
) {
  const apiKey = process.env.JINA_API_KEY;
  
  if (!apiKey) {
    throw new Error("JINA_API_KEY not configured. Please set it in your .env file.");
  }
  
  // Create a cache key based on the request parameters
  const cacheKey = JSON.stringify({ params, engine, max_length, start_index });
  
  // Check cache if enabled
  if (useCache && cache[cacheKey]) {
    const entry = cache[cacheKey];
    const now = Date.now();
    
    // Return cached result if it's still valid
    if (now - entry.timestamp < CACHE_TTL) {
      console.error("Using cached result");
      return entry.data;
    } else {
      // Remove expired entry
      delete cache[cacheKey];
    }
  }
  
  try {
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "X-Return-Format": "markdown",
      "X-With-Links-Summary": "true",
      "Content-Type": "application/json",
      "X-Cache": "true" // Enable Jina's built-in caching
    };
    
    // Add X-Engine header if specified (not none)
    if (engine !== "none") {
      headers["X-Engine"] = engine;
    }
    
    // Create a copy of params and add length parameters
    const requestParams = { ...params };
    if (max_length !== undefined) {
      requestParams.max_length = max_length;
    }
    if (start_index !== undefined) {
      requestParams.start_index = start_index;
    }
    
    const response = await fetch("https://r.jina.ai/", {
      method: "POST",
      headers,
      body: JSON.stringify(requestParams),
    });
    
    if (!response.ok) {
      throw new Error(`Jina API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Cache the result if caching is enabled
    if (useCache) {
      cache[cacheKey] = {
        data: result,
        timestamp: Date.now()
      };
    }
    
    return result;
  } catch (error) {
    console.error("Jina Reader API call failed:", error);
    throw error;
  }
}

// Read content from URL
server.tool(
  "jina_read_url",
  "Read and extract content from a webpage using Jina Reader",
  {
    url: z.string().url().describe("URL of the webpage to read"),
    engine: z.enum(["none", "direct", "browser", "cf-browser-rendering"])
      .describe("Engine to use: none (default), direct (speed), browser (quality), cf-browser-rendering (experimental)")
      .optional(),
    max_length: z.number().positive().describe("Maximum number of characters to return (default is 20000)").optional(),
    start_index: z.number().nonnegative().describe("Start content from the character index (default is 0)").optional(),
  },
  async ({ url, engine = "none", max_length, start_index }) => {
    try {
      const result = await callJinaReaderAPI({ url }, engine as JinaEngineType, max_length, start_index);
      
      return {
        content: [
          {
            type: "text",
            text: formatJinaResponse(result, max_length, start_index || 0),
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

// Read content from HTML
server.tool(
  "jina_read_html",
  "Read and extract content from HTML using Jina Reader",
  {
    html: z.string().describe("HTML content to read"),
    engine: z.enum(["none", "direct", "browser", "cf-browser-rendering"])
      .describe("Engine to use: none (default), direct (speed), browser (quality), cf-browser-rendering (experimental)")
      .optional(),
    max_length: z.number().positive().describe("Maximum number of characters to return (default is 20000)").optional(),
    start_index: z.number().nonnegative().describe("Start content from the character index (default is 0)").optional(),
  },
  async ({ html, engine = "none", max_length, start_index }) => {
    try {
      const result = await callJinaReaderAPI({ html }, engine as JinaEngineType, max_length, start_index);
      
      return {
        content: [
          {
            type: "text",
            text: formatJinaResponse(result, max_length, start_index || 0),
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

// Read content from PDF
server.tool(
  "jina_read_pdf",
  "Read and extract content from a PDF file using Jina Reader",
  {
    pdf: z.string().describe("Base64 encoded PDF content"),
    engine: z.enum(["none", "direct", "browser", "cf-browser-rendering"])
      .describe("Engine to use: none (default), direct (speed), browser (quality), cf-browser-rendering (experimental)")
      .optional(),
    max_length: z.number().positive().describe("Maximum number of characters to return (default is 20000)").optional(),
    start_index: z.number().nonnegative().describe("Start content from the character index (default is 0)").optional(),
  },
  async ({ pdf, engine = "none", max_length, start_index }) => {
    try {
      const result = await callJinaReaderAPI({ pdf }, engine as JinaEngineType, max_length, start_index);
      
      return {
        content: [
          {
            type: "text",
            text: formatJinaResponse(result, max_length, start_index || 0),
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

// Helper function to format the response from Jina Reader
function formatJinaResponse(result: any, max_length?: number, start_index: number = 0): string {
  let output = "";
  
  if (result.data) {
    const data = result.data;
    
    if (data.title) {
      output += `# ${data.title}\n\n`;
    }
    
    if (data.description && data.description.trim()) {
      output += `${data.description}\n\n`;
    }
    
    if (data.content) {
      output += `${data.content}\n\n`;
    }
    
    if (data.links && Object.keys(data.links).length > 0) {
      output += "## Links\n\n";
      for (const [text, url] of Object.entries(data.links)) {
        output += `- [${text}](${url})\n`;
      }
      output += "\n";
    }
    
    if (data.warning) {
      output += `> Warning: ${data.warning}\n\n`;
    }
    
    if (data.usage && data.usage.tokens) {
      output += `*Used ${data.usage.tokens} tokens*\n`;
    }
  } else {
    output = "No content extracted or unexpected response format.";
  }
  
  // Apply max_length limit if specified, with a default of 20000 characters
  const defaultMaxLength = 20000;
  const effectiveMaxLength = max_length || defaultMaxLength;
  const startPosition = start_index;
  
  if (output.length > effectiveMaxLength) {
    const totalLength = output.length;
    const endPosition = startPosition + effectiveMaxLength;
    
    // Truncate and add detailed pagination information
    output = output.substring(0, effectiveMaxLength) + 
      `\n\n---\n` +
      `[PAGINATION INFO]\n` +
      `- Content clipped: Currently showing characters ${startPosition}-${endPosition} of approximately ${totalLength} total\n` +
      `- To view the next section, use start_index=${endPosition} with the same max_length\n` +
      `- Complete content can be accessed by making multiple paginated requests\n`;
  } else {
    // If not truncated but we're not at the beginning, add pagination info
    if (startPosition > 0) {
      output += `\n\n---\n` +
      `[PAGINATION INFO]\n` +
      `- Showing characters ${startPosition}-${startPosition + output.length} of the document\n` +
      `- This appears to be the end of the content\n`;
    }
  }
  
  return output;
}

// Start the server
async function main() {
  console.error("Starting Jina Reader MCP Server...");
  
  // Use stdio transport by default
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("Jina Reader MCP Server running");
}

// Handle errors
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});