import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { employeeSchema } from '@/lib/validations';
import type { Employee } from '@/lib/types';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = employeeSchema.parse(body);
    
    // Check if employee with this phone already exists
    const existingEmployee = await query(
      'SELECT id FROM employees WHERE phone = $1',
      [validatedData.phone]
    );
    
    if (existingEmployee.rows.length > 0) {
      return NextResponse.json(
        { error: 'Employee with this phone number already exists' },
        { status: 400 }
      );
    }
    
    // Create new employee
    const result = await query(
      'INSERT INTO employees (phone, email) VALUES ($1, $2) RETURNING *',
      [validatedData.phone, validatedData.email || null]
    );
    
    const employee: Employee = result.rows[0];
    
    return NextResponse.json(employee, { status: 201 });
    
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required as query parameter' },
        { status: 400 }
      );
    }
    
    // Get employee by phone
    const result = await query(
      'SELECT * FROM employees WHERE phone = $1',
      [phone]
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