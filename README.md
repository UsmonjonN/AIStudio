# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/56af7eaa-ac27-44cc-a449-e64116ea3fed

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. **Configure Gmail SMTP** (for email functionality):
   - Follow the detailed instructions in [GMAIL_SETUP.md](GMAIL_SETUP.md)
   - Update `.env.local` with your Gmail credentials
   - Test your configuration at http://localhost:3000/api/email/test
4. Run the app:
   `npm run dev`

## Features

- 🤖 AI-powered conversation with Gemini
- 📧 Email notifications with Gmail SMTP
- 🎨 Beautiful email templates
- 📊 Admin notifications for new leads
- ✅ Email configuration testing

## Email Functionality

This app includes built-in email functionality using Gmail SMTP:

- **Welcome Emails**: Send beautifully formatted emails to users with their idea summary
- **Admin Notifications**: Get notified when new leads come in
- **Configuration Test**: Verify your Gmail setup is working

### API Endpoints

- `GET /api/email/test` - Test email configuration
- `POST /api/email/send-welcome` - Send welcome email to user
- `POST /api/email/send-notification` - Send notification to admin

See [GMAIL_SETUP.md](GMAIL_SETUP.md) for complete setup instructions.
