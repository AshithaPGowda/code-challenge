import { NextRequest, NextResponse } from 'next/server';
import { executeSaveI9Field } from '@/lib/mcp-tools';

export async function POST(request: NextRequest) {
  console.log('🔧 [save-i9-field] POST request received');
  
  try {
    // Parse request body
    const body = await request.json();
    const { employee_id, field_name, value } = body;

    console.log('🔧 [save-i9-field] Request data:', { 
      employee_id, 
      field_name, 
      value: typeof value === 'string' ? value.substring(0, 50) : value 
    });

    // Validate required fields
    if (!employee_id || !field_name || value === undefined) {
      console.log('❌ [save-i9-field] Missing required fields');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: employee_id, field_name, value' 
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    // Call the MCP tool function
    const result = await executeSaveI9Field({
      employee_id,
      field_name,
      value: String(value)
    });

    if (result.success) {
      console.log('✅ [save-i9-field] Successfully saved field');
      return NextResponse.json(
        {
          success: true,
          message: `Saved ${field_name}`
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    } else {
      console.log('❌ [save-i9-field] Error saving field:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

  } catch (error) {
    console.error('💥 [save-i9-field] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  console.log('🔧 [save-i9-field] OPTIONS request received');
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}