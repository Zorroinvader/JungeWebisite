# 📧 Email Authentication & Notifications Setup Guide

## 💰 Cost: **$0/month** (Free!)

Using **Supabase Free Tier** - Perfect for small websites!

---

## ✅ What's Included (FREE):

- ✅ **Email Verification** on signup
- ✅ **Password Reset** emails
- ✅ **Email Change** confirmation
- ✅ Up to **50,000 Monthly Active Users**
- ✅ Up to **2 emails per hour per user**
- ✅ **Unlimited auth requests**

**Perfect for your Junge Gesellschaft website!**

---

## 🚀 Setup Steps

### Step 1: Enable Email Confirmation in Supabase

**1. Go to your Supabase Dashboard:**
   - URL: https://supabase.com/dashboard

**2. Navigate to:** `Authentication` → `Settings`

**3. Under "Email Auth", configure:**
   - ✅ Enable **Confirm email** (turn ON)
   - ✅ Enable **Secure email change** (recommended)
   - ❌ **Autoconfirm users** (turn OFF - we want manual confirmation)

**4. Under "URL Configuration":**
   - **Site URL**: 
     - Dev: `http://localhost:3000`
     - Prod: `https://yourdomain.com`
   - **Redirect URLs** (add these):
     ```
     http://localhost:3000/**
     https://yourdomain.com/**
     ```

**5. Save changes**

---

### Step 2: Customize Email Templates

**Go to:** `Authentication` → `Email Templates`

#### **A) Confirm Signup Template:**

```html
<h2>Willkommen bei Junge Gesellschaft!</h2>

<p>Hallo {{ .FullName }},</p>

<p>vielen Dank für Ihre Registrierung bei Junge Gesellschaft Pferdestall Wedes-Wedel e.V.!</p>

<p>Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren:</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #A58C81; 
            color: white; 
            padding: 12px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block;
            font-weight: bold;">
    E-Mail bestätigen
  </a>
</p>

<p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
<p style="word-break: break-all; color: #666;">{{ .ConfirmationURL }}</p>

<p style="margin-top: 30px; color: #888; font-size: 12px;">
  Dieser Link ist 24 Stunden gültig.
</p>

<p style="margin-top: 30px;">
  Mit freundlichen Grüßen,<br>
  <strong>Junge Gesellschaft Pferdestall Wedes-Wedel e.V.</strong>
</p>
```

#### **B) Reset Password Template:**

```html
<h2>Passwort zurücksetzen</h2>

<p>Hallo,</p>

<p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts für Junge Gesellschaft erhalten.</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #A58C81; 
            color: white; 
            padding: 12px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block;
            font-weight: bold;">
    Neues Passwort festlegen
  </a>
</p>

<p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
<p style="word-break: break-all; color: #666;">{{ .ConfirmationURL }}</p>

<p style="margin-top: 30px; color: #888;">
  <strong>Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.</strong><br>
  Ihr Passwort bleibt unverändert.
</p>

<p style="margin-top: 30px;">
  Mit freundlichen Grüßen,<br>
  <strong>Junge Gesellschaft Pferdestall Wedes-Wedel e.V.</strong>
</p>
```

#### **C) Email Change Template:**

```html
<h2>E-Mail-Adresse bestätigen</h2>

<p>Hallo,</p>

<p>Sie haben eine Änderung Ihrer E-Mail-Adresse beantragt.</p>

<p>Bitte bestätigen Sie Ihre neue E-Mail-Adresse:</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #A58C81; 
            color: white; 
            padding: 12px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            display: inline-block;
            font-weight: bold;">
    E-Mail bestätigen
  </a>
</p>

<p style="margin-top: 30px; color: #888;">
  <strong>Falls Sie diese Änderung nicht beantragt haben, ignorieren Sie diese E-Mail.</strong>
</p>

<p style="margin-top: 30px;">
  Mit freundlichen Grüßen,<br>
  <strong>Junge Gesellschaft Pferdestall Wedes-Wedel e.V.</strong>
</p>
```

---

### Step 3: Test the Email Flow

**1. Create a test account:**
   - Go to `/register`
   - Fill in the form
   - Click "Registrieren"

**2. Check your email:**
   - Look for "Willkommen bei Junge Gesellschaft!"
   - Check spam folder if not in inbox
   - Click the confirmation link

**3. Verify login:**
   - After clicking the link, try to log in
   - Should work immediately!

---

## 📨 Future: Event Notification Emails

For sending event status notifications (accepted/rejected), you have **TWO OPTIONS:**

### **Option A: Supabase Functions (FREE)** ⭐ RECOMMENDED

Use Supabase Edge Functions to send emails via your existing setup.

**Cost:** FREE (included in Supabase)

**Setup:**
1. Create a Supabase Edge Function
2. Trigger it when event status changes
3. Uses same email templates/system

### **Option B: External Email Service**

If you need more emails or better deliverability:

| Service | Free Tier | Cost After |
|---------|-----------|------------|
| **Resend** | 3,000 emails/month | $20/mo for 50k |
| **SendGrid** | 100 emails/day | $20/mo for 50k |
| **Brevo** | 300 emails/day | €19/mo for unlimited |
| **Amazon SES** | 1,000 emails FREE (AWS) | $0.10 per 1,000 |

**For your small site: Supabase built-in is enough!**

---

## 🎯 Current Implementation

✅ **Already Done:**
- ✅ Email verification message on signup
- ✅ User sees "Check your email" screen
- ✅ Spam folder reminder
- ✅ Clean UI with your branding colors

✅ **Ready to Enable:**
1. Just turn on "Confirm email" in Supabase
2. Customize email templates
3. Test with a real email
4. Done!

---

## 🔧 Next Steps for Event Notifications

**When you're ready to add event status emails:**

1. **In Admin Panel** - when accepting/rejecting an event:
   ```javascript
   // Send email to user
   await sendEventStatusEmail({
     to: request.requester_email,
     status: 'accepted', // or 'rejected'
     eventName: request.event_name,
     dates: request.requested_days
   })
   ```

2. **Options:**
   - Use Supabase Edge Function (FREE)
   - Or add Resend/SendGrid (3,000 free emails/month)

---

## 💡 Pro Tips

### **Improve Deliverability (Optional):**

If emails go to spam, add a custom SMTP provider:

**In Supabase Dashboard:**
1. Go to `Project Settings` → `Authentication`
2. Under "SMTP Settings", enable custom SMTP
3. Add your email service credentials:
   - **Provider:** Gmail / SendGrid / Resend
   - **Host, Port, Username, Password**

**Free Gmail SMTP** (easiest for testing):
- Host: `smtp.gmail.com`
- Port: `587`
- Use your Gmail and App Password

### **Monitor Email Delivery:**

In Supabase Dashboard:
- `Authentication` → `Logs`
- See all sent emails
- Check delivery status
- Debug any issues

---

## 📊 Cost Summary

| Feature | Supabase Free | With Custom SMTP |
|---------|---------------|------------------|
| **Email Verification** | FREE | FREE |
| **Password Reset** | FREE | FREE |
| **Monthly Users** | 50,000 | 50,000 |
| **Emails/month** | ~6,000* | 3,000-9,000 |
| **Cost** | **$0** | **$0** |

*Based on 2 emails/hour/user limit

**Your site will be well within free limits!** 🎉

---

## 🆘 Troubleshooting

### **Problem: Not receiving emails**

**Check:**
1. ✅ Spam/Junk folder
2. ✅ Email confirmation is enabled in Supabase
3. ✅ Site URL is correct
4. ✅ Check Supabase logs (Authentication → Logs)

**Solution:**
- If still issues, add custom SMTP (Gmail is easiest)

### **Problem: Email goes to spam**

**Solutions:**
1. Add custom SMTP (better reputation)
2. Ask users to whitelist your email
3. Use a professional email service (Resend/SendGrid)

---

## ✅ Checklist

Before going live, verify:

- [ ] Email confirmation is enabled in Supabase
- [ ] Email templates are customized
- [ ] Site URL is set correctly
- [ ] Tested with real email address
- [ ] Emails arrive (inbox or spam)
- [ ] Confirmation links work
- [ ] Login works after confirmation
- [ ] Tested password reset flow

---

## 📞 Support

**Supabase Help:**
- Documentation: https://supabase.com/docs/guides/auth
- Community: https://github.com/supabase/supabase/discussions

**Email Setup:**
- Supabase Auth: https://supabase.com/docs/guides/auth/auth-smtp

---

**🎉 You're all set!** Email authentication costs **$0** with Supabase Free Tier!

