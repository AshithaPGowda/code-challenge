import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown } from 'pdf-lib';
import { readFileSync } from 'fs';
import { join } from 'path';
import { I9Form, Employer, CitizenshipStatus } from './types';

/**
 * Format date as MMDDYYYY for PDF fields
 */
function formatDateMMDDYYYY(date: Date | null | undefined): string {
  if (!date) return '';
  
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  
  return `${month}${day}${year}`;
}

/**
 * Safely fill a text field in the PDF form
 */
function fillTextField(form: PDFForm, fieldName: string, value: string | undefined | null, required = false): void {
  try {
    if (!value && !required) return;
    
    const field = form.getTextField(fieldName);
    field.setText(value || '');
    console.log(`✓ Filled field "${fieldName}": "${value}"`);
  } catch (error) {
    console.warn(`⚠ Warning: Could not fill field "${fieldName}":`, error instanceof Error ? error.message : error);
  }
}

/**
 * Safely fill a checkbox in the PDF form
 */
function fillCheckBox(form: PDFForm, fieldName: string, checked: boolean): void {
  try {
    const field = form.getCheckBox(fieldName);
    if (checked) {
      field.check();
      console.log(`✓ Checked box "${fieldName}"`);
    } else {
      field.uncheck();
    }
  } catch (error) {
    console.warn(`⚠ Warning: Could not fill checkbox "${fieldName}":`, error instanceof Error ? error.message : error);
  }
}

/**
 * Safely fill a dropdown in the PDF form
 */
function fillDropdown(form: PDFForm, fieldName: string, value: string | undefined | null): void {
  try {
    if (!value) return;
    
    const field = form.getDropdown(fieldName);
    const options = field.getOptions();
    
    // Find exact match or try variations
    let selectedValue = value;
    if (!options.includes(value)) {
      // Try uppercase
      const upperValue = value.toUpperCase();
      if (options.includes(upperValue)) {
        selectedValue = upperValue;
      } else {
        console.warn(`⚠ Warning: Value "${value}" not found in dropdown "${fieldName}". Available options:`, options);
        return;
      }
    }
    
    field.select(selectedValue);
    console.log(`✓ Selected "${selectedValue}" in dropdown "${fieldName}"`);
  } catch (error) {
    console.warn(`⚠ Warning: Could not fill dropdown "${fieldName}":`, error instanceof Error ? error.message : error);
  }
}

/**
 * Fill I-9 PDF form with provided data
 */
export async function fillI9PDF(formData: I9Form, employerData: Employer): Promise<Uint8Array> {
  try {
    console.log('🔄 Starting I-9 PDF form filling...');
    
    // Load the I-9 PDF template
    const templatePath = join(process.cwd(), 'public', 'templates', 'i9-template.pdf');
    console.log(`📄 Loading template from: ${templatePath}`);
    
    const templateBytes = readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();
    
    console.log(`📝 Form loaded with ${form.getFields().length} fields`);
    
    // Section 1: Employee Information
    console.log('\\n📋 Filling Section 1 - Employee Information');
    
    // Basic Info
    fillTextField(form, 'Last Name (Family Name)', formData.last_name, true);
    fillTextField(form, 'First Name Given Name', formData.first_name, true);
    fillTextField(form, 'Employee Middle Initial (if any)', formData.middle_initial);
    fillTextField(form, 'Employee Other Last Names Used (if any)', formData.other_last_names);
    
    // Address
    fillTextField(form, 'Address Street Number and Name', formData.address, true);
    fillTextField(form, 'Apt Number (if any)', formData.apt_number);
    fillTextField(form, 'City or Town', formData.city, true);
    fillDropdown(form, 'State', formData.state);
    fillTextField(form, 'ZIP Code', formData.zip_code, true);
    
    // Personal Info
    fillTextField(form, 'Date of Birth mmddyyyy', formatDateMMDDYYYY(formData.date_of_birth), true);
    
    // Clean SSN: remove dashes and validate 9 digits
    const cleanSSN = formData.ssn ? formData.ssn.replace(/[^0-9]/g, '') : undefined;
    if (cleanSSN && cleanSSN.length !== 9) {
      console.warn(`⚠ Warning: SSN should be 9 digits, got ${cleanSSN.length}: "${cleanSSN}"`);
    }
    fillTextField(form, 'US Social Security Number', cleanSSN);
    
    fillTextField(form, 'Employees E-mail Address', formData.email, true);
    fillTextField(form, 'Telephone Number', formData.phone, true);
    
    // Citizenship Status Checkboxes
    console.log('\\n🏛 Setting citizenship status checkboxes');
    const citizenship = formData.citizenship_status;
    
    fillCheckBox(form, 'CB_1', citizenship === CitizenshipStatus.US_CITIZEN);
    fillCheckBox(form, 'CB_2', citizenship === CitizenshipStatus.NONCITIZEN_NATIONAL);
    fillCheckBox(form, 'CB_3', citizenship === CitizenshipStatus.LAWFUL_PERMANENT_RESIDENT);
    fillCheckBox(form, 'CB_4', citizenship === CitizenshipStatus.AUTHORIZED_ALIEN);
    
    // Additional fields based on citizenship status
    if (citizenship === CitizenshipStatus.LAWFUL_PERMANENT_RESIDENT) {
      fillTextField(form, '3 A lawful permanent resident Enter USCIS or ANumber', formData.uscis_a_number);
    }
    
    if (citizenship === CitizenshipStatus.AUTHORIZED_ALIEN) {
      fillTextField(form, 'Exp Date mmddyyyy', formatDateMMDDYYYY(formData.alien_expiration_date));
      
      // Fill one of the three possible fields for authorized aliens
      if (formData.uscis_a_number) {
        fillTextField(form, 'USCIS ANumber', formData.uscis_a_number);
      } else if (formData.form_i94_number) {
        fillTextField(form, 'Form I94 Admission Number', formData.form_i94_number);
      } else if (formData.foreign_passport_number && formData.country_of_issuance) {
        const passportInfo = `${formData.foreign_passport_number} ${formData.country_of_issuance}`;
        fillTextField(form, 'Foreign Passport Number and Country of IssuanceRow1', passportInfo);
      }
    }
    
    // Employee Signature and Date
    console.log('\\n✍️ Adding employee signature and date');
    const signatureText = formData.completed_at 
      ? `Signed via voice on ${formData.completed_at.toLocaleDateString()}`
      : 'Signed via voice';
    fillTextField(form, 'Signature of Employee', signatureText);
    fillTextField(form, "Today's Date mmddyyy", formatDateMMDDYYYY(formData.completed_at || new Date()));
    
    // Section 2: Employer Information
    console.log('\\n🏢 Filling Section 2 - Employer Information');
    
    fillTextField(form, 'Employers Business or Org Name', employerData.company_name, true);
    
    // Combine employer address
    const employerAddress = [
      employerData.company_address,
      employerData.company_city,
      `${employerData.company_state} ${employerData.company_zip}`
    ].filter(Boolean).join(', ');
    fillTextField(form, 'Employers Business or Org Address', employerAddress);
    
    // HR Representative info
    const hrInfo = [employerData.hr_representative_name, employerData.hr_representative_title]
      .filter(Boolean).join(', ');
    fillTextField(form, 'Last Name First Name and Title of Employer or Authorized Representative', hrInfo);
    
    // Employer signature placeholder
    fillTextField(form, 'Signature of Employer or AR', `${employerData.hr_representative_name} (Electronic Signature)`);
    
    // Dates
    const currentDate = new Date();
    fillTextField(form, 'S2 Todays Date mmddyyyy', formatDateMMDDYYYY(currentDate));
    fillTextField(form, 'FirstDayEmployed mmddyyyy', ''); // Leave blank or fill with start date if available
    
    console.log('\\n🔒 Flattening form to make it read-only');
    
    // Flatten the form to make it read-only (optional)
    // form.flatten();
    
    console.log('💾 Saving completed PDF');
    const pdfBytes = await pdfDoc.save();
    
    console.log(`✅ PDF form filled successfully! Generated ${pdfBytes.length} bytes`);
    return pdfBytes;
    
  } catch (error) {
    console.error('❌ Error filling PDF form:', error);
    throw new Error(`Failed to fill I-9 PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a sample employer for testing
 */
export function createSampleEmployer(): Employer {
  return {
    id: 'employer-1',
    company_name: 'Telnyx LLC',
    company_address: '311 W Superior St, Suite 200',
    company_city: 'Chicago',
    company_state: 'IL',
    company_zip: '60654',
    hr_representative_name: 'Sarah Johnson',
    hr_representative_title: 'HR Manager',
    created_at: new Date(),
    updated_at: new Date()
  };
}