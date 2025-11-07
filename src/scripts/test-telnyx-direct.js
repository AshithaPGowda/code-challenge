#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

async function testTelnyxDirect() {
  console.log('🧪 Testing Telnyx API directly...\n');
  
  const apiKey = process.env.TELNYX_API_KEY;
  const phoneNumber = process.env.TELNYX_PHONE_NUMBER;
  
  console.log('📋 Environment Check:');
  console.log(`   TELNYX_API_KEY: ${apiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   TELNYX_PHONE_NUMBER: ${phoneNumber ? '✅ Set' : '❌ Missing'}`);
  
  if (!apiKey || !phoneNumber) {
    console.log('\n❌ Missing environment variables');
    return;
  }
  
  // Test SMS sending
  const testRecipient = '+16675811678'; // User's phone number for testing
  const testMessage = 'Test message from Telnyx I-9 system';
  
  console.log(`\n📋 Testing SMS to ${testRecipient}`);
  console.log(`   Message: "${testMessage}"`);
  
  try {
    const response = await fetch('https://api.telnyx.com/v2/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Telnyx-I9-System/1.0'
      },
      body: JSON.stringify({
        from: phoneNumber,
        to: testRecipient,
        text: testMessage
      })
    });
    
    console.log(`\n📋 API Response:`)
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const responseData = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ SMS sent successfully!`);
      console.log(`   Message ID: ${responseData.data.id}`);
      console.log(`   Parts: ${responseData.data.parts}`);
      console.log(`   Cost: ${responseData.data.cost.amount} ${responseData.data.cost.currency}`);
    } else {
      console.log(`   ❌ SMS failed:`);
      if (responseData.errors) {
        responseData.errors.forEach(error => {
          console.log(`      ${error.code}: ${error.title} - ${error.detail}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testTelnyxDirect();