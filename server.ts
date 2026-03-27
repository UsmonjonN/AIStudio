import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

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
