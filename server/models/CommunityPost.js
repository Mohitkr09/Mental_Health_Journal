import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const communityPostSchema = new mongoose.Schema(
  {
    // 🔗 Reference to User
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

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

    likes: {
      support: { type: Number, default: 0 },
      relate: { type: Number, default: 0 },
    },

    // 🕶️ Optional anonymity
    isAnonymous: {
      type: Boolean,
      default: false,
    },

    anonymous_id: {
      type: String,
      default: () => uuidv4(),
      immutable: true,
    },
  },
  {
    timestamps: true,
  }
);

const CommunityPost = mongoose.model(
  "CommunityPost",
  communityPostSchema
);

export default CommunityPost;
