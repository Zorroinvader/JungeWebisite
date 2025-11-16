# Testing Documentation

This document explains the complete testing pipeline for the Jungengesellschaft website project.

## Overview

The project includes a comprehensive testing setup with:
- **Unit & API Tests**: Jest-based tests for API endpoints and Supabase Edge Functions
- **E2E Tests**: Playwright browser tests for end-to-end user flows
- **Visual Regression Tests**: Playwright screenshot comparison tests
- **CI/CD Integration**: GitHub Actions workflows for automated testing

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

This will install all dependencies including Playwright and testing libraries.

### 2. Install Playwright Browsers

```bash
npx playwright install --with-deps
```

This installs the browser binaries needed for E2E and visual tests.

### 3. Configure Environment Variables

Create a `.env.test` file (or use your existing `.env` file) with:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

Optional for E2E tests:
```env
TEST_BASE_URL=http://localhost:3000
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123
```

## Quick Start

### Run All Tests

```bash
npm test
# or
npm run test:all
```

This command runs all test suites in sequence:
1. Unit & API tests (Jest)
2. E2E tests (Playwright)
3. Visual regression tests (Playwright)

### Run Grouped Tests

The testing pipeline is organized into logical groups for easier testing:

```bash
# Run all user/auth/profile related tests
npm run test:user

# Run all event/request/calendar related tests
npm run test:event

# Run complete test pipeline (all tests)
npm run test:all
```

Each grouped test runs:
- **Unit tests** for that category
- **API tests** for that category
- **E2E tests** for that category

### Run Individual Test Suites

```bash
# Unit and API tests only
npm run test:api

# E2E tests only
npm run test:e2e

# Visual regression tests only
npm run test:visual

# User-specific tests
npm run test:unit:user    # User unit tests only
npm run test:api:user     # User API tests only
npm run test:e2e:user     # User E2E tests only

# Event-specific tests
npm run test:unit:event   # Event unit tests only
npm run test:api:event    # Event API tests only
npm run test:e2e:event    # Event E2E tests only
```

## Test Structure

```
src/
└── __tests__/
    ├── api/                       # API-level tests (Jest) - Must be in src/ for CRA
    │   ├── user/                  # User/auth API tests
    │   │   └── auth.test.js
    │   ├── event/                  # Event/request API tests
    │   │   └── eventRequests.test.js
    │   ├── supabase-edge-functions.test.js
    │   └── supabase-client.test.js
    └── unit/                      # Unit tests for utility functions
        ├── user/                  # User/auth utility tests
        │   └── authHelpers.test.js
        └── event/                 # Event validation utility tests
            └── eventValidation.test.js
tests/
├── e2e/                          # End-to-end tests (Playwright)
│   ├── user-auth.spec.ts         # User authentication & profile tests
│   ├── event-requests.spec.ts   # Event request & calendar tests
│   ├── auth.spec.ts
│   ├── homepage.spec.ts
│   └── navigation.spec.ts
└── visual/                       # Visual regression tests (Playwright)
    └── homepage-visual.spec.ts
```

**Note**: API and unit tests must be in `src/__tests__/` because Create React App's Jest only searches the `src/` directory by default.

## Environment Variables

### Required for Local Testing

Create a `.env.test` file in the project root (or use your existing `.env` file):

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### Optional for E2E Tests

```env
TEST_BASE_URL=http://localhost:3000  # Default: http://localhost:3000
TEST_USER_EMAIL=test@example.com      # For login tests
TEST_USER_PASSWORD=testpassword123    # For login tests
```

### For CI/CD (GitHub Actions)

Configure these as GitHub Secrets:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `TEST_BASE_URL` (optional, for deployed preview URLs)
- `TEST_USER_EMAIL` (optional, for E2E login tests)
- `TEST_USER_PASSWORD` (optional, for E2E login tests)

## Test Suites

### 1. Unit Tests

**Framework**: Jest (via react-scripts)

**Locations**: 
- `src/__tests__/unit/user/` - User/auth utility functions
- `src/__tests__/unit/event/` - Event validation utilities

**What they test**:
- Utility functions (validation, formatting, calculations)
- Event validation logic (time overlap, conflicts)
- Authentication helpers (email/phone validation, text sanitization)

**Run**: `npm run test:unit:user` or `npm run test:unit:event`

### 2. API Tests (`npm run test:api`)

**Framework**: Jest (via react-scripts)

**Locations**: 
- `src/__tests__/api/user/` - User/auth API tests
- `src/__tests__/api/event/` - Event/request API tests
- `src/__tests__/api/` - General Supabase API tests

**What they test**:
- Supabase Edge Function endpoints
- API response formats
- Configuration validation
- Error handling
- Database table access patterns

**Example**:
```javascript
test('send-admin-notification edge function should be callable', async () => {
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${supabaseAnonKey}` },
    body: JSON.stringify(testPayload),
  });
  
  expect([200, 401, 403, 500]).toContain(response.status);
});
```

### 3. E2E Tests (`npm run test:e2e`)

**Framework**: Playwright

**Location**: `tests/e2e/`

**What they test**:
- User authentication flows (login, registration)
- Page navigation
- Form interactions
- UI element visibility

**Example**:
```typescript
test('should display login form', async ({ page }) => {
  await page.goto('/login');
  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeVisible();
});
```

**Running E2E Tests**:
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug
```

### 4. Visual Regression Tests (`npm run test:visual`)

**Framework**: Playwright with screenshot comparison

**Location**: `tests/visual/`

**What they test**:
- Visual appearance of pages
- Layout consistency
- Responsive design

**Updating Snapshots**:
When UI changes are intentional, update the baseline snapshots:

```bash
npm run test:visual:update
```

This will update the stored baseline images in `tests/visual/__screenshots__/`.

## CI/CD Integration

### GitHub Actions Workflows

The project includes multiple GitHub Actions workflows:

1. **`.github/workflows/test-user.yml`**
   - Runs on: push, pull_request (when user/auth files change)
   - Tests: User & auth tests (unit, API, E2E)
   - Triggers on changes to: AuthContext, LoginPage, RegisterPage, ProfilePage, Admin components

2. **`.github/workflows/test-event.yml`**
   - Runs on: push, pull_request (when event files change)
   - Tests: Event & request tests (unit, API, E2E)
   - Triggers on changes to: databaseApi, Calendar components, eventValidation

3. **`.github/workflows/test-api-unit.yml`**
   - Runs on: push, pull_request
   - Tests: All unit & API tests

4. **`.github/workflows/test-e2e.yml`**
   - Runs on: push, pull_request
   - Tests: All E2E browser tests
   - Installs Playwright browsers

5. **`.github/workflows/test-visual.yml`**
   - Runs on: push, pull_request
   - Tests: Visual regression tests

6. **`.github/workflows/test-all.yml`**
   - Runs on: push, pull_request, manual trigger
   - Runs all test suites in parallel
   - Provides a unified test summary

### Setting Up CI Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:
   - `REACT_APP_SUPABASE_URL` - Your Supabase project URL
   - `REACT_APP_SUPABASE_ANON_KEY` - Supabase anonymous key (public, safe for frontend)
   - `TEST_BASE_URL` (optional) - For testing against deployed previews (e.g., Vercel preview URL)
   - `TEST_USER_EMAIL` (optional) - Test user email for E2E login tests
   - `TEST_USER_PASSWORD` (optional) - Test user password for E2E login tests
   - `TEST_ADMIN_EMAIL` (optional) - Admin user email for admin E2E tests
   - `TEST_ADMIN_PASSWORD` (optional) - Admin user password for admin E2E tests

**⚠️ Security Note**: Never commit these values to the repository. Always use GitHub Secrets.

## Configuration Files

### Playwright Configuration

- **`playwright.config.ts`**: Main E2E test configuration
  - Base URL: Configurable via `TEST_BASE_URL` env var
  - Browsers: Chromium, Firefox, WebKit
  - Auto-starts dev server for local testing

- **`playwright.visual.config.ts`**: Visual regression test configuration
  - Consistent viewport sizes
  - Screenshot comparison settings

### Jest Configuration

Jest is configured via `react-scripts` (Create React App). Test files should:
- Be in `tests/` directory or have `.test.js`/`.spec.js` extension
- Use standard Jest/React Testing Library patterns

## Interpreting Test Failures

### Unit/API Test Failures

**Symptom**: `npm run test:api` fails

**Common Causes**:
- Missing environment variables
- Supabase Edge Function not accessible
- Network connectivity issues
- Invalid API responses

**How to Debug**:
1. Check that `.env.test` has correct Supabase credentials
2. Verify Supabase Edge Functions are deployed
3. Check network connectivity
4. Review test output for specific error messages

### E2E Test Failures

**Symptom**: `npm run test:e2e` fails

**Common Causes**:
- Application not running (if `TEST_BASE_URL` points to localhost)
- Selectors changed in UI
- Timing issues (elements not loaded)
- Authentication failures

**How to Debug**:
1. Run with UI mode: `npm run test:e2e:ui`
2. Run in debug mode: `npm run test:e2e:debug`
3. Check Playwright report: `npx playwright show-report`
4. Review screenshots/videos in `test-results/`

### Visual Regression Test Failures

**Symptom**: `npm run test:visual` fails with screenshot differences

**Common Causes**:
- Intentional UI changes
- Font rendering differences
- Browser version differences
- Dynamic content (dates, timestamps)

**How to Fix**:
1. Review the diff images in `test-results/`
2. If changes are intentional: `npm run test:visual:update`
3. If changes are unintentional: Fix the UI issue and re-run tests

## Best Practices

### Writing Tests

1. **Keep tests independent**: Each test should be able to run in isolation
2. **Use descriptive names**: Test names should clearly describe what they test
3. **Avoid hardcoded values**: Use environment variables for configuration
4. **Clean up after tests**: Reset state between tests when needed

### Security

⚠️ **Never commit secrets or API keys to the repository**

- Use environment variables for all sensitive data
- Use GitHub Secrets for CI/CD
- The project uses `secureConfig.js` to safely handle API keys

### Performance

- E2E tests are slower than unit tests - use them for critical user flows
- Run unit/API tests frequently during development
- Run full test suite before committing major changes

## Troubleshooting

### Playwright browsers not installed

```bash
npx playwright install --with-deps
```

### Tests fail in CI but pass locally

- Check environment variables are set correctly in GitHub Secrets
- Verify `TEST_BASE_URL` points to accessible URL in CI
- Check CI logs for specific error messages

### Visual tests fail due to minor differences

Adjust the threshold in `playwright.visual.config.ts`:

```typescript
expect: {
  toHaveScreenshot: {
    threshold: 0.2,  // Increase for more tolerance
    maxDiffPixels: 100,  // Increase for more tolerance
  },
}
```

### Jest tests timeout

Increase timeout in test file:

```javascript
test('long running test', async () => {
  // test code
}, 30000); // 30 second timeout
```

## Test Categories

### Email Workflow Tests (`npm run test:email`)

Tests for email notification workflows when event requests are created, approved, or rejected:

**Unit Tests** (`src/__tests__/unit/email/`):
- Email service functions (`sendEmail`, `sendUserNotification`, `sendAdminNotificationEmail`)
- Email content formatting and validation
- Error handling for email failures

**API Tests** (`src/__tests__/api/email/`):
- Supabase Edge Function endpoint (`send-admin-notification`)
- Email API request/response validation
- CORS and authentication handling

**E2E Tests** (`tests/e2e/email-workflow.spec.ts`):
- Email triggers when event requests are created
- Email triggers when admins approve/reject requests
- Email Edge Function availability and CORS

**Running Email Tests**:
```bash
npm run test:email           # Run all email tests (unit, API, E2E)
npm run test:unit:email      # Email unit tests only
npm run test:api:email       # Email API tests only
npm run test:e2e:email       # Email E2E tests only
```

**Email Workflow Test Scenarios**:
1. **Event Request Creation**: User submits request → User receives confirmation email + Admins receive notification
2. **Admin Approval**: Admin approves request → User receives acceptance email
3. **Final Approval**: Admin grants final approval → User receives final approval email
4. **Details Submission**: User submits detailed info → Admins receive notification

**Note**: Email API tests will skip if Supabase credentials are not configured. This is expected to prevent test failures in environments without email service setup.

### User & Auth Tests (`npm run test:user`)

Tests related to user authentication, profiles, and admin access:

**Unit Tests** (`src/__tests__/unit/user/`):
- Email/phone validation
- Text sanitization
- Authentication helpers

**API Tests** (`src/__tests__/api/user/`):
- Supabase auth endpoints
- Profile table access
- User role validation

**E2E Tests** (`tests/e2e/user-auth.spec.ts`):
- Login form display and validation
- Registration flow
- Profile page access control
- Admin panel restrictions

### Event & Request Tests (`npm run test:event`)

Tests related to events, event requests, and calendar:

**Unit Tests** (`src/__tests__/unit/event/`):
- Time overlap detection
- Event conflict checking
- Date/time validation
- Conflict message formatting

**API Tests** (`src/__tests__/api/event/`):
- Event requests table access
- Event status validation
- Supabase Edge Functions for events

**E2E Tests** (`tests/e2e/event-requests.spec.ts`):
- Calendar display
- Event request form
- Event tracking page
- Special events page

## Project-Specific Test Information

### User Roles & Permissions

The application uses a hierarchical role system:

- **SUPERADMIN**: Full access, can create/manage users
- **ADMIN**: Can accept events, manage requests
- **MEMBER**: Logged in user, can create event requests
- **GUEST**: Not logged in, limited access

**Test Users**: Create test accounts in your Supabase project for E2E tests:
- Regular member: `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`
- Admin user: `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD` (optional)

### Database Tables

Key tables tested:
- **profiles**: User profiles with roles
- **events**: Approved events
- **event_requests**: Pending/approved/rejected event requests

### Core User Flows

1. **User Registration & Login**
   - User registers → Email confirmation → Login → Profile access
   - Expected: User can access profile, create event requests

2. **Event Request Creation**
   - Member/Guest creates event request → Admin reviews → Approval/Rejection
   - Expected: Request status updates, notifications sent

3. **Admin Event Management**
   - Admin logs in → Accesses admin panel → Approves/rejects requests → Manages events
   - Expected: Events appear in calendar, users notified

### Frontend Routes

- `/login` - Login page
- `/register` - Registration page
- `/profile` - User profile (protected)
- `/admin` - Admin panel (admin only)
- `/` - Homepage with calendar
- `/event-tracking` - Event request tracking
- `/special-events` - Special events listing

## New Test Categories (2024)

### Security & RLS Tests (`npm run test:security`)

Comprehensive security testing including Row Level Security (RLS) policy verification:

**RLS Tests** (`tests/security/rls.test.ts`):
- Service role key isolation (verify anon keys cannot access privileged operations)
- RLS enforcement for `event_requests` table (INSERT, SELECT, UPDATE, DELETE)
- RLS enforcement for `profiles` table (access restrictions)
- RLS enforcement for `events` table (public/private access)
- Environment variable security verification

**Running RLS Tests**:
```bash
npm run test:rls              # RLS tests only
npm run test:security          # All security tests
npm run test:security          # Security test group
```

**Edge Cases Tests** (`tests/unit/edgeCases.test.ts`):
- Invalid inputs (empty strings, null, undefined, special characters)
- Max/min values (string lengths, dates, numbers)
- Duplicate entries
- Boundary conditions
- Type validation
- SQL injection attempts
- Email validation (valid/invalid formats)
- Phone number format handling
- Concurrent request handling

**Running Edge Cases Tests**:
```bash
npm run test:edgecases         # Edge cases tests only
```

**Error Handling Tests** (`tests/api/errorHandling.test.ts`):
- Network timeout handling
- Retry logic for transient failures
- Rate limiting / throttling (429 responses)
- Server errors (500, 502, 503)
- Malformed response handling
- Connection error handling
- CORS error handling
- Invalid API key handling

**Running Error Handling Tests**:
```bash
npm run test:errorhandling     # Error handling tests only
```

### Concurrency Tests (`npm run test:e2e:concurrency`)

Tests for race conditions and concurrent operations:

**Location**: `tests/e2e/concurrency.spec.ts`

**What they test**:
- Multiple users booking the same time slot simultaneously
- Concurrent event request submissions
- Race conditions in status updates
- Double submission prevention on rapid clicks
- Concurrent profile updates

**Running Concurrency Tests**:
```bash
npm run test:e2e:concurrency   # Concurrency E2E tests only
```

### Accessibility Tests (`npm run test:e2e:a11y`)

WCAG compliance and accessibility testing:

**Location**: `tests/e2e/a11y.spec.ts`

**What they test**:
- WCAG compliance (using @axe-core/playwright)
- Keyboard navigation
- Screen reader compatibility
- Focus management
- Color contrast
- ARIA labels
- Form accessibility
- Image alt text
- Heading hierarchy
- Error message accessibility

**Running Accessibility Tests**:
```bash
npm run test:e2e:a11y          # Accessibility tests only
```

**Dependencies**: Requires `@axe-core/playwright` (already added to package.json)

### Expanded Visual Regression Tests (`npm run test:visual:expanded`)

Comprehensive visual regression testing:

**Location**: `tests/visual/expandedSnapshots.spec.ts`

**What they test**:
- Forms (event request, login, registration, profile)
- Calendar views (month, week, day, mobile)
- Modals and dialogs
- User profile pages
- Admin panels
- Special events pages
- Error states (404, validation errors)
- Loading states
- Responsive design (tablet, mobile, desktop large)

**Running Expanded Visual Tests**:
```bash
npm run test:visual:expanded   # Expanded visual tests only
npm run test:visual:update     # Update all visual snapshots
```

## Supabase Mock Environment

### Configuration

The project includes a Supabase mock/test environment configuration for safe testing:

**Location**: `tests/setup/supabase-mock.config.js`

**Features**:
- Test-specific Supabase URL and keys
- Safety checks to prevent production key usage
- Mock Supabase client for unit tests
- Environment verification

### Setting Up Test Environment

1. **Create a Test Supabase Project**:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create a new project specifically for testing
   - Copy the test project URL and anon key

2. **Configure Test Environment Variables**:

   Create `.env.test` file:
   ```env
   # Test Supabase credentials (use test project, not production!)
   TEST_SUPABASE_URL=https://your-test-project.supabase.co
   TEST_SUPABASE_ANON_KEY=your-test-anon-key-here
   
   # Optional: Service role key (ONLY for backend tests, never in frontend)
   TEST_SUPABASE_SERVICE_KEY=your-test-service-key-here
   
   # Fallback to regular env vars if test vars not set
   REACT_APP_SUPABASE_URL=https://your-test-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-test-anon-key-here
   ```

3. **Verify Test Environment**:
   ```bash
   # Tests will automatically verify they're using test credentials
   npm run test:security
   ```

### Using Mock Environment in Tests

```javascript
// In test files
import { getTestSupabaseUrl, getTestSupabaseAnonKey } from '../setup/supabase-mock.config';

const supabaseUrl = getTestSupabaseUrl();
const supabaseAnonKey = getTestSupabaseAnonKey();
```

### Safety Features

- ✅ Prevents production key usage in tests
- ✅ Warns if production-like URLs are detected
- ✅ Service role key never exposed in frontend
- ✅ Automatic environment verification

## Test Execution Order

When running `npm run test:all`, tests execute in this order:

1. **Unit Tests** - Fast, isolated function tests
2. **API Tests** - Supabase API and Edge Function tests
3. **RLS Security Tests** - Row Level Security verification
4. **Edge Cases Tests** - Input validation and boundary tests
5. **Error Handling Tests** - API error scenarios
6. **E2E Tests** - End-to-end user flow tests
7. **Concurrency Tests** - Race condition tests (optional)
8. **Accessibility Tests** - WCAG compliance tests (optional)
9. **Email Workflow Tests** - Email notification tests
10. **Visual Regression Tests** - Screenshot comparison (optional)
11. **Expanded Visual Tests** - Comprehensive visual tests (optional)

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)
- [Axe Core Documentation](https://github.com/dequelabs/axe-core)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Getting Help

If you encounter issues:

1. Check this documentation
2. Review test output and error messages
3. Check GitHub Actions logs (for CI failures)
4. Review Playwright/Jest documentation
5. Check that all environment variables are set correctly
6. Verify test user accounts exist in Supabase
7. Check Supabase RLS policies allow test operations

---

**Last Updated**: 2024
**Maintained By**: Development Team

