import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { fillI9PDF, createSampleEmployer } from '@/lib/pdf-filler';
import type { I9Form } from '@/lib/types';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid I-9 form ID format' },
        { status: 400 }
      );
    }
    
    console.log(`[PDF API] Generating PDF for I-9 form ${id}`);
    
    // Get I-9 form data
    const result = await query(`
      SELECT * FROM i9_forms 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'I-9 form not found' },
        { status: 404 }
      );
    }
    
    const formData: I9Form = {
      ...result.rows[0],
      date_of_birth: new Date(result.rows[0].date_of_birth),
      created_at: new Date(result.rows[0].created_at),
      updated_at: new Date(result.rows[0].updated_at),
      completed_at: result.rows[0].completed_at ? new Date(result.rows[0].completed_at) : null,
      employer_reviewed_at: result.rows[0].employer_reviewed_at ? new Date(result.rows[0].employer_reviewed_at) : null,
      employee_signature_date: result.rows[0].employee_signature_date ? new Date(result.rows[0].employee_signature_date) : null,
      alien_expiration_date: result.rows[0].alien_expiration_date ? new Date(result.rows[0].alien_expiration_date) : null
    };
    
    // Use sample employer data (in production, this would come from company database)
    const employerData = createSampleEmployer();
    
    console.log(`[PDF API] Filling PDF for employee: ${formData.first_name} ${formData.last_name}`);
    
    // Generate the filled PDF
    const pdfBytes = await fillI9PDF(formData, employerData);
    
    // Create filename
    const filename = `I9-Form-${formData.last_name}-${formData.first_name}-${formData.id.slice(0, 8)}.pdf`;
    
    console.log(`[PDF API] Generated PDF: ${pdfBytes.length} bytes, filename: ${filename}`);
    
    // Return the PDF with proper headers for browser viewing
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': pdfBytes.length.toString(),
        'Cache-Control': 'private, max-age=0',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('[PDF API] Error generating PDF:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
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