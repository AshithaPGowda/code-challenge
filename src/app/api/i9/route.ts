import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createI9FormSchema } from '@/lib/validations';
import type { I9Form } from '@/lib/types';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = createI9FormSchema.parse(body);
    
    // Check if employee exists
    const employeeCheck = await query(
      'SELECT id FROM employees WHERE id = $1',
      [validatedData.employee_id]
    );
    
    if (employeeCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // Create new I-9 form
    const result = await query(`
      INSERT INTO i9_forms (
        employee_id, last_name, first_name, middle_initial, other_last_names,
        address, apt_number, city, state, zip_code,
        date_of_birth, ssn, email, phone, citizenship_status,
        uscis_a_number, alien_expiration_date, form_i94_number,
        foreign_passport_number, country_of_issuance
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      ) RETURNING *
    `, [
      validatedData.employee_id,
      validatedData.last_name,
      validatedData.first_name,
      validatedData.middle_initial || null,
      validatedData.other_last_names || null,
      validatedData.address,
      validatedData.apt_number || null,
      validatedData.city,
      validatedData.state,
      validatedData.zip_code,
      validatedData.date_of_birth,
      validatedData.ssn || null,
      validatedData.email,
      validatedData.phone,
      validatedData.citizenship_status,
      validatedData.uscis_a_number || null,
      validatedData.alien_expiration_date || null,
      validatedData.form_i94_number || null,
      validatedData.foreign_passport_number || null,
      validatedData.country_of_issuance || null
    ]);
    
    const i9Form: I9Form = result.rows[0];
    
    return NextResponse.json(i9Form, { status: 201 });
    
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating I-9 form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employee_id');
    
    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required as query parameter' },
        { status: 400 }
      );
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(employeeId)) {
      return NextResponse.json(
        { error: 'Invalid employee ID format' },
        { status: 400 }
      );
    }
    
    // Check if employee exists
    const employeeCheck = await query(
      'SELECT id FROM employees WHERE id = $1',
      [employeeId]
    );
    
    if (employeeCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // Get all I-9 forms for the employee
    const result = await query(
      'SELECT * FROM i9_forms WHERE employee_id = $1 ORDER BY created_at DESC',
      [employeeId]
    );
    
    const i9Forms: I9Form[] = result.rows;
    
    return NextResponse.json(i9Forms, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching I-9 forms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}