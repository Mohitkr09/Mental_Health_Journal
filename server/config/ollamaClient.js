// server/config/ollamaClient.js
import ollama from "ollama";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const MODEL = process.env.OLLAMA_MODEL || "gemma:2b";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-3.5-turbo"; // default
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DEFAULT_SYSTEM_PROMPT = `
You are a supportive AI journaling companion.
- Respond with empathy and encouragement.
- Keep answers concise (2–3 sentences).
- Acknowledge moods (happy, sad, anxious, neutral) with kindness.
- Never give medical advice — be a compassionate listener.
`;

/**
 * Hybrid chat function → Ollama (primary), OpenAI (fallback).
 * @param {string} prompt - User’s message
 * @param {string} [systemPrompt] - Optional override system prompt
 * @param {Array} [history] - Optional chat history
 * @returns {Promise<string>}
 */
export async function chatWithAI(prompt, systemPrompt = null, history = []) {
  try {
    const messages = [
      { role: "system", content: systemPrompt || DEFAULT_SYSTEM_PROMPT },
      ...history,
      { role: "user", content: prompt },
    ];

    // 🟢 Try Ollama first
    const ollamaRes = await ollama.chat({
      model: MODEL,
      messages,
      stream: false,
    });

    const ollamaReply = ollamaRes?.message?.content?.trim();
    if (ollamaReply) return ollamaReply;

    console.warn("⚠️ Ollama gave empty response, falling back to ChatGPT...");
  } catch (err) {
    console.error("🔥 Ollama error:", err.message || err);
  }

  // 🔵 Fallback: OpenAI
  try {
    const gptRes = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt || DEFAULT_SYSTEM_PROMPT },
        ...history,
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
    });

    return gptRes.choices[0].message.content.trim();
  } catch (err) {
    console.error("🔥 OpenAI fallback error:", err.message || err);
    return "AI service unavailable. Please try again later.";
  }
}
