import ollama from "ollama";
import OpenAI from "openai";
import dotenv from "dotenv";
import Journal from "../models/Journal.js";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Flattened FAQ Data
const faqData = [
  { keyword: "anxious", response: "Take a deep breath. Can you share what triggered your anxiety?" },
  { keyword: "stress", response: "Break your tasks into smaller steps and take a short walk to clear your mind." },
  { keyword: "overwhelmed", response: "It’s okay to take a pause. Focus on one thing at a time." },
  { keyword: "sad", response: "I’m here for you. Do you want to talk about what’s making you feel sad?" },
  { keyword: "angry", response: "Anger is natural. Try counting to ten or a brief walk to calm down." },
  { keyword: "happy", response: "That’s wonderful! What made you feel happy today?" },
  { keyword: "sleep", response: "A consistent bedtime routine helps. Avoid screens 30 minutes before sleep." },
  { keyword: "tired", response: "Make sure to take small breaks and hydrate. How about a short power nap?" },
  { keyword: "lonely", response: "You are not alone. Would you like to talk about your feelings or try a relaxing activity?" },
  { keyword: "motivated", response: "That’s great! Keep the momentum going and set a small goal for today." },
  { keyword: "guilt", response: "It’s okay to make mistakes. What can you learn from this experience?" },
  { keyword: "shame", response: "You are worthy of compassion. What’s one small thing you can do to care for yourself?" },
  { keyword: "panic", response: "Focus on your breathing. Inhale slowly for 4 seconds, hold for 4, exhale for 6." },
  { keyword: "confused", response: "It’s okay to feel uncertain. Write down your thoughts and try to clarify them step by step." },
  { keyword: "frustrated", response: "Take a short break or do something creative to release tension." },
  { keyword: "relationship", response: "Relationships can be tricky. What’s the main concern you’d like to explore?" },
  { keyword: "friendship", response: "Friendships are important. Is there someone you’d like to reconnect with?" },
  { keyword: "family", response: "Family dynamics can be complex. Would you like to share what’s on your mind?" },
  { keyword: "self-care", response: "Self-care matters. What’s one thing you can do for yourself today?" },
  { keyword: "exercise", response: "Movement helps both body and mind. Even a short walk can lift your mood." },
  { keyword: "meditation", response: "Try a 5-minute meditation or focus on your breathing to calm your mind." },
  { keyword: "gratitude", response: "Think of three things you are grateful for today. Even small things count." },
  { keyword: "positive", response: "Focus on one positive thing that happened today, no matter how small." },
  { keyword: "negative", response: "Acknowledge negative thoughts, but try not to dwell. Can you reframe one thought?" },
  { keyword: "focus", response: "Minimize distractions and focus on one task at a time." },
  { keyword: "panic attack", response: "Slow your breathing and remind yourself that this moment will pass." },
  { keyword: "crying", response: "It’s okay to cry. Letting emotions out is healthy." },
  { keyword: "overthinking", response: "Write down your thoughts. Sometimes seeing them on paper helps reduce overthinking." },
  { keyword: "decision", response: "Weigh the pros and cons and remember that no decision is perfect." },
  { keyword: "future", response: "Focus on what you can control today. Small steps build a better tomorrow." },
  { keyword: "past", response: "The past is behind you. What can you do today to move forward?" },
  { keyword: "work", response: "Try to set clear boundaries and take short breaks to stay productive without burnout." },
  { keyword: "career", response: "Reflect on what brings you satisfaction. Can you take one small step toward your goal?" },
  { keyword: "school", response: "Break your tasks into manageable chunks and prioritize what’s important." },
  { keyword: "exam", response: "Stay calm and review key points. Don’t forget to rest before the exam." },
  { keyword: "stressful day", response: "Take a few moments to breathe deeply and decompress." },
  { keyword: "mindfulness", response: "Focus on the present moment. Observe your surroundings without judgment." },
  { keyword: "happiness", response: "Notice small joys today and savor them." },
  { keyword: "energy", response: "Check your sleep, nutrition, and movement. Sometimes small adjustments help energy." },
  { keyword: "relax", response: "Try listening to calm music or deep breathing." },
  { keyword: "conflict", response: "Try to see the other person’s perspective and communicate calmly." },
  { keyword: "perfectionism", response: "Progress over perfection. Small steps are enough." },
  { keyword: "help", response: "It’s okay to ask for help. Who can you reach out to today?" },
  { keyword: "therapy", response: "Talking to a professional can help you process your emotions." },
  { keyword: "counseling", response: "A counselor can help you explore your thoughts and feelings safely." },
  { keyword: "friend", response: "Sharing with a friend can lighten your emotional load." },
  { keyword: "support", response: "Seek support from people who care about you or professional help if needed." },
  { keyword: "self-esteem", response: "Write down three things you like about yourself today." },
  { keyword: "confidence", response: "Focus on small wins. Each success builds confidence." },
  { keyword: "motivation", response: "Set one achievable goal for today and celebrate when you complete it." },
  { keyword: "burnout", response: "Rest, hydrate, and take time to recharge." },
  { keyword: "fatigue", response: "Check your sleep, nutrition, and hydration." },
  { keyword: "worry", response: "Write down your worries and assess what you can control today." },
  { keyword: "negative thoughts", response: "Challenge negative thoughts by asking if they are facts or assumptions." },
  { keyword: "rumination", response: "Shift focus to a small task or an activity you enjoy." },
  { keyword: "self-reflection", response: "Ask yourself: What did I do well today, and what can I improve?" },
  { keyword: "healing", response: "Healing takes time. Be patient and kind to yourself." }
];

export const chatWithAI = async (req, res) => {
  try {
    const { message, mood } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    // ✅ First check FAQ keywords
    const faqMatch = faqData.find(f =>
      message.toLowerCase().includes(f.keyword.toLowerCase())
    );
    if (faqMatch) {
      return res.json({ reply: faqMatch.response });
    }

    // ✅ Fetch recent journals for context
    const journals = await Journal.find().sort({ createdAt: -1 }).limit(5);
    const journalContext = journals.length
      ? journals.map(j => `${j.mood}: ${j.text}`).join("\n")
      : "No journals entered yet.";

    const systemPrompt =
      "You are a friendly mental health companion. Keep responses short (2–3 sentences), empathetic, and supportive.";

    let reply;

    // ✅ Try Ollama first
    try {
      const response = await ollama.chat({
        model: process.env.OLLAMA_MODEL || "tinyllama",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Mood: ${mood || "unknown"}\nMessage: ${message}\nRecent journals:\n${journalContext}`,
          },
        ],
      });
      reply = response?.message?.content?.trim();
    } catch (ollamaErr) {
      console.warn("⚠️ Ollama failed, falling back to OpenAI:", ollamaErr.message);

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Mood: ${mood || "unknown"}\nMessage: ${message}\nRecent journals:\n${journalContext}`,
          },
        ],
      });
      reply = completion.choices[0].message.content.trim();
    }

    res.json({ reply: reply || "I'm here for you, even if I couldn’t process fully." });
  } catch (error) {
    console.error("🔥 Chat error:", error);
    res.status(500).json({ reply: "⚠️ AI unavailable. Try later." });
  }
};
