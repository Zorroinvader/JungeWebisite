# 🔍 Debug: Calendar Not Showing Multiple Events

## 📋 **Quick Diagnosis Steps:**

---

## Step 1: Check Console Logs

I've added debugging to show when multiple events are on the same day.

1. **Open your website**
2. **Open browser console** (F12)
3. **Check for messages like:**
   ```
   📅 2025-07-15: 2 events
   [{title: "Workshop", time: "10:00", allDay: false}, 
    {title: "Party", time: "18:00", allDay: false}]
   ```

**If you see this:**
- ✅ Events ARE being loaded
- ✅ They have different times
- ❌ Problem is with visual display

**If you DON'T see this:**
- ❌ Events not being created with proper times
- Need to check event creation

---

## Step 2: Check Event Data in Database

1. **Go to Supabase:**
   ```
   https://supabase.com/dashboard/project/wthsritnjosieqxpprsl/editor
   ```

2. **Run this SQL:**
   ```sql
   SELECT id, title, start_date, end_date, event_type
   FROM events
   WHERE start_date::date = '2025-07-15'  -- Change to your test date
   ORDER BY start_date;
   ```

3. **Check the results:**

**Good (with time):**
```
start_date: 2025-07-15T10:00:00
end_date:   2025-07-15T14:00:00
✅ Has time component!
```

**Bad (no time):**
```
start_date: 2025-07-15
end_date:   2025-07-15
❌ Missing time component!
```

---

## Step 3: Test Event Creation

### **Create Test Events:**

1. **Go to Admin Panel → Event erstellen**

2. **Create Event 1:**
   ```
   Title: Test Morning
   Datum: Tomorrow (pick from calendar)
   Start Zeit: 10:00
   Ende Zeit:  14:00
   ```
   → Click **"Event erstellen"**

3. **Create Event 2:**
   ```
   Title: Test Evening
   Datum: Same day as Event 1
   Start Zeit: 18:00
   Ende Zeit:  22:00
   ```
   → Click **"Event erstellen"**

4. **Check Calendar:**
   - Do you see BOTH events?
   - Are they stacked vertically?

---

## Step 4: Check What You See

### **Scenario A: Only One Event Visible**
```
15
10:00 Test Morning
[Test Evening is missing]
```

**Problem:** Events might be overlaying each other

**Solution:** Check CSS - might be `position: absolute` issue

### **Scenario B: "+1 weitere" Shown**
```
15
10:00 Test Morning
+1 weitere
```

**This is CORRECT!** Click "+1 weitere" to see all events

**Solution:** Calendar is working, just showing overflow properly

### **Scenario C: Both Visible but Overlapping**
```
15
10:00 Test Morning Test Evening
[Both on same line, unreadable]
```

**Problem:** CSS layout issue

**Solution:** Needs CSS adjustment

### **Scenario D: Both Visible, Stacked**
```
15
10:00 Test Morning
18:00 Test Evening
```

**✅ PERFECT!** This is what we want!

---

## 🔧 **Common Fixes:**

### **Fix 1: Events Created Without Time**

If events in database show `2025-07-15` instead of `2025-07-15T10:00:00`:

**Check:**
- Event creation form combines date + time correctly
- SQL is storing datetime, not just date

### **Fix 2: Calendar Treating as All-Day**

If `allDay: true` in console:

**Check:**
- Events have `T` in start_date string
- `hasTimeInfo` check is working

### **Fix 3: CSS Hiding Events**

If events exist but not visible:

**Try:**
- Increase `min-height` of `.rbc-month-row`
- Check for `display: none` in CSS
- Verify event styling

---

## 🧪 **Detailed Test:**

### **Create These 3 Events:**

```
Event 1: "Morning"
  Date: 15.07.2025
  Time: 09:00 - 12:00

Event 2: "Afternoon"  
  Date: 15.07.2025
  Time: 14:00 - 17:00

Event 3: "Evening"
  Date: 15.07.2025
  Time: 19:00 - 23:00
```

### **Expected in Calendar:**
```
┌──────────────┐
│ 15           │
├──────────────┤
│09:00 Morning │
│14:00 Afternoon│
│19:00 Evening │
└──────────────┘
```

### **Check Console:**
```
📅 2025-07-15: 3 events 
[
  {title: "Morning", time: "09:00", allDay: false},
  {title: "Afternoon", time: "14:00", allDay: false},
  {title: "Evening", time: "19:00", allDay: false}
]
```

---

## 💡 **What to Report:**

After testing, tell me:

1. **What you see in console** (the 📅 log)
2. **What you see in calendar** (how many events visible)
3. **What the database shows** (SQL query result)

Then I can pinpoint the exact issue and fix it!

---

## 🎯 **Expected Behavior:**

✅ Both events created
✅ Both in database with times
✅ Console shows both events
✅ Calendar displays both (stacked)
✅ Each shows time: "10:00 EventName"


