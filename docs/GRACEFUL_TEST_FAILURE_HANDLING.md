# Graceful Test Failure Handling

## Overview

The test suite has been enhanced with graceful failure handling that ensures all tests run to completion, even if some tests fail. Errors are collected throughout the test run and presented in a comprehensive summary report at the end.

## Key Features

### 1. **Continue on Failure**
- No single test failure stops subsequent tests
- All test categories (security, unit, API, E2E, visual) run fully
- Errors are collected but don't interrupt the pipeline

### 2. **Error Collection**
- All failed tests are captured with detailed information:
  - Test name and location
  - Reason for failure
  - Expected vs actual outcome (when applicable)
  - Stack traces and error output
  - Category and severity classification

### 3. **Comprehensive Summary Report**
At the end of each test run, you'll see:
- ✅ **Passed tests** - List of all successful tests
- ❌ **Failed tests** - Detailed breakdown by severity:
  - 🔴 Critical failures (security, authentication, database)
  - 🟠 High priority failures (API, core E2E functionality)
  - 🟡 Medium priority failures (visual regressions, unit tests)
  - 🔵 Low priority failures (other issues)
- ⚠️ **Warnings** - Non-critical issues
- ⏭️ **Skipped tests** - Tests that were skipped

### 4. **Debugging Guidance**
Each failed test includes:
- File location and line number (when available)
- Category classification (security, API, E2E, visual, unit, etc.)
- Severity level
- Specific debugging hints based on error type
- Error output snippets

### 5. **Rerun Failed Tests**
After a test run, you can rerun only the tests that failed:
```bash
npm run test:failed        # Rerun all previously failed tests
npm run test:debug          # Rerun failed tests in debug mode
```

## Usage

### Running All Tests
```bash
npm test                    # Run all test suites with graceful failure handling
npm run test:all            # Same as above
```

### Running Specific Test Groups
```bash
npm run test:user           # User/auth/profile tests
npm run test:event         # Event/request tests
npm run test:email         # Email workflow tests
npm run test:security      # Security and RLS tests
```

### Individual Test Categories
```bash
npm run test:unit           # Unit tests only
npm run test:api            # API tests only
npm run test:e2e            # E2E tests only
npm run test:visual         # Visual regression tests only
```

### Rerunning Failed Tests
```bash
# After running tests, if some failed:
npm run test:failed         # Rerun only the failed tests
npm run test:debug          # Rerun failed tests in debug mode
```

## How It Works

### Test Runner Scripts

1. **`scripts/run-all-tests.js`**
   - Main test runner for all test suites
   - Runs: Security → Unit → API → E2E → Visual
   - Continues on failure and collects all errors

2. **`scripts/run-grouped-tests.js`**
   - Runs specific test groups (user, event, email, security, all)
   - Same graceful failure handling as main runner

3. **`scripts/test-error-collector.js`**
   - Centralized error collection and reporting
   - Categorizes errors by type and severity
   - Generates comprehensive summary reports
   - Saves failed tests to `.test-failures.json` for rerun

4. **`scripts/rerun-failed-tests.js`**
   - Reads `.test-failures.json` from previous run
   - Reruns only the tests that failed
   - Supports debug mode for interactive debugging

### Error Classification

Tests are automatically classified into categories:
- **Security**: Secret detection, RLS, sanitization
- **API**: API endpoint tests
- **E2E**: Browser/Playwright tests
- **Visual**: Screenshot/snapshot tests
- **Unit**: Unit tests
- **Database**: Database connection/query issues
- **Network**: Network/timeout issues
- **General**: Other errors

### Severity Levels

- **Critical**: Security issues, authentication failures, database access problems
- **High**: API failures, core E2E functionality issues
- **Medium**: Visual regressions, unit test edge cases
- **Low**: Other non-critical issues

## Example Output

```
================================================================================
📊 TEST EXECUTION SUMMARY
================================================================================

Total Tests: 15
✅ Passed: 12
❌ Failed: 3
⚠️  Warnings: 0
⏭️  Skipped: 0
⏱️  Duration: 45.32s

✅ PASSED TESTS
--------------------------------------------------------------------------------
  ✓ Security Tests (12.5s)
  ✓ Unit Tests (8.2s)
  ✓ API Tests (15.3s)
  ...

❌ FAILED TESTS
================================================================================

🔴 CRITICAL FAILURES

1. E2E Tests
   Category: e2e
   Severity: critical
   Location: tests/e2e/auth.spec.ts:45
   Duration: 23.1s
   Exit Code: 1
   Hints:
     • Check if application is running on correct port
     • Verify UI selectors match current page structure
     • Review Playwright report: npx playwright show-report

💡 DEBUGGING GUIDANCE
================================================================================
To rerun only failed tests:
  npm run test:failed

To debug failed tests interactively:
  npm run test:debug
```

## Configuration

### Playwright Configuration

Both `playwright.config.ts` and `playwright.visual.config.ts` are configured to:
- Run all tests even if some fail (`maxFailures: undefined`)
- Retry flaky tests on CI (2 retries)
- Capture screenshots and videos on failure
- Generate HTML reports in CI

### Jest Configuration

Jest tests (unit and API) are configured to:
- Continue running all tests even if some fail
- Use `--passWithNoTests` to avoid errors when no tests match
- Run with limited workers (50%) to avoid resource exhaustion

## File Structure

```
scripts/
  ├── run-all-tests.js          # Main test runner
  ├── run-grouped-tests.js       # Grouped test runner
  ├── test-error-collector.js    # Error collection utility
  └── rerun-failed-tests.js     # Rerun failed tests script

.test-failures.json              # Saved failed tests (gitignored)
```

## Best Practices

1. **Always run full test suite** before committing:
   ```bash
   npm test
   ```

2. **Review the summary report** to understand all failures before fixing

3. **Use severity levels** to prioritize fixes:
   - Fix critical failures first
   - Address high priority failures next
   - Medium and low priority can be addressed later

4. **Rerun failed tests** after making fixes:
   ```bash
   npm run test:failed
   ```

5. **Use debug mode** for interactive debugging:
   ```bash
   npm run test:debug
   ```

## Troubleshooting

### No Failed Tests File
If `npm run test:failed` says "No failed tests found":
- Run the full test suite first: `npm test`
- The `.test-failures.json` file is created automatically after a test run with failures

### Tests Still Failing After Fixes
- Check the detailed error output in the summary
- Review the debugging hints provided
- Use `npm run test:debug` for interactive debugging
- Check Playwright reports: `npx playwright show-report`

### Exit Codes
- Exit code 0: All tests passed OR only low/medium priority failures
- Exit code 1: Critical or high priority failures detected

This allows CI/CD pipelines to fail on important issues while still running all tests.

