-- Migration: Add I-9 workflow fields
-- Run this after the initial schema to add workflow capabilities

-- Add new workflow columns to i9_forms table
ALTER TABLE i9_forms 
ADD COLUMN employer_notes TEXT,
ADD COLUMN employer_reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN employer_reviewed_by VARCHAR(255),
ADD COLUMN employee_signature_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN employee_signature_method VARCHAR(50);

-- Update status check constraint to include new workflow statuses
ALTER TABLE i9_forms 
DROP CONSTRAINT IF EXISTS i9_forms_status_check;

ALTER TABLE i9_forms 
ADD CONSTRAINT i9_forms_status_check 
CHECK (status IN ('in_progress', 'completed', 'verified', 'needs_correction', 'data_approved'));

-- Add indexes for workflow queries
CREATE INDEX IF NOT EXISTS idx_i9_forms_employer_reviewed_at ON i9_forms(employer_reviewed_at);
CREATE INDEX IF NOT EXISTS idx_i9_forms_employee_signature_date ON i9_forms(employee_signature_date);

-- Update comments for documentation
COMMENT ON COLUMN i9_forms.employer_notes IS 'Notes from employer review process';
COMMENT ON COLUMN i9_forms.employer_reviewed_at IS 'Timestamp when employer reviewed the form';
COMMENT ON COLUMN i9_forms.employer_reviewed_by IS 'Email or ID of reviewer';
COMMENT ON COLUMN i9_forms.employee_signature_date IS 'When employee signed the form';
COMMENT ON COLUMN i9_forms.employee_signature_method IS 'Method used for signature (voice, digital, etc.)';

-- Add workflow status documentation
COMMENT ON COLUMN i9_forms.status IS 'Form status: in_progress, completed, needs_correction, data_approved, verified';