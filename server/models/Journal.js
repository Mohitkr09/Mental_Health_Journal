import mongoose from "mongoose";

const journalSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    mood: { type: String, required: true },
    aiResponse: { type: String },
  },
  { timestamps: true } // ✅ adds createdAt & updatedAt automatically
);

export default mongoose.model("Journal", journalSchema);
