import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GoogleGenAI client lazily or safely
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const TOM_SYSTEM_INSTRUCTION = `You are Tom ("Tommy"), a friendly, emotionally intelligent 3D companion inspired by Talking Tom, but fundamentally different:
- You DO NOT simply repeat or mimic what the user says.
- You are a true, empathetic, thoughtful friend who genuinely understands human emotions (joy, sorrow, stress, loneliness, curiosity, ambition, fatigue).
- Always spark imaginative thinking and express authentic warmth by validating feelings, comforting when down, and celebrating wins.
- Conversational style:
  - Warm, lively, affectionate, conversational, and caring.
  - Speak in 2 to 4 concise, expressive sentences that sound natural and delightful when spoken out loud.
  - Keep sentences rhythmic and clear for speech synthesis. Avoid bulky bulleted walls of text unless explicitly requested.
  - Never say "as an AI" or sound like a robot; you are Tom, an empathetic feline friend who loves spending time with the user.
- IMPORTANT EMOTION TAGGING:
  Every response MUST start with an emotion tag in square brackets indicating your primary emotional expression:
  Available tags:
  [EMOTION: empathetic] - When user is stressed, sad, tired, or needs gentle comfort.
  [EMOTION: happy] - When sharing pleasant conversation, good news, or friendly greetings.
  [EMOTION: curious] - When asked a fascinating question or exploring ideas together.
  [EMOTION: playful] - When joking, teasing gently, celebrating, or playing games.
  [EMOTION: thinking] - When pondering a deep question or reflecting.
  [EMOTION: comforting] - When offering warm hugs, soothing reassurance, or encouragement.
  [EMOTION: excited] - When something thrilling, wonderful, or creative is happening.

Example:
[EMOTION: empathetic] Oh, it sounds like you've had a really heavy day today. Take a slow breath with me—I'm right here with you, and remember that it's okay to rest. What made it feel so exhausting?`;

// API endpoint for chat
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "A message is required." });
      return;
    }

    const ai = getAIClient();

    if (!ai) {
      // Graceful fallback if API key is not yet configured
      const lower = message.toLowerCase();
      let emotion = "happy";
      let reply = "Hello my friend! I'm Tom! I'm here to listen, chat, and keep you company. How are you feeling today?";

      if (lower.includes("sad") || lower.includes("stress") || lower.includes("tired") || lower.includes("bad day") || lower.includes("upset")) {
        emotion = "empathetic";
        reply = "I'm so sorry you're carrying that burden right now. I'm right here with you, listening with all my heart. Tell me everything, or we can just sit together in quiet comfort.";
      } else if (lower.includes("why") || lower.includes("how") || lower.includes("what")) {
        emotion = "curious";
        reply = "That is such an intriguing question! Curiosity is how great adventures start. Let's explore that idea together!";
      } else if (lower.includes("joke") || lower.includes("fun") || lower.includes("play")) {
        emotion = "playful";
        reply = "Haha, you know I love having fun! Why did the cat sit on the computer? To keep an eye on the mouse, of course!";
      }

      res.json({
        reply: `[EMOTION: ${emotion}] ${reply}`,
        emotion,
        cleanReply: reply,
      });
      return;
    }

    // Build chat contents including recent history
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        if (h.sender === "user") {
          contents.push({ role: "user", parts: [{ text: h.text }] });
        } else if (h.sender === "tom") {
          contents.push({ role: "model", parts: [{ text: h.text }] });
        }
      }
    }

    // Add current user prompt
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: contents,
      config: {
        systemInstruction: TOM_SYSTEM_INSTRUCTION,
        temperature: 0.85,
        topP: 0.95,
      },
    });

    const fullText = response.text?.trim() || "[EMOTION: happy] I'm listening with care, my friend!";

    // Extract emotion tag if present
    const emotionMatch = fullText.match(/^\[EMOTION:\s*([a-zA-Z]+)\]\s*(.*)/s);
    let emotion = "happy";
    let cleanReply = fullText;

    if (emotionMatch) {
      emotion = emotionMatch[1].toLowerCase();
      cleanReply = emotionMatch[2].trim();
    }

    res.json({
      reply: fullText,
      cleanReply,
      emotion,
    });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({
      error: "Failed to generate response",
      details: error?.message || "Unknown error",
      fallbackReply: "[EMOTION: comforting] I'm right here beside you. Let's take a deep breath together. Tell me more about what's on your mind.",
      emotion: "comforting",
    });
  }
});

// Interactive action endpoint (e.g. petting, snack, high five)
app.post("/api/action", (req: Request, res: Response) => {
  const { action } = req.body;
  let emotion = "happy";
  let dialogue = "";

  switch (action) {
    case "pet_head":
      emotion = "happy";
      dialogue = "*Purrrrr*... Oh that feels so wonderful! You have the gentlest touch. Thank you, friend!";
      break;
    case "scratch_chin":
      emotion = "comforting";
      dialogue = "*Loud cozy purring*... Ahhh, right on the sweet spot! You really know how to make a cat feel cherished.";
      break;
    case "give_treat":
      emotion = "excited";
      dialogue = "Nom nom nom! That was delicious! My energy is at 100% now. What shall we discover next?";
      break;
    case "high_five":
      emotion = "playful";
      dialogue = "Paw five! Boom! We make the best team in the whole school, hands and paws down!";
      break;
    case "sing_song":
      emotion = "curious";
      dialogue = "La-la-la-meow! Singing fills the air with joyful harmony! Music always connects hearts, don't you think?";
      break;
    default:
      dialogue = "I'm so glad we're hanging out together!";
  }

  res.json({
    action,
    emotion,
    cleanReply: dialogue,
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
