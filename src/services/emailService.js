/**
 * Email Service
 * 
 * This service handles sending notification emails to admins.
 * Currently supports EmailJS for quick setup without backend.
 * 
 * To activate email sending:
 * 1. Sign up at https://www.emailjs.com/
 * 2. Get your Service ID, Template ID, and Public Key
 * 3. Add them to .env.local file (see EMAIL_SETUP_GUIDE.md)
 * 4. Uncomment the EmailJS implementation below
 * 5. Run: npm install @emailjs/browser
 */

// Uncomment these lines after installing @emailjs/browser
// import emailjs from '@emailjs/browser';

/**
 * Initialize EmailJS (call this once when app starts)
 */
export const initializeEmailService = () => {
  // Uncomment after adding environment variables
  /*
  const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
  
  if (!publicKey) {
    console.warn('EmailJS public key not found. Email notifications will not be sent.');
    return false;
  }
  
  emailjs.init(publicKey);
  console.log('✅ EmailJS initialized');
  return true;
  */
  
  console.warn('⚠️ Email service not configured. Please see EMAIL_SETUP_GUIDE.md');
  return false;
}

/**
 * Send email using EmailJS
 * @param {Array<string>} recipients - Array of email addresses
 * @param {string} subject - Email subject
 * @param {string} messageText - Plain text message
 * @param {string} messageHTML - HTML formatted message
 * @returns {Promise<boolean>} Success status
 */
export const sendEmail = async (recipients, subject, messageText, messageHTML = null) => {
  // Check if EmailJS is configured
  const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
  const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
  
  if (!serviceId || !templateId) {
    console.warn('⚠️ EmailJS not configured. Email not sent.');
    console.log('Recipients:', recipients);
    console.log('Subject:', subject);
    console.log('Message:', messageText);
    return false;
  }
  
  try {
    // Uncomment this section after installing @emailjs/browser and configuring
    /*
    // EmailJS template parameters
    const templateParams = {
      to_email: recipients.join(', '), // EmailJS will send to all recipients
      subject: subject,
      message_text: messageText,
      message_html: messageHTML || messageText.replace(/\n/g, '<br>')
    };
    
    // Send email
    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams
    );
    
    if (response.status === 200) {
      console.log('✅ Email sent successfully to:', recipients);
      return true;
    } else {
      console.error('❌ Email sending failed:', response);
      return false;
    }
    */
    
    // Temporary: Show alert until email service is configured
    alert(`📧 EMAIL WÜRDE GESENDET WERDEN\n\n` +
          `An: ${recipients.join(', ')}\n` +
          `Betreff: ${subject}\n\n` +
          `${messageText}\n\n` +
          `⚠️ Um echte E-Mails zu versenden, folgen Sie der Anleitung in EMAIL_SETUP_GUIDE.md`);
    
    return false;
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

/**
 * Alternative: Send email using custom backend API
 * Uncomment and modify this if you have your own email API
 */
export const sendEmailViaAPI = async (recipients, subject, messageText, messageHTML = null) => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: recipients,
        subject: subject,
        text: messageText,
        html: messageHTML
      })
    });
    
    if (response.ok) {
      console.log('✅ Email sent successfully via API');
      return true;
    } else {
      console.error('❌ API email sending failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending email via API:', error);
    return false;
  }
}

/**
 * Test email functionality
 * Use this to verify your email setup is working
 */
export const sendTestEmail = async (testEmail) => {
  const subject = 'Test-E-Mail vom Event-Management-System';
  const message = `Guten Tag,\n\n` +
                  `dies ist eine Test-E-Mail.\n\n` +
                  `Wenn Sie diese E-Mail erhalten, funktioniert Ihr E-Mail-System korrekt.\n\n` +
                  `Mit freundlichen Grüßen\n` +
                  `Ihr Event-Management-System`;
  
  return await sendEmail([testEmail], subject, message);
}

