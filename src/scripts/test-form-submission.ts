#!/usr/bin/env tsx

import { executeSubmitCompleteI9Form } from '../lib/mcp-tools';

async function testFormSubmission() {
  try {
    console.log('🧪 Testing complete I-9 form submission...\n');
    
    // Test case 1: US Citizen
    console.log('📋 Test 1: US Citizen Form Submission');
    const usCitizenForm = {
      phone: '+1-555-123-4001',
      first_name: 'Alice',
      last_name: 'Johnson',
      middle_initial: 'M',
      address: '456 Test Street',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94102',
      date_of_birth: '1992-08-15',
      ssn: '555-12-3456',
      email: 'alice.johnson@test.com',
      citizenship_status: 'us_citizen'
    };
    
    const result1 = await executeSubmitCompleteI9Form(usCitizenForm);
    
    if (result1.success) {
      console.log(`✅ Success! Form ID: ${result1.data?.form_id}`);
      console.log(`   Employee ID: ${result1.data?.employee_id}`);
      console.log(`   Status: ${result1.data?.status}`);
      console.log(`   Message: ${result1.data?.message}`);
      console.log(`   SMS: ${result1.data?.sms_sent ? 'Sent' : 'Failed'}`);
    } else {
      console.log(`❌ Failed: ${result1.error}`);
    }
    
    console.log('\\n' + '='.repeat(60) + '\\n');
    
    // Test case 2: Lawful Permanent Resident
    console.log('📋 Test 2: Lawful Permanent Resident Form Submission');
    const lprForm = {
      phone: '+1-555-123-4002',
      first_name: 'Carlos',
      last_name: 'Rodriguez',
      address: '789 Green Card Avenue',
      apt_number: 'Unit 5',
      city: 'Miami',
      state: 'FL',
      zip_code: '33101',
      date_of_birth: '1988-12-03',
      email: 'carlos.rodriguez@test.com',
      citizenship_status: 'lawful_permanent_resident',
      uscis_a_number: 'A123456789'
    };
    
    const result2 = await executeSubmitCompleteI9Form(lprForm);
    
    if (result2.success) {
      console.log(`✅ Success! Form ID: ${result2.data?.form_id}`);
      console.log(`   Employee ID: ${result2.data?.employee_id}`);
      console.log(`   Status: ${result2.data?.status}`);
      console.log(`   A-Number: Included`);
    } else {
      console.log(`❌ Failed: ${result2.error}`);
    }
    
    console.log('\\n' + '='.repeat(60) + '\\n');
    
    // Test case 3: Authorized Alien with work permit
    console.log('📋 Test 3: Authorized Alien Form Submission');
    const alienForm = {
      phone: '+1-555-123-4003',
      first_name: 'Yuki',
      last_name: 'Tanaka',
      address: '321 Visa Boulevard',
      city: 'Seattle',
      state: 'WA',
      zip_code: '98101',
      date_of_birth: '1995-06-20',
      email: 'yuki.tanaka@test.com',
      citizenship_status: 'authorized_alien',
      alien_expiration_date: '2026-12-31',
      foreign_passport_number: 'JP123456789',
      country_of_issuance: 'Japan'
    };
    
    const result3 = await executeSubmitCompleteI9Form(alienForm);
    
    if (result3.success) {
      console.log(`✅ Success! Form ID: ${result3.data?.form_id}`);
      console.log(`   Employee ID: ${result3.data?.employee_id}`);
      console.log(`   Status: ${result3.data?.status}`);
      console.log(`   Work Authorization: Valid until 2026-12-31`);
    } else {
      console.log(`❌ Failed: ${result3.error}`);
    }
    
    console.log('\\n' + '='.repeat(60) + '\\n');
    
    // Test case 4: Validation error (missing required field)
    console.log('📋 Test 4: Validation Error Test');
    const invalidForm = {
      phone: '+1-555-123-4004',
      first_name: 'Test',
      last_name: 'User',
      // Missing required address field
      city: 'Test City',
      state: 'CA',
      zip_code: '90210',
      date_of_birth: '1990-01-01',
      email: 'test@example.com',
      citizenship_status: 'us_citizen'
    };
    
    const result4 = await executeSubmitCompleteI9Form(invalidForm as any);
    
    if (result4.success) {
      console.log(`❌ Unexpected success - validation should have failed`);
    } else {
      console.log(`✅ Expected validation error: ${result4.error}`);
    }
    
    console.log('\\n' + '='.repeat(60) + '\\n');
    
    // Test case 5: Duplicate submission (should fail)
    console.log('📋 Test 5: Duplicate Submission Test');
    const duplicateResult = await executeSubmitCompleteI9Form(usCitizenForm);
    
    if (duplicateResult.success) {
      console.log(`❌ Unexpected success - duplicate should have failed`);
    } else {
      console.log(`✅ Expected duplicate error: ${duplicateResult.error}`);
    }
    
    console.log('\\n🎉 All form submission tests completed!');
    
  } catch (error) {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testFormSubmission()
    .then(() => {
      console.log('\\n✨ Form submission tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test script failed:', error);
      process.exit(1);
    });
}

export { testFormSubmission };