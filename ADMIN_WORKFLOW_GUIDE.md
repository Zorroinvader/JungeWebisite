# Admin Workflow Guide - 3-Step Event Request System

## ✅ What You Have Now

### 1. **Admin Panel - "Anfragen" View**

**Location:** Admin Panel → "3-Schritt Anfragen" Tab

**Features:**
- 📋 All event requests shown in one view (grid layout)
- 🎨 **Color-coded by stage:**
  - 🔵 **Blue** = Initial request (Step 1)
  - 🟡 **Yellow** = Waiting for user details (Step 2)
  - 🟣 **Purple** = Details submitted (Step 3)
  - 🟢 **Green** = Final accepted
  - 🔴 **Red** = Rejected

- Click on any request card → Opens detail modal

### 2. **Detail Modal (Click on Request)**

Shows complete information:
- Requester name, email, phone
- Event type (Private/Public)
- Requested timeframe
- Initial notes
- Detailed times (if submitted)
- Key handover times (if submitted)
- Signed contract download button (if uploaded)
- Admin notes
- Timeline of progress

**Action Buttons Based on Stage:**

#### **Stage 1: Initial Request** (Blue)
```
Buttons visible:
- ✅ Erste Anfrage akzeptieren
- ❌ Ablehnen
```

**What happens when you click "✅ Erste Anfrage akzeptieren":**
1. Request moves to "initial_accepted" stage (yellow)
2. Event becomes **temporarily blocked** in public calendar (orange/dashed)
3. User gets notification *(you'll need to implement email notification)*
4. User can now access their request in their profile
5. Admin waits for user to fill details

#### **Stage 2: Waiting for Details** (Yellow)
```
No action needed - waiting for user
Shows: "⏳ Warte darauf, dass der Benutzer die Details ausfüllt..."
```

**User sees in their profile:**
- Big green button: **"Details ausfüllen →"** (animated pulse!)
- Timeline showing current step
- Form to enter:
  - Exact start/end times
  - Key handover/return times
  - Upload signed Mietvertrag PDF
  - Additional notes

#### **Stage 3: Details Submitted** (Purple)
```
Buttons visible:
- 🎉 Endgültig freigeben (nach Zahlung)
- ❌ Ablehnen
```

**What you see:**
- All detailed information
- Download button for signed contract
- Exact times for event and key handover

**What happens when you click "🎉 Endgültig freigeben":**
1. Shows confirmation: "Hat der Benutzer bezahlt?"
2. If confirmed:
   - Creates event in calendar
   - Request moves to "final_accepted" (green)
   - Temporary block is removed
   - Event is now publicly visible
   - User sees success message

#### **Stage 4: Final Accepted** (Green)
```
No actions - completed!
Shows: "✅ Event endgültig freigegeben am [date]"
```

#### **Rejected** (Red)
```
No actions - rejected
Shows: "❌ Anfrage abgelehnt"
+ Rejection reason
```

### 3. **User Profile View**

**Location:** User Profile Page → "Meine Event-Anfragen"

**Features:**
- User sees all their requests
- Color-coded timeline showing progress
- Status messages for each stage

**Interactive Elements:**
- When request is "initial_accepted" → **Big green pulsing button: "Details ausfüllen →"**
- Click button → Opens detailed form modal
- User fills:
  - Exact event times
  - Key handover times
  - Uploads signed PDF
  - Adds notes
- Submit → Admin sees it in purple (details_submitted)

### 4. **Public Calendar Integration**

**Temporary Blocking (Steps 2-3):**
- When admin accepts initial request
- Event shows as **"Vorübergehend blockiert"** for public users
- Orange/yellow color with dashed border
- Admins see event name + "(Vorläufig)"
- After final approval → becomes normal event

## Complete Workflow Example

### User Perspective:
```
1. Click on calendar date (no login!) → Initial request form opens
2. Fill basic info (name, email, dates, type)
3. Submit → "⏳ Waiting for admin..."

   [Admin accepts]

4. Get notification → Go to profile
5. See big green button "Details ausfüllen →"
6. Click → Form opens
7. Fill detailed times + upload PDF
8. Submit → "📄 Details eingereicht"

   [Admin checks payment & accepts]

9. "🎉 Event freigegeben!" → Done!
```

### Admin Perspective:
```
1. See blue card in "Anfragen" tab
2. Click card → See initial request details
3. Click "✅ Erste Anfrage akzeptieren"
4. Yellow card appears → waiting for user

   [User fills details]

5. Purple card appears → new details available!
6. Click card → See all details + download contract
7. Verify payment
8. Click "🎉 Endgültig freigeben (nach Zahlung)"
9. Confirm → Event created in calendar
10. Green card → completed!
```

## Key Features

### ✅ Color Coding
- Instant visual status at a glance
- All requests visible together
- Easy to spot which need action

### ✅ Payment Verification
- Admin confirms payment before final approval
- Confirmation dialog: "Hat der Benutzer bezahlt?"
- Prevents accidental approval

### ✅ Timeline Tracking
- Users see exactly where they are
- 4-phase visual timeline
- Timestamps for each step

### ✅ Temporary Blocking
- Prevents double-booking during approval
- Visible to all calendar users
- Automatically removed after final approval

### ✅ Profile Integration
- Users access their requests easily
- Big, obvious action buttons when needed
- No email needed to track progress (login works)

## Tips for Admins

1. **Check requests daily** - Look for blue and purple cards (need action)
2. **Yellow cards** - No rush, waiting for user
3. **Download contracts** - Always review before final approval
4. **Verify payment** - Don't click final approval until paid!
5. **Add notes** - Optional but helpful for communication

## Files Modified

**New Components:**
- `ThreeStepRequestManagement.js` - Admin view with color-coded cards
- `MyEventRequests.js` - User profile integration
- `DetailedEventForm.js` - Step 2 form for users
- `RequestTimeline.js` - Visual progress tracker
- `PublicEventRequestForm.js` - Initial request form

**Updated:**
- `NewEventCalendar.js` - Opens initial form on click
- `ProfilePage.js` - Integrated MyEventRequests component
- `AdminPanelClean.js` - Added "Anfragen" tab
- `HomePage.js` - New buttons

## Database

**Key Fields:**
- `request_stage` - Tracks workflow phase
- `requested_days` - Date range (JSON)
- `exact_start_datetime` - Precise start time
- `key_handover_datetime` - Key pickup time
- `signed_contract_url` - PDF location
- `initial_accepted_at` - Stage 1 timestamp
- `details_submitted_at` - Stage 2 timestamp
- `final_accepted_at` - Stage 3 timestamp

---

**You're all set!** 🎉

The complete 3-step workflow is now live and integrated into your admin panel and user profiles!

