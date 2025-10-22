# Integration Guide - 3-Step Workflow with Existing Code

## Overview

The new 3-step workflow has been designed to **work alongside** your existing single-step workflow without breaking anything.

## How Both Systems Coexist

### Database Schema
```sql
-- Existing fields (used by both workflows):
title, description, requester_name, requester_email,
start_date, end_date, is_private, event_type, status

-- New fields (only used by 3-step workflow):
event_name, requested_days, request_stage, initial_notes,
exact_start_datetime, exact_end_datetime,
key_handover_datetime, key_return_datetime,
signed_contract_url, initial_accepted_at, etc.
```

### Field Mapping

| Old Workflow | 3-Step Workflow | Notes |
|--------------|-----------------|-------|
| `status` = 'pending' | `status` = 'pending' + `request_stage` = 'initial' | Both set |
| `status` = 'approved' | `status` = 'approved' + `request_stage` = 'final_accepted' | Both set |
| `status` = 'rejected' | `status` = 'rejected' + `request_stage` = 'rejected' | Both set |
| `title` | `title` + `event_name` | Stored in both |
| `description` | `description` + `initial_notes` | Stored in both |
| `schluesselannahme_time` (time only) | `key_handover_datetime` (full datetime) | Different precision |

## Usage

### For Users:

**Option 1: Old Workflow (Still Works!)**
1. Click "Event anfragen" (if logged in)
2. Fill complete form with all details
3. Upload signed PDF
4. Submit → Admin reviews → Done

**Option 2: New 3-Step Workflow**
1. Click green "Event anfragen" button (no login needed!)
2. Fill basic info (name, email, dates, type)
3. Submit → Wait for admin
4. When accepted, fill detailed form + upload PDF
5. Submit → Wait for final admin approval → Done

### For Admins:

Your existing **EventRequestManagement.js** will show ALL requests:
- Requests from old workflow have `request_stage` = null or undefined
- Requests from new workflow have `request_stage` = 'initial', 'initial_accepted', etc.

You can filter by checking if `request_stage` exists:

```javascript
// In your admin panel:
const isThreeStepRequest = request.request_stage !== null;

if (isThreeStepRequest) {
  // Show 3-step workflow UI
  if (request.request_stage === 'initial') {
    // Show "Accept Initial Request" button
  } else if (request.request_stage === 'details_submitted') {
    // Show "Final Approval" button
  }
} else {
  // Show traditional approve/reject buttons
}
```

## Migration Path

### Phase 1: Run Database Migration ✓
```sql
-- Run: database/three-step-workflow-migration.sql
-- This adds new columns without affecting existing data
```

### Phase 2: Test Both Workflows Side-by-Side
- Old workflow continues working normally
- New workflow is available via new button
- Both store in same table
- Both visible in admin panel

### Phase 3: Optional - Gradual Migration
You can gradually move users to the new workflow:
- Keep old button for logged-in users
- Use new button for non-logged-in users
- Monitor both systems
- Eventually deprecate old workflow when ready

## Code Structure

### Files That DON'T Change:
- ✅ `EventRequestModalHTTP.js` - Your existing request form
- ✅ `EventRequestManagement.js` - Your existing admin component
- ✅ `EventCalendar.js` - Still works, just enhanced

### New Files Added:
- 📄 `PublicEventRequestForm.js` - Simple initial request form
- 📄 `DetailedEventForm.js` - Step 2 form (detailed info + PDF)
- 📄 `RequestTimeline.js` - Status tracker
- 📄 `ThreeStepRequestManagement.js` - Admin component for 3-step requests
- 📄 `EventRequestTrackingPage.js` - Public tracking page

### Updated Files:
- 🔄 `HomePage.js` - Added new buttons
- 🔄 `httpApi.js` - Added new API methods
- 🔄 `AdminPanelClean.js` - Added new tab (optional)
- 🔄 `App.js` - Added tracking page route

## Testing Checklist

### Test Old Workflow Still Works:
- [ ] Create request via EventRequestModalHTTP
- [ ] Upload PDF works
- [ ] Admin can see and approve/reject
- [ ] Event appears in calendar after approval

### Test New 3-Step Workflow:
- [ ] Create initial request (no login)
- [ ] Admin sees request with `request_stage = 'initial'`
- [ ] Admin accepts request
- [ ] User can track request by email
- [ ] User fills detailed form + uploads PDF
- [ ] Admin sees detailed request
- [ ] Admin gives final approval
- [ ] Event appears in calendar
- [ ] Temporary blocking shows during steps 2-3

## API Methods

### Existing (Still Work):
```javascript
eventRequestsAPI.getAll()       // Gets all requests
eventRequestsAPI.create(data)   // Creates traditional request
eventRequestsAPI.update(id, data) // Updates request
```

### New (Added):
```javascript
eventRequestsAPI.createInitialRequest(data)  // Step 1
eventRequestsAPI.acceptInitialRequest(id)    // Admin accepts
eventRequestsAPI.submitDetailedRequest(id, data) // Step 2
eventRequestsAPI.finalAcceptRequest(id)      // Admin final approval
eventRequestsAPI.rejectRequest(id, reason)   // Admin rejects
eventRequestsAPI.getByStage(stage)           // Filter by stage
eventRequestsAPI.getByEmail(email)           // Public lookup
```

## Backwards Compatibility

✅ **100% Backwards Compatible**
- Existing requests continue working
- Old code doesn't need changes
- New features are additive
- Database migration is non-destructive
- RLS policies don't break existing functionality

## Rollback Plan

If you need to rollback:

1. **Frontend**: Just don't use the new components
2. **Backend**: New columns are nullable, don't affect existing queries
3. **Database**: Can drop new columns if needed:
```sql
ALTER TABLE event_requests 
DROP COLUMN IF EXISTS request_stage,
DROP COLUMN IF EXISTS event_name,
DROP COLUMN IF EXISTS requested_days,
... etc
```

But this shouldn't be necessary - the new fields don't interfere with old functionality.

## Support

Both workflows are now available:
- **Old** = Fast, all-at-once, requires login
- **New** = Gradual, step-by-step, no login required

Choose based on your users' needs!

