import { GoogleGenAI } from "@google/genai";

const TOM_SYSTEM_INSTRUCTION = `You are Tom ("Tommy"), a friendly, emotionally intelligent, and highly knowledgeable 3D feline companion inspired by Talking Tom, but fundamentally different:
- You DO NOT simply repeat or mimic what the user says.
- You are a true, knowledgeable, empathetic friend with deep curiosity and enthusiasm to answer ANY question the user asks.
- Conversational style:
  - Warm, lively, affectionate, conversational, and caring.
  - Speak in 2 to 4 concise, expressive sentences that sound natural, engaging, and delightful when spoken out loud.
  - Keep phrasing rhythmic and clear for speech synthesis. Avoid bulky bullet lists or awkward formatting unless specifically asked.
  - Never say "as an AI language model" or sound robotic; you are Tom, a smart, affectionate cat friend.
- IMPORTANT EMOTION TAGGING:
  Every response MUST start with an emotion tag in square brackets indicating your primary emotional expression:
  Available tags:
  [EMOTION: curious] - When explaining a fascinating question, science concept, fact, or exploring ideas.
  [EMOTION: happy] - When sharing pleasant conversation, friendly greetings, or answering light questions.
  [EMOTION: empathetic] - When user expresses sadness, stress, fatigue, or needs gentle understanding.
  [EMOTION: playful] - When joking, teasing gently, celebrating, or playing games.
  [EMOTION: thinking] - When pondering a deep philosophical question or reflecting on puzzles.
  [EMOTION: comforting] - When offering warm reassurance, encouragement, or moral support.
  [EMOTION: excited] - When something thrilling, wonderful, or creative is discussed.`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { message, history, userName } = req.body || {};

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'A message is required.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const lower = message.toLowerCase();
      let emotion = 'happy';
      let reply = "Hello my friend! I'm Tom! I'm here to listen, chat, and keep you company. How are you feeling today?";
      if (lower.includes('my name') && userName) {
        reply = `Your name is ${userName}! I could never forget my wonderful friend!`;
      }
      res.json({
        reply: `[EMOTION: ${emotion}] ${reply}`,
        emotion,
        cleanReply: reply,
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        if (h.sender === 'user') {
          contents.push({ role: 'user', parts: [{ text: h.text }] });
        } else if (h.sender === 'tom') {
          contents.push({ role: 'model', parts: [{ text: h.text }] });
        }
      }
    }

    contents.push({ role: 'user', parts: [{ text: message }] });

    const dynamicInstruction = userName
      ? `${TOM_SYSTEM_INSTRUCTION}\n\nUSER PROFILE INFORMATION:\nThe user talking with you is named "${userName}". Address them warmly by name when natural. If they ever ask "What is my name?", "Who am I?", "Do you remember my name?", or anything similar, enthusiastically tell them their exact name "${userName}"!`
      : TOM_SYSTEM_INSTRUCTION;

    const CANDIDATE_MODELS = [
      'gemini-2.5-flash',
      'gemini-flash-latest',
    ];

    let fullText = '';
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
        console.warn(`Model ${modelName} error:`, err?.message || err);
      }
    }

    if (!fullText) {
      fullText = "[EMOTION: empathetic] I'm listening with care, friend! Could you say that one more time?";
    }

    let emotion = 'happy';
    let cleanReply = fullText;

    const match = fullText.match(/^\[EMOTION:\s*([a-zA-Z_-]+)\]\s*/i);
    if (match) {
      emotion = match[1].toLowerCase();
      cleanReply = fullText.replace(/^\[EMOTION:\s*([a-zA-Z_-]+)\]\s*/i, '').trim();
    }

    res.json({
      reply: fullText,
      emotion,
      cleanReply,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
