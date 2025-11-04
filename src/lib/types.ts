export enum CitizenshipStatus {
  US_CITIZEN = 'us_citizen',
  NONCITIZEN_NATIONAL = 'noncitizen_national',
  LAWFUL_PERMANENT_RESIDENT = 'lawful_permanent_resident',
  AUTHORIZED_ALIEN = 'authorized_alien'
}

export enum I9FormStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  VERIFIED = 'verified'
}

export interface Employee {
  id: string;
  phone: string;
  email?: string;
  created_at: Date;
  updated_at: Date;
}

export interface I9Form {
  id: string;
  employee_id: string;
  
  // Basic Info
  last_name: string;
  first_name: string;
  middle_initial?: string;
  other_last_names?: string;
  
  // Address
  address: string;
  apt_number?: string;
  city: string;
  state: string;
  zip_code: string;
  
  // Contact
  date_of_birth: Date;
  ssn?: string;
  email: string;
  phone: string;
  
  // Citizenship Status
  citizenship_status: CitizenshipStatus;
  
  // Additional fields for status 3 & 4
  uscis_a_number?: string;
  alien_expiration_date?: Date;
  form_i94_number?: string;
  foreign_passport_number?: string;
  country_of_issuance?: string;
  
  // Metadata
  status: I9FormStatus;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateI9FormRequest {
  employee_id: string;
  last_name: string;
  first_name: string;
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
  phone: string;
  citizenship_status: CitizenshipStatus;
  uscis_a_number?: string;
  alien_expiration_date?: string;
  form_i94_number?: string;
  foreign_passport_number?: string;
  country_of_issuance?: string;
}

export interface UpdateI9FormRequest extends Partial<CreateI9FormRequest> {
  status?: I9FormStatus;
}