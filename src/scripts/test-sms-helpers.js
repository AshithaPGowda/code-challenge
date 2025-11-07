#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Import SMS helper functions
const { sendI9SubmittedSMS, sendI9ApprovedSMS, sendI9RejectedSMS } = require('../lib/telnyx.ts');

async function testSMSHelpers() {
  console.log('🧪 Testing I-9 SMS Helper Functions...\n');
  
  const testRecipient = '+16674811679';
  
  try {
    // Test 1: Form Submission SMS
    console.log('📋 Test 1: I-9 Form Submission Notification');
    const submissionResult = await sendI9SubmittedSMS(testRecipient);
    console.log(`   Result: ${submissionResult ? '✅ Success' : '❌ Failed'}\n`);
    
    // Wait a moment between sends
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Form Approval SMS with PDF link
    console.log('📋 Test 2: I-9 Form Approval Notification');
    const approvalResult = await sendI9ApprovedSMS(testRecipient, 'https://example.com/pdf/test.pdf');
    console.log(`   Result: ${approvalResult ? '✅ Success' : '❌ Failed'}\n`);
    
    // Wait a moment between sends
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Form Correction Request SMS
    console.log('📋 Test 3: I-9 Correction Request Notification');
    const correctionResult = await sendI9RejectedSMS(testRecipient, 'Please verify your address and provide additional documentation.');
    console.log(`   Result: ${correctionResult ? '✅ Success' : '❌ Failed'}\n`);
    
    console.log('🎉 All SMS helper tests completed!');
    
  } catch (error) {
    console.error('❌ SMS helper test failed:', error);
  }
}

testSMSHelpers();