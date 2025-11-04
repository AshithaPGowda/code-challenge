import { NextRequest, NextResponse } from 'next/server';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import {
  tools,
  executeValidateSSN,
  executeValidateCitizenshipStatus,
  executeSaveI9Field,
  executeGetI9Progress,
  executeGetEmployeeByPhone,
  executeCompleteI9Section1
} from '@/lib/mcp-tools';

// Create MCP Server instance
const server = new Server(
  {
    name: 'i9-voice-assistant',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool execution mapping
const toolExecutors = {
  validate_ssn: executeValidateSSN,
  validate_citizenship_status: executeValidateCitizenshipStatus,
  save_i9_field: executeSaveI9Field,
  get_i9_progress: executeGetI9Progress,
  get_employee_by_phone: executeGetEmployeeByPhone,
  complete_i9_section1: executeCompleteI9Section1,
};

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.values(tools),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    const executor = toolExecutors[name as keyof typeof toolExecutors];
    
    if (!executor) {
      throw new Error(`Unknown tool: ${name}`);
    }
    
    const result = await executor(args as any);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: errorMessage,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Handle GET requests (for MCP connection establishment)
export async function GET(request: NextRequest) {
  try {
    // Return server capabilities and information
    const serverInfo = {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: 'i9-voice-assistant',
        version: '1.0.0',
        description: 'MCP server for I-9 Employment Eligibility Verification voice assistant',
      },
      tools: Object.values(tools),
    };

    return NextResponse.json(serverInfo, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('MCP GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// Handle POST requests (for tool execution)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle different MCP request types
    if (body.method === 'tools/list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          tools: Object.values(tools),
        },
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    if (body.method === 'tools/call') {
      const { name, arguments: args } = body.params;
      
      const executor = toolExecutors[name as keyof typeof toolExecutors];
      
      if (!executor) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id: body.id,
          error: {
            code: -32601,
            message: `Unknown tool: ${name}`,
          },
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
      
      const result = await executor(args);
      
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    // Handle server initialization
    if (body.method === 'initialize') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'i9-voice-assistant',
            version: '1.0.0',
          },
        },
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    return NextResponse.json({
      jsonrpc: '2.0',
      id: body.id,
      error: {
        code: -32601,
        message: 'Method not found',
      },
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('MCP POST error:', error);
    
    return NextResponse.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32603,
        message: 'Internal error',
        data: error instanceof Error ? error.message : 'Unknown error',
      },
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// Handle OPTIONS requests (for CORS preflight)
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}