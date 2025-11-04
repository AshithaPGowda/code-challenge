import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { I9Form } from '@/lib/types';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid I-9 form ID format' },
        { status: 400 }
      );
    }
    
    // Get I-9 form with employee data
    const result = await query(`
      SELECT 
        i9.*,
        e.phone as employee_phone,
        e.email as employee_email,
        e.created_at as employee_created_at
      FROM i9_forms i9
      JOIN employees e ON i9.employee_id = e.id
      WHERE i9.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'I-9 form not found' },
        { status: 404 }
      );
    }
    
    const formData = result.rows[0];
    
    // Format the form data for PDF generation
    const formattedData = {
      // Form identification
      form_id: formData.id,
      employee_id: formData.employee_id,
      
      // Section 1: Employee Information and Attestation
      section1: {
        personal_info: {
          last_name: formData.last_name,
          first_name: formData.first_name,
          middle_initial: formData.middle_initial,
          other_last_names: formData.other_last_names
        },
        address: {
          street_address: formData.address,
          apt_number: formData.apt_number,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code
        },
        personal_details: {
          date_of_birth: formData.date_of_birth,
          ssn: formData.ssn ? '***-**-' + formData.ssn.slice(-4) : null, // Masked for security
          email: formData.email,
          phone: formData.phone
        },
        citizenship_status: {
          status: formData.citizenship_status,
          uscis_a_number: formData.uscis_a_number,
          alien_expiration_date: formData.alien_expiration_date,
          form_i94_number: formData.form_i94_number,
          foreign_passport_number: formData.foreign_passport_number,
          country_of_issuance: formData.country_of_issuance
        },
        signature: {
          signature_date: formData.employee_signature_date,
          signature_method: formData.employee_signature_method || 'voice_verification'
        }
      },
      
      // Form metadata
      metadata: {
        status: formData.status,
        completed_at: formData.completed_at,
        created_at: formData.created_at,
        updated_at: formData.updated_at
      },
      
      // Workflow information
      workflow: {
        employer_notes: formData.employer_notes,
        employer_reviewed_at: formData.employer_reviewed_at,
        employer_reviewed_by: formData.employer_reviewed_by
      },
      
      // Employee record info
      employee_record: {
        phone: formData.employee_phone,
        email: formData.employee_email,
        registered_at: formData.employee_created_at
      }
    };
    
    // Generate response
    const response = {
      form_data: formattedData,
      status: formData.status,
      generated_at: new Date().toISOString(),
      note: "PDF generation coming next - this endpoint currently returns formatted form data ready for PDF conversion",
      pdf_ready: false,
      next_steps: [
        "Integrate PDF generation library (pdf-lib, jsPDF, or Puppeteer)",
        "Create I-9 form template with proper USCIS formatting",
        "Add digital signature support",
        "Implement secure PDF download with access controls"
      ]
    };
    
    console.log(`[PDF API] Form ${id} data retrieved for PDF generation`);
    
    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('Error generating PDF data:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}