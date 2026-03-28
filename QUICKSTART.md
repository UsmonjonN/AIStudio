# 🚀 Quick Start: Gmail SMTP Setup

Follow these steps to get email working in under 5 minutes:

## Step 1: Enable 2-Step Verification (2 minutes)

1. Go to https://myaccount.google.com/security
2. Click **2-Step Verification** → Follow the setup
3. You'll need your phone to verify

## Step 2: Create App Password (1 minute)

1. Go to https://myaccount.google.com/apppasswords
2. Select **Mail** or enter custom name "AI Studio"
3. Click **Generate**
4. **Copy the 16-character password** (example: `abcd efgh ijkl mnop`)

## Step 3: Update Your .env.local (1 minute)

Open `.env.local` and update these lines:

```env
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="abcdefghijklmnop"  # Paste without spaces!
```

## Step 4: Test It! (1 minute)

```bash
# Start the server
npm run dev

# In your browser, visit:
# http://localhost:3000/api/email/test
```

You should see: `✅ Email configuration is correct`

---

## ✅ Done! Now you can:

### Send a test welcome email:

```bash
curl -X POST http://localhost:3000/api/email/send-welcome \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com", "ideaSummary":"Test email"}'
```

### Check your inbox!

You should receive a beautifully formatted email.

---

## ❌ Something wrong?

- **"Invalid login"** → Make sure you're using the App Password, not your Gmail password
- **"Authentication failed"** → Remove all spaces from the app password
- **Can't find App Passwords** → Make sure 2-Step Verification is enabled
- **Still stuck?** → See [GMAIL_SETUP.md](GMAIL_SETUP.md) for detailed troubleshooting

---

## 📚 Next Steps

- Read [GMAIL_SETUP.md](GMAIL_SETUP.md) for complete documentation
- Test the admin notification endpoint
- Customize email templates in `src/services/emailService.ts`
- Deploy to production with AI Studio secrets
