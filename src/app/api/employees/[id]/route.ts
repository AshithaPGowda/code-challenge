import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { employeeSchema } from '@/lib/validations';
import type { Employee } from '@/lib/types';
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
        { error: 'Invalid employee ID format' },
        { status: 400 }
      );
    }
    
    // Get employee by ID
    const result = await query(
      'SELECT * FROM employees WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    const employee: Employee = result.rows[0];
    
    return NextResponse.json(employee, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching employee:', error);
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
        { error: 'Invalid employee ID format' },
        { status: 400 }
      );
    }
    
    // Validate request body
    const validatedData = employeeSchema.parse(body);
    
    // Check if employee exists
    const existingEmployee = await query(
      'SELECT id FROM employees WHERE id = $1',
      [id]
    );
    
    if (existingEmployee.rows.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // Check if phone number is already used by another employee
    const phoneCheck = await query(
      'SELECT id FROM employees WHERE phone = $1 AND id != $2',
      [validatedData.phone, id]
    );
    
    if (phoneCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'Phone number is already used by another employee' },
        { status: 400 }
      );
    }
    
    // Update employee
    const result = await query(
      'UPDATE employees SET phone = $1, email = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [validatedData.phone, validatedData.email || null, id]
    );
    
    const employee: Employee = result.rows[0];
    
    return NextResponse.json(employee, { status: 200 });
    
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating employee:', error);
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
        { error: 'Invalid employee ID format' },
        { status: 400 }
      );
    }
    
    // Check if employee exists
    const existingEmployee = await query(
      'SELECT id FROM employees WHERE id = $1',
      [id]
    );
    
    if (existingEmployee.rows.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // Delete employee (this will cascade delete I-9 forms)
    await query(
      'DELETE FROM employees WHERE id = $1',
      [id]
    );
    
    return NextResponse.json(
      { message: 'Employee deleted successfully' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}