import { 
  sendWelcomeEmail, 
  sendAdminNotification
} from "./src/services/emailService.js";
import dotenv from "dotenv";

// Load .env.local first, then .env
dotenv.config({ path: '.env.local' });
dotenv.config();

async function sendTestEmails() {
  console.log("📧 Sending test emails to shuhratrahmonov023@gmail.com\n");
  console.log("=" .repeat(60));

  // Test 1: Welcome Email
  console.log("\n1️⃣ WELCOME EMAIL");
  console.log("-".repeat(60));
  
  const ideaSummary = `
  A mobile fitness app with AI personal trainer that:
  - Tracks workouts and nutrition automatically
  - Provides real-time form correction using phone camera
  - Creates personalized workout plans based on goals
  - Integrates with wearables (Apple Watch, Fitbit)
  - Social features to compete with friends
  `;

  console.log("📝 Idea Summary:");
  console.log(ideaSummary.trim());
  console.log("\n🚀 Sending welcome email...");
  
  const welcomeResult = await sendWelcomeEmail(
    "shuhratrahmonov023@gmail.com",
    ideaSummary.trim()
  );

  if (welcomeResult) {
    console.log("✅ Welcome email sent successfully!");
    console.log("📬 Check inbox: shuhratrahmonov023@gmail.com");
    console.log("\n📧 EMAIL STRUCTURE:");
    console.log("   Subject: ✨ Your SRP Idea Summary & Next Steps");
    console.log("   From: SRP AI Studio <shuhratrahmonov146@gmail.com>");
    console.log("   To: shuhratrahmonov023@gmail.com");
    console.log("   Format: HTML + Plain Text");
    console.log("\n   Content Includes:");
    console.log("   ✓ Professional header with gradient");
    console.log("   ✓ Personalized idea summary box");
    console.log("   ✓ Next steps (3 action items)");
    console.log("   ✓ CTA button for consultation");
    console.log("   ✓ Company branding footer");
  } else {
    console.log("❌ Failed to send welcome email");
  }

  // Test 2: Admin Notification
  console.log("\n\n" + "=".repeat(60));
  console.log("2️⃣ ADMIN NOTIFICATION EMAIL");
  console.log("-".repeat(60));

  const conversationData = {
    timestamp: new Date().toISOString(),
    userEmail: "shuhratrahmonov023@gmail.com",
    exchanges: 7,
    category: "Mobile App",
    platform: "iOS & Android",
    urgency: "High - needs MVP in 3 months",
    budget_discussed: false,
    qualified: true,
    engagement_score: 8.5
  };

  console.log("📊 Conversation Data:");
  console.log(JSON.stringify(conversationData, null, 2));
  console.log("\n🚀 Sending admin notification...");

  const adminResult = await sendAdminNotification(
    "shuhratrahmonov023@gmail.com",
    ideaSummary.trim(),
    conversationData
  );

  if (adminResult) {
    console.log("✅ Admin notification sent successfully!");
    console.log("📬 Check inbox: shuhratrahmonov146@gmail.com (admin)");
    console.log("\n📧 EMAIL STRUCTURE:");
    console.log("   Subject: 🎯 New Lead: shuhratrahmonov023@gmail.com");
    console.log("   From: SRP AI Studio <shuhratrahmonov146@gmail.com>");
    console.log("   To: shuhratrahmonov146@gmail.com");
    console.log("   Format: HTML + Plain Text");
    console.log("\n   Content Includes:");
    console.log("   ✓ Alert header (dark theme)");
    console.log("   ✓ User email & timestamp");
    console.log("   ✓ Idea summary");
    console.log("   ✓ Full conversation data (JSON)");
    console.log("   ✓ Action reminder (follow up in 24h)");
  } else {
    console.log("❌ Failed to send admin notification");
  }

  console.log("\n" + "=".repeat(60));
  console.log("✨ Test complete! Check both inboxes:");
  console.log("   Customer: shuhratrahmonov023@gmail.com");
  console.log("   Admin: shuhratrahmonov146@gmail.com");
  console.log("=".repeat(60) + "\n");
}

sendTestEmails().catch(console.error);
