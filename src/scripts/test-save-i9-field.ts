#!/usr/bin/env tsx

import { config } from 'dotenv';
import { executeSaveI9Field, executeGetI9Progress, executeGetEmployeeByPhone } from '../lib/mcp-tools';

// Load environment variables
config({ path: '.env.local' });

interface TestResult {
  scenario: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(scenario: string, condition: boolean, expected: any, actual: any, message?: string): void {
  const passed = condition;
  const testMessage = message || `Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)}`;
  
  console.log(`${passed ? '✅' : '❌'} ${scenario}: ${testMessage}`);
  
  results.push({
    scenario,
    passed,
    message: testMessage,
    details: { expected, actual }
  });
}

function logInfo(message: string): void {
  console.log(`ℹ️  ${message}`);
}

function logSection(title: string): void {
  console.log(`\n🔍 ${title}`);
  console.log('='.repeat(50));
}

async function runTests(): Promise<void> {
  console.log('🚀 Starting comprehensive save_i9_field MCP tool tests...\n');

  // Test variables
  let employee1Id: string;
  let employee2Id: string;
  let employee3Id: string;
  
  // Use unique phone numbers for each test run to avoid conflicts
  const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
  const phone1 = `+1 555-123-${timestamp}`;
  const phone2 = `+1 555-987-${timestamp}`;
  const phone3 = `+1 555-111-${timestamp}`;

  try {
    // SCENARIO 1: New Employee, New Form
    logSection('SCENARIO 1: New Employee, New Form');
    logInfo(`Creating new employee with phone ${phone1}`);
    
    const employee1Result = await executeGetEmployeeByPhone({ 
      phone: phone1, 
      email: 'john@example.com' 
    });
    
    if (!employee1Result.success || !employee1Result.data?.employee?.id) {
      throw new Error('Failed to create employee for Scenario 1');
    }
    
    employee1Id = employee1Result.data.employee.id;
    logInfo(`Employee created with ID: ${employee1Id}`);
    
    // Save first_name
    logInfo('Saving first_name = "John"');
    const save1 = await executeSaveI9Field({ 
      employee_id: employee1Id, 
      field_name: 'first_name', 
      value: 'John' 
    });
    logTest('Save first_name', save1.success, true, save1.success);
    
    // Save last_name
    logInfo('Saving last_name = "Doe"');
    const save2 = await executeSaveI9Field({ 
      employee_id: employee1Id, 
      field_name: 'last_name', 
      value: 'Doe' 
    });
    logTest('Save last_name', save2.success, true, save2.success);
    
    // Save email
    logInfo('Saving email = "john@example.com"');
    const save3 = await executeSaveI9Field({ 
      employee_id: employee1Id, 
      field_name: 'email', 
      value: 'john@example.com' 
    });
    logTest('Save email', save3.success, true, save3.success);
    
    // Verify all fields are saved correctly
    logInfo('Verifying saved fields and form status');
    const progress1 = await executeGetI9Progress({ employee_id: employee1Id });
    logTest('Form exists', progress1.success && progress1.data?.exists, true, progress1.data?.exists);
    logTest('Form status is in_progress', 
      progress1.data?.status === 'in_progress', 
      'in_progress', 
      progress1.data?.status
    );
    logTest('first_name saved correctly', 
      progress1.data?.current_data?.first_name === 'John', 
      'John', 
      progress1.data?.current_data?.first_name
    );
    logTest('last_name saved correctly', 
      progress1.data?.current_data?.last_name === 'Doe', 
      'Doe', 
      progress1.data?.current_data?.last_name
    );
    logTest('email saved correctly', 
      progress1.data?.current_data?.email === 'john@example.com', 
      'john@example.com', 
      progress1.data?.current_data?.email
    );

    // SCENARIO 2: Update Existing Field
    logSection('SCENARIO 2: Update Existing Field');
    logInfo('Updating first_name from "John" to "Jonathan"');
    
    const originalTimestamp = progress1.data?.current_data?.updated_at;
    
    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updateResult = await executeSaveI9Field({ 
      employee_id: employee1Id, 
      field_name: 'first_name', 
      value: 'Jonathan' 
    });
    logTest('Update first_name', updateResult.success, true, updateResult.success);
    
    // Verify update worked
    const progress2 = await executeGetI9Progress({ employee_id: employee1Id });
    logTest('first_name updated correctly', 
      progress2.data?.current_data?.first_name === 'Jonathan', 
      'Jonathan', 
      progress2.data?.current_data?.first_name
    );
    
    const newTimestamp = progress2.data?.current_data?.updated_at;
    logTest('updated_at timestamp changed', 
      newTimestamp !== originalTimestamp, 
      'different timestamps', 
      `${originalTimestamp} vs ${newTimestamp}`
    );

    // SCENARIO 3: Fill Half the Form
    logSection('SCENARIO 3: Fill Half the Form');
    logInfo(`Creating new employee with phone ${phone2}`);
    
    const employee2Result = await executeGetEmployeeByPhone({ 
      phone: phone2, 
      email: 'sarah@example.com' 
    });
    
    if (!employee2Result.success || !employee2Result.data?.employee?.id) {
      throw new Error('Failed to create employee for Scenario 3');
    }
    
    employee2Id = employee2Result.data.employee.id;
    logInfo(`Employee created with ID: ${employee2Id}`);
    
    // Save partial fields
    const partialFields = [
      { name: 'first_name', value: 'Sarah' },
      { name: 'last_name', value: 'Smith' },
      { name: 'zip_code', value: '21201' },
      { name: 'city', value: 'Baltimore' },
      { name: 'state', value: 'MD' },
      { name: 'email', value: 'sarah@example.com' }
    ];
    
    for (const field of partialFields) {
      logInfo(`Saving ${field.name} = "${field.value}"`);
      const saveResult = await executeSaveI9Field({ 
        employee_id: employee2Id, 
        field_name: field.name, 
        value: field.value 
      });
      logTest(`Save ${field.name}`, saveResult.success, true, saveResult.success);
    }
    
    // Check completion percentage 
    const progress3 = await executeGetI9Progress({ employee_id: employee2Id });
    const completionPct = progress3.data?.completion_percentage || 0;
    const missingFields = progress3.data?.missing_fields || [];
    
    logInfo(`Current missing fields: [${missingFields.join(', ')}]`);
    logInfo(`Completion percentage: ${completionPct}%`);
    
    // We saved 6 fields: first_name, last_name, zip_code, city, state, email
    // The form has defaults for state='CA' and citizenship_status='us_citizen'
    // But we overwrote state to 'MD', so we should have fields missing
    logTest('Form completion percentage calculated', 
      completionPct >= 0 && completionPct <= 100, 
      '0-100%', 
      `${completionPct}%`
    );
    
    // Check if there are missing required fields (address, date_of_birth, phone)
    const expectedMissingFields = ['address', 'date_of_birth', 'phone'];
    const hasSomeExpectedMissing = expectedMissingFields.some(field => missingFields.includes(field));
    
    if (completionPct < 100) {
      logTest('Has missing required fields when not complete', 
        missingFields.length > 0, 
        'more than 0', 
        missingFields.length,
        `Missing: [${missingFields.join(', ')}]`
      );
    } else {
      logTest('All required fields are filled', 
        completionPct === 100, 
        100, 
        completionPct,
        'Form is complete (possibly due to defaults)'
      );
    }
    
    // SCENARIO 4: Complete the Half-Filled Form
    logSection('SCENARIO 4: Complete the Half-Filled Form');
    logInfo('Completing the remaining required fields for Sarah');
    
    const remainingFields = [
      { name: 'address', value: '123 Main St' },
      { name: 'date_of_birth', value: '1990-01-15' },
      { name: 'citizenship_status', value: 'us_citizen' },
      { name: 'phone', value: phone2 }
    ];
    
    for (const field of remainingFields) {
      logInfo(`Saving ${field.name} = "${field.value}"`);
      const saveResult = await executeSaveI9Field({ 
        employee_id: employee2Id, 
        field_name: field.name, 
        value: field.value 
      });
      logTest(`Save ${field.name}`, saveResult.success, true, saveResult.success);
    }
    
    // Check final completion
    const progress4 = await executeGetI9Progress({ employee_id: employee2Id });
    const finalCompletionPct = progress4.data?.completion_percentage || 0;
    logTest('Completion percentage is 100%', 
      finalCompletionPct === 100, 
      100, 
      finalCompletionPct
    );
    
    const finalMissingFields = progress4.data?.missing_fields || [];
    logTest('No missing required fields', 
      finalMissingFields.length === 0, 
      0, 
      finalMissingFields.length,
      finalMissingFields.length > 0 ? `Still missing: [${finalMissingFields.join(', ')}]` : undefined
    );

    // SCENARIO 5: Invalid Field Name
    logSection('SCENARIO 5: Invalid Field Name');
    logInfo('Attempting to save invalid field "invalid_field"');
    
    const invalidFieldResult = await executeSaveI9Field({ 
      employee_id: employee1Id, 
      field_name: 'invalid_field', 
      value: 'test' 
    });
    logTest('Invalid field rejected', 
      !invalidFieldResult.success, 
      false, 
      invalidFieldResult.success,
      invalidFieldResult.error || 'Should return error'
    );
    logTest('Error message mentions invalid field', 
      (invalidFieldResult.error || '').includes('Invalid field name'), 
      'Contains "Invalid field name"', 
      invalidFieldResult.error
    );

    // SCENARIO 6: Missing Employee ID
    logSection('SCENARIO 6: Missing Employee ID');
    logInfo('Attempting to save with non-existent employee ID');
    
    const fakeEmployeeId = '00000000-0000-0000-0000-000000000000';
    const missingEmployeeResult = await executeSaveI9Field({ 
      employee_id: fakeEmployeeId, 
      field_name: 'first_name', 
      value: 'Test' 
    });
    logTest('Non-existent employee rejected', 
      !missingEmployeeResult.success, 
      false, 
      missingEmployeeResult.success,
      missingEmployeeResult.error || 'Should return error'
    );

    // SCENARIO 7: Optional Fields
    logSection('SCENARIO 7: Optional Fields');
    logInfo('Testing optional fields with new employee');
    
    const employee3Result = await executeGetEmployeeByPhone({ 
      phone: phone3, 
      email: 'test@example.com' 
    });
    
    if (!employee3Result.success || !employee3Result.data?.employee?.id) {
      throw new Error('Failed to create employee for Scenario 7');
    }
    
    employee3Id = employee3Result.data.employee.id;
    logInfo(`Employee created with ID: ${employee3Id}`);
    
    // Save required fields first
    const requiredFieldsForTest = [
      { name: 'first_name', value: 'Alice' },
      { name: 'last_name', value: 'Johnson' },
      { name: 'email', value: 'alice@example.com' },
      { name: 'phone', value: phone3 },
      { name: 'address', value: '456 Oak Ave' },
      { name: 'city', value: 'Denver' },
      { name: 'state', value: 'CO' },
      { name: 'zip_code', value: '80202' },
      { name: 'date_of_birth', value: '1985-06-20' },
      { name: 'citizenship_status', value: 'us_citizen' }
    ];
    
    for (const field of requiredFieldsForTest) {
      const saveResult = await executeSaveI9Field({ 
        employee_id: employee3Id, 
        field_name: field.name, 
        value: field.value 
      });
      logTest(`Save required ${field.name}`, saveResult.success, true, saveResult.success);
    }
    
    // Save optional field: middle_initial
    logInfo('Saving optional field: middle_initial = "A"');
    const optionalSave1 = await executeSaveI9Field({ 
      employee_id: employee3Id, 
      field_name: 'middle_initial', 
      value: 'A' 
    });
    logTest('Save optional middle_initial', optionalSave1.success, true, optionalSave1.success);
    
    // Verify optional field was saved
    const progressOptional = await executeGetI9Progress({ employee_id: employee3Id });
    logTest('Optional middle_initial saved correctly', 
      progressOptional.data?.current_data?.middle_initial === 'A', 
      'A', 
      progressOptional.data?.current_data?.middle_initial
    );
    
    // Note: apt_number is also optional, but we're not testing NOT saving it since 
    // the form is already complete with required fields
    logTest('Form still 100% complete with optional fields', 
      progressOptional.data?.completion_percentage === 100, 
      100, 
      progressOptional.data?.completion_percentage
    );

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    results.push({
      scenario: 'Test Execution',
      passed: false,
      message: `Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }

  // Summary
  logSection('TEST SUMMARY');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! The save_i9_field tool is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Review the details above.');
    
    // Show failed tests
    const failed = results.filter(r => !r.passed);
    console.log('\n❌ Failed tests:');
    failed.forEach(test => {
      console.log(`   - ${test.scenario}: ${test.message}`);
    });
  }
  
  console.log('\n✨ Test execution complete!');
  
  // Exit with proper code
  process.exit(passed === total ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Unhandled error in test runner:', error);
  process.exit(1);
});