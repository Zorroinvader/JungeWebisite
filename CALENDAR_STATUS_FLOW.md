# 📅 Calendar Status Flow - Complete Guide

## 🎯 How It Works After the Fix

---

## 📊 **Complete Status Flow:**

### **Stage 1: User Submits Initial Request**
```
request_stage: 'initial'
status: 'pending'
```

**Calendar Shows:**
- ⏸️ **Temporarily Blocked** (gray/orange overlay)
- 📝 Tooltip: "Vorläufig reserviert - In Bearbeitung"

**Why:** Request is in `temporarily_blocked_dates` view

---

### **Stage 2: Admin Accepts Initial Request**
```
request_stage: 'initial_accepted'
status: 'pending'
```

**Calendar Shows:**
- ⏸️ **Still Temporarily Blocked** (gray/orange overlay)
- 📝 Tooltip: "Vorläufig reserviert - Wartet auf Details"

**Why:** Still in `temporarily_blocked_dates` view

---

### **Stage 3: User Submits Detailed Info**
```
request_stage: 'details_submitted'
status: 'pending'
```

**Calendar Shows:**
- ⏸️ **Still Temporarily Blocked** (gray/orange overlay)
- 📝 Tooltip: "Vorläufig reserviert - Wartet auf finale Genehmigung"

**Why:** Still in `temporarily_blocked_dates` view

---

### **Stage 4: Admin Gives Final Approval** ✅
```
request_stage: 'final_accepted'
status: 'approved'
+ Event created in events table
```

**Calendar Shows:**
- ✅ **REAL EVENT** (full color, normal event)
- 📝 Shows event title, times, type
- 🎉 No longer "temporarily blocked"

**Why:** 
- ❌ NO LONGER in `temporarily_blocked_dates` view (stage is 'final_accepted')
- ✅ NOW in `events` table as a real event

---

## 🔧 **Database Views:**

### **temporarily_blocked_dates View:**
```sql
WHERE request_stage IN ('initial', 'initial_accepted', 'details_submitted')
  AND status NOT IN ('rejected', 'cancelled')
```

**Includes:**
- ✅ initial
- ✅ initial_accepted
- ✅ details_submitted

**Excludes:**
- ❌ final_accepted (moves to events table)
- ❌ rejected
- ❌ cancelled

---

## 🎨 **Visual Difference in Calendar:**

### **Temporarily Blocked (Stages 1-3):**
```
┌─────────────────────┐
│ ⏸️ [Gray/Orange]     │
│                     │
│ Vorläufig reserviert│
│ (Event Name)        │
│                     │
└─────────────────────┘
```

### **Final Approved (Stage 4):**
```
┌─────────────────────┐
│ 🎉 [Full Color]     │
│                     │
│ Sommerparty 2025    │
│ 18:00 - 23:00       │
│ Privates Event      │
└─────────────────────┘
```

---

## ✅ **What Happens in the Code:**

### **When finalAcceptRequest is called:**

1. **Updates event_requests table:**
   ```javascript
   request_stage: 'final_accepted'
   status: 'approved'
   final_accepted_at: [timestamp]
   ```

2. **Creates event in events table:**
   ```javascript
   title: "Sommerparty 2025"
   start_date: "2025-07-15T18:00:00"
   end_date: "2025-07-17T23:00:00"
   event_type: "Privates Event"
   // ... all other details
   ```

3. **Result in calendar:**
   - Request disappears from temporarily_blocked_dates (because stage is now 'final_accepted')
   - Event appears in events table
   - Calendar shows it as a real event!

---

## 🧪 **Test the Flow:**

### **Step 1: Submit Initial Request**
```
→ Refresh calendar
→ Should see: "Vorläufig reserviert" (blocked)
```

### **Step 2: Admin Accepts Initial**
```
→ Refresh calendar
→ Should see: Still "Vorläufig reserviert" (blocked)
```

### **Step 3: User Submits Details**
```
→ Refresh calendar
→ Should see: Still "Vorläufig reserviert" (blocked)
```

### **Step 4: Admin Gives Final Approval**
```
→ Refresh calendar
→ Should see: REAL EVENT with full details! ✅
→ No longer shows as "temporarily blocked"
```

---

## ⚠️ **Important: Run the SQL Fix First!**

Before testing, make sure you've run:

**File:** `database/fix-temporary-blocking.sql`

**In Supabase SQL Editor:**
```sql
CREATE OR REPLACE VIEW public.temporarily_blocked_dates AS
SELECT ...
WHERE request_stage IN ('initial', 'initial_accepted', 'details_submitted')
  AND status NOT IN ('rejected', 'cancelled')
...
```

This ensures:
1. ✅ Dates blocked immediately on initial request
2. ✅ Dates stay blocked through stages 2-3
3. ✅ Dates unblocked and show as real event on final approval

---

## 🎯 **Summary:**

| Stage | request_stage | In View? | Calendar Shows |
|-------|---------------|----------|----------------|
| Initial Submit | `initial` | ✅ Yes | Temporarily Blocked |
| Admin Accept | `initial_accepted` | ✅ Yes | Temporarily Blocked |
| Details Submit | `details_submitted` | ✅ Yes | Temporarily Blocked |
| **Final Approve** | `final_accepted` | ❌ **No** | **Real Event** ✅ |
| Rejected | `rejected` | ❌ No | Nothing (unblocked) |
| Cancelled | `cancelled` | ❌ No | Nothing (unblocked) |

---

## ✅ **Everything is Already Coded Correctly!**

The code is working as designed:
- ✅ finalAcceptRequest creates event
- ✅ Sets stage to 'final_accepted'
- ✅ View excludes 'final_accepted'
- ✅ Calendar shows real event

**Just run the SQL fix and it will work perfectly!** 🚀


