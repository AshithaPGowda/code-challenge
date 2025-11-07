#!/usr/bin/env tsx

import { 
  sendSMS, 
  sendI9SubmittedSMS, 
  sendI9ApprovedSMS, 
  sendI9RejectedSMS,
  isValidSMSNumber,
  formatPhoneForSMS,
  getSMSInfo
} from '../lib/telnyx';

async function testSMSIntegration() {
  try {
    console.log('🧪 Testing Telnyx SMS Integration...\n');
    
    // Check environment variables
    console.log('📋 Environment Check:');
    const apiKey = process.env.TELNYX_API_KEY;
    const phoneNumber = process.env.TELNYX_PHONE_NUMBER;
    
    console.log(`   TELNYX_API_KEY: ${apiKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`   TELNYX_PHONE_NUMBER: ${phoneNumber ? '✅ Set' : '❌ Missing'}`);
    
    if (!apiKey || !phoneNumber) {
      console.log('\\n⚠️  Environment variables are missing. Testing helper functions only.\\n');
    }
    
    // Test helper functions
    console.log('📋 Testing Helper Functions:');
    
    // Test phone validation
    const testPhones = [
      '+15551234567',
      '+1-555-123-4567',
      '(555) 123-4567',
      '5551234567',
      'invalid-phone',
      '+44 20 7123 4567' // UK number
    ];
    
    console.log('\\n   Phone Validation Tests:');
    testPhones.forEach(phone => {
      const isValid = isValidSMSNumber(phone);
      const formatted = formatPhoneForSMS(phone);
      console.log(`   ${phone.padEnd(20)} → Valid: ${isValid ? '✅' : '❌'} | Formatted: ${formatted}`);
    });
    
    // Test SMS info calculation
    const testMessages = [
      'Short message',
      'This is a longer message that might take more than one SMS part to send. We need to test how the system calculates the number of parts and estimated cost for longer messages.',
      '🎉 This message has emojis and special characters! Let\'s see how it affects the encoding and part calculation. 📱💬✨'
    ];
    
    console.log('\\n   SMS Info Tests:');
    testMessages.forEach((message, index) => {
      const info = getSMSInfo(message.length);
      console.log(`   Message ${index + 1} (${message.length} chars):`);
      console.log(`     Parts: ${info.parts} | Encoding: ${info.encoding} | Est. Cost: $${info.estimatedCostUSD}`);
    });
    
    // Test actual SMS sending (only if environment is configured)
    if (apiKey && phoneNumber) {
      console.log('\\n📋 Testing Actual SMS Sending:');
      
      const testRecipient = process.env.TEST_SMS_NUMBER || '+15551234567'; // Use env var or test number
      
      console.log(`   Test recipient: ${testRecipient}`);
      console.log('   Note: Using test recipient. Set TEST_SMS_NUMBER env var for real testing.\\n');
      
      // Test 1: Basic SMS
      console.log('   Test 1: Basic SMS');
      const basicResult = await sendSMS(testRecipient, 'Test message from I-9 system');
      console.log(`   Result: ${basicResult ? '✅ Success' : '❌ Failed'}\\n`);
      
      // Test 2: I-9 Submission SMS
      console.log('   Test 2: I-9 Submission Notification');
      const submissionResult = await sendI9SubmittedSMS(testRecipient);
      console.log(`   Result: ${submissionResult ? '✅ Success' : '❌ Failed'}\\n`);
      
      // Test 3: I-9 Approval SMS
      console.log('   Test 3: I-9 Approval Notification');
      const approvalResult = await sendI9ApprovedSMS(testRecipient, 'https://example.com/pdf/test.pdf');
      console.log(`   Result: ${approvalResult ? '✅ Success' : '❌ Failed'}\\n`);
      
      // Test 4: I-9 Rejection SMS
      console.log('   Test 4: I-9 Correction Request');
      const rejectionResult = await sendI9RejectedSMS(testRecipient, 'Please verify your address information and provide additional documentation.');
      console.log(`   Result: ${rejectionResult ? '✅ Success' : '❌ Failed'}\\n`);
      
      // Test 5: Error handling - invalid phone
      console.log('   Test 5: Error Handling (Invalid Phone)');
      const errorResult = await sendSMS('invalid-phone', 'This should fail');
      console.log(`   Result: ${!errorResult ? '✅ Failed as expected' : '❌ Unexpected success'}\\n`);
      
      // Test 6: Error handling - empty message
      console.log('   Test 6: Error Handling (Empty Message)');
      const emptyResult = await sendSMS(testRecipient, '');
      console.log(`   Result: ${!emptyResult ? '✅ Failed as expected' : '❌ Unexpected success'}\\n`);
      
    } else {
      console.log('\\n⚠️  Skipping actual SMS tests - environment not configured\\n');
      console.log('To test actual SMS sending:');
      console.log('1. Set TELNYX_API_KEY in your .env.local');
      console.log('2. Set TELNYX_PHONE_NUMBER in your .env.local');
      console.log('3. Optionally set TEST_SMS_NUMBER for real testing\\n');
    }
    
    console.log('🎉 SMS Integration Tests Completed!\\n');
    
  } catch (error) {
    console.error('❌ SMS Integration Tests Failed:', error);
    process.exit(1);
  }
}

async function testWorkflowIntegration() {
  console.log('🧪 Testing SMS in Complete Workflow...');
  
  try {
    // Test form submission with SMS
    console.log('\\n📋 Step 1: Testing Form Submission with SMS');
    const { executeSubmitCompleteI9Form } = await import('../lib/mcp-tools');
    
    const testForm = {
      phone: '+15551234567', // Test phone number
      first_name: 'SMSTest',
      last_name: 'User',
      address: '123 SMS Test Street',
      city: 'SMS City',
      state: 'CA',
      zip_code: '90210',
      date_of_birth: '1990-01-01',
      email: 'smstest@example.com',
      citizenship_status: 'us_citizen'
    };
    
    const submissionResult = await executeSubmitCompleteI9Form(testForm);
    console.log(`   Form Submission: ${submissionResult.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   SMS Sent: ${submissionResult.data?.sms_sent ? '✅ Yes' : '❌ No'}`);
    
    if (submissionResult.success) {
      const formId = submissionResult.data?.form_id;
      
      // Test approval workflow with SMS
      console.log('\\n📋 Step 2: Testing Approval Workflow with SMS');
      const approvalResponse = await fetch(`http://localhost:3000/api/i9/${formId}?action=approve-data`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reviewed_by: 'sms-test@example.com'
        })
      });
      
      if (approvalResponse.ok) {
        const approvalData = await approvalResponse.json();
        console.log(`   Approval: ${approvalData.success ? '✅ Success' : '❌ Failed'}`);
        console.log(`   PDF Generated: ${approvalData.pdf_generated ? '✅ Yes' : '❌ No'}`);
        console.log(`   SMS Sent: ${approvalData.sms_sent ? '✅ Yes' : '❌ No'}`);
      } else {
        console.log('   ❌ Approval API call failed');
      }
    }
    
    console.log('\\n🎉 Workflow Integration Tests Completed!');
    
  } catch (error) {
    console.error('❌ Workflow Integration Tests Failed:', error);
  }
}

if (require.main === module) {
  Promise.all([
    testSMSIntegration(),
    testWorkflowIntegration()
  ])
    .then(() => {
      console.log('\\n✨ All SMS tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ SMS tests failed:', error);
      process.exit(1);
    });
}

export { testSMSIntegration, testWorkflowIntegration };