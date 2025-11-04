import { query } from './db';
import { validateSSN, validatePhone } from './validations';
import { CitizenshipStatus, I9FormStatus } from './types';

interface ToolResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const tools = {
  validate_ssn: {
    name: 'validate_ssn',
    description: 'Validate Social Security Number format (XXX-XX-XXXX)',
    inputSchema: {
      type: 'object',
      properties: {
        ssn: {
          type: 'string',
          description: 'Social Security Number to validate'
        }
      },
      required: ['ssn']
    }
  },

  validate_citizenship_status: {
    name: 'validate_citizenship_status',
    description: 'Validate citizenship status value against allowed options',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Citizenship status to validate'
        }
      },
      required: ['status']
    }
  },

  save_i9_field: {
    name: 'save_i9_field',
    description: 'Save a single field to the I-9 form in database',
    inputSchema: {
      type: 'object',
      properties: {
        employee_id: {
          type: 'string',
          description: 'Employee UUID'
        },
        field_name: {
          type: 'string',
          description: 'Name of the field to update'
        },
        value: {
          type: 'string',
          description: 'Value to save for the field'
        }
      },
      required: ['employee_id', 'field_name', 'value']
    }
  },

  get_i9_progress: {
    name: 'get_i9_progress',
    description: 'Get current I-9 form completion status and list missing required fields',
    inputSchema: {
      type: 'object',
      properties: {
        employee_id: {
          type: 'string',
          description: 'Employee UUID'
        }
      },
      required: ['employee_id']
    }
  },

  get_employee_by_phone: {
    name: 'get_employee_by_phone',
    description: 'Find existing employee by phone number or create new one if not found',
    inputSchema: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          description: 'Phone number to search for'
        },
        email: {
          type: 'string',
          description: 'Email address for new employee creation (optional)'
        }
      },
      required: ['phone']
    }
  },

  complete_i9_section1: {
    name: 'complete_i9_section1',
    description: 'Mark I-9 Section 1 as completed and set completion timestamp',
    inputSchema: {
      type: 'object',
      properties: {
        employee_id: {
          type: 'string',
          description: 'Employee UUID'
        }
      },
      required: ['employee_id']
    }
  }
};

export async function executeValidateSSN(args: { ssn: string }): Promise<ToolResponse> {
  try {
    const isValid = validateSSN(args.ssn);
    return {
      success: true,
      data: {
        valid: isValid,
        format: 'XXX-XX-XXXX',
        input: args.ssn
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to validate SSN: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function executeValidateCitizenshipStatus(args: { status: string }): Promise<ToolResponse> {
  try {
    const validStatuses = Object.values(CitizenshipStatus);
    const isValid = validStatuses.includes(args.status as CitizenshipStatus);
    
    return {
      success: true,
      data: {
        valid: isValid,
        input: args.status,
        validOptions: validStatuses
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to validate citizenship status: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function executeSaveI9Field(args: { employee_id: string; field_name: string; value: string }): Promise<ToolResponse> {
  try {
    // Validate employee exists
    const employeeCheck = await query(
      'SELECT id FROM employees WHERE id = $1',
      [args.employee_id]
    );
    
    if (employeeCheck.rows.length === 0) {
      return {
        success: false,
        error: 'Employee not found'
      };
    }

    // Check if I-9 form exists, create if not
    let formCheck = await query(
      'SELECT id FROM i9_forms WHERE employee_id = $1',
      [args.employee_id]
    );

    if (formCheck.rows.length === 0) {
      // Create new I-9 form with minimal required fields
      await query(
        'INSERT INTO i9_forms (employee_id, last_name, first_name, address, city, state, zip_code, date_of_birth, email, phone, citizenship_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        [args.employee_id, '', '', '', '', 'CA', '00000', '1990-01-01', '', '', CitizenshipStatus.US_CITIZEN]
      );
    }

    // Validate field name is allowed
    const allowedFields = [
      'last_name', 'first_name', 'middle_initial', 'other_last_names',
      'address', 'apt_number', 'city', 'state', 'zip_code',
      'date_of_birth', 'ssn', 'email', 'phone', 'citizenship_status',
      'uscis_a_number', 'alien_expiration_date', 'form_i94_number',
      'foreign_passport_number', 'country_of_issuance'
    ];

    if (!allowedFields.includes(args.field_name)) {
      return {
        success: false,
        error: `Invalid field name: ${args.field_name}`
      };
    }

    // Update the field
    const updateQuery = `
      UPDATE i9_forms 
      SET ${args.field_name} = $1, updated_at = NOW() 
      WHERE employee_id = $2 
      RETURNING *
    `;
    
    const result = await query(updateQuery, [args.value, args.employee_id]);
    
    return {
      success: true,
      data: {
        field_name: args.field_name,
        value: args.value,
        updated_form: result.rows[0]
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to save field: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function executeGetI9Progress(args: { employee_id: string }): Promise<ToolResponse> {
  try {
    // Get current I-9 form data
    const result = await query(
      'SELECT * FROM i9_forms WHERE employee_id = $1',
      [args.employee_id]
    );

    if (result.rows.length === 0) {
      return {
        success: true,
        data: {
          exists: false,
          completion_percentage: 0,
          missing_fields: ['All fields - form not started'],
          status: 'not_started'
        }
      };
    }

    const form = result.rows[0];
    const requiredFields = [
      'last_name', 'first_name', 'address', 'city', 'state', 'zip_code',
      'date_of_birth', 'email', 'phone', 'citizenship_status'
    ];

    // Check for missing required fields
    const missingFields = requiredFields.filter(field => {
      const value = form[field];
      return !value || value === '' || value === '00000' || value === '1990-01-01';
    });

    // Calculate completion percentage
    const completedFields = requiredFields.length - missingFields.length;
    const completionPercentage = Math.round((completedFields / requiredFields.length) * 100);

    return {
      success: true,
      data: {
        exists: true,
        completion_percentage: completionPercentage,
        missing_fields: missingFields,
        status: form.status,
        completed_at: form.completed_at,
        current_data: form
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to get progress: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function executeGetEmployeeByPhone(args: { phone: string; email?: string }): Promise<ToolResponse> {
  try {
    // Validate phone format
    if (!validatePhone(args.phone)) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }

    // Check if employee exists
    let result = await query(
      'SELECT * FROM employees WHERE phone = $1',
      [args.phone]
    );

    if (result.rows.length > 0) {
      return {
        success: true,
        data: {
          found: true,
          employee: result.rows[0]
        }
      };
    }

    // Create new employee
    result = await query(
      'INSERT INTO employees (phone, email) VALUES ($1, $2) RETURNING *',
      [args.phone, args.email || null]
    );

    return {
      success: true,
      data: {
        found: false,
        created: true,
        employee: result.rows[0]
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to get/create employee: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function executeCompleteI9Section1(args: { employee_id: string }): Promise<ToolResponse> {
  try {
    // Check if form exists and get current data
    const formCheck = await query(
      'SELECT * FROM i9_forms WHERE employee_id = $1',
      [args.employee_id]
    );

    if (formCheck.rows.length === 0) {
      return {
        success: false,
        error: 'I-9 form not found for employee'
      };
    }

    const form = formCheck.rows[0];
    
    // Validate required fields are completed
    const requiredFields = [
      'last_name', 'first_name', 'address', 'city', 'state', 'zip_code',
      'date_of_birth', 'email', 'phone', 'citizenship_status'
    ];

    const missingFields = requiredFields.filter(field => {
      const value = form[field];
      return !value || value === '' || value === '00000' || value === '1990-01-01';
    });

    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Cannot complete form. Missing required fields: ${missingFields.join(', ')}`
      };
    }

    // Mark as completed
    const result = await query(
      'UPDATE i9_forms SET status = $1, completed_at = NOW(), updated_at = NOW() WHERE employee_id = $2 RETURNING *',
      [I9FormStatus.COMPLETED, args.employee_id]
    );

    return {
      success: true,
      data: {
        message: 'I-9 Section 1 completed successfully',
        completed_at: result.rows[0].completed_at,
        form: result.rows[0]
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to complete form: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}