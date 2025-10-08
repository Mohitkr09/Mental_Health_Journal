// models/CommunityPost.js
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const communityPostSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    mood: {
      type: String,
      enum: ["happy", "sad", "neutral", "anxious", "angry", "tired"],
      default: "neutral",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    likes: {
      support: { type: Number, default: 0 }, // 💬 “Support”
      relate: { type: Number, default: 0 },   // ❤️ “Relate”
    },
    anonymous_id: {
      type: String,
      default: () => uuidv4(), // Unique random ID, cannot be traced back
      immutable: true,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

const CommunityPost = mongoose.model("CommunityPost", communityPostSchema);

export default CommunityPost;
