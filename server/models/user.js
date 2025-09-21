import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    avatar: { type: String, default: "" },

    // 🌗 Theme preference
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "light",
    },

    // 📝 Personalization
    bio: { type: String, default: "" },
    moodGoal: { type: String, default: "" },
    remindersEnabled: { type: Boolean, default: false },
    reminderTime: { type: String, default: "08:00" }, // HH:mm
    reminderDays: {
      type: [String],
      default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },

    // 🎮 Gamification
    streak: { type: Number, default: 0 },
    lastJournalDate: { type: Date, default: null },
    badges: { type: [String], default: [] },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },

    // 🔐 Account management
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: "" },
    resetPasswordToken: { type: String, default: "" },
    resetPasswordExpire: { type: Date },
  },
  { timestamps: true }
);

// 🔐 Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔑 Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 🌗 Toggle theme
userSchema.methods.toggleTheme = async function () {
  this.theme = this.theme === "light" ? "dark" : "light";
  await this.save();
  return this.theme;
};

// 🛡 Hide sensitive fields in API response
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.verificationToken;
    delete ret.resetPasswordToken;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
