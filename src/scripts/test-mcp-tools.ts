#!/usr/bin/env tsx

import {
  executeSubmitCompleteI9Form,
  executeValidateSSN,
  executeValidateCitizenshipStatus,
  executeGetI9Progress,
  executeGetEmployeeByPhone,
  executeZipLookup,
  executeCompleteI9Section1
} from '../lib/mcp-tools';
import { CitizenshipStatus } from '../lib/types';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const testResults: TestResult[] = [];

function logTest(name: string, passed: boolean, error?: string, details?: any) {
  const result: TestResult = { name, passed, error, details };
  testResults.push(result);
  
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}`);
  if (error) console.log(`   Error: ${error}`);
  if (details) console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  console.log();
}

async function testSubmitCompleteI9Form() {
  console.log('🧪 Testing submit_complete_i9_form...\n');
  
  try {
    // Test 1: Valid form submission
    const mockData = {
      phone: '+15551234001',
      first_name: 'MCPTest',
      last_name: 'User',
      address: '123 MCP Test Street',
      city: 'Test City',
      state: 'CA',
      zip_code: '90210',
      date_of_birth: '1990-01-01',
      email: 'mcptest@example.com',
      citizenship_status: 'us_citizen'
    };
    
    const result = await executeSubmitCompleteI9Form(mockData);
    
    if (result.success && result.data?.form_id && result.data?.employee_id) {
      logTest('submit_complete_i9_form - Valid submission', true, undefined, {
        form_id: result.data.form_id,
        employee_id: result.data.employee_id,
        status: result.data.status
      });
      
      // Store for later tests
      (global as any).testFormId = result.data.form_id;
      (global as any).testEmployeeId = result.data.employee_id;
    } else {
      logTest('submit_complete_i9_form - Valid submission', false, result.error);
    }
    
    // Test 2: Missing required fields
    const invalidData = {
      phone: '+15551234002',
      first_name: 'Invalid',
      // missing required fields
    };
    
    const invalidResult = await executeSubmitCompleteI9Form(invalidData as any);
    
    if (!invalidResult.success) {
      logTest('submit_complete_i9_form - Missing required fields (should fail)', true, undefined, {
        expected_error: invalidResult.error
      });
    } else {
      logTest('submit_complete_i9_form - Missing required fields (should fail)', false, 'Expected failure but got success');
    }
    
  } catch (error) {
    logTest('submit_complete_i9_form - Test execution', false, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function testValidateSSN() {
  console.log('🧪 Testing validate_ssn...\n');
  
  try {
    // Test 1: Valid SSN format
    const validResult = await executeValidateSSN({ ssn: '123-45-6789' });
    
    if (validResult.success && validResult.data?.valid === true) {
      logTest('validate_ssn - Valid format (123-45-6789)', true);
    } else {
      logTest('validate_ssn - Valid format (123-45-6789)', false, validResult.error);
    }
    
    // Test 2: Invalid SSN format (no dashes)
    const invalidResult = await executeValidateSSN({ ssn: '123456789' });
    
    if (invalidResult.success && invalidResult.data?.valid === false) {
      logTest('validate_ssn - Invalid format (123456789)', true);
    } else {
      logTest('validate_ssn - Invalid format (123456789)', false, 'Expected invalid but got valid');
    }
    
    // Test 3: Invalid SSN format (wrong pattern)
    const wrongPatternResult = await executeValidateSSN({ ssn: '123-456-78901' });
    
    if (wrongPatternResult.success && wrongPatternResult.data?.valid === false) {
      logTest('validate_ssn - Wrong pattern (123-456-78901)', true);
    } else {
      logTest('validate_ssn - Wrong pattern (123-456-78901)', false, 'Expected invalid but got valid');
    }
    
  } catch (error) {
    logTest('validate_ssn - Test execution', false, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function testValidateCitizenshipStatus() {
  console.log('🧪 Testing validate_citizenship_status...\n');
  
  const validStatuses = [
    'us_citizen',
    'noncitizen_national', 
    'lawful_permanent_resident',
    'authorized_alien'
  ];
  
  try {
    // Test all valid statuses
    for (const status of validStatuses) {
      const result = await executeValidateCitizenshipStatus({ status });
      
      if (result.success && result.data?.valid === true) {
        logTest(`validate_citizenship_status - Valid status (${status})`, true);
      } else {
        logTest(`validate_citizenship_status - Valid status (${status})`, false, result.error);
      }
    }
    
    // Test invalid status
    const invalidResult = await executeValidateCitizenshipStatus({ status: 'invalid_status' });
    
    if (invalidResult.success && invalidResult.data?.valid === false) {
      logTest('validate_citizenship_status - Invalid status', true);
    } else {
      logTest('validate_citizenship_status - Invalid status', false, 'Expected invalid but got valid');
    }
    
  } catch (error) {
    logTest('validate_citizenship_status - Test execution', false, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function testZipLookup() {
  console.log('🧪 Testing lookup_city_state_from_zip...\n');
  
  try {
    // Test 1: Valid ZIP code (Baltimore, MD)
    const baltimoreResult = await executeZipLookup({ zip_code: '21201' });
    
    if (baltimoreResult.success && 
        baltimoreResult.data?.city && 
        baltimoreResult.data?.state_abbr === 'MD') {
      logTest('lookup_city_state_from_zip - Baltimore ZIP (21201)', true, undefined, {
        city: baltimoreResult.data.city,
        state: baltimoreResult.data.state_abbr
      });
    } else {
      logTest('lookup_city_state_from_zip - Baltimore ZIP (21201)', false, baltimoreResult.error);
    }
    
    // Test 2: Valid ZIP code (Beverly Hills, CA)
    const bhResult = await executeZipLookup({ zip_code: '90210' });
    
    if (bhResult.success && 
        bhResult.data?.city && 
        bhResult.data?.state_abbr === 'CA') {
      logTest('lookup_city_state_from_zip - Beverly Hills ZIP (90210)', true, undefined, {
        city: bhResult.data.city,
        state: bhResult.data.state_abbr
      });
    } else {
      logTest('lookup_city_state_from_zip - Beverly Hills ZIP (90210)', false, bhResult.error);
    }
    
    // Test 3: Invalid ZIP code
    const invalidResult = await executeZipLookup({ zip_code: '99999' });
    
    if (!invalidResult.success || invalidResult.error?.includes('not found')) {
      logTest('lookup_city_state_from_zip - Invalid ZIP (99999)', true);
    } else {
      logTest('lookup_city_state_from_zip - Invalid ZIP (99999)', false, 'Expected failure but got success');
    }
    
    // Test 4: Invalid ZIP format
    const invalidFormatResult = await executeZipLookup({ zip_code: 'ABCDE' });
    
    if (!invalidFormatResult.success) {
      logTest('lookup_city_state_from_zip - Invalid format (ABCDE)', true);
    } else {
      logTest('lookup_city_state_from_zip - Invalid format (ABCDE)', false, 'Expected failure but got success');
    }
    
  } catch (error) {
    logTest('lookup_city_state_from_zip - Test execution', false, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function testI9Progress() {
  console.log('🧪 Testing get_i9_progress...\n');
  
  try {
    const testEmployeeId = (global as any).testEmployeeId;
    
    if (!testEmployeeId) {
      logTest('get_i9_progress - Test setup', false, 'No test employee ID available (submit_complete_i9_form must run first)');
      return;
    }
    
    // Test 1: Get progress for completed form
    const progressResult = await executeGetI9Progress({ employee_id: testEmployeeId });
    
    if (progressResult.success && 
        progressResult.data?.exists === true && 
        typeof progressResult.data?.completion_percentage === 'number') {
      logTest('get_i9_progress - Existing form progress', true, undefined, {
        completion_percentage: progressResult.data.completion_percentage,
        status: progressResult.data.status,
        missing_fields: progressResult.data.missing_fields
      });
    } else {
      logTest('get_i9_progress - Existing form progress', false, progressResult.error);
    }
    
    // Test 2: Get progress for non-existent employee
    const nonExistentResult = await executeGetI9Progress({ employee_id: '00000000-0000-0000-0000-000000000000' });
    
    if (nonExistentResult.success && nonExistentResult.data?.exists === false) {
      logTest('get_i9_progress - Non-existent employee', true, undefined, {
        completion_percentage: nonExistentResult.data.completion_percentage
      });
    } else {
      logTest('get_i9_progress - Non-existent employee', false, 'Expected exists=false');
    }
    
  } catch (error) {
    logTest('get_i9_progress - Test execution', false, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function testEmployeeLookup() {
  console.log('🧪 Testing get_employee_by_phone...\n');
  
  try {
    // Test 1: Create new employee
    const newEmployeeResult = await executeGetEmployeeByPhone({ 
      phone: '+15551234003',
      email: 'newemployee@test.com'
    });
    
    if (newEmployeeResult.success && 
        newEmployeeResult.data?.created === true && 
        newEmployeeResult.data?.employee?.id) {
      logTest('get_employee_by_phone - Create new employee', true, undefined, {
        employee_id: newEmployeeResult.data.employee.id,
        phone: newEmployeeResult.data.employee.phone
      });
    } else {
      logTest('get_employee_by_phone - Create new employee', false, newEmployeeResult.error);
    }
    
    // Test 2: Find existing employee
    const existingEmployeeResult = await executeGetEmployeeByPhone({ 
      phone: '+15551234003'
    });
    
    if (existingEmployeeResult.success && 
        existingEmployeeResult.data?.found === true) {
      logTest('get_employee_by_phone - Find existing employee', true);
    } else {
      logTest('get_employee_by_phone - Find existing employee', false, existingEmployeeResult.error);
    }
    
    // Test 3: Invalid phone number
    const invalidPhoneResult = await executeGetEmployeeByPhone({ 
      phone: 'invalid-phone'
    });
    
    if (!invalidPhoneResult.success) {
      logTest('get_employee_by_phone - Invalid phone number', true);
    } else {
      logTest('get_employee_by_phone - Invalid phone number', false, 'Expected failure but got success');
    }
    
  } catch (error) {
    logTest('get_employee_by_phone - Test execution', false, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function runAllTests() {
  console.log('🚀 Starting MCP Tools Test Suite...\n');
  console.log('=' .repeat(60));
  console.log();
  
  // Run all tests in sequence
  await testSubmitCompleteI9Form();
  await testValidateSSN();
  await testValidateCitizenshipStatus(); 
  await testZipLookup();
  await testI9Progress();
  await testEmployeeLookup();
  
  // Print summary
  console.log('=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  
  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;
  const total = testResults.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${Math.round((passed / total) * 100)}%`);
  console.log();
  
  if (failed > 0) {
    console.log('🔍 FAILED TESTS:');
    testResults.filter(r => !r.passed).forEach(result => {
      console.log(`   ❌ ${result.name}: ${result.error}`);
    });
    console.log();
  }
  
  console.log(passed === total ? '🎉 All tests passed!' : '⚠️  Some tests failed.');
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test suite failed to run:', error);
    process.exit(1);
  });
}