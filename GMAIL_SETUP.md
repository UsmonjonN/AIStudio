# Gmail SMTP Setup Guide

This guide will help you configure Gmail SMTP for sending emails from your AI Studio app.

## Prerequisites

- A Gmail account
- 2-Step Verification enabled on your Google Account

## Step-by-Step Setup

### 1. Enable 2-Step Verification

Before you can create an App Password, you must enable 2-Step Verification:

1. Go to your [Google Account](https://myaccount.google.com/)
2. Click on **Security** in the left sidebar
3. Under "How you sign in to Google", click on **2-Step Verification**
4. Follow the prompts to enable it (you'll need your phone)

### 2. Create an App Password

App Passwords are special passwords that allow apps to access your Gmail account without using your main password.

1. Visit [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Or go to Google Account → Security → 2-Step Verification → App passwords
2. You may need to sign in again
3. Under "Select app", choose **Mail** or **Other (Custom name)**
4. If you chose "Other", enter a name like "AI Studio App"
5. Click **Generate**
6. Google will display a 16-character password (like: `abcd efgh ijkl mnop`)
7. **Copy this password immediately** - you won't be able to see it again!

### 3. Configure Your Environment File

1. Create a `.env.local` file in your project root (if it doesn't exist)
2. Copy the contents from `.env.example`
3. Update the SMTP settings with your information:

```env
# Your Gmail address
SMTP_USER="your-email@gmail.com"

# The 16-character App Password (paste it without spaces)
SMTP_PASSWORD="abcdefghijklmnop"

# These should work as-is for Gmail
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"

# Customize the sender name
SMTP_FROM_NAME="Your App Name"

# Optional: Different admin email for notifications
ADMIN_EMAIL="admin@example.com"
```

### 4. Test Your Configuration

Start your server and test the email configuration:

```bash
npm run dev
```

Then visit: http://localhost:3000/api/email/test

You should see:
```json
{
  "success": true,
  "message": "✅ Email configuration is correct"
}
```

### 5. Using the Email API

#### Send Welcome Email

```bash
curl -X POST http://localhost:3000/api/email/send-welcome \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "ideaSummary": "A mobile app for tracking fitness goals with AI coaching"
  }'
```

#### Send Admin Notification

```bash
curl -X POST http://localhost:3000/api/email/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "ideaSummary": "A mobile app for tracking fitness goals",
    "conversationData": {
      "exchanges": 5,
      "timestamp": "2026-03-28T10:30:00Z"
    }
  }'
```

## Troubleshooting

### "Invalid login" or "Authentication failed"

**Causes:**
- App Password is incorrect
- App Password has spaces (remove all spaces)
- 2-Step Verification is not enabled
- Using your regular Gmail password instead of App Password

**Solution:**
1. Verify 2-Step Verification is enabled
2. Create a new App Password
3. Copy the password without any spaces
4. Update your `.env.local` file

### "Connection timeout" error

**Causes:**
- Firewall blocking port 587
- Incorrect SMTP host or port

**Solution:**
1. Verify `SMTP_HOST="smtp.gmail.com"` and `SMTP_PORT="587"`
2. Try port 465 with `secure: true` (requires code change in emailService.ts)
3. Check your firewall settings

### Emails not being received

**Causes:**
- Email went to spam folder
- Gmail is blocking the email
- Recipient email is invalid

**Solution:**
1. Check spam/junk folder
2. Verify the recipient email address
3. Check your Gmail "Sent" folder to confirm it was sent
4. Add your sending email to the recipient's contacts

### "Less secure app access" error (Old Gmail accounts)

**Solution:**
- This setting is deprecated. Use App Passwords instead.
- If you see this, ensure you're using an App Password, not your regular password

## Security Best Practices

1. **Never commit your .env.local file** - it's already in .gitignore
2. **Keep your App Password secret** - treat it like a password
3. **Revoke unused App Passwords** - go to Google Account Security settings
4. **Use different App Passwords** for different apps (easier to track and revoke)
5. **Monitor your Google Account activity** regularly

## Gmail Sending Limits

Be aware of Gmail's sending limits:

- **Free Gmail accounts**: ~500 emails per day
- **Google Workspace accounts**: ~2,000 emails per day

For higher volume, consider:
- Using a dedicated email service (SendGrid, AWS SES, Mailgun)
- Implementing rate limiting in your app
- Batching notifications

## Alternative: Using OAuth2 (Advanced)

For production applications, consider using OAuth2 instead of App Passwords for better security. This requires:

1. Creating a Google Cloud Project
2. Enabling Gmail API
3. Creating OAuth2 credentials
4. Implementing OAuth2 flow in your app

See [Nodemailer OAuth2 documentation](https://nodemailer.com/smtp/oauth2/) for more details.

## Need Help?

If you're still having issues:

1. Check the server console for detailed error messages
2. Test with a simple email client first to verify your credentials
3. Review [Google's App Password troubleshooting](https://support.google.com/accounts/answer/185833)
4. Check [Gmail SMTP settings](https://support.google.com/mail/answer/7126229)

## Production Deployment

When deploying to production (e.g., AI Studio, Cloud Run):

1. **Never put credentials in code** or commit them
2. Use **environment variables** or **secret management** (AI Studio Secrets panel)
3. Set `NODE_ENV=production` in production
4. Consider using a **dedicated email service** for reliability
5. Implement **retry logic** for failed emails
6. Add **logging and monitoring** for email delivery

---

✅ Once configured, your app will be able to:
- Send welcome emails with idea summaries
- Notify admins of new leads
- Send beautifully formatted HTML emails
- Track email delivery success
