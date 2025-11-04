-- I-9 Employment Eligibility Verification Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- I-9 Forms table (Section 1 fields)
CREATE TABLE IF NOT EXISTS i9_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Basic Info
    last_name VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_initial VARCHAR(10),
    other_last_names VARCHAR(255),
    
    -- Address
    address VARCHAR(255) NOT NULL,
    apt_number VARCHAR(20),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    
    -- Contact
    date_of_birth DATE NOT NULL,
    ssn VARCHAR(11),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    
    -- Citizenship Status
    citizenship_status VARCHAR(50) NOT NULL CHECK (
        citizenship_status IN (
            'us_citizen',
            'noncitizen_national', 
            'lawful_permanent_resident',
            'authorized_alien'
        )
    ),
    
    -- Additional fields for status 3 & 4
    uscis_a_number VARCHAR(50),
    alien_expiration_date DATE,
    form_i94_number VARCHAR(50),
    foreign_passport_number VARCHAR(50),
    country_of_issuance VARCHAR(100),
    
    -- Metadata
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (
        status IN ('in_progress', 'completed', 'verified')
    ),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_phone ON employees(phone);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_i9_forms_employee_id ON i9_forms(employee_id);
CREATE INDEX IF NOT EXISTS idx_i9_forms_status ON i9_forms(status);
CREATE INDEX IF NOT EXISTS idx_i9_forms_created_at ON i9_forms(created_at);

-- Update trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_employees_updated_at 
    BEFORE UPDATE ON employees 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_i9_forms_updated_at 
    BEFORE UPDATE ON i9_forms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();