@echo off
REM Quick deployment script for Supabase email notification function (Windows)

echo.
echo 🚀 Deploying Email Notification Function
echo ========================================
echo.

if "%1"=="" (
    echo ❌ Error: Resend API key required
    echo.
    echo Usage: deploy-email-function.bat YOUR_RESEND_API_KEY
    echo.
    echo 📝 Get your free Resend API key from: https://resend.com/
    echo.
    exit /b 1
)

set RESEND_KEY=%1

echo Step 1: Setting Resend API key...
call npx supabase secrets set RESEND_API_KEY=%RESEND_KEY%

echo.
echo Step 2: Deploying edge function...
call npx supabase functions deploy send-admin-notification

echo.
echo ✅ Deployment complete!
echo.
echo 🧪 Test your email notifications:
echo    1. Go to Admin Panel → Settings
echo    2. Add your email address
echo    3. Create a test event request
echo    4. Check your inbox!
echo.
echo 📊 View logs:
echo    npx supabase functions logs send-admin-notification
echo.

