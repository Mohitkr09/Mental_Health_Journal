import path from "path";
import { spawnSync } from "child_process";

export const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ reply: "Message cannot be empty." });
    }

    console.log("💬 Incoming message:", message);

    // Correct path to Python script
    const pythonPath = path.join(process.cwd(), "python", "chat.py");

    const result = spawnSync("python", [pythonPath, message], {
      encoding: "utf-8",
    });

    const aiReply = result.stdout.trim();
    const stderr = result.stderr?.trim();

    console.log("🐍 Python stdout:", aiReply);
    if (stderr) console.error("🐍 Python stderr:", stderr);

    res.status(200).json({ reply: aiReply || "No response from AI." });
  } catch (err) {
    console.error("🔥 Chat error:", err.message);
    res.status(500).json({ reply: "AI service unavailable." });
  }
};
