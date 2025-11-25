import mongoose from "mongoose";

const journalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, required: true },
    mood: { type: String, required: true },
    aiResponse: { type: String },
  },
  { timestamps: true }
);


export default mongoose.models.Journal ||
  mongoose.model("Journal", journalSchema);
