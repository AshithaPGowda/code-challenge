import { query } from './db';
import { validateSSN, validatePhone } from './validations';
import { CitizenshipStatus, I9FormStatus } from './types';
import { sendI9SubmittedSMS } from './telnyx';

interface ToolResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface I9FormSubmissionArgs {
  phone: string;
  first_name: string;
  last_name: string;
  middle_initial?: string;
  other_last_names?: string;
  address: string;
  apt_number?: string;
  city: string;
  state: string;
  zip_code: string;
  date_of_birth: string;
  ssn?: string;
  email: string;
  citizenship_status: string;
  uscis_a_number?: string;
  alien_expiration_date?: string;
  form_i94_number?: string;
  foreign_passport_number?: string;
  country_of_issuance?: string;
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
  },

  lookup_city_state_from_zip: {
    name: 'lookup_city_state_from_zip',
    description: 'Look up city and state from a ZIP code to auto-fill address fields',
    inputSchema: {
      type: 'object',
      properties: {
        zip_code: {
          type: 'string',
          description: '5-digit US ZIP code'
        }
      },
      required: ['zip_code']
    }
  },

  submit_complete_i9_form: {
    name: 'submit_complete_i9_form',
    description: 'Submit a complete I-9 form for HR review. Creates employee if needed and sends SMS confirmation.',
    inputSchema: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          description: 'Employee phone number'
        },
        first_name: {
          type: 'string',
          description: 'Employee first name'
        },
        last_name: {
          type: 'string',
          description: 'Employee last name'
        },
        middle_initial: {
          type: 'string',
          description: 'Employee middle initial (optional)'
        },
        other_last_names: {
          type: 'string',
          description: 'Other last names used (optional)'
        },
        address: {
          type: 'string',
          description: 'Street address'
        },
        apt_number: {
          type: 'string',
          description: 'Apartment number (optional)'
        },
        city: {
          type: 'string',
          description: 'City'
        },
        state: {
          type: 'string',
          description: 'State abbreviation (e.g., CA, NY)'
        },
        zip_code: {
          type: 'string',
          description: '5-digit ZIP code'
        },
        date_of_birth: {
          type: 'string',
          description: 'Date of birth (YYYY-MM-DD format)'
        },
        ssn: {
          type: 'string',
          description: 'Social Security Number (optional, 9 digits or XXX-XX-XXXX format)'
        },
        email: {
          type: 'string',
          description: 'Email address'
        },
        citizenship_status: {
          type: 'string',
          description: 'Citizenship status: us_citizen, noncitizen_national, lawful_permanent_resident, or authorized_alien'
        },
        uscis_a_number: {
          type: 'string',
          description: 'USCIS A-Number (for LPR or authorized alien)'
        },
        alien_expiration_date: {
          type: 'string',
          description: 'Work authorization expiration date (YYYY-MM-DD, for authorized alien)'
        },
        form_i94_number: {
          type: 'string',
          description: 'Form I-94 admission number (for authorized alien)'
        },
        foreign_passport_number: {
          type: 'string',
          description: 'Foreign passport number (for authorized alien)'
        },
        country_of_issuance: {
          type: 'string',
          description: 'Country of passport issuance (for authorized alien)'
        }
      },
      required: ['phone', 'first_name', 'last_name', 'address', 'city', 'state', 'zip_code', 'date_of_birth', 'email', 'citizenship_status']
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

export async function executeZipLookup(args: { zip_code: string }): Promise<ToolResponse> {
  try {
    // Validate ZIP code format (5 digits)
    const zipRegex = /^\d{5}$/;
    if (!zipRegex.test(args.zip_code)) {
      return {
        success: false,
        error: 'Invalid ZIP code format. Must be 5 digits.'
      };
    }

    // Call Zippopotamus API
    const response = await fetch(`https://api.zippopotam.us/us/${args.zip_code}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          error: 'ZIP code not found'
        };
      }
      return {
        success: false,
        error: `API error: ${response.status} ${response.statusText}`
      };
    }

    const data = await response.json();
    
    // Extract city and state from response
    if (!data.places || data.places.length === 0) {
      return {
        success: false,
        error: 'No location data found for this ZIP code'
      };
    }

    const place = data.places[0];
    const city = place['place name'];
    const state_abbr = place['state abbreviation'];
    const state_full = place['state'];

    return {
      success: true,
      data: {
        zip_code: args.zip_code,
        city: city,
        state: state_full,
        state_abbr: state_abbr,
        country: data.country
      }
    };

  } catch (error) {
    return {
      success: false,
      error: `Failed to lookup ZIP code: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function executeSubmitCompleteI9Form(args: I9FormSubmissionArgs): Promise<ToolResponse> {
  try {
    console.log(`[MCP] Starting I-9 form submission for ${args.first_name} ${args.last_name}`);
    
    // 1. Validate required fields
    const requiredFields = ['phone', 'first_name', 'last_name', 'address', 'city', 'state', 'zip_code', 'date_of_birth', 'email', 'citizenship_status'];
    const missingFields = requiredFields.filter(field => !args[field as keyof I9FormSubmissionArgs]);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      };
    }
    
    // Validate citizenship status
    const validStatuses = Object.values(CitizenshipStatus);
    if (!validStatuses.includes(args.citizenship_status as CitizenshipStatus)) {
      return {
        success: false,
        error: `Invalid citizenship status. Must be one of: ${validStatuses.join(', ')}`
      };
    }
    
    // Validate phone format
    if (!validatePhone(args.phone)) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(args.date_of_birth)) {
      return {
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      };
    }
    
    // Validate SSN if provided
    if (args.ssn && !validateSSN(args.ssn)) {
      return {
        success: false,
        error: 'Invalid SSN format'
      };
    }
    
    console.log(`[MCP] Validation passed for ${args.phone}`);
    
    // 2. Check if employee exists by phone, create if not
    let employee;
    const employeeResult = await executeGetEmployeeByPhone({ 
      phone: args.phone, 
      email: args.email 
    });
    
    if (!employeeResult.success) {
      return {
        success: false,
        error: `Failed to get/create employee: ${employeeResult.error}`
      };
    }
    
    employee = employeeResult.data?.employee;
    console.log(`[MCP] Employee ${employeeResult.data?.found ? 'found' : 'created'}: ${employee.id}`);
    
    // 3. Check if I-9 form already exists
    const existingFormCheck = await query(
      'SELECT id, status FROM i9_forms WHERE employee_id = $1',
      [employee.id]
    );
    
    if (existingFormCheck.rows.length > 0) {
      const existingForm = existingFormCheck.rows[0];
      if (existingForm.status === I9FormStatus.COMPLETED || 
          existingForm.status === I9FormStatus.DATA_APPROVED || 
          existingForm.status === I9FormStatus.VERIFIED) {
        return {
          success: false,
          error: 'I-9 form already exists and has been submitted/approved'
        };
      }
      // If form exists but is in progress, we'll update it
      console.log(`[MCP] Updating existing form ${existingForm.id}`);
    }
    
    // 4. Clean SSN (remove dashes, keep only digits)
    const cleanSSN = args.ssn ? args.ssn.replace(/[^0-9]/g, '') : null;
    
    // 5. Convert date strings to Date objects
    const dateOfBirth = new Date(args.date_of_birth);
    const alienExpirationDate = args.alien_expiration_date ? new Date(args.alien_expiration_date) : null;
    
    // 6. Create or update I-9 form record with ALL fields
    let formResult;
    if (existingFormCheck.rows.length > 0) {
      // Update existing form
      formResult = await query(`
        UPDATE i9_forms SET 
          last_name = $1, first_name = $2, middle_initial = $3, other_last_names = $4,
          address = $5, apt_number = $6, city = $7, state = $8, zip_code = $9,
          date_of_birth = $10, ssn = $11, email = $12, phone = $13, 
          citizenship_status = $14, uscis_a_number = $15, alien_expiration_date = $16,
          form_i94_number = $17, foreign_passport_number = $18, country_of_issuance = $19,
          status = $20, completed_at = NOW(), updated_at = NOW(),
          employee_signature_date = NOW(), employee_signature_method = 'voice'
        WHERE employee_id = $21
        RETURNING *
      `, [
        args.last_name, args.first_name, args.middle_initial || null, args.other_last_names || null,
        args.address, args.apt_number || null, args.city, args.state, args.zip_code,
        dateOfBirth, cleanSSN, args.email, args.phone,
        args.citizenship_status, args.uscis_a_number || null, alienExpirationDate,
        args.form_i94_number || null, args.foreign_passport_number || null, args.country_of_issuance || null,
        I9FormStatus.COMPLETED, employee.id
      ]);
    } else {
      // Create new form
      formResult = await query(`
        INSERT INTO i9_forms (
          employee_id, last_name, first_name, middle_initial, other_last_names,
          address, apt_number, city, state, zip_code,
          date_of_birth, ssn, email, phone, citizenship_status,
          uscis_a_number, alien_expiration_date, form_i94_number,
          foreign_passport_number, country_of_issuance,
          status, completed_at, employee_signature_date, employee_signature_method
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, NOW(), NOW(), 'voice'
        ) RETURNING *
      `, [
        employee.id, args.last_name, args.first_name, args.middle_initial || null, args.other_last_names || null,
        args.address, args.apt_number || null, args.city, args.state, args.zip_code,
        dateOfBirth, cleanSSN, args.email, args.phone, args.citizenship_status,
        args.uscis_a_number || null, alienExpirationDate, args.form_i94_number || null,
        args.foreign_passport_number || null, args.country_of_issuance || null,
        I9FormStatus.COMPLETED
      ]);
    }
    
    const form = formResult.rows[0];
    console.log(`[MCP] I-9 form ${existingFormCheck.rows.length > 0 ? 'updated' : 'created'}: ${form.id}`);
    
    // 7. Send SMS notification
    let smsSuccess = false;
    try {
      console.log(`[MCP] Sending SMS notification to ${args.phone}`);
      smsSuccess = await sendI9SubmittedSMS(args.phone);
    } catch (smsError) {
      console.warn('[MCP] SMS notification failed:', smsError);
      // Don't fail the entire operation if SMS fails
    }
    
    console.log(`[MCP] I-9 form submission completed successfully for ${args.first_name} ${args.last_name}`);
    
    // 8. Return success with form_id
    return {
      success: true,
      data: {
        form_id: form.id,
        employee_id: employee.id,
        message: 'Form submitted for HR review',
        status: I9FormStatus.COMPLETED,
        completed_at: form.completed_at,
        sms_sent: smsSuccess
      }
    };
    
  } catch (error) {
    console.error('[MCP] Error submitting I-9 form:', error);
    return {
      success: false,
      error: `Failed to submit I-9 form: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}