#!/usr/bin/env tsx

import { writeFileSync } from 'fs';
import { join } from 'path';
import { fillI9PDF, createSampleEmployer } from '../lib/pdf-filler';
import { I9Form, CitizenshipStatus, I9FormStatus } from '../lib/types';

async function testPdfFiller() {
  try {
    console.log('🧪 Testing PDF form filler...\n');
    
    // Create sample I9Form data
    const sampleForm: I9Form = {
      id: 'test-form-1',
      employee_id: 'emp-123',
      
      // Basic Info
      last_name: 'Smith',
      first_name: 'John',
      middle_initial: 'M',
      other_last_names: undefined,
      
      // Address
      address: '123 Main Street',
      apt_number: 'Apt 4B',
      city: 'New York',
      state: 'NY',
      zip_code: '10001',
      
      // Contact
      date_of_birth: new Date('1990-05-15'),
      ssn: '123456789',
      email: 'john.smith@email.com',
      phone: '+1-555-123-4567',
      
      // Citizenship Status
      citizenship_status: CitizenshipStatus.US_CITIZEN,
      
      // Additional fields (not needed for US citizen)
      uscis_a_number: undefined,
      alien_expiration_date: undefined,
      form_i94_number: undefined,
      foreign_passport_number: undefined,
      country_of_issuance: undefined,
      
      // Metadata
      status: I9FormStatus.COMPLETED,
      completed_at: new Date(),
      
      // Workflow fields
      employer_notes: undefined,
      employer_reviewed_at: undefined,
      employer_reviewed_by: undefined,
      employee_signature_date: new Date(),
      employee_signature_method: 'voice',
      
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Create sample employer data
    const sampleEmployer = createSampleEmployer();
    
    console.log('📝 Sample form data:');
    console.log(`   Employee: ${sampleForm.first_name} ${sampleForm.last_name}`);
    console.log(`   Address: ${sampleForm.address}, ${sampleForm.city}, ${sampleForm.state} ${sampleForm.zip_code}`);
    console.log(`   Email: ${sampleForm.email}`);
    console.log(`   Phone: ${sampleForm.phone}`);
    console.log(`   Citizenship: ${sampleForm.citizenship_status}`);
    console.log(`   Employer: ${sampleEmployer.company_name}`);
    console.log('');
    
    // Fill the PDF
    console.log('🔄 Filling PDF form...');
    const pdfBytes = await fillI9PDF(sampleForm, sampleEmployer);
    
    // Save the filled PDF
    const outputPath = join(process.cwd(), 'filled-i9-sample.pdf');
    writeFileSync(outputPath, pdfBytes);
    
    console.log(`\n✅ Success! Filled PDF saved to: ${outputPath}`);
    console.log(`📊 File size: ${(pdfBytes.length / 1024).toFixed(1)} KB`);
    
    // Test with different citizenship status
    console.log('\n🧪 Testing with Lawful Permanent Resident status...');
    
    const lprForm: I9Form = {
      ...sampleForm,
      id: 'test-form-2',
      first_name: 'Maria',
      last_name: 'Rodriguez',
      citizenship_status: CitizenshipStatus.LAWFUL_PERMANENT_RESIDENT,
      uscis_a_number: 'A123456789'
    };
    
    const lprPdfBytes = await fillI9PDF(lprForm, sampleEmployer);
    const lprOutputPath = join(process.cwd(), 'filled-i9-lpr-sample.pdf');
    writeFileSync(lprOutputPath, lprPdfBytes);
    
    console.log(`✅ LPR test completed! PDF saved to: ${lprOutputPath}`);
    
    // Test with Authorized Alien status
    console.log('\n🧪 Testing with Authorized Alien status...');
    
    const alienForm: I9Form = {
      ...sampleForm,
      id: 'test-form-3',
      first_name: 'Ahmed',
      last_name: 'Hassan',
      citizenship_status: CitizenshipStatus.AUTHORIZED_ALIEN,
      alien_expiration_date: new Date('2025-12-31'),
      foreign_passport_number: 'P123456789',
      country_of_issuance: 'Egypt'
    };
    
    const alienPdfBytes = await fillI9PDF(alienForm, sampleEmployer);
    const alienOutputPath = join(process.cwd(), 'filled-i9-alien-sample.pdf');
    writeFileSync(alienOutputPath, alienPdfBytes);
    
    console.log(`✅ Authorized Alien test completed! PDF saved to: ${alienOutputPath}`);
    
    console.log('\n🎉 All PDF filler tests completed successfully!');
    console.log('💡 Open the generated PDF files to verify the form fields were filled correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testPdfFiller()
    .then(() => {
      console.log('\n✨ PDF filler test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test script failed:', error);
      process.exit(1);
    });
}

export { testPdfFiller };