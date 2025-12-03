# Event Email Workflow & Blocking Logic - Implementation Summary

## Overview
This document describes the implementation of the complete email-driven event workflow with timeline blocking logic for the Junge Gesellschaft event management system.

## Development Environment
- **Admin Email for Testing**: `Juan.Wiegmann@web.de` (configured in `src/utils/settingsHelper.js`)

## Event Workflow Stages

### 1. User Submits Event Request (Initial)
**Status**: `initial` / `requested`

**Actions**:
- User fills out the event request form
- Request is created in `event_requests` table with `request_stage = 'initial'`

**Emails Sent**:
- **To User**: "Ihre Event-Anfrage wurde empfangen" - Confirmation that request was received
- **To Admin** (Juan.Wiegmann@web.de): "Neue Event-Anfrage eingegangen - Initiale Überprüfung erforderlich"

**Files**:
- `src/components/Calendar/PublicEventRequestForm.js` - Form submission
- `src/services/databaseApi.js` - `createInitialRequest()` method
- `src/utils/settingsHelper.js` - `sendUserNotification()` and `sendAdminNotification()`

### 2. Admin Initial Acceptance (Step 1)
**Status**: `initial_accepted`

**Actions**:
- Admin reviews request in admin panel (`src/components/Admin/ThreeStepRequestManagement.js`)
- Admin clicks "✅ Initial akzeptieren" button
- System updates `request_stage` to `initial_accepted`
- **TIMELINE BLOCKING**: A temporary block is created in `temporarily_blocked_dates` table
- This block prevents other requests from being accepted for the same time slot

**Emails Sent**:
- **To User**: "Ihre Event-Anfrage wurde akzeptiert - Weitere Informationen erforderlich"
  - Contains link to `/event-tracking?email={user_email}` for easy access
  - Explains that time slot is now blocked/reserved
  - Lists required information (exact times, key handover, signed contract)
- **To Admin**: No email at this stage (waits for user to submit details)

**Files**:
- `src/components/Admin/ThreeStepRequestManagement.js` - `handleLocalAcceptInitial()`
- `src/services/databaseApi.js` - `acceptInitialRequest()` method
- `supabase/migrations/create_temporarily_blocked_dates_table.sql` - Database table for blocks

### 3. User Provides More Information (Step 2)
**Status**: `details_submitted`

**Actions**:
- User accesses "Details ergänzen" form via:
  - Link in email: `/event-tracking?email={email}`
  - Or via "Nachverfolgen" button in UI
- User fills in:
  - Exact start/end datetime
  - Key handover/return datetime
  - Signed contract (PDF upload)
  - Additional notes
- System updates `request_stage` to `details_submitted`

**Emails Sent**:
- **To Admin**: "Detaillierte Event-Informationen eingereicht - Finale Überprüfung erforderlich"
  - Includes all submitted details
  - Notes that contract is uploaded
  - Reminds that time slot is blocked
- **To User**: No email at this stage

**Files**:
- `src/components/Calendar/DetailedEventForm.js` - Form for submitting details
- `src/pages/EventRequestTrackingPage.js` - Handles email parameter from URL
- `src/services/databaseApi.js` - `submitDetailedRequest()` method

### 4. Admin Final Acceptance (Step 3)
**Status**: `final_accepted`

**Actions**:
- Admin reviews submitted details in admin panel
- Admin clicks "🎉 Final freigeben" button
- System updates `request_stage` to `final_accepted`
- **Event Creation**: A new entry is created in `events` table
- **Block Removal**: The temporary block is deleted from `temporarily_blocked_dates`
- Event is now visible in the calendar for all users

**Emails Sent**:
- **To User**: "Ihre Event-Buchung wurde final genehmigt!"
  - Confirms event is in calendar
  - Includes exact start/end times
  - Link to view calendar
- **To Admin**: "Event genehmigt und aktiviert (Schritt 3/3)"
  - Confirmation that event is now live

**Files**:
- `src/components/Admin/ThreeStepRequestManagement.js` - `handleLocalFinalAccept()`
- `src/services/databaseApi.js` - `finalAcceptRequest()` method

## Timeline Blocking Logic

### When Blocking is Created
- **Trigger**: When admin performs "Initial Accept" (Step 1)
- **Table**: `temporarily_blocked_dates`
- **Duration**: From initial acceptance until final acceptance
- **Purpose**: Prevents double-booking of the same time slot

### Blocking Behavior
1. **Creation**: On `initial_accepted` status:
   - Block entry created in `temporarily_blocked_dates`
   - Includes `request_id`, dates, requester info, `request_stage`
   - Visible in admin calendar as "Vorläufig blockiert"

2. **Display in Calendar**:
   - Shows as orange/yellow blocked time slot
   - Admin sees: "Anfrage von {name} - Status: initial_accepted"
   - Public sees: "Dieser Zeitraum ist vorübergehend blockiert"
   - Loaded via `httpAPI.blockedDates.getTemporarilyBlocked()`

3. **Removal**: On `final_accepted` status:
   - Block is deleted from `temporarily_blocked_dates`
   - Event is created in `events` table instead
   - Calendar now shows the confirmed event

### Calendar Integration
- **File**: `src/components/Calendar/SimpleMonthCalendar.js`
- Loads temporarily blocked dates on calendar render
- Displays blocks with distinct styling
- Blocks are visible to all users (admin and public)
- Uses `exact_start_datetime` / `exact_end_datetime` if available, falls back to `start_date` / `end_date`

## Database Schema

### New Migration
**File**: `supabase/migrations/create_temporarily_blocked_dates_table.sql`

**Table**: `temporarily_blocked_dates`
- `id` (UUID, primary key)
- `request_id` (UUID, references event_requests)
- `event_name`, `requester_name`, `requester_email`
- `start_date`, `end_date` (DATE)
- `exact_start_datetime`, `exact_end_datetime` (TIMESTAMPTZ)
- `request_stage` (TEXT, default 'initial_accepted')
- `is_temporary` (BOOLEAN, default true)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**RLS Policies**:
- Admins can read/insert/delete all blocks
- Anyone (anon/authenticated) can read blocks (for calendar display)

## Email Configuration

### Admin Email (Development)
- **Email**: `Juan.Wiegmann@web.de`
- **Location**: `src/utils/settingsHelper.js` - `getAdminNotificationEmails()`
- **Note**: This is the development email. Update for production.

### Email Templates
**File**: `src/utils/settingsHelper.js`

**User Emails**:
1. `initial_request_received` - Request confirmation
2. `initial_request_accepted` - Initial acceptance with "more information" link
3. `final_approval` - Final acceptance confirmation

**Admin Emails**:
1. `initial_request` - New request notification
2. `detailed_info_submitted` - User submitted details
3. `final_acceptance` - Event activated confirmation

### Email Service
- **Edge Function**: `supabase/functions/send-admin-notification/index.ts`
- Uses Resend API for email delivery
- Environment variables: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`

## Key Files Modified/Created

### Core Workflow
- `src/services/databaseApi.js` - API methods for workflow steps
- `src/utils/settingsHelper.js` - Email templates and admin email config
- `src/components/Admin/ThreeStepRequestManagement.js` - Admin panel with workflow buttons

### User Interface
- `src/pages/EventRequestTrackingPage.js` - Event tracking with email parameter support
- `src/components/Calendar/DetailedEventForm.js` - "More information" form
- `src/components/Calendar/SimpleMonthCalendar.js` - Calendar with blocking display

### Database
- `supabase/migrations/create_temporarily_blocked_dates_table.sql` - New migration

### Email Service
- `supabase/functions/send-admin-notification/index.ts` - Edge function for emails

## Testing Checklist

### Development Testing (Juan.Wiegmann@web.de)
1. ✅ Submit event request → Check user and admin emails
2. ✅ Admin initial accept → Check user email with link, verify block in calendar
3. ✅ User submits details → Check admin email
4. ✅ Admin final accept → Check user email, verify event in calendar, verify block removed
5. ✅ Verify calendar shows blocks from `initial_accepted` onwards
6. ✅ Verify "more information" link works with email parameter
7. ✅ Verify no double-booking after initial acceptance

## Environment Variables Required

### Supabase Edge Function
- `RESEND_API_KEY` - Resend API key (starts with `re_`)
- `RESEND_FROM_EMAIL` - Sender email (must be verified with Resend)
- `RESEND_FROM_NAME` - Sender name
- `ALLOWED_ORIGINS` - CORS origins (comma-separated)

## Notes
- All email sending is non-blocking (won't fail the main operation if email fails)
- Blocking is active from `initial_accepted` status onwards
- The "more information" link includes email parameter for easy access
- Admin panel clearly shows workflow stages with appropriate buttons
- Calendar displays blocks to prevent confusion about availability

