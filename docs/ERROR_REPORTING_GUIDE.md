# Error Reporting Guide

## Overview

The testing pipeline now includes **detailed, LLM-friendly error messages** that can be easily copied and pasted into an LLM for debugging assistance.

## What Was Added

### 1. Enhanced Error Formatting

When a test fails, you'll now see a formatted error block that includes:

```
═══════════════════════════════════════════════════════════════
ERROR DESCRIPTION FOR LLM DEBUGGING
═══════════════════════════════════════════════════════════════

Test Suite: [Test Name]
Exit Code: [Exit Code]
Timestamp: [ISO Timestamp]

ERROR SUMMARY:
[What went wrong]

WHAT WENT WRONG:
[Detailed explanation with possible causes]

CONTEXT:
[Test type and context information]

STDOUT OUTPUT (last 5000 chars):
[Test output]

STDERR OUTPUT (last 5000 chars):
[Error output]

HOW TO DEBUG:
[Step-by-step debugging instructions]

NEXT STEPS:
[Actionable next steps]

═══════════════════════════════════════════════════════════════
Copy the above section to paste into an LLM for debugging help
═══════════════════════════════════════════════════════════════
```

### 2. Error Helper Utilities

Created `tests/e2e/error-helper.ts` with utilities for formatting test errors:

- `formatTestError()` - Creates detailed error descriptions
- `formatAssertionError()` - Formats assertion failures with context

### 3. Enhanced Test Files

E2E tests now include:
- Try-catch blocks with detailed error formatting
- Context information (selectors used, page state, etc.)
- Suggestions for fixing the issue
- LLM-friendly error messages

## How to Use

### When a Test Fails

1. **Look for the error block** - It will be displayed in yellow text after the test failure
2. **Copy the entire error block** - From the `═══════` lines
3. **Paste into an LLM** - The formatted text is designed to be easily understood by LLMs

### Example Error Output

```
❌ User E2E Tests failed (exit code: 1, 35.56s)

═══════════════════════════════════════════════════════════════
ERROR DESCRIPTION FOR LLM DEBUGGING
═══════════════════════════════════════════════════════════════

Test Suite: User E2E Tests
Exit Code: 1
Timestamp: 2024-11-16T20:30:45.123Z

ERROR SUMMARY:
The test suite "User E2E Tests" failed with exit code 1.

WHAT WENT WRONG:
An element was not found on the page. This usually means:
- The UI selector has changed (check the test file for the selector)
- The page structure is different than expected
- The element is not visible or not loaded yet (add wait conditions)
- The page redirected to a different route than expected

CONTEXT:
- This is a E2E test failure
- The test was part of the automated testing pipeline
- Check the output below for specific test failures

STDOUT OUTPUT (last 5000 chars):
[Test output here...]

STDERR OUTPUT (last 5000 chars):
[Error output here...]

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
```

## Error Types Detected

The error formatter automatically detects and explains:

1. **Timeout Errors** - Element not found, slow responses
2. **Element Not Found** - Selector issues, page structure changes
3. **Assertion Failures** - Value mismatches, condition failures
4. **Network Errors** - API failures, connectivity issues
5. **Syntax Errors** - Code errors, parsing issues
6. **Redirect/Navigation Issues** - Unexpected URL changes

## Best Practices

1. **Always copy the full error block** - It contains all context needed
2. **Include the test name** - Helps identify which test failed
3. **Check the suggestions** - The error formatter provides specific guidance
4. **Review stdout/stderr** - Contains the actual error details

## Integration with LLMs

The error format is optimized for:
- **ChatGPT**
- **Claude**
- **Other LLMs**

Simply copy the error block (between the `═══════` lines) and paste it into your LLM with a prompt like:

> "I have a test failure. Here's the error output: [paste error block]"

The LLM will have all the context needed to help debug the issue.

---

**Last Updated**: 2024

