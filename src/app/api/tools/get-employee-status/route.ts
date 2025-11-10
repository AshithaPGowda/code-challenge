import { NextRequest, NextResponse } from 'next/server';
import { executeGetEmployeeByPhone, executeGetI9Progress } from '@/lib/mcp-tools';

export async function GET(request: NextRequest) {
  console.log('🔧 [get-employee-status] GET request received');
  
  try {
    // Get phone from query parameters
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    console.log('🔧 [get-employee-status] Request data:', { phone });

    // Validate required fields
    if (!phone) {
      console.log('❌ [get-employee-status] Missing phone parameter');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameter: phone' 
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

    // Call the MCP tool function to get/create employee
    const employeeResult = await executeGetEmployeeByPhone({ phone });

    if (!employeeResult.success) {
      console.log('❌ [get-employee-status] Error getting employee:', employeeResult.error);
      return NextResponse.json(
        {
          success: false,
          error: employeeResult.error
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

    const employee = employeeResult.data.employee;
    const employeeId = employee.id;
    const wasFound = employeeResult.data.found;

    console.log('✅ [get-employee-status] Employee found/created:', { 
      employee_id: employeeId, 
      was_found: wasFound 
    });

    // Get I-9 form progress
    const progressResult = await executeGetI9Progress({ employee_id: employeeId });

    let hasExistingForm = false;
    let formStatus = 'not_started';
    let missingFields: string[] = [];

    if (progressResult.success && progressResult.data.exists) {
      hasExistingForm = true;
      formStatus = progressResult.data.status || 'in_progress';
      missingFields = progressResult.data.missing_fields || [];
      
      console.log('✅ [get-employee-status] Form progress:', { 
        status: formStatus, 
        completion: progressResult.data.completion_percentage,
        missing_count: missingFields.length
      });
    } else {
      console.log('ℹ️ [get-employee-status] No existing form found');
    }

    // Return status information
    return NextResponse.json(
      {
        employee_id: employeeId,
        has_existing_form: hasExistingForm,
        form_status: formStatus,
        missing_fields: missingFields
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );

  } catch (error) {
    console.error('💥 [get-employee-status] Unexpected error:', error);
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
  console.log('🔧 [get-employee-status] OPTIONS request received');
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}