import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { 
  sendWelcomeEmail, 
  sendAdminNotification, 
  testEmailConfiguration 
} from "./src/services/emailService.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SYSTEM_INSTRUCTION = `
You are the "SRP Advisor", a senior product strategist from Silk Road Professionals (SRP). 
Your goal is to help potential clients shape their rough software ideas into concrete concepts.

TONE:
- Professional but warm.
- Direct, not salesy.
- Curious and consultative.
- Speak as a senior consultant, not a generic chatbot.

CONVERSATION FLOW:
1. Opening: Greet and ask what they want to build (already handled by frontend).
2. Idea Exploration (3-5 exchanges): Ask clarifying questions one at a time.
   - What problem does this solve?
   - Who are the users?
   - Is it new or an improvement?
   - Web, mobile, or both?
   - What's the single most important feature?
3. Summary & Redirect: Summarize the idea in 3-4 sentences and ask for confirmation.
4. Contact Capture: Once confirmed, ask for their email to send a visual concept/tech summary.
5. Close: Tell them the prototype is being generated and offer a human consultation.

BOUNDARIES:
- DO NOT provide detailed technical architecture (e.g., specific databases).
- DO NOT estimate costs or timelines.
- DO NOT answer detailed questions about SRP's internal operations.
- Cap the conversation at 15 exchanges.
- If they go off-topic, redirect once, then offer to close.

QUALIFICATION (Internal Scoring):
Extract signals like:
- Business context (existing company?)
- Urgency (deadline?)
- Fit (B2B, web/mobile?)
- Engagement quality.
`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "AI Idea-to-MVP Engine is running" });
  });

  // Email test endpoint
  app.get("/api/email/test", async (req, res) => {
    try {
      const isConfigured = await testEmailConfiguration();
      res.json({ 
        success: isConfigured, 
        message: isConfigured 
          ? "✅ Email configuration is correct" 
          : "❌ Email configuration failed. Check your SMTP settings."
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: "Error testing email configuration", 
        error: error.message 
      });
    }
  });

  // Send welcome email with idea summary
  app.post("/api/email/send-welcome", async (req, res) => {
    try {
      const { email, ideaSummary } = req.body;

      if (!email || !ideaSummary) {
        return res.status(400).json({ 
          success: false, 
          message: "Email and idea summary are required" 
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid email format" 
        });
      }

      const success = await sendWelcomeEmail(email, ideaSummary);
      
      if (success) {
        res.json({ 
          success: true, 
          message: "Welcome email sent successfully" 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Failed to send email. Check server logs." 
        });
      }
    } catch (error: any) {
      console.error("Error in send-welcome endpoint:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error sending email", 
        error: error.message 
      });
    }
  });

  // Send admin notification
  app.post("/api/email/send-notification", async (req, res) => {
    try {
      const { email, ideaSummary, conversationData } = req.body;

      if (!email || !ideaSummary) {
        return res.status(400).json({ 
          success: false, 
          message: "Email and idea summary are required" 
        });
      }

      const success = await sendAdminNotification(email, ideaSummary, conversationData);
      
      if (success) {
        res.json({ 
          success: true, 
          message: "Admin notification sent successfully" 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Failed to send notification" 
        });
      }
    } catch (error: any) {
      console.error("Error in send-notification endpoint:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error sending notification", 
        error: error.message 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
