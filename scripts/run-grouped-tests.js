#!/usr/bin/env node

/**
 * Grouped Test Runner with Graceful Failure Handling
 * 
 * Runs specific test groups based on category:
 * - user: All user/auth/profile related tests
 * - event: All event/event-request related tests
 * - email: All email workflow related tests
 * - security: All security and RLS tests
 * - all: Complete test pipeline
 * 
 * Continues execution even on failures and collects all errors for a final report.
 */

const { spawn } = require('child_process');
const path = require('path');
const TestErrorCollector = require('./test-error-collector');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const testGroups = {
  user: {
    name: 'User & Auth Tests',
    description: 'Running user authentication, profile, and permission tests...',
    tests: [
      { name: 'User Unit Tests', command: 'npm', args: ['run', 'test:unit:user'] },
      { name: 'User API Tests', command: 'npm', args: ['run', 'test:api:user'] },
      { name: 'User E2E Tests', command: 'npm', args: ['run', 'test:e2e:user'] },
    ]
  },
  event: {
    name: 'Event & Request Tests',
    description: 'Running event creation, approval, and management tests...',
    tests: [
      { name: 'Event Unit Tests', command: 'npm', args: ['run', 'test:unit:event'] },
      { name: 'Event API Tests', command: 'npm', args: ['run', 'test:api:event'] },
      { name: 'Event E2E Tests', command: 'npm', args: ['run', 'test:e2e:event'] },
    ]
  },
  email: {
    name: 'Email Workflow Tests',
    description: 'Running email notification workflow tests...',
    tests: [
      { name: 'Email Unit Tests', command: 'npm', args: ['run', 'test:unit:email'] },
      { name: 'Email API Tests', command: 'npm', args: ['run', 'test:api:email'] },
      { name: 'Email E2E Tests', command: 'npm', args: ['run', 'test:e2e:email'] },
    ]
  },
  security: {
    name: 'Security & RLS Tests',
    description: 'Running security, RLS, and edge case tests...',
    tests: [
      { name: 'RLS Security Tests', command: 'npm', args: ['run', 'test:rls'] },
      { name: 'Edge Cases Tests', command: 'npm', args: ['run', 'test:edgecases'] },
      { name: 'Error Handling Tests', command: 'npm', args: ['run', 'test:errorhandling'] },
      { name: 'Security Tests', command: 'npm', args: ['run', 'test:security'] },
    ]
  },
  all: {
    name: 'Complete Test Pipeline',
    description: 'Running all tests (unit, API, E2E, visual, email, security)...',
    tests: [
      { name: 'All Unit Tests', command: 'npm', args: ['run', 'test:unit'] },
      { name: 'All API Tests', command: 'npm', args: ['run', 'test:api'] },
      { name: 'RLS Security Tests', command: 'npm', args: ['run', 'test:rls'] },
      { name: 'Edge Cases Tests', command: 'npm', args: ['run', 'test:edgecases'] },
      { name: 'Error Handling Tests', command: 'npm', args: ['run', 'test:errorhandling'] },
      { name: 'All E2E Tests', command: 'npm', args: ['run', 'test:e2e'] },
      { name: 'Concurrency Tests', command: 'npm', args: ['run', 'test:e2e:concurrency'], optional: true },
      { name: 'Accessibility Tests', command: 'npm', args: ['run', 'test:e2e:a11y'], optional: true },
      { name: 'Email Workflow Tests', command: 'npm', args: ['run', 'test:unit:email'] },
      { name: 'Email API Tests', command: 'npm', args: ['run', 'test:api:email'] },
      { name: 'Email E2E Tests', command: 'npm', args: ['run', 'test:e2e:email'] },
      { name: 'Visual Regression Tests', command: 'npm', args: ['run', 'test:visual'], optional: true },
      { name: 'Expanded Visual Tests', command: 'npm', args: ['run', 'test:visual:expanded'], optional: true },
    ]
  }
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatErrorForLLM(testName, exitCode, stdout, stderr) {
  const errorText = `
═══════════════════════════════════════════════════════════════
ERROR DESCRIPTION FOR LLM DEBUGGING
═══════════════════════════════════════════════════════════════

Test Suite: ${testName}
Exit Code: ${exitCode}
Timestamp: ${new Date().toISOString()}

ERROR SUMMARY:
The test suite "${testName}" failed with exit code ${exitCode}.

WHAT WENT WRONG:
${extractErrorDetails(stdout, stderr)}

CONTEXT:
- This is a ${testName.includes('Unit') ? 'unit test' : testName.includes('API') ? 'API test' : 'E2E test'} failure
- The test was part of the automated testing pipeline
- Check the output below for specific test failures

STDOUT OUTPUT (last 5000 chars):
${stdout.substring(Math.max(0, stdout.length - 5000)) || '(no output)'}

STDERR OUTPUT (last 5000 chars):
${stderr.substring(Math.max(0, stderr.length - 5000)) || '(no output)'}

HOW TO DEBUG:
1. Review the error messages above
2. Check which specific test(s) failed
3. Verify environment variables are set correctly
4. Check that the application is running (for E2E tests)
5. Review test files for incorrect assertions or selectors
6. Check Playwright report: npx playwright show-report (for E2E tests)

NEXT STEPS:
- Run the failing test individually to isolate the issue
- Check the test file mentioned in the error output
- Verify the application state matches test expectations
- Review recent changes to the code being tested

═══════════════════════════════════════════════════════════════
Copy the above section to paste into an LLM for debugging help
═══════════════════════════════════════════════════════════════
`;
  return errorText;
}

function extractErrorDetails(stdout, stderr) {
  const allOutput = (stdout + stderr).toLowerCase();
  
  // Try to extract meaningful error information
  if (allOutput.includes('timeout')) {
    return 'A test timeout occurred. This usually means:\n- An element was not found within the timeout period\n- The application took too long to respond\n- Network issues or slow server response';
  }
  
  if (allOutput.includes('not found') || allOutput.includes('element')) {
    return 'An element was not found on the page. This usually means:\n- The UI selector has changed\n- The page structure is different than expected\n- The element is not visible or not loaded yet';
  }
  
  if (allOutput.includes('assertion') || allOutput.includes('expect')) {
    return 'A test assertion failed. This means:\n- An expected value did not match the actual value\n- A condition that was expected to be true was false\n- Check the specific assertion in the test output above';
  }
  
  if (allOutput.includes('network') || allOutput.includes('fetch')) {
    return 'A network request failed. This usually means:\n- API endpoint is not accessible\n- Authentication credentials are missing or invalid\n- Server is not running or unreachable';
  }
  
  if (allOutput.includes('syntax') || allOutput.includes('parse')) {
    return 'A syntax or parsing error occurred. This usually means:\n- There is a syntax error in the test file\n- Invalid JSON or data format\n- Check the test file for typos or incorrect syntax';
  }
  
  return 'Review the stdout and stderr output above for specific error details.';
}

function runTest(test, collector) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    
    const testProcess = spawn(test.command, test.args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
      cwd: process.cwd(),
    });

    testProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      process.stdout.write(output); // Show output in real-time
    });

    testProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      process.stderr.write(output); // Show output in real-time
    });

    testProcess.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      if (code === 0) {
        log(`✅ ${test.name} passed (${duration}s)`, 'green');
        collector.addPassed({
          name: test.name,
          duration,
          command: test.command,
          args: test.args,
        });
        resolve({ success: true, name: test.name, duration });
      } else {
        log(`❌ ${test.name} failed (exit code: ${code}, ${duration}s)`, 'red');
        
        // Create detailed error description
        const errorDescription = formatErrorForLLM(test.name, code, stdout, stderr);
        
        // Collect the error but continue execution
        collector.addFailed({
          name: test.name,
          code,
          duration,
          description: errorDescription,
          stdout,
          stderr,
          command: test.command,
          args: test.args,
        });
        
        log(`\n⚠️  Error collected. Continuing with remaining tests...\n`, 'yellow');
        resolve({ success: false, name: test.name, code, duration });
      }
    });

    testProcess.on('error', (error) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      log(`❌ ${test.name} error: ${error.message}`, 'red');
      
      // Collect the error but continue execution
      collector.addFailed({
        name: test.name,
        error: error.message,
        duration,
        description: `Failed to run ${test.name}: ${error.message}`,
        command: test.command,
        args: test.args,
      });
      
      log(`\n⚠️  Error collected. Continuing with remaining tests...\n`, 'yellow');
      resolve({ 
        success: false, 
        name: test.name, 
        error: error.message,
      });
    });
  });
}

async function runTestGroup(groupName) {
  const group = testGroups[groupName];
  
  if (!group) {
    log(`\n❌ Unknown test group: ${groupName}`, 'red');
    log(`Available groups: ${Object.keys(testGroups).join(', ')}`, 'yellow');
    process.exit(1);
  }

  log(`\n🧪 ${group.description}`, 'bright');
  log('='.repeat(60), 'cyan');
  log('⚠️  All tests will run to completion, even if some fail', 'yellow');
  log('='.repeat(60) + '\n', 'cyan');
  
  // Initialize error collector
  const collector = new TestErrorCollector();
  
  const results = [];

  // Run all tests - continue even on failure
  for (const test of group.tests) {
    try {
      const result = await runTest(test, collector);
      results.push(result);
    } catch (error) {
      // This should not happen now since runTest always resolves
      // But keep it as a safety net
      results.push({
        success: false,
        name: error.name || test.name,
        error: error.error || error.code,
        description: error.description || `Unknown error in ${test.name}`,
      });
      
      collector.addFailed({
        name: test.name,
        error: error.error || error.code,
        description: error.description || `Unknown error in ${test.name}`,
        command: test.command,
        args: test.args,
      });
      
      if (test.optional) {
        log(`⚠️  ${test.name} failed but is optional, continuing...`, 'yellow');
      } else {
        log(`⚠️  ${test.name} failed but continuing with remaining tests...`, 'yellow');
      }
    }
  }

  // Print comprehensive summary using the collector
  const exitCode = collector.printSummary();
  process.exit(exitCode);
}

// Get group from command line argument
const groupName = process.argv[2] || 'all';

// Validate group name
if (!testGroups[groupName]) {
  log(`\n❌ Unknown test group: ${groupName}`, 'red');
  log(`Available groups: ${Object.keys(testGroups).join(', ')}`, 'yellow');
  process.exit(1);
}

// Run the test group
runTestGroup(groupName);

