import { 
  sendWelcomeEmail, 
  sendAdminNotification, 
  testEmailConfiguration 
} from "./src/services/emailService.js";
import dotenv from "dotenv";

// Load .env.local first, then .env
dotenv.config({ path: '.env.local' });
dotenv.config();

async function testEmailSystem() {
  console.log("🧪 Testing Email System...\n");

  // Test 1: Configuration
  console.log("1️⃣ Testing SMTP configuration...");
  const configTest = await testEmailConfiguration();
  console.log(configTest ? "✅ SMTP configuration valid\n" : "❌ SMTP configuration failed\n");

  if (!configTest) {
    console.log("⚠️ Please check your .env.local file:");
    console.log("   - SMTP_USER=" + process.env.SMTP_USER);
    console.log("   - SMTP_PASSWORD=" + (process.env.SMTP_PASSWORD ? "***configured***" : "NOT SET"));
    return;
  }

  // Test 2: Send welcome email
  console.log("2️⃣ Sending test welcome email...");
  const testEmail = process.env.SMTP_USER || "test@example.com";
  const welcomeResult = await sendWelcomeEmail(
    testEmail,
    "This is a test email from the hackathon app. We're building an AI-powered idea-to-MVP engine that helps businesses transform concepts into working prototypes quickly."
  );
  console.log(welcomeResult 
    ? `✅ Welcome email sent to ${testEmail}\n` 
    : "❌ Failed to send welcome email\n"
  );

  // Test 3: Send admin notification
  console.log("3️⃣ Sending test admin notification...");
  const adminResult = await sendAdminNotification(
    testEmail,
    "Test hackathon project - AI Idea-to-MVP Engine",
    {
      timestamp: new Date().toISOString(),
      userType: "test",
      exchanges: 5,
      sentiment: "positive"
    }
  );
  console.log(adminResult 
    ? `✅ Admin notification sent\n` 
    : "❌ Failed to send admin notification\n"
  );

  console.log("✨ Email system test complete!");
  console.log(`📧 Check inbox: ${testEmail}`);
}

testEmailSystem().catch(console.error);
