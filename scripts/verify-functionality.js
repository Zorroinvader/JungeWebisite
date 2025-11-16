#!/usr/bin/env node

/**
 * End-to-End Functionality Verification Script
 * 
 * Runs all tests and generates a comprehensive report confirming
 * that all features are functioning as intended.
 * 
 * Usage:
 *   node scripts/verify-functionality.js
 *   npm run verify:functionality
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
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

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test categories to run
const testCategories = [
  {
    name: 'Security & RLS Tests',
    command: 'npm',
    args: ['run', 'test:security'],
    critical: true,
  },
  {
    name: 'Unit Tests',
    command: 'npm',
    args: ['run', 'test:unit'],
    critical: true,
  },
  {
    name: 'API Tests',
    command: 'npm',
    args: ['run', 'test:api'],
    critical: true,
  },
  {
    name: 'Edge Cases Tests',
    command: 'npm',
    args: ['run', 'test:edgecases'],
    critical: false,
  },
  {
    name: 'Error Handling Tests',
    command: 'npm',
    args: ['run', 'test:errorhandling'],
    critical: false,
  },
  {
    name: 'E2E Functionality Verification',
    command: 'npm',
    args: ['run', 'test:e2e:functionality'],
    critical: true,
  },
  {
    name: 'Accessibility Tests',
    command: 'npm',
    args: ['run', 'test:e2e:a11y'],
    critical: false,
  },
  {
    name: 'Visual Regression Tests',
    command: 'npm',
    args: ['run', 'test:visual'],
    critical: false,
  },
];

function runTest(test) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const testProcess = spawn(test.command, test.args, {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd(),
    });

    let stdout = '';
    let stderr = '';

    testProcess.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    testProcess.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    testProcess.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const success = code === 0;

      resolve({
        name: test.name,
        success,
        code,
        duration,
        critical: test.critical,
        stdout,
        stderr,
      });
    });

    testProcess.on('error', (error) => {
      resolve({
        name: test.name,
        success: false,
        error: error.message,
        critical: test.critical,
        duration: ((Date.now() - startTime) / 1000).toFixed(2),
        stdout,
        stderr,
      });
    });
  });
}

function generateReport(results) {
  const timestamp = new Date().toISOString();
  const passed = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const criticalFailed = failed.filter(r => r.critical);
  const allCriticalPassed = criticalFailed.length === 0;

  const report = {
    timestamp,
    summary: {
      total: results.length,
      passed: passed.length,
      failed: failed.length,
      criticalFailed: criticalFailed.length,
      allCriticalPassed,
    },
    results: results.map(r => ({
      name: r.name,
      status: r.success ? 'PASSED' : 'FAILED',
      critical: r.critical,
      duration: r.duration,
      error: r.error || (r.code !== 0 ? `Exit code: ${r.code}` : null),
    })),
    passedTests: passed.map(r => r.name),
    failedTests: failed.map(r => ({
      name: r.name,
      critical: r.critical,
      error: r.error || `Exit code: ${r.code}`,
    })),
  };

  return report;
}

function formatReport(report) {
  const lines = [];
  
  lines.push('='.repeat(80));
  lines.push('END-TO-END FUNCTIONALITY VERIFICATION REPORT');
  lines.push('='.repeat(80));
  lines.push(`Generated: ${report.timestamp}`);
  lines.push('');

  // Summary
  lines.push('SUMMARY');
  lines.push('-'.repeat(80));
  lines.push(`Total Tests: ${report.summary.total}`);
  lines.push(`✅ Passed: ${report.summary.passed}`);
  lines.push(`❌ Failed: ${report.summary.failed}`);
  lines.push(`⚠️  Critical Failed: ${report.summary.criticalFailed}`);
  lines.push('');

  // Results
  lines.push('DETAILED RESULTS');
  lines.push('-'.repeat(80));
  report.results.forEach(result => {
    const status = result.status === 'PASSED' ? '✅' : '❌';
    const critical = result.critical ? ' [CRITICAL]' : '';
    lines.push(`${status} ${result.name}${critical} (${result.duration}s)`);
    if (result.error) {
      lines.push(`   Error: ${result.error}`);
    }
  });
  lines.push('');

  // Final Status
  lines.push('='.repeat(80));
  if (report.summary.allCriticalPassed && report.summary.failed === 0) {
    lines.push('✅ ALL FEATURES ARE FUNCTIONING AS INTENDED');
    lines.push('='.repeat(80));
  } else if (report.summary.allCriticalPassed) {
    lines.push('⚠️  ALL CRITICAL FEATURES ARE FUNCTIONING');
    lines.push(`   ${report.summary.failed} non-critical test(s) failed`);
    lines.push('='.repeat(80));
  } else {
    lines.push('❌ FUNCTIONALITY VERIFICATION FAILED');
    lines.push(`   ${report.summary.criticalFailed} critical test(s) failed`);
    lines.push('='.repeat(80));
    lines.push('');
    lines.push('FAILED CRITICAL TESTS:');
    report.failedTests.filter(t => t.critical).forEach(test => {
      lines.push(`  - ${test.name}: ${test.error}`);
    });
  }
  lines.push('');

  return lines.join('\n');
}

async function main() {
  log('\n🧪 Starting End-to-End Functionality Verification', 'bright');
  log('='.repeat(80), 'cyan');
  log('');

  const results = [];
  const startTime = Date.now();

  // Run all test categories
  for (const test of testCategories) {
    log(`Running: ${test.name}...`, 'cyan');
    const result = await runTest(test);
    results.push(result);

    if (result.success) {
      log(`✅ ${test.name} - PASSED (${result.duration}s)`, 'green');
    } else {
      const critical = test.critical ? ' [CRITICAL]' : '';
      log(`❌ ${test.name}${critical} - FAILED (${result.duration}s)`, 'red');
      if (result.error) {
        log(`   Error: ${result.error}`, 'yellow');
      }
    }
    log('');
  }

  // Generate report
  const report = generateReport(results);
  const reportText = formatReport(report);

  // Display report
  log(reportText);

  // Save report to file
  const reportPath = path.join(process.cwd(), 'FUNCTIONALITY_VERIFICATION_REPORT.md');
  const markdownReport = `# Functionality Verification Report

${reportText}

## Detailed Test Results

${report.results.map(r => `
### ${r.name}
- **Status**: ${r.status}
- **Critical**: ${r.critical ? 'Yes' : 'No'}
- **Duration**: ${r.duration}s
${r.error ? `- **Error**: ${r.error}` : ''}
`).join('\n')}

## Failed Tests

${report.failedTests.length > 0 ? report.failedTests.map(t => `
### ${t.name}
- **Critical**: ${t.critical ? 'Yes' : 'No'}
- **Error**: ${t.error}
`).join('\n') : 'No tests failed.'}

---
Generated: ${report.timestamp}
`;

  fs.writeFileSync(reportPath, markdownReport);
  log(`\n📄 Report saved to: ${reportPath}`, 'cyan');

  // Exit with appropriate code
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  log(`\n⏱️  Total Duration: ${totalDuration}s`, 'cyan');

  if (report.summary.allCriticalPassed) {
    log('\n✅ VERIFICATION COMPLETE: All critical features are functioning', 'green');
    process.exit(0);
  } else {
    log('\n❌ VERIFICATION FAILED: Critical features need attention', 'red');
    process.exit(1);
  }
}

// Run verification
main().catch(error => {
  log(`\n❌ Verification script error: ${error.message}`, 'red');
  process.exit(1);
});

