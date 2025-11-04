import { NextRequest, NextResponse } from 'next/server';
import { executeGetEmployeeByPhone, executeGetI9Progress } from '@/lib/mcp-tools';

interface CallerContextResponse {
  employee_id: string | null;
  phone: string;
  email?: string;
  has_existing_form: boolean;
  form_status?: 'in_progress' | 'completed' | 'verified';
  completed_fields?: string[];
  missing_fields?: string[];
  last_updated?: string;
  message?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const call_control_id = searchParams.get('call_control_id');

    // Validate required phone parameter
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone parameter is required' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    console.log(`[Webhook] Caller context lookup for phone: ${phone}${call_control_id ? `, call_control_id: ${call_control_id}` : ''}`);

    // Look up employee by phone using MCP tool
    const employeeResult = await executeGetEmployeeByPhone({ phone });
    
    if (!employeeResult.success) {
      console.error('[Webhook] Employee lookup failed:', employeeResult.error);
      return NextResponse.json(
        { error: 'Failed to lookup employee data' },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const employee = employeeResult.data?.employee;
    
    if (!employee) {
      // No employee found - return new caller response
      const response: CallerContextResponse = {
        employee_id: null,
        phone: phone,
        has_existing_form: false,
        message: "New caller - ready to start I-9 form"
      };

      console.log('[Webhook] New caller detected');
      
      return NextResponse.json(response, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    console.log(`[Webhook] Existing employee found: ${employee.id}`);

    // Employee exists - check for I-9 form progress
    const progressResult = await executeGetI9Progress({ employee_id: employee.id });
    
    if (!progressResult.success) {
      console.error('[Webhook] I-9 progress lookup failed:', progressResult.error);
      
      // Return basic employee info without form data
      const response: CallerContextResponse = {
        employee_id: employee.id,
        phone: employee.phone,
        email: employee.email || undefined,
        has_existing_form: false,
        message: "Employee found but unable to load form data"
      };

      return NextResponse.json(response, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const progressData = progressResult.data;
    
    if (!progressData?.exists) {
      // Employee exists but no I-9 form yet
      const response: CallerContextResponse = {
        employee_id: employee.id,
        phone: employee.phone,
        email: employee.email || undefined,
        has_existing_form: false,
        message: "Returning caller - ready to start I-9 form"
      };

      console.log('[Webhook] Employee exists but no I-9 form found');

      return NextResponse.json(response, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Employee has existing I-9 form - return detailed progress
    const requiredFields = [
      'last_name', 'first_name', 'address', 'city', 'state', 'zip_code',
      'date_of_birth', 'email', 'phone', 'citizenship_status'
    ];

    const allFields = [
      ...requiredFields,
      'middle_initial', 'other_last_names', 'apt_number', 'ssn',
      'uscis_a_number', 'alien_expiration_date', 'form_i94_number',
      'foreign_passport_number', 'country_of_issuance'
    ];

    const currentData = progressData.current_data;
    const completedFields = allFields.filter(field => {
      const value = currentData[field];
      return value && value !== '' && value !== '00000' && value !== '1990-01-01';
    });

    const response: CallerContextResponse = {
      employee_id: employee.id,
      phone: employee.phone,
      email: employee.email || undefined,
      has_existing_form: true,
      form_status: progressData.status,
      completed_fields: completedFields,
      missing_fields: progressData.missing_fields || [],
      last_updated: currentData.updated_at
    };

    console.log(`[Webhook] I-9 form found - Status: ${progressData.status}, Completion: ${progressData.completion_percentage}%`);

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('[Webhook] Unexpected error in caller context lookup:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}