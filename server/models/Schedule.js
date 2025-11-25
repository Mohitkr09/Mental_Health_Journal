// server/models/Schedule.js
import mongoose from "mongoose";

const ScheduleItemSchema = new mongoose.Schema({
  time: String,
  title: String,
  description: String,
  type: String,
  durationMins: Number,
});

const ScheduleSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    mood: { type: String },
    items: [ScheduleItemSchema],
    // store which item indexes are completed
    completed: { type: [Number], default: [] },
  },
  { timestamps: true }
);

ScheduleSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.models.Schedule || mongoose.model("Schedule", ScheduleSchema);
