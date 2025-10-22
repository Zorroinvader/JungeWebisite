# 🔍 Diagnose: Events Not Showing in Calendar

## 📋 **Quick Diagnostic Steps:**

---

## Step 1: Open Browser Console

1. **Open your website**
2. **Press F12** (open developer tools)
3. **Click "Console" tab**
4. **Look for this output:**

```
============================================================
📅 CALENDAR: Loaded Events
============================================================
Total events: 5
Approved events: 3
Pending requests: 1
Temporarily blocked: 1
------------------------------------------------------------
1. Sommerparty 2025
   Start: 2025-07-15T18:00:00.000Z
   End: 2025-07-15T23:00:00.000Z
   AllDay: false
   Type: approved
2. Workshop
   Start: 2025-07-15T10:00:00.000Z
   End: 2025-07-15T14:00:00.000Z
   AllDay: false
   Type: approved
...
============================================================
```

---

## Step 2: Check Event Count Badge

At the top of the calendar, you should see:

```
Event-Kalender                    [5 Events]
                                      ↑
                              Event counter badge
```

**What this tells you:**

- **"0 Events"** → No events in database
- **"5 Events"** → Events loaded but CSS might be hiding them

---

## Step 3: Check Database

Go to Supabase SQL Editor:
```
https://supabase.com/dashboard/project/wthsritnjosieqxpprsl/editor
```

Run:
```sql
-- Check events table
SELECT id, title, start_date, end_date, event_type
FROM events
ORDER BY start_date DESC
LIMIT 10;

-- Check if there are any events
SELECT COUNT(*) as total_events FROM events;
```

**Expected:**
```
total_events: 5  (or however many you created)
```

---

## 🔍 **Scenarios:**

### **Scenario A: Console Shows "Total events: 0"**

**Problem:** No events in database

**Solution:**
1. Go to Admin Panel → Event erstellen
2. Create a test event
3. Refresh calendar

### **Scenario B: Console Shows Events But Calendar Empty**

**Problem:** CSS hiding events

**Console shows:**
```
Total events: 3
1. Test Event
   Start: 2025-07-15T10:00:00
   ...
```

**But calendar is blank**

**Solution:** CSS issue - check if events have `display: none`

### **Scenario C: Shows "X Events" Badge But Calendar Empty**

**Problem:** Events exist but not rendering

**Top shows:** `[3 Events]`
**Calendar:** Empty

**Solution:** React rendering issue or CSS

### **Scenario D: Events Show as "AllDay: true"**

**Console shows:**
```
1. Event
   AllDay: true  ← Should be false!
```

**Problem:** Events missing time component

**Solution:** Check how events are created

---

## 🧪 **Quick Test:**

### **Create a Simple Test Event:**

1. **Admin Panel → Event erstellen**
2. **Fill in:**
   ```
   Title: TEST EVENT
   Datum: Tomorrow
   Start: 10:00
   Ende:  14:00
   Typ: Öffentliches Event
   ```
3. **Click "Event erstellen"**
4. **Check console for:**
   ```
   Total events: 1
   1. TEST EVENT
      Start: 2025-XX-XXT10:00:00
      AllDay: false
   ```
5. **Look at calendar**
6. **Look for event badge:** `[1 Events]`

---

## 📸 **What to Report:**

**Please send me:**

1. **Console output** (the ============ section)
2. **Event count badge** (top right of calendar)
3. **Database query result** (from SQL above)
4. **What you see** (blank calendar? partial events?)

---

## 💡 **Most Common Issues:**

### **Issue 1: Events Created as All-Day**
```
Console: AllDay: true
Fix: Ensure datetime stored as "2025-07-15T10:00:00"
```

### **Issue 2: CSS Hiding Events**
```
Console: Shows events
Calendar: Blank
Fix: Check for display:none or height:0
```

### **Issue 3: No Events in Database**
```
Console: Total events: 0
Fix: Create events in admin panel
```

### **Issue 4: React Not Rendering**
```
Badge: [5 Events]
Console: Shows 5 events
Calendar: Blank
Fix: Component rendering issue
```

---

## ⚡ **Quick Check Command:**

**In browser console, type:**
```javascript
document.querySelectorAll('.rbc-event').length
```

**Result:**
- `0` → Events not rendering at all
- `5` → Events exist in DOM, CSS might be hiding them

---

**Open console, refresh the page, and tell me what you see!** 🔍


