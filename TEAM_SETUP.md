# 🚀 Team Setup Guide - Quick Start

## For Team Members to Run This Project:

### 1. Clone & Install (2 minutes)
```bash
git clone <your-repo-url>
cd AIStudio
npm install
```

### 2. Create Your Own `.env.local` (3 minutes)

Copy the example file:
```bash
cp .env.example .env.local
```

Then add these values to `.env.local`:

```env
# Get Gemini API Key from: https://aistudio.google.com/apikey
GEMINI_API_KEY="your-key-here"

# For Email Testing - Use Shuhrat's credentials (temp for hackathon)
SMTP_USER="shuhratrahmonov146@gmail.com"
SMTP_PASSWORD="nhtjrqmmbmiuylbx"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_FROM_NAME="SRP AI Studio"
ADMIN_EMAIL="shuhratrahmonov146@gmail.com"
```

### 3. Run It!
```bash
npm run dev
```

Visit: http://localhost:3000

### 4. Test Email (30 seconds)

Visit: http://localhost:3000/api/email/test

Should see: `✅ Email configuration is correct`

---

## 📧 Email Features Implemented

✅ Gmail SMTP integration  
✅ Welcome email templates  
✅ Admin notifications  
✅ API endpoints ready

### Test Sending Email:
```bash
curl -X POST http://localhost:3000/api/email/send-welcome -H "Content-Type: application/json" -d "{\"email\":\"test@example.com\", \"ideaSummary\":\"Test idea\"}"
```

---

## 🔒 Security Note

`.env.local` is gitignored - each person has their own copy. Don't commit credentials!

For production, we'll use environment variables in deployment.
