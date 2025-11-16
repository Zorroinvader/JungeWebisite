#!/usr/bin/env node

/**
 * Rerun Failed Tests
 * 
 * Reads the .test-failures.json file and reruns only the tests that failed
 * in the previous test run.
 */

const { spawn } = require('child_process');
const fs = require('fs');
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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runTest(test, collector, debugMode = false) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    
    // Modify args for debug mode
    const args = debugMode && test.args 
      ? [...test.args, '--debug']
      : test.args || [];
    
    log(`\nRunning: ${test.name}`, 'cyan');
    if (debugMode) {
      log('  (Debug mode enabled)', 'yellow');
    }
    
    const testProcess = spawn(test.command || 'npm', args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
      cwd: process.cwd(),
    });

    testProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      process.stdout.write(output);
    });

    testProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      process.stderr.write(output);
    });

    testProcess.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      if (code === 0) {
        log(`\n✅ ${test.name} passed (${duration}s)`, 'green');
        collector.addPassed({
          name: test.name,
          duration,
          command: test.command,
          args: test.args,
        });
        resolve({ success: true, name: test.name, duration });
      } else {
        log(`\n❌ ${test.name} failed (exit code: ${code}, ${duration}s)`, 'red');
        
        collector.addFailed({
          name: test.name,
          code,
          duration,
          stdout,
          stderr,
          command: test.command,
          args: test.args,
        });
        
        resolve({ success: false, name: test.name, code, duration });
      }
    });

    testProcess.on('error', (error) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      log(`\n❌ ${test.name} error: ${error.message}`, 'red');
      
      collector.addFailed({
        name: test.name,
        error: error.message,
        duration,
        command: test.command,
        args: test.args,
      });
      
      resolve({ 
        success: false, 
        name: test.name, 
        error: error.message,
      });
    });
  });
}

async function rerunFailedTests(debugMode = false) {
  const collector = new TestErrorCollector();
  const failedTestsFile = path.join(process.cwd(), '.test-failures.json');
  
  // Check if failed tests file exists
  if (!fs.existsSync(failedTestsFile)) {
    log('\n❌ No failed tests found from previous run.', 'red');
    log('   Run tests first to generate a failure list.', 'yellow');
    log('   Example: npm test', 'cyan');
    process.exit(0);
  }

  // Load failed tests
  let failedTests = [];
  try {
    const content = fs.readFileSync(failedTestsFile, 'utf8');
    failedTests = JSON.parse(content);
  } catch (error) {
    log(`\n❌ Error reading failed tests file: ${error.message}`, 'red');
    process.exit(1);
  }

  if (failedTests.length === 0) {
    log('\n✅ No failed tests to rerun!', 'green');
    process.exit(0);
  }

  log('\n' + '='.repeat(80), 'cyan');
  log(`🔄 Rerunning ${failedTests.length} Failed Test(s)`, 'bright');
  if (debugMode) {
    log('   (Debug Mode Enabled)', 'yellow');
  }
  log('='.repeat(80) + '\n', 'cyan');

  // Group tests by category for better organization
  const testsByCategory = {};
  failedTests.forEach(test => {
    const category = test.category || 'general';
    if (!testsByCategory[category]) {
      testsByCategory[category] = [];
    }
    testsByCategory[category].push(test);
  });

  // Run tests by category
  for (const [category, tests] of Object.entries(testsByCategory)) {
    log(`\n📁 Category: ${category.toUpperCase()}`, 'cyan');
    log('-'.repeat(80), 'cyan');
    
    for (const test of tests) {
      await runTest(test, collector, debugMode);
    }
  }

  // Print summary
  log('\n' + '='.repeat(80), 'cyan');
  log('📊 RERUN SUMMARY', 'bright');
  log('='.repeat(80) + '\n', 'cyan');
  
  const exitCode = collector.printSummary();
  
  // Update failed tests file with new failures
  if (collector.errors.length > 0) {
    log('\n💡 Some tests still failed. Run again with: npm run test:failed', 'yellow');
  } else {
    log('\n✅ All previously failed tests now pass!', 'green');
    // Clear the failed tests file
    collector.clearFailedTests();
  }
  
  process.exit(exitCode);
}

// Check for debug flag
const debugMode = process.argv.includes('--debug') || process.argv.includes('-d');

// Run the failed tests
rerunFailedTests(debugMode);

