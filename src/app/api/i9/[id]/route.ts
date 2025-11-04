import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { updateI9FormSchema } from '@/lib/validations';
import type { I9Form } from '@/lib/types';
import { I9FormStatus } from '@/lib/types';
import { ZodError } from 'zod';

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
    
    // Get I-9 form by ID
    const result = await query(
      'SELECT * FROM i9_forms WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'I-9 form not found' },
        { status: 404 }
      );
    }
    
    const i9Form: I9Form = result.rows[0];
    
    return NextResponse.json(i9Form, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching I-9 form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid I-9 form ID format' },
        { status: 400 }
      );
    }
    
    // Validate request body
    const validatedData = updateI9FormSchema.parse(body);
    
    // Check if I-9 form exists
    const existingForm = await query(
      'SELECT id FROM i9_forms WHERE id = $1',
      [id]
    );
    
    if (existingForm.rows.length === 0) {
      return NextResponse.json(
        { error: 'I-9 form not found' },
        { status: 404 }
      );
    }
    
    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });
    
    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }
    
    // Add updated_at and completed_at logic
    updates.push(`updated_at = NOW()`);
    if (validatedData.status === I9FormStatus.COMPLETED) {
      updates.push(`completed_at = NOW()`);
    }
    
    values.push(id);
    const updateQuery = `
      UPDATE i9_forms 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount} 
      RETURNING *
    `;
    
    const result = await query(updateQuery, values);
    const i9Form: I9Form = result.rows[0];
    
    return NextResponse.json(i9Form, { status: 200 });
    
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating I-9 form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid I-9 form ID format' },
        { status: 400 }
      );
    }
    
    // Validate status field only
    if (!body.status || !Object.values(I9FormStatus).includes(body.status)) {
      return NextResponse.json(
        { error: 'Valid status is required' },
        { status: 400 }
      );
    }
    
    // Check if I-9 form exists
    const existingForm = await query(
      'SELECT id FROM i9_forms WHERE id = $1',
      [id]
    );
    
    if (existingForm.rows.length === 0) {
      return NextResponse.json(
        { error: 'I-9 form not found' },
        { status: 404 }
      );
    }
    
    // Update status and related fields
    const updateQuery = body.status === I9FormStatus.COMPLETED
      ? 'UPDATE i9_forms SET status = $1, completed_at = NOW(), updated_at = NOW() WHERE id = $2 RETURNING *'
      : 'UPDATE i9_forms SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
    
    const result = await query(updateQuery, [body.status, id]);
    const i9Form: I9Form = result.rows[0];
    
    return NextResponse.json(i9Form, { status: 200 });
    
  } catch (error) {
    console.error('Error updating I-9 form status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
    // Check if I-9 form exists
    const existingForm = await query(
      'SELECT id FROM i9_forms WHERE id = $1',
      [id]
    );
    
    if (existingForm.rows.length === 0) {
      return NextResponse.json(
        { error: 'I-9 form not found' },
        { status: 404 }
      );
    }
    
    // Delete I-9 form
    await query(
      'DELETE FROM i9_forms WHERE id = $1',
      [id]
    );
    
    return NextResponse.json(
      { message: 'I-9 form deleted successfully' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error deleting I-9 form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}