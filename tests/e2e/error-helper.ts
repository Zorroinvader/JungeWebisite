/**
 * Error Helper Utilities for E2E Tests
 * 
 * Provides utilities to create detailed, LLM-friendly error messages
 */

export function formatTestError(
  testName: string,
  expected: string,
  received: string,
  context: string = ''
): string {
  return `
═══════════════════════════════════════════════════════════════
TEST FAILURE DETAILS FOR LLM DEBUGGING
═══════════════════════════════════════════════════════════════

Test: ${testName}
Timestamp: ${new Date().toISOString()}

WHAT FAILED:
${testName}

EXPECTED BEHAVIOR:
${expected}

ACTUAL BEHAVIOR:
${received}

CONTEXT:
${context || 'No additional context provided'}

POSSIBLE CAUSES:
1. UI element selector has changed - check if the component structure changed
2. Application behavior changed - verify the feature still works as expected
3. Timing issue - element may not be loaded yet, try adding wait conditions
4. Authentication state - check if user is logged in/out as expected
5. Route/URL mismatch - verify the routing logic matches expectations

HOW TO FIX:
1. Check the test file: ${testName.split(' › ').pop() || testName}
2. Verify the selector matches current UI structure
3. Add appropriate wait conditions if timing is the issue
4. Check application logs for errors
5. Review recent changes to the component/page being tested

DEBUGGING COMMANDS:
- npm run test:e2e:debug          # Run in debug mode
- npm run test:e2e:ui             # Run with UI mode
- npx playwright show-report      # View detailed test report

═══════════════════════════════════════════════════════════════
Copy the above section to paste into an LLM for debugging help
═══════════════════════════════════════════════════════════════
`;
}

export function formatAssertionError(
  testName: string,
  assertion: string,
  expected: any,
  received: any,
  context: Record<string, any> = {}
): string {
  return formatTestError(
    testName,
    `Assertion: ${assertion}\nExpected: ${JSON.stringify(expected, null, 2)}`,
    `Received: ${JSON.stringify(received, null, 2)}`,
    `Additional Context:\n${JSON.stringify(context, null, 2)}`
  );
}

