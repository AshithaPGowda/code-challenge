import { NextRequest, NextResponse } from 'next/server';
import { executeZipLookup } from '@/lib/mcp-tools';

export async function GET(request: NextRequest) {
  console.log('🔧 [lookup-city-state] GET request received');
  
  try {
    // Get zip from query parameters
    const { searchParams } = new URL(request.url);
    const zip = searchParams.get('zip');

    console.log('🔧 [lookup-city-state] Request data:', { zip });

    // Validate required fields
    if (!zip) {
      console.log('❌ [lookup-city-state] Missing zip parameter');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameter: zip' 
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    // Call the MCP tool function
    const result = await executeZipLookup({ zip_code: zip });

    if (result.success) {
      const { city, state } = result.data;
      console.log('✅ [lookup-city-state] ZIP lookup successful:', { city, state });
      
      return NextResponse.json(
        {
          city,
          state
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    } else {
      console.log('❌ [lookup-city-state] ZIP lookup failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

  } catch (error) {
    console.error('💥 [lookup-city-state] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  console.log('🔧 [lookup-city-state] OPTIONS request received');
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}