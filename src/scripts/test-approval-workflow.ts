#!/usr/bin/env tsx

async function testApprovalWorkflow() {
  try {
    console.log('🧪 Testing HR approval workflow...\n');
    
    // First, get a form that has 'completed' status
    console.log('📋 Step 1: Finding a completed form to test approval');
    const formsResponse = await fetch('http://localhost:3000/api/i9');
    const forms = await formsResponse.json();
    
    const completedForm = forms.find((form: any) => form.status === 'completed');
    
    if (!completedForm) {
      console.log('❌ No completed forms found. Creating a test form first...');
      
      // Use our form submission MCP tool to create a test form
      const { executeSubmitCompleteI9Form } = await import('../lib/mcp-tools');
      
      const testForm = {
        phone: '+1-555-APPROVAL-TEST',
        first_name: 'TestApproval',
        last_name: 'User',
        address: '123 Test Approval St',
        city: 'Test City', 
        state: 'CA',
        zip_code: '90210',
        date_of_birth: '1990-01-01',
        email: 'testapproval@example.com',
        citizenship_status: 'us_citizen'
      };
      
      const submissionResult = await executeSubmitCompleteI9Form(testForm);
      if (!submissionResult.success) {
        console.log('❌ Failed to create test form:', submissionResult.error);
        return;
      }
      
      console.log(`✅ Created test form: ${submissionResult.data?.form_id}`);
      const testFormId = submissionResult.data?.form_id;
      
      // Test the approval workflow
      await testApproval(testFormId, testForm.first_name, testForm.last_name);
      await testCorrections(testFormId);
      
    } else {
      console.log(`✅ Found completed form: ${completedForm.id} (${completedForm.first_name} ${completedForm.last_name})`);
      
      // Test approval workflow with existing form
      await testApproval(completedForm.id, completedForm.first_name, completedForm.last_name);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

async function testApproval(formId: string, firstName: string, lastName: string) {
  console.log(`\\n📋 Step 2: Testing Approval Workflow for ${firstName} ${lastName}`);
  
  try {
    const approvalResponse = await fetch(`http://localhost:3000/api/i9/${formId}?action=approve-data`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reviewed_by: 'test-hr@telnyx.com'
      })
    });
    
    if (!approvalResponse.ok) {
      const errorData = await approvalResponse.json();
      console.log(`❌ Approval failed: ${errorData.error}`);
      return;
    }
    
    const approvalData = await approvalResponse.json();
    
    console.log(`✅ Approval successful!`);
    console.log(`   Form ID: ${approvalData.form.id}`);
    console.log(`   New Status: ${approvalData.form.status}`);
    console.log(`   PDF Generated: ${approvalData.pdf_generated ? 'Yes' : 'No'}`);
    if (approvalData.pdf_url) {
      console.log(`   PDF URL: ${approvalData.pdf_url}`);
    }
    console.log(`   SMS Sent: ${approvalData.sms_sent ? 'Yes' : 'No'}`);
    console.log(`   Recipient: ${approvalData.notification_details?.recipient}`);
    
    // Verify the PDF file was actually created
    if (approvalData.pdf_url) {
      const pdfTestResponse = await fetch(`http://localhost:3000${approvalData.pdf_url}`);
      if (pdfTestResponse.ok) {
        const contentType = pdfTestResponse.headers.get('content-type');
        console.log(`   PDF Verification: ✅ Accessible (${contentType})`);
      } else {
        console.log(`   PDF Verification: ❌ Not accessible (${pdfTestResponse.status})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Approval test failed:', error);
  }
}

async function testCorrections(formId: string) {
  console.log(`\\n📋 Step 3: Testing Corrections Workflow`);
  
  try {
    // First, create another test form to test corrections
    const { executeSubmitCompleteI9Form } = await import('../lib/mcp-tools');
    
    const correctionTestForm = {
      phone: '+1-555-CORRECTION-TEST',
      first_name: 'TestCorrection',
      last_name: 'User',
      address: '456 Test Correction Ave',
      city: 'Correction City',
      state: 'NY', 
      zip_code: '10001',
      date_of_birth: '1985-05-15',
      email: 'testcorrection@example.com',
      citizenship_status: 'us_citizen'
    };
    
    const submissionResult = await executeSubmitCompleteI9Form(correctionTestForm);
    if (!submissionResult.success) {
      console.log('❌ Failed to create correction test form:', submissionResult.error);
      return;
    }
    
    const correctionFormId = submissionResult.data?.form_id;
    console.log(`✅ Created correction test form: ${correctionFormId}`);
    
    // Test correction request
    const correctionResponse = await fetch(`http://localhost:3000/api/i9/${correctionFormId}?action=request-corrections`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        employer_notes: 'Please verify your date of birth and provide additional documentation for address verification.',
        reviewed_by: 'test-hr@telnyx.com'
      })
    });
    
    if (!correctionResponse.ok) {
      const errorData = await correctionResponse.json();
      console.log(`❌ Correction request failed: ${errorData.error}`);
      return;
    }
    
    const correctionData = await correctionResponse.json();
    
    console.log(`✅ Correction request successful!`);
    console.log(`   Form ID: ${correctionData.form.id}`);
    console.log(`   New Status: ${correctionData.form.status}`);
    console.log(`   Employer Notes: ${correctionData.form.employer_notes}`);
    console.log(`   SMS Sent: ${correctionData.sms_sent ? 'Yes' : 'No'}`);
    console.log(`   Recipient: ${correctionData.notification_details?.recipient}`);
    
  } catch (error) {
    console.error('❌ Correction test failed:', error);
  }
}

if (require.main === module) {
  testApprovalWorkflow()
    .then(() => {
      console.log('\\n🎉 Approval workflow tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test script failed:', error);
      process.exit(1);
    });
}

export { testApprovalWorkflow };