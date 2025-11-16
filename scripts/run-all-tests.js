#!/usr/bin/env node

/**
 * Unified Test Runner with Graceful Failure Handling
 * 
 * Runs all test suites in order:
 * 1. Security tests
 * 2. Unit tests
 * 3. API tests
 * 4. E2E tests
 * 5. Visual regression tests
 * 
 * Continues execution even on failures and collects all errors for a final report.
 */

const { spawn } = require('child_process');
const path = require('path');
const TestErrorCollector = require('./test-error-collector');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const testSuites = [
  {
    name: 'Security Tests',
    command: 'npm',
    args: ['run', 'test:security'],
    description: 'Running security tests (secret detection, sanitization)...',
  },
  {
    name: 'Unit Tests',
    command: 'npm',
    args: ['run', 'test:unit'],
    description: 'Running all unit tests (user + event)...',
  },
  {
    name: 'API Tests',
    command: 'npm',
    args: ['run', 'test:api'],
    description: 'Running all API tests (user + event)...',
  },
  {
    name: 'E2E Tests',
    command: 'npm',
    args: ['run', 'test:e2e'],
    description: 'Running all E2E tests (user + event)...',
  },
  {
    name: 'Visual Regression Tests',
    command: 'npm',
    args: ['run', 'test:visual'],
    description: 'Running Playwright visual regression tests...',
    optional: true, // Visual tests are optional
  },
];

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatErrorForLLM(suiteName, exitCode, stdout, stderr) {
  const errorText = `
═══════════════════════════════════════════════════════════════
ERROR DESCRIPTION FOR LLM DEBUGGING
═══════════════════════════════════════════════════════════════

Test Suite: ${suiteName}
Exit Code: ${exitCode}
Timestamp: ${new Date().toISOString()}

ERROR SUMMARY:
The test suite "${suiteName}" failed with exit code ${exitCode}.

WHAT WENT WRONG:
${extractErrorDetails(stdout, stderr)}

CONTEXT:
- This is a ${suiteName.includes('Unit') || suiteName.includes('API') ? 'unit/API test' : suiteName.includes('E2E') ? 'E2E browser test' : suiteName.includes('Visual') ? 'visual regression test' : 'test'} failure
- The test was part of the automated testing pipeline
- Check the output below for specific test failures

STDOUT OUTPUT:
${stdout.substring(Math.max(0, stdout.length - 5000)) || '(no output)'}

STDERR OUTPUT:
${stderr.substring(Math.max(0, stderr.length - 5000)) || '(no output)'}

HOW TO DEBUG:
1. Review the error messages above
2. Check which specific test(s) failed
3. Verify environment variables are set correctly
4. Check that the application is running (for E2E tests)
5. Review test files for incorrect assertions or selectors
6. Check Playwright report: npx playwright show-report (for E2E tests)

NEXT STEPS:
- Run the failing test suite individually: npm run test:${suiteName.toLowerCase().replace(/\s+/g, ':')}
- Check test output for specific failing test names
- Review the test file mentioned in the error
- Verify the application state matches test expectations

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
    return 'A test timeout occurred. This usually means:\n- An element was not found within the timeout period\n- The application took too long to respond\n- Network issues or slow server response\n- The page is still loading when the test expects it to be ready';
  }
  
  if (allOutput.includes('not found') || allOutput.includes('element') || allOutput.includes('locator')) {
    return 'An element was not found on the page. This usually means:\n- The UI selector has changed (check the test file for the selector)\n- The page structure is different than expected\n- The element is not visible or not loaded yet (add wait conditions)\n- The page redirected to a different route than expected';
  }
  
  if (allOutput.includes('assertion') || allOutput.includes('expect') || allOutput.includes('expected')) {
    return 'A test assertion failed. This means:\n- An expected value did not match the actual value\n- A condition that was expected to be true was false\n- Check the specific assertion in the test output above\n- Verify the application behavior matches the test expectations';
  }
  
  if (allOutput.includes('network') || allOutput.includes('fetch') || allOutput.includes('api')) {
    return 'A network request failed. This usually means:\n- API endpoint is not accessible\n- Authentication credentials are missing or invalid\n- Server is not running or unreachable\n- CORS issues or network configuration problems';
  }
  
  if (allOutput.includes('syntax') || allOutput.includes('parse') || allOutput.includes('unexpected token')) {
    return 'A syntax or parsing error occurred. This usually means:\n- There is a syntax error in the test file\n- Invalid JSON or data format\n- Check the test file for typos or incorrect syntax\n- Verify all imports and dependencies are correct';
  }
  
  if (allOutput.includes('redirect') || allOutput.includes('navigation')) {
    return 'A navigation or redirect issue occurred. This usually means:\n- The page redirected to an unexpected URL\n- The redirect logic in the app has changed\n- Authentication state is different than expected\n- Check the actual URL vs expected URL in the test output';
  }
  
  return 'Review the stdout and stderr output above for specific error details. The error may be related to:\n- Test environment configuration\n- Application state or behavior changes\n- Selector or assertion mismatches\n- Network or API connectivity issues';
}

function runTestSuite(suite, collector) {
  return new Promise((resolve) => {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`${suite.description}`, 'bright');
    log(`${'='.repeat(60)}\n`, 'cyan');

    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    
    const testProcess = spawn(suite.command, suite.args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
      cwd: process.cwd(),
    });

    testProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      process.stdout.write(output); // Still show output in real-time
    });

    testProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      process.stderr.write(output); // Still show output in real-time
    });

    testProcess.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      if (code === 0) {
        log(`\n✅ ${suite.name} passed (${duration}s)`, 'green');
        collector.addPassed({
          name: suite.name,
          suite: suite.name,
          duration,
          command: suite.command,
          args: suite.args,
        });
        resolve({ success: true, suite: suite.name, duration });
      } else {
        log(`\n❌ ${suite.name} failed (exit code: ${code}, ${duration}s)`, 'red');
        
        // Create detailed error description
        const errorDescription = formatErrorForLLM(suite.name, code, stdout, stderr);
        
        // Collect the error but continue execution
        collector.addFailed({
          name: suite.name,
          suite: suite.name,
          code,
          duration,
          description: errorDescription,
          stdout,
          stderr,
          command: suite.command,
          args: suite.args,
        });
        
        log(`\n⚠️  Error collected. Continuing with remaining tests...\n`, 'yellow');
        resolve({ success: false, suite: suite.name, code, duration });
      }
    });

    testProcess.on('error', (error) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      log(`\n❌ ${suite.name} error: ${error.message}`, 'red');
      
      // Collect the error but continue execution
      collector.addFailed({
        name: suite.name,
        suite: suite.name,
        error: error.message,
        duration,
        description: `Failed to run ${suite.name}: ${error.message}`,
        command: suite.command,
        args: suite.args,
      });
      
      log(`\n⚠️  Error collected. Continuing with remaining tests...\n`, 'yellow');
      resolve({ 
        success: false, 
        suite: suite.name, 
        error: error.message,
      });
    });
  });
}

async function runAllTests() {
  log('\n🧪 Starting Complete Test Pipeline', 'bright');
  log('='.repeat(60), 'cyan');
  log('⚠️  All tests will run to completion, even if some fail', 'yellow');
  log('='.repeat(60) + '\n', 'cyan');
  
  // Initialize error collector
  const collector = new TestErrorCollector();
  
  const results = [];

  // Run all test suites - continue even on failure
  for (const suite of testSuites) {
    try {
      const result = await runTestSuite(suite, collector);
      results.push(result);
    } catch (error) {
      // This should not happen now since runTestSuite always resolves
      // But keep it as a safety net
      results.push({
        success: false,
        suite: error.suite || suite.name,
        error: error.error || error.code,
        description: error.description || `Unknown error in ${suite.name}`,
      });
      
      collector.addFailed({
        name: suite.name,
        suite: suite.name,
        error: error.error || error.code,
        description: error.description || `Unknown error in ${suite.name}`,
        command: suite.command,
        args: suite.args,
      });
      
      log(`⚠️  ${suite.name} failed but continuing with remaining tests...`, 'yellow');
    }
  }

  // Print comprehensive summary using the collector
  const exitCode = collector.printSummary();
  process.exit(exitCode);
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  log(`\n❌ Unhandled error: ${error.message}`, 'red');
  process.exit(1);
});

// Run the tests
runAllTests();

