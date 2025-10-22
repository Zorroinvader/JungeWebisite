#!/bin/bash

# Quick deployment script for Supabase email notification function

echo "🚀 Deploying Email Notification Function"
echo "========================================"
echo ""

# Check if Resend API key is provided
if [ -z "$1" ]; then
    echo "❌ Error: Resend API key required"
    echo ""
    echo "Usage: ./deploy-email-function.sh YOUR_RESEND_API_KEY"
    echo ""
    echo "📝 Get your free Resend API key from: https://resend.com/"
    echo ""
    exit 1
fi

RESEND_KEY=$1

echo "Step 1: Setting Resend API key..."
npx supabase secrets set RESEND_API_KEY=$RESEND_KEY

echo ""
echo "Step 2: Deploying edge function..."
npx supabase functions deploy send-admin-notification

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🧪 Test your email notifications:"
echo "   1. Go to Admin Panel → Settings"
echo "   2. Add your email address"
echo "   3. Create a test event request"
echo "   4. Check your inbox!"
echo ""
echo "📊 View logs:"
echo "   npx supabase functions logs send-admin-notification"
echo ""

