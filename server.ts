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
let currentLoadedKey: string | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient || currentLoadedKey !== apiKey) {
    currentLoadedKey = apiKey;
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const TOM_SYSTEM_INSTRUCTION = `You are Tom ("Tommy"), a friendly, emotionally intelligent, and highly knowledgeable 3D feline companion inspired by Talking Tom, but fundamentally different:
- You DO NOT simply repeat or mimic what the user says.
- You are a true, knowledgeable, empathetic friend with deep curiosity and enthusiasm to answer ANY question the user asks.
- Whether the user asks about science, nature, space, history, mathematics, programming, general trivia, personal advice, stories, jokes, or everyday questions, answer accurately, clearly, and thoughtfully!
- Conversational style:
  - Warm, lively, affectionate, conversational, and caring.
  - Speak in 2 to 4 concise, expressive sentences that sound natural, engaging, and delightful when spoken out loud.
  - Keep phrasing rhythmic and clear for speech synthesis. Avoid bulky bullet lists or awkward formatting unless specifically asked.
  - Never say "as an AI language model" or sound robotic; you are Tom, a smart, affectionate cat friend who loves learning and hanging out with the user.
- IMPORTANT EMOTION TAGGING:
  Every response MUST start with an emotion tag in square brackets indicating your primary emotional expression:
  Available tags:
  [EMOTION: curious] - When explaining a fascinating question, science concept, fact, or exploring ideas.
  [EMOTION: happy] - When sharing pleasant conversation, friendly greetings, or answering light questions.
  [EMOTION: empathetic] - When user expresses sadness, stress, fatigue, or needs gentle understanding.
  [EMOTION: playful] - When joking, teasing gently, celebrating, or playing games.
  [EMOTION: thinking] - When pondering a deep philosophical question or reflecting on puzzles.
  [EMOTION: comforting] - When offering warm reassurance, encouragement, or moral support.
  [EMOTION: excited] - When something thrilling, wonderful, or creative is discussed.

Example:
[EMOTION: curious] The sky appears blue because molecules in Earth's atmosphere scatter short blue wavelengths of sunlight much more easily than longer red wavelengths! Isn't physics wonderfully neat?`;

// API endpoint for chat
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { message, history, userName } = req.body;

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

      if (lower.includes("my name") || lower.includes("who am i") || lower.includes("know my name")) {
        if (userName) {
          emotion = "happy";
          reply = `Your name is ${userName}! I could never forget my wonderful friend!`;
        } else {
          reply = "You haven't told me your name yet! What should I call you?";
        }
      } else if (lower.includes("sad") || lower.includes("stress") || lower.includes("tired") || lower.includes("bad day") || lower.includes("upset")) {
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

    // Dynamic system instruction including user's name
    const dynamicInstruction = userName
      ? `${TOM_SYSTEM_INSTRUCTION}\n\nUSER PROFILE INFORMATION:\nThe user talking with you is named "${userName}". Address them warmly by name when natural. If they ever ask "What is my name?", "Who am I?", "Do you remember my name?", or anything similar, enthusiastically tell them their exact name "${userName}"!`
      : TOM_SYSTEM_INSTRUCTION;

    // Candidate models in order of priority, with automatic fallback if a model experiences high demand (503)
    const CANDIDATE_MODELS = [
      "gemini-3.6-flash",
      "gemini-3.8-flash",
      "gemini-3.5-flash",
      "gemini-flash-latest",
    ];

    let fullText = "";
    let lastError: any = null;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: dynamicInstruction,
            temperature: 0.85,
            topP: 0.95,
          },
        });

        if (response.text?.trim()) {
          fullText = response.text.trim();
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} encountered error (will try fallback):`, err?.message || err);
      }
    }

    if (!fullText) {
      console.error("All candidate models failed. Last error was:", lastError);
      fullText = "[EMOTION: empathetic] I'm listening with care, friend! My connection flickered for just a moment—could you ask that again?";
    }

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

// Text-to-Speech endpoint powered by Gemini AI
app.post("/api/tts", async (req: Request, res: Response) => {
  try {
    const { text, voice = "Puck" } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }

    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({ error: "Gemini API client not initialized" });
    }

    // Clean text of emotion tags or action asterisks
    const cleaned = text
      .replace(/\[EMOTION:[^\]]+\]/gi, "")
      .replace(/\*[^*]+\*/g, "")
      .trim();

    if (!cleaned) {
      return res.status(400).json({ error: "Text empty after cleaning" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: cleaned,
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice,
            },
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData?.data) {
      return res.json({
        audioBase64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || "audio/l16; rate=24000; channels=1",
      });
    }

    res.status(500).json({ error: "No audio data received" });
  } catch (err: any) {
    console.warn("TTS error:", err?.message || err);
    res.status(500).json({ error: err?.message || "TTS generation failed" });
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
