# 🧪 Test Email Function Now

## ✅ Updated Function Deployed!

The edge function now has detailed error logging to help us debug.

---

## 📋 Next Steps:

### Step 1: Try Sending an Email Again

1. Go to your website
2. Fill out the event request form
3. Submit it
4. **Watch what happens!**

---

### Step 2: Check the Detailed Logs

Go to this URL to see the detailed logs:
https://supabase.com/dashboard/project/wthsritnjosieqxpprsl/functions/send-admin-notification/logs

You'll see exactly what's happening:
- ✅ Is the API key being found?
- ✅ What data is being sent?
- ✅ What is Resend API responding?
- ❌ What exact error is occurring?

---

### Step 3: Common Issues & Fixes

#### Issue 1: "RESEND_API_KEY not configured"
**Fix:**
```bash
npx supabase secrets set RESEND_API_KEY=re_your_key_here
```

#### Issue 2: "Resend API error (403)"
**Cause:** Invalid API key
**Fix:** 
1. Go to https://resend.com/api-keys
2. Create a NEW API key
3. Run: `npx supabase secrets set RESEND_API_KEY=re_new_key`

#### Issue 3: "Resend API error (401)"
**Cause:** API key not activated or expired
**Fix:** Check your Resend dashboard - you might need to verify your email

#### Issue 4: Email address not verified
**Cause:** Resend requires verification before sending
**Fix:** 
1. Go to https://resend.com/
2. Check if your email is verified
3. If not, verify it

---

### Step 4: Quick Resend Account Check

Make sure:
- [ ] Your Resend account is active
- [ ] Your email is verified
- [ ] Your API key status shows "Active"
- [ ] You haven't exceeded free tier (100 emails/day)

---

## 🎯 What Should Happen:

### In Browser Console:
```
[NOTIFICATION] Sending to: your@email.com
✅ Email sent successfully!
```

### In Supabase Logs:
```
✅ API Key found, length: 72
📧 Request received:
  - To: ["your@email.com"]
  - Subject: Neue Event-Anfrage...
📤 Sending to Resend API...
✅ Email sent successfully! ID: abc123...
```

### In Your Email Inbox:
```
From: Event Management <onboarding@resend.dev>
Subject: Neue Event-Anfrage - Aktion erforderlich (Schritt 1/3)
```

---

## 🆘 Still Not Working?

**Show me the logs from:**
https://supabase.com/dashboard/project/wthsritnjosieqxpprsl/functions/send-admin-notification/logs

Copy the error message and I'll help you fix it!

---

## 💡 Quick Test (Without Form)

Want to test the function directly? Go to:
https://supabase.com/dashboard/project/wthsritnjosieqxpprsl/functions/send-admin-notification

Click "Invoke" and paste:
```json
{
  "adminEmails": ["your@email.com"],
  "subject": "Test Email",
  "message": "This is a test",
  "htmlContent": "<h1>Test</h1><p>This is a test</p>"
}
```

This will test the function without using your app!

