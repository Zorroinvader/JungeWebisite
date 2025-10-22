# 🔧 Fix: Block Dates Immediately on Initial Request

## ❌ Current Problem:

Dates are only blocked **after admin accepts** the initial request, not immediately when user submits.

## ✅ Solution:

Update the database view to include **ALL pending requests** (including initial stage).

---

## 📋 Steps to Fix:

### Step 1: Run SQL Update

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/wthsritnjosieqxpprsl/editor
   ```

2. **Click "SQL Editor"**

3. **Paste this SQL:**
   ```sql
   CREATE OR REPLACE VIEW public.temporarily_blocked_dates AS
   SELECT 
       id,
       event_name,
       title,
       requested_days,
       exact_start_datetime,
       exact_end_datetime,
       start_date,
       end_date,
       is_private,
       request_stage,
       initial_accepted_at,
       requester_name,
       requester_email,
       created_at
   FROM public.event_requests
   WHERE request_stage IN ('initial', 'initial_accepted', 'details_submitted')
     AND status NOT IN ('rejected', 'cancelled')
   ORDER BY created_at ASC;
   ```

4. **Click "Run"**

5. **You should see:** `Success. No rows returned`

---

## ✅ What This Changes:

### Before:
```
User submits request (stage: 'initial')
→ Dates NOT blocked ❌
→ Admin accepts
→ Dates blocked ✓
```

### After:
```
User submits request (stage: 'initial')
→ Dates IMMEDIATELY blocked ✓
→ Shows as "vorläufig reserviert"
→ Admin accepts
→ Dates stay blocked ✓
```

---

## 🎯 New Behavior:

**Stage 1 (initial):**
- ✅ Dates show as temporarily blocked in calendar
- ✅ Marked as "vorläufig reserviert"

**Stage 2 (initial_accepted):**
- ✅ Dates remain blocked
- ✅ User fills detailed form

**Stage 3 (details_submitted):**
- ✅ Dates remain blocked
- ✅ Admin reviews and approves

**Final (approved):**
- ✅ Event added to calendar
- ✅ No longer "temporarily blocked" - now a real event!

**Rejected/Cancelled:**
- ✅ Dates unblocked immediately

---

## 🧪 Test It:

1. **Run the SQL above**
2. **Refresh your website**
3. **Submit a test event request**
4. **Immediately check the calendar**
5. **See the dates marked as blocked!** ✓

---

## 📧 Email is Already Correct:

The email already says:
```
✓ Zeitraum vorläufig für Sie reserviert
```

After running this SQL, this will be **100% accurate** - the dates ARE reserved immediately!

---

## ⚡ Quick Copy-Paste:

**The SQL is also saved in:** `database/fix-temporary-blocking.sql`

Just run it in Supabase SQL Editor and you're done!


