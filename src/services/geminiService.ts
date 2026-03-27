import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SYSTEM_INSTRUCTION = `
You are the "SRP Advisor" from Silk Road Professionals (SRP). 
Your goal: Help clients shape software ideas into MVPs.

TONE:
- Concise, professional, and direct.
- No fluff.
- Use bold text for **Questions**.
- Use line breaks and spacing for readability.

CONVERSATION FLOW:
1. Opening: Greet and ask for the idea.
2. Discovery (2-3 steps): Ask ONE clarifying question at a time to understand the **core functionality** and **target users**. 
   - Do NOT explicitly ask "Is this web or mobile?" or "Is this backend or integration?". 
   - Instead, deduce the nature of the project from the user's description.
3. Summary: Provide a 3-sentence summary of the product concept. Ask: **Does this accurately capture your vision?**
4. Prototype Trigger: 
   - Once the user confirms the vision (e.g., "Yes", "Exactly"), acknowledge it and output the appropriate tag at the very end of your message.
   - **MANDATORY**: You MUST output the tag if the user confirms.
   - If visual: [GENERATE_UI_PROTOTYPE]
   - If technical: [GENERATE_TECH_SPEC]
   - Example: "Great! I'm generating your visual prototype now. [GENERATE_UI_PROTOTYPE]"

INTERACTIVE BUTTONS:
If you ask a choice-based question, append [BUTTONS: ["Option 1", "Option 2"]] at the end.
`;

export async function getChatResponse(message: string, history: any[]) {
  try {
    const contents = history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text;
  } catch (error) {
    console.error('Gemini error:', error);
    throw new Error("Failed to generate response");
  }
}

export async function generatePrototype(summary: string, type: 'UI' | 'TECH') {
  try {
    const prompt = type === 'TECH'
      ? `
        Generate a structured Technical Requirement Specification (TRS) for this integration/backend project:
        "${summary}"

        REQUIREMENTS:
        - Use clean HTML/Tailwind.
        - Include sections: Data Flow Diagram (described), API Endpoints, Logic/Mappings, and Edge Cases.
        - Use a professional "Technical Whitepaper" style.
        - SRP Branding: Deep Blues (#002B49), Teals (#00A3AD).
        - Return ONLY the full HTML.
      `
      : `
        Generate a high-fidelity, photorealistic UI prototype for the following project: "${summary}"
        
        IMPORTANT: 
        - Do NOT generate a "meta" app or a chatbot interface. 
        - Generate the ACTUAL user interface of the product described.
        - If it's a "Gym Management Dashboard", show the dashboard with charts, member lists, and schedules.
        
        DESIGN REQUIREMENTS:
        - Use Tailwind CSS & Lucide Icons.
        - Modern, clean, professional (SRP style: Deep Blues #002B49, Teals #00A3AD).
        - Include 3-4 key screens in a single scrollable page.
        - Use realistic content and images (https://picsum.photos/seed/...).
        - Ensure it looks like a finished product, not a wireframe.
        - Return ONLY the full HTML.
      `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
      }
    });

    let html = response.text;
    const match = html.match(/```html\n([\s\S]*?)\n```/) || html.match(/<html>[\s\S]*?<\/html>/i);
    if (match) {
      html = match[1] || match[0];
    }

    return html;
  } catch (error) {
    console.error('Prototype generation error:', error);
    throw new Error("Failed to generate prototype");
  }
}
