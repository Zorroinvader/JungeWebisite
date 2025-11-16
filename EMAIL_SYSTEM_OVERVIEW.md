# Email System Overview

## 📧 Resend API Configuration

### Backend Configuration
**Location:** `supabase/functions/send-admin-notification/index.ts`

**Environment Variables Required:**
- `RESEND_API_KEY` - Your Resend API key (set in Supabase Edge Function secrets)
- `RESEND_FROM_EMAIL` - Default: `jungegesellschaft@wedelheine.de` (production email)
- `RESEND_FROM_NAME` - Default: `Jungengesellschaft`

**How it works:**
1. Frontend calls Supabase Edge Function: `/functions/v1/send-admin-notification`
2. Edge Function authenticates with Resend API using `RESEND_API_KEY`
3. Resend sends the email via `https://api.resend.com/emails`

---

## 🔄 Email Flow Architecture

```
Frontend (React)
    ↓
settingsHelper.js (sendUserNotification / sendAdminNotification)
    ↓
Supabase Edge Function (send-admin-notification)
    ↓
Resend API
    ↓
Email Delivered
```

---

## 📍 Where Resend API is Used

### 1. **Supabase Edge Function** (Backend)
**File:** `supabase/functions/send-admin-notification/index.ts`
- **Line 60:** Makes POST request to `https://api.resend.com/emails`
- **Line 27:** Gets `RESEND_API_KEY` from environment
- **Line 46-47:** Gets sender email/name from environment

### 2. **Frontend Email Functions**
**File:** `src/utils/settingsHelper.js`
- **`sendUserNotification()`** (Line 105) - Sends emails to event requesters
- **`sendAdminNotification()`** (Line 221) - Sends emails to admins
- Both functions call the Supabase Edge Function at Line 194 and Line 320

---

## 🎯 Email Triggers & Events

### **User Emails** (to event requester)

#### 1. **Initial Request Received**
**Trigger:** User submits initial event request form
**Location:** 
- `src/components/Calendar/PublicEventRequestForm.js` (Line 202)
- `src/services/httpApi.js` (Line 494)
**Type:** `'initial_request_received'`
**Subject:** "Ihre Event-Anfrage wurde empfangen"
**When:** Immediately after form submission

#### 2. **Initial Request Accepted**
**Trigger:** Admin accepts initial request (Step 1 → Step 2)
**Location:**
- `src/services/httpApi.js` (Line 565) - via `acceptInitialRequest()`
- `src/components/Admin/ThreeStepRequestManagement.js` (Line 186) - duplicate call
**Type:** `'initial_request_accepted'`
**Subject:** "Ihre Event-Anfrage wurde akzeptiert - Weitere Informationen erforderlich"
**When:** Admin clicks "Accept" on initial request

#### 3. **Final Approval**
**Trigger:** Admin finalizes and approves event (Step 3)
**Location:**
- `src/services/httpApi.js` (Line 667) - via `finalAcceptRequest()`
- `src/components/Admin/ThreeStepRequestManagement.js` (Line 244) - duplicate call
**Type:** `'final_approval'`
**Subject:** "Ihre Event-Buchung wurde final genehmigt!"
**When:** Admin clicks "Final Accept" after user submits detailed info

---

### **Admin Emails** (to configured admin addresses)

#### 1. **New Initial Request**
**Trigger:** User submits initial event request
**Location:**
- `src/components/Calendar/PublicEventRequestForm.js` (Line 198)
- `src/services/httpApi.js` (Line 496)
**Type:** `'initial_request'`
**Subject:** "Neue Event-Anfrage - Aktion erforderlich (Schritt 1/3)"
**When:** Immediately after form submission
**Recipients:** From `getAdminNotificationEmails()` (default: `zorro.invader@gmail.com`)

#### 2. **Detailed Info Submitted**
**Trigger:** User submits detailed information (Step 2)
**Location:**
- `src/components/Calendar/DetailedEventForm.js` (Line 176)
**Type:** `'detailed_info_submitted'`
**Subject:** "Detaillierte Event-Informationen eingereicht (Schritt 2/3)"
**When:** User submits detailed form with contract, times, etc.

#### 3. **Final Acceptance**
**Trigger:** Admin finalizes event approval
**Location:**
- `src/services/httpApi.js` (Line 669) - via `finalAcceptRequest()`
**Type:** `'final_acceptance'`
**Subject:** "Event genehmigt und aktiviert (Schritt 3/3)"
**When:** Event is created in calendar and activated

---

## 🔧 Key Functions

### `sendUserNotification(userEmail, eventData, type)`
**File:** `src/utils/settingsHelper.js` (Line 105)
- Sends email to the event requester
- Types: `'initial_request_received'`, `'initial_request_accepted'`, `'final_approval'`
- Calls Edge Function with recipient = `[userEmail]`

### `sendAdminNotification(eventData, type)`
**File:** `src/utils/settingsHelper.js` (Line 221)
- Sends email to all configured admin emails
- Types: `'initial_request'`, `'detailed_info_submitted'`, `'final_acceptance'`
- Gets admin emails from `getAdminNotificationEmails()` (Line 42)
- Default admin email: `zorro.invader@gmail.com` (Line 48)

### `areNotificationsEnabled()`
**File:** `src/utils/settingsHelper.js` (Line 58)
- Checks if email notifications are enabled in admin settings
- Returns `true` by default
- Can be disabled via `localStorage.adminSettings.notificationsEnabled`

---

## 📋 Email Configuration

### Admin Email Settings
**Location:** `localStorage.adminSettings`
**Key:** `adminEmails` (array of email addresses)
**Default:** `['zorro.invader@gmail.com']` (Line 48 in settingsHelper.js)

### Notification Toggle
**Key:** `notificationsEnabled` (boolean)
**Default:** `true`
**Location:** `localStorage.adminSettings.notificationsEnabled`

---

## 🔍 Important Notes

1. **All emails go through the same Edge Function** (`send-admin-notification`)
2. **Resend API key must be set in Supabase** as environment variable
3. **Emails are sent asynchronously** - failures don't block the main flow
4. **Duplicate email calls exist** in some places (e.g., `ThreeStepRequestManagement.js` calls emails even though `httpApi.js` already does)
5. **Email templates** are generated in `settingsHelper.js`:
   - `generateUserEmailHTML()` (Line 362) - for user emails
   - `generateEmailHTML()` (Line 490) - for admin emails

---

## 🐛 Potential Issues

1. **Duplicate email sending** in `ThreeStepRequestManagement.js` - emails are sent both in the component AND in `httpApi.js`
2. **No error handling UI** - email failures are silently caught
3. **Hardcoded default email** - `zorro.invader@gmail.com` is hardcoded as fallback

---

## 📝 Files Involved

1. **Backend:**
   - `supabase/functions/send-admin-notification/index.ts` - Resend API integration

2. **Frontend Core:**
   - `src/utils/settingsHelper.js` - Email functions and templates
   - `src/services/httpApi.js` - API calls that trigger emails
   - `src/services/emailService.js` - Alternative email service (may be unused)

3. **Components:**
   - `src/components/Calendar/PublicEventRequestForm.js` - Initial request form
   - `src/components/Calendar/DetailedEventForm.js` - Detailed info form
   - `src/components/Admin/ThreeStepRequestManagement.js` - Admin approval UI

