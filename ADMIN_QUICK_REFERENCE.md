# Admin Quick Reference - Event Request Workflow

## 🎨 Color-Coded Cards (At a Glance)

```
🔵 BLUE     = Schritt 1: Neue Anfrage (Action needed!)
🟡 YELLOW   = Schritt 2: Warte auf Benutzer
🟣 PURPLE   = Schritt 3: Details prüfen (Action needed!)
🟢 GREEN    = Abgeschlossen
🔴 RED      = Abgelehnt
```

## 🔵 STAGE 1: Initial Request (Blue Card)

**Card shows:**
- Event name
- Requester name
- Requested dates
- Event type (Private/Public)

**Click card → Modal opens:**

**Action buttons:**
```
✅ Erste Anfrage akzeptieren  |  ❌ Ablehnen
```

### If you click ✅ Accept:
1. Event becomes **temporarily blocked** in calendar (🟠 orange/dashed)
2. Card turns 🟡 YELLOW
3. User gets notification
4. User can now fill details in their profile

### If you click ❌ Reject:
1. Confirmation: "Sind Sie sicher?"
2. Requires rejection reason in notes
3. Card turns 🔴 RED
4. User gets notification with reason
5. Event request is cancelled

---

## 🟡 STAGE 2: Waiting for User (Yellow Card)

**Card shows:**
- Same info as before
- "Warte auf Details" status

**Click card → Modal opens:**

**Action buttons:**
```
⏳ Warte auf Benutzer...  |  ❌ Ablehnen
```

### What happens here:
- User is filling out detailed form in their profile
- You just wait (no action needed yet)

### If you click ❌ Reject (still possible!):
- **Use case:** User not responding, changed mind, etc.
- Requires rejection reason
- Confirmation: "Sind Sie sicher?"
- Removes temporary block from calendar
- Notifies user

---

## 🟣 STAGE 3: Details Submitted (Purple Card)

**Card shows:**
- All previous info
- ✅ Exact event times
- ✅ Key handover/return times
- ✅ Signed contract (download button!)
- Additional notes

**Click card → Modal opens:**

**You can see:**
- Download signed Mietvertrag PDF
- All detailed times
- All notes from user

**Action buttons:**
```
🎉 Endgültig freigeben (nach Zahlung)  |  ❌ Ablehnen
```

### If you click 🎉 Final Approve:
1. **Confirmation: "Hat der Benutzer bezahlt?"**
2. Creates real event in calendar
3. Removes temporary block
4. Card turns 🟢 GREEN
5. Event is now publicly visible!

### If you click ❌ Reject:
- **Use case:** Missing payment, wrong info, etc.
- Confirmation: "Sind Sie sicher?"
- Requires rejection reason
- User gets notification
- Temporary block removed

---

## ✅ You Can ALWAYS Reject!

### At every stage:

**Stage 1 (Blue):**
- ❌ Reject → "Dates not available", "Not suitable", etc.

**Stage 2 (Yellow):**  
- ❌ Reject → "User not responding", "Changed plans", etc.

**Stage 3 (Purple):**
- ❌ Reject → "Payment missing", "Wrong contract", "Cancelled", etc.

### Safety Features:
1. ✅ Requires rejection reason (notes field)
2. ✅ Confirmation dialog: "Sind Sie sicher?"
3. ✅ Shows event name and requester before confirming
4. ✅ Cannot accidentally reject without reason

---

## 📅 Calendar Integration

### After Initial Accept (Stage 2-3):
```
Public Calendar:  🟠 "Vorübergehend blockiert" (Orange, dashed)
Admin Calendar:   🟠 "{Event Name} (Vorläufig)"
```

### After Final Accept (Completed):
```
Public Calendar:  ✅ Full event visible with name
Admin Calendar:   ✅ Full event with all details
```

### After Reject (Any Stage):
```
Calendar:  ⭕ Nothing shown (temporary block removed)
```

---

## 🎯 Quick Actions Guide

### When you see a BLUE card:
1. Click to review
2. Check if dates are available
3. Accept → Temporary block added
4. OR Reject → Add reason

### When you see a YELLOW card:
- Just wait for user
- OR Reject if user not responding

### When you see a PURPLE card:
1. Click to review
2. **Download contract** (important!)
3. Check all times are correct
4. **Verify payment received** ⚠️
5. Final approve → Event goes live!
6. OR Reject if issues

---

## 💡 Best Practices

1. **Always download the contract** before final approval
2. **Always verify payment** before clicking final approve
3. **Always give a reason** when rejecting
4. **Check temporarily blocked dates** in calendar don't overlap
5. **Be patient with yellow cards** - users need time to fill forms

---

## ⚠️ Important Notes

- **Payment verification is YOUR responsibility** - system doesn't track payment
- **Rejection can happen at any time** - use it if something goes wrong
- **Temporary blocks prevent double-booking** - only remove by accepting or rejecting
- **Final approval is final** - event goes live immediately

---

## 🔴 Rejection = Complete Cancellation

When you reject:
- ❌ Request is cancelled
- ❌ User cannot continue
- ❌ Temporary block removed
- ❌ User gets notification with your reason
- ✅ User can submit a new request if they want

Use rejection carefully but don't hesitate if needed!

---

**You're in control at every step!** 🎯

