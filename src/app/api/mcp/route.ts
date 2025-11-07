import { z } from 'zod';
import { createMcpHandler } from 'mcp-handler';
import {
  executeValidateSSN,
  executeValidateCitizenshipStatus,
  executeSaveI9Field,
  executeGetI9Progress,
  executeGetEmployeeByPhone,
  executeCompleteI9Section1,
  executeZipLookup,
  executeSubmitCompleteI9Form
} from '@/lib/mcp-tools';

const handler = createMcpHandler(
  (server) => {
    // Tool 1: Validate SSN
    server.tool(
      'validate_ssn',
      'Validates Social Security Number format (XXX-XX-XXXX)',
      { 
        ssn: z.string().describe('Social Security Number to validate')
      },
      async ({ ssn }) => {
        const result = await executeValidateSSN({ ssn });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    // Tool 2: Validate Citizenship Status
    server.tool(
      'validate_citizenship_status',
      'Validate citizenship status value against allowed options',
      { 
        status: z.string().describe('Citizenship status to validate')
      },
      async ({ status }) => {
        const result = await executeValidateCitizenshipStatus({ status });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    // Tool 3: Save I-9 Field
    server.tool(
      'save_i9_field',
      'Save a single field to the I-9 form in database',
      { 
        employee_id: z.string().describe('Employee UUID'),
        field_name: z.string().describe('Name of the field to update'),
        value: z.string().describe('Value to save for the field')
      },
      async ({ employee_id, field_name, value }) => {
        const result = await executeSaveI9Field({ employee_id, field_name, value });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    // Tool 4: Get I-9 Progress
    server.tool(
      'get_i9_progress',
      'Get current I-9 form completion status and list missing required fields',
      { 
        employee_id: z.string().describe('Employee UUID')
      },
      async ({ employee_id }) => {
        const result = await executeGetI9Progress({ employee_id });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    // Tool 5: Get Employee By Phone
    server.tool(
      'get_employee_by_phone',
      'Find existing employee by phone number or create new one if not found',
      { 
        phone: z.string().describe('Phone number to search for'),
        email: z.string().optional().describe('Email address for new employee creation (optional)')
      },
      async ({ phone, email }) => {
        const result = await executeGetEmployeeByPhone({ phone, email });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    // Tool 6: Complete I-9 Section 1
    server.tool(
      'complete_i9_section1',
      'Mark I-9 Section 1 as completed and set completion timestamp',
      { 
        employee_id: z.string().describe('Employee UUID')
      },
      async ({ employee_id }) => {
        const result = await executeCompleteI9Section1({ employee_id });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    // Tool 7: ZIP Code Lookup
    server.tool(
      'lookup_city_state_from_zip',
      'Look up city and state from a ZIP code to auto-fill address fields',
      { 
        zip_code: z.string().describe('5-digit US ZIP code')
      },
      async ({ zip_code }) => {
        const result = await executeZipLookup({ zip_code });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      },
    );

    // Tool 8: Submit Complete I-9 Form
    server.tool(
      'submit_complete_i9_form',
      'Submit a complete I-9 form for HR review. Creates employee if needed and sends SMS confirmation.',
      {
        phone: z.string().describe('Employee phone number'),
        first_name: z.string().describe('Employee first name'),
        last_name: z.string().describe('Employee last name'),
        middle_initial: z.string().optional().describe('Employee middle initial (optional)'),
        other_last_names: z.string().optional().describe('Other last names used (optional)'),
        address: z.string().describe('Street address'),
        apt_number: z.string().optional().describe('Apartment number (optional)'),
        city: z.string().describe('City'),
        state: z.string().describe('State abbreviation (e.g., CA, NY)'),
        zip_code: z.string().describe('5-digit ZIP code'),
        date_of_birth: z.string().describe('Date of birth (YYYY-MM-DD format)'),
        ssn: z.string().optional().describe('Social Security Number (optional, 9 digits or XXX-XX-XXXX format)'),
        email: z.string().describe('Email address'),
        citizenship_status: z.string().describe('Citizenship status: us_citizen, noncitizen_national, lawful_permanent_resident, or authorized_alien'),
        uscis_a_number: z.string().optional().describe('USCIS A-Number (for LPR or authorized alien)'),
        alien_expiration_date: z.string().optional().describe('Work authorization expiration date (YYYY-MM-DD, for authorized alien)'),
        form_i94_number: z.string().optional().describe('Form I-94 admission number (for authorized alien)'),
        foreign_passport_number: z.string().optional().describe('Foreign passport number (for authorized alien)'),
        country_of_issuance: z.string().optional().describe('Country of passport issuance (for authorized alien)')
      },
      async (args) => {
        const result = await executeSubmitCompleteI9Form(args);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      },
    );
  },
  {
    name: 'i9-voice-assistant',
    version: '1.0.0',
    description: 'MCP server for I-9 Employment Eligibility Verification voice assistant'
  },
  { basePath: '/api' },
);

export { handler as GET, handler as POST, handler as DELETE };