#!/usr/bin/env node

/**
 * Test Error Collector and Reporter
 * 
 * Centralized error collection and reporting system for test failures.
 * Collects all test failures, categorizes them, and provides detailed reports.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

class TestErrorCollector {
  constructor() {
    this.errors = [];
    this.passed = [];
    this.warnings = [];
    this.skipped = [];
    this.startTime = Date.now();
    this.failedTestsFile = path.join(process.cwd(), '.test-failures.json');
  }

  /**
   * Add a passed test
   */
  addPassed(test) {
    this.passed.push({
      ...test,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Add a failed test with error details
   */
  addFailed(test) {
    const error = {
      ...test,
      timestamp: new Date().toISOString(),
      category: this.categorizeError(test),
      severity: this.determineSeverity(test),
    };
    this.errors.push(error);
    this.saveFailedTests();
  }

  /**
   * Add a warning
   */
  addWarning(test) {
    this.warnings.push({
      ...test,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Add a skipped test
   */
  addSkipped(test) {
    this.skipped.push({
      ...test,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Categorize error type
   */
  categorizeError(test) {
    const name = (test.name || test.suite || '').toLowerCase();
    const output = ((test.stdout || '') + (test.stderr || '')).toLowerCase();

    if (name.includes('security') || name.includes('rls') || output.includes('secret') || output.includes('sanitize')) {
      return 'security';
    }
    if (name.includes('api') || output.includes('api') || output.includes('endpoint')) {
      return 'api';
    }
    if (name.includes('e2e') || name.includes('playwright') || output.includes('page') || output.includes('browser')) {
      return 'e2e';
    }
    if (name.includes('visual') || output.includes('screenshot') || output.includes('snapshot')) {
      return 'visual';
    }
    if (name.includes('unit')) {
      return 'unit';
    }
    if (output.includes('database') || output.includes('db') || output.includes('supabase')) {
      return 'database';
    }
    if (output.includes('network') || output.includes('fetch') || output.includes('timeout')) {
      return 'network';
    }
    return 'general';
  }

  /**
   * Determine error severity
   */
  determineSeverity(test) {
    const category = this.categorizeError(test);
    const output = ((test.stdout || '') + (test.stderr || '')).toLowerCase();

    // Critical: Security, Database access, API authentication
    if (category === 'security' || 
        output.includes('authentication') || 
        output.includes('unauthorized') ||
        output.includes('database connection')) {
      return 'critical';
    }

    // High: API failures, E2E core functionality
    if (category === 'api' || (category === 'e2e' && !output.includes('visual'))) {
      return 'high';
    }

    // Medium: Visual regressions, unit test edge cases
    if (category === 'visual' || category === 'unit') {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Extract test file and line number from error output
   */
  extractTestLocation(test) {
    const output = (test.stdout || '') + (test.stderr || '');
    
    // Try to find file path and line number
    const fileMatch = output.match(/([\/\\][\w\-\.\/\\]+\.(js|ts|jsx|tsx)):(\d+)/);
    if (fileMatch) {
      return {
        file: fileMatch[1],
        line: parseInt(fileMatch[3], 10),
      };
    }

    // Try Jest test file pattern
    const jestMatch = output.match(/at\s+.*?\(([^:]+):(\d+):(\d+)\)/);
    if (jestMatch) {
      return {
        file: jestMatch[1],
        line: parseInt(jestMatch[2], 10),
      };
    }

    return null;
  }

  /**
   * Generate debugging hints
   */
  generateHints(test) {
    const category = this.categorizeError(test);
    const output = ((test.stdout || '') + (test.stderr || '')).toLowerCase();
    const hints = [];

    if (category === 'security') {
      hints.push('Check environment variables for sensitive data');
      hints.push('Verify RLS policies are correctly configured');
      hints.push('Review secret detection patterns');
    }

    if (category === 'api') {
      hints.push('Verify API endpoints are accessible');
      hints.push('Check authentication credentials');
      hints.push('Review API request/response format');
    }

    if (category === 'e2e') {
      hints.push('Check if application is running on correct port');
      hints.push('Verify UI selectors match current page structure');
      hints.push('Review Playwright report: npx playwright show-report');
    }

    if (category === 'visual') {
      hints.push('Review screenshot differences in test-results folder');
      hints.push('Update snapshots if changes are intentional: npm run test:visual:update');
    }

    if (output.includes('timeout')) {
      hints.push('Increase timeout if operation is legitimately slow');
      hints.push('Check for race conditions or missing wait conditions');
    }

    if (output.includes('not found') || output.includes('element')) {
      hints.push('Verify element selectors match current UI');
      hints.push('Add explicit wait conditions for dynamic content');
    }

    if (output.includes('assertion') || output.includes('expect')) {
      hints.push('Review expected vs actual values in test output');
      hints.push('Verify application behavior matches test expectations');
    }

    return hints.length > 0 ? hints : ['Review error output for specific details'];
  }

  /**
   * Save failed tests to file for later rerun
   */
  saveFailedTests() {
    const failedTests = this.errors.map(err => ({
      name: err.name || err.suite,
      command: err.command,
      args: err.args,
      category: err.category,
      severity: err.severity,
    }));

    try {
      fs.writeFileSync(
        this.failedTestsFile,
        JSON.stringify(failedTests, null, 2),
        'utf8'
      );
    } catch (error) {
      // Silently fail - not critical
    }
  }

  /**
   * Load previously failed tests
   */
  loadFailedTests() {
    try {
      if (fs.existsSync(this.failedTestsFile)) {
        const content = fs.readFileSync(this.failedTestsFile, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      // Return empty array if file doesn't exist or is invalid
    }
    return [];
  }

  /**
   * Clear saved failed tests
   */
  clearFailedTests() {
    try {
      if (fs.existsSync(this.failedTestsFile)) {
        fs.unlinkSync(this.failedTestsFile);
      }
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Print summary report
   */
  printSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const total = this.passed.length + this.errors.length + this.skipped.length;
    
    console.log('\n' + '='.repeat(80));
    console.log(this.color('📊 TEST EXECUTION SUMMARY', 'bright'));
    console.log('='.repeat(80) + '\n');

    // Overall statistics
    console.log(this.color(`Total Tests: ${total}`, 'cyan'));
    console.log(this.color(`✅ Passed: ${this.passed.length}`, 'green'));
    console.log(this.color(`❌ Failed: ${this.errors.length}`, this.errors.length > 0 ? 'red' : 'green'));
    console.log(this.color(`⚠️  Warnings: ${this.warnings.length}`, this.warnings.length > 0 ? 'yellow' : 'cyan'));
    console.log(this.color(`⏭️  Skipped: ${this.skipped.length}`, 'cyan'));
    console.log(this.color(`⏱️  Duration: ${duration}s`, 'cyan'));
    console.log('');

    // Passed tests (compact)
    if (this.passed.length > 0) {
      console.log(this.color('✅ PASSED TESTS', 'green'));
      console.log('-'.repeat(80));
      this.passed.forEach(test => {
        const name = test.name || test.suite || 'Unknown';
        const duration = test.duration ? ` (${test.duration}s)` : '';
        console.log(this.color(`  ✓ ${name}${duration}`, 'green'));
      });
      console.log('');
    }

    // Failed tests (detailed)
    if (this.errors.length > 0) {
      console.log(this.color('❌ FAILED TESTS', 'red'));
      console.log('='.repeat(80));
      
      // Group by severity
      const critical = this.errors.filter(e => e.severity === 'critical');
      const high = this.errors.filter(e => e.severity === 'high');
      const medium = this.errors.filter(e => e.severity === 'medium');
      const low = this.errors.filter(e => e.severity === 'low');

      if (critical.length > 0) {
        console.log(this.color('\n🔴 CRITICAL FAILURES', 'red'));
        critical.forEach((test, index) => {
          this.printFailedTest(test, index + 1, critical.length);
        });
      }

      if (high.length > 0) {
        console.log(this.color('\n🟠 HIGH PRIORITY FAILURES', 'yellow'));
        high.forEach((test, index) => {
          this.printFailedTest(test, index + 1, high.length);
        });
      }

      if (medium.length > 0) {
        console.log(this.color('\n🟡 MEDIUM PRIORITY FAILURES', 'yellow'));
        medium.forEach((test, index) => {
          this.printFailedTest(test, index + 1, medium.length);
        });
      }

      if (low.length > 0) {
        console.log(this.color('\n🔵 LOW PRIORITY FAILURES', 'cyan'));
        low.forEach((test, index) => {
          this.printFailedTest(test, index + 1, low.length);
        });
      }
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log(this.color('\n⚠️  WARNINGS', 'yellow'));
      console.log('-'.repeat(80));
      this.warnings.forEach(warning => {
        const name = warning.name || warning.suite || 'Unknown';
        console.log(this.color(`  ⚠ ${name}`, 'yellow'));
        if (warning.description) {
          console.log(`    ${warning.description}`);
        }
      });
      console.log('');
    }

    // Skipped tests
    if (this.skipped.length > 0) {
      console.log(this.color('⏭️  SKIPPED TESTS', 'cyan'));
      console.log('-'.repeat(80));
      this.skipped.forEach(test => {
        const name = test.name || test.suite || 'Unknown';
        console.log(`  ⏭ ${name}`);
      });
      console.log('');
    }

    // Debugging guidance
    if (this.errors.length > 0) {
      console.log(this.color('💡 DEBUGGING GUIDANCE', 'cyan'));
      console.log('='.repeat(80));
      console.log(this.color('To rerun only failed tests:', 'bright'));
      console.log('  npm run test:failed');
      console.log('');
      console.log(this.color('To debug failed tests interactively:', 'bright'));
      console.log('  npm run test:debug');
      console.log('');
      console.log(this.color('To run a specific test category:', 'bright'));
      console.log('  npm run test:unit      - Run unit tests');
      console.log('  npm run test:api       - Run API tests');
      console.log('  npm run test:e2e       - Run E2E tests');
      console.log('  npm run test:visual    - Run visual tests');
      console.log('  npm run test:security  - Run security tests');
      console.log('');
    }

    // Final status
    console.log('='.repeat(80));
    if (this.errors.length === 0) {
      console.log(this.color('✅ ALL TESTS PASSED', 'green'));
      console.log('='.repeat(80) + '\n');
      return 0;
    } else {
      console.log(this.color(`❌ ${this.errors.length} TEST(S) FAILED`, 'red'));
      console.log('='.repeat(80) + '\n');
      return 1;
    }
  }

  /**
   * Print details for a single failed test
   */
  printFailedTest(test, index, total) {
    const name = test.name || test.suite || 'Unknown';
    const location = this.extractTestLocation(test);
    const hints = this.generateHints(test);

    console.log(`\n${index}. ${this.color(name, 'red')}`);
    console.log(`   Category: ${this.color(test.category || 'unknown', 'cyan')}`);
    console.log(`   Severity: ${this.color(test.severity || 'unknown', test.severity === 'critical' ? 'red' : 'yellow')}`);
    
    if (location) {
      console.log(`   Location: ${location.file}:${location.line}`);
    }

    if (test.duration) {
      console.log(`   Duration: ${test.duration}s`);
    }

    if (test.code !== undefined) {
      console.log(`   Exit Code: ${test.code}`);
    }

    if (test.error) {
      console.log(`   Error: ${this.color(test.error, 'red')}`);
    }

    if (test.description) {
      // Show first few lines of description
      const descLines = test.description.split('\n').slice(0, 5);
      console.log(`   Details: ${descLines.join('\n            ')}`);
    }

    if (hints.length > 0) {
      console.log(`   ${this.color('Hints:', 'yellow')}`);
      hints.forEach(hint => {
        console.log(`     • ${hint}`);
      });
    }

    // Show error output snippet
    const output = (test.stdout || '') + (test.stderr || '');
    if (output) {
      const snippet = output.split('\n')
        .filter(line => line.trim().length > 0)
        .slice(-10)
        .join('\n');
      if (snippet) {
        console.log(`   ${this.color('Error Output (last 10 lines):', 'yellow')}`);
        console.log(`     ${snippet.split('\n').join('\n     ')}`);
      }
    }
  }

  /**
   * Color text helper
   */
  color(text, colorName) {
    return `${colors[colorName] || colors.reset}${text}${colors.reset}`;
  }

  /**
   * Get exit code based on failures
   */
  getExitCode() {
    // Exit with error code if there are critical or high priority failures
    const criticalOrHigh = this.errors.filter(e => 
      e.severity === 'critical' || e.severity === 'high'
    ).length;
    
    return criticalOrHigh > 0 ? 1 : 0;
  }
}

module.exports = TestErrorCollector;

