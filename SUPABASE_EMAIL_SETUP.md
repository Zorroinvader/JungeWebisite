# Supabase Email Notification Setup

Your admin email notifications are now ready to use Supabase Edge Functions!

## 🎯 What's Implemented

✅ Supabase Edge Function for sending emails
✅ Professional HTML email templates
✅ Automatic fallback if email fails
✅ Integration with your existing notification system

---

## 📋 Setup Steps

### Step 1: Get a Free Email Service API Key

I recommend **Resend** (easiest and free):

1. Go to https://resend.com/
2. Sign up for free account
3. Verify your email
4. Go to **API Keys** section
5. Click **Create API Key**
6. Copy the API key (starts with `re_...`)

**Free Tier:** 100 emails/day, 3,000/month

---

### Step 2: Deploy the Supabase Edge Function

Open your terminal and run:

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Set the Resend API key as a secret
npx supabase secrets set RESEND_API_KEY=re_your_api_key_here

# Deploy the edge function
npx supabase functions deploy send-admin-notification
```

---

### Step 3: Configure Your Domain in Resend (Optional but Recommended)

To send emails from your own domain:

1. Go to **Domains** in Resend
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records shown
5. Wait for verification (usually a few minutes)

Then update the edge function `from` address to use your domain:
```typescript
from: 'Event Management <noreply@yourdomain.com>'
```

If you don't have a domain, you can use Resend's default:
```typescript
from: 'Event Management <onboarding@resend.dev>'
```

---

### Step 4: Enable the Edge Function in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions**
3. Find `send-admin-notification`
4. Make sure it's **deployed** and **enabled**

---

### Step 5: Test the Email System

1. Go to your admin panel
2. Navigate to **Settings**
3. Add an admin email (your email)
4. Click **Save Settings**
5. Create a test event request
6. Check your email inbox!

---

## 🔧 Troubleshooting

### "Supabase credentials not found"

Make sure your `.env` file has:
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### "Email service returned an error"

1. Check if the edge function is deployed:
   ```bash
   npx supabase functions list
   ```

2. Check the edge function logs:
   ```bash
   npx supabase functions logs send-admin-notification
   ```

3. Verify your Resend API key is set:
   ```bash
   npx supabase secrets list
   ```

### Emails not arriving

1. Check spam folder
2. Verify email address in admin settings
3. Check Resend dashboard for delivery logs
4. Make sure you haven't exceeded free tier limits

---

## 💰 Cost & Limits

### Resend (Recommended)
- **Free:** 100 emails/day, 3,000/month
- **Pro:** $20/month for 50,000 emails

### Alternative: SendGrid
- **Free:** 100 emails/day
- Requires more setup

### Alternative: AWS SES
- **Free:** 62,000 emails/month (if using EC2)
- More complex setup

---

## 📧 Email Content

Your emails will look like this:

**Subject:** `Neue Event-Anfrage - Aktion erforderlich (Schritt 1/3)`

**Body:** Professional HTML email with:
- Clean header with color coding
- Structured event details
- Call-to-action button
- Professional footer

---

## 🚀 Alternative: Use Supabase Auth SMTP (If Already Configured)

If you've already configured custom SMTP in Supabase Auth:

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Check if custom SMTP is configured
3. If yes, we can modify the edge function to use that instead

Let me know if you want to use this option!

---

## ✅ Verification

After setup, you should see:

1. **In Console:** 
   ```
   [NOTIFICATION] Sending to: admin@example.com
   ✅ Email sent successfully!
   ```

2. **In Email Inbox:**
   - Professional email with your event details
   - Clean HTML formatting
   - Working "Zum Admin-Panel" button

---

## 🎉 You're Done!

Your admin notifications are now fully functional and will send real emails!

**Next Steps:**
- Add more admin emails in settings
- Test with a real event request
- Monitor email delivery in Resend dashboard

---

## 📞 Need Help?

If you run into issues:
1. Check the edge function logs
2. Verify API key is correct
3. Check Resend dashboard for errors
4. Look at browser console for errors


