import { z } from 'zod';
import { CitizenshipStatus, I9FormStatus } from './types';

// US state codes for validation
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC'
];

// Helper validation functions
export function validateSSN(ssn: string): boolean {
  const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
  return ssnRegex.test(ssn);
}

export function validateZipCode(zip: string): boolean {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
}

export function validatePhone(phone: string): boolean {
  // Supports formats: (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890
  const phoneRegex = /^(\+1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
  return phoneRegex.test(phone);
}

export function validateState(state: string): boolean {
  return US_STATES.includes(state.toUpperCase());
}

// Employee schema
export const employeeSchema = z.object({
  phone: z.string()
    .min(1, 'Phone number is required')
    .refine(validatePhone, 'Invalid US phone number format'),
  email: z.string().email('Invalid email format').optional(),
});

// Base I-9 Form schema (without refine)
const baseI9FormSchema = z.object({
  employee_id: z.string().uuid('Invalid employee ID format'),
  
  // Basic Info
  last_name: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be 100 characters or less'),
  first_name: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be 100 characters or less'),
  middle_initial: z.string()
    .max(10, 'Middle initial must be 10 characters or less')
    .optional(),
  other_last_names: z.string()
    .max(255, 'Other last names must be 255 characters or less')
    .optional(),
  
  // Address
  address: z.string()
    .min(1, 'Address is required')
    .max(255, 'Address must be 255 characters or less'),
  apt_number: z.string()
    .max(20, 'Apartment number must be 20 characters or less')
    .optional(),
  city: z.string()
    .min(1, 'City is required')
    .max(100, 'City must be 100 characters or less'),
  state: z.string()
    .length(2, 'State must be 2 characters')
    .refine(validateState, 'Invalid US state code'),
  zip_code: z.string()
    .refine(validateZipCode, 'Invalid ZIP code format (must be 12345 or 12345-6789)'),
  
  // Contact
  date_of_birth: z.string()
    .refine((date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime()) && parsed < new Date();
    }, 'Invalid date of birth'),
  ssn: z.string()
    .refine(validateSSN, 'Invalid SSN format (must be XXX-XX-XXXX)')
    .optional(),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be 255 characters or less'),
  phone: z.string()
    .refine(validatePhone, 'Invalid US phone number format'),
  
  // Citizenship Status
  citizenship_status: z.nativeEnum(CitizenshipStatus, {
    errorMap: () => ({ message: 'Invalid citizenship status' })
  }),
  
  // Additional fields for status 3 & 4 (conditional validation)
  uscis_a_number: z.string()
    .max(50, 'USCIS A-Number must be 50 characters or less')
    .optional(),
  alien_expiration_date: z.string()
    .refine((date) => {
      if (!date) return true;
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, 'Invalid expiration date')
    .optional(),
  form_i94_number: z.string()
    .max(50, 'Form I-94 number must be 50 characters or less')
    .optional(),
  foreign_passport_number: z.string()
    .max(50, 'Foreign passport number must be 50 characters or less')
    .optional(),
  country_of_issuance: z.string()
    .max(100, 'Country of issuance must be 100 characters or less')
    .optional(),
});

// I-9 Form creation schema (with refine)
export const createI9FormSchema = baseI9FormSchema.refine((data) => {
  // Conditional validation for non-citizens
  if (data.citizenship_status === CitizenshipStatus.LAWFUL_PERMANENT_RESIDENT) {
    return data.uscis_a_number || data.alien_expiration_date;
  }
  if (data.citizenship_status === CitizenshipStatus.AUTHORIZED_ALIEN) {
    return data.uscis_a_number || data.form_i94_number || data.foreign_passport_number;
  }
  return true;
}, {
  message: 'Additional documentation required for selected citizenship status',
  path: ['citizenship_status']
});

// I-9 Form update schema (partial)
export const updateI9FormSchema = baseI9FormSchema.partial().extend({
  status: z.nativeEnum(I9FormStatus, {
    errorMap: () => ({ message: 'Invalid form status' })
  }).optional(),
});

// Export type inference
export type EmployeeInput = z.infer<typeof employeeSchema>;
export type CreateI9FormInput = z.infer<typeof createI9FormSchema>;
export type UpdateI9FormInput = z.infer<typeof updateI9FormSchema>;