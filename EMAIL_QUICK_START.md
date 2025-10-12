# 📧 Email Notifications - Quick Start

## You're Right! Supabase Already Has Email

Since you're using Supabase Auth (which already sends emails), we can use the **same email infrastructure** for admin notifications!

---

## ⚡ Quick Setup (5 Minutes)

### 1️⃣ Get Free Resend API Key

```
Go to: https://resend.com/
Sign up (free)
Get API key (looks like: re_abc123...)
```

**Free Tier:** 100 emails per day ✅

---

### 2️⃣ Deploy the Email Function

**On Windows (PowerShell):**
```powershell
# Set your Resend API key
npx supabase secrets set RESEND_API_KEY=re_your_key_here

# Deploy the function
npx supabase functions deploy send-admin-notification
```

**Or use the script:**
```bash
.\deploy-email-function.bat re_your_key_here
```

---

### 3️⃣ Test It

1. Open your admin panel
2. Go to **Settings**
3. Add your email address
4. Save settings
5. Create a test event request
6. **Check your inbox!** 📬

---

## ✅ What You Get

- **Stage 1:** Email when user submits initial request
- **Stage 2:** Email when user submits detailed info + contract
- **Stage 3:** Email when event is approved

All emails are:
- ✨ Professional HTML format
- 📱 Mobile responsive
- 🎨 Color-coded by stage
- 🔘 Include action button to admin panel

---

## 🔍 Verify It's Working

**Console should show:**
```
[NOTIFICATION] Sending to: your@email.com
✅ Email sent successfully!
```

**Your inbox should receive:**
```
From: Event Management
Subject: Neue Event-Anfrage - Aktion erforderlich
```

---

## 🚨 Troubleshooting

**"Supabase credentials not found"**
→ Check your `.env` file has `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`

**"Email service returned an error"**
→ Check edge function is deployed: `npx supabase functions list`

**Emails not arriving**
→ Check spam folder
→ Verify email address is correct in settings
→ Check Resend dashboard for logs

---

## 📖 Full Documentation

See `SUPABASE_EMAIL_SETUP.md` for:
- Detailed setup instructions
- Alternative email providers
- Custom domain configuration
- Advanced troubleshooting

---

## 💡 Pro Tips

1. **Test with your own email first** before adding others
2. **Check spam folder** on first email
3. **Monitor Resend dashboard** to see delivery status
4. **Set up custom domain** for better deliverability (optional)

---

## 🎉 That's It!

Your admin email notifications are now **fully functional**!

Every time someone:
- Submits an event request → Email sent ✅
- Fills detailed form → Email sent ✅
- Event gets approved → Email sent ✅

**No more missed requests!** 🚀

