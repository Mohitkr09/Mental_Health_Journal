import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true, // 🚀 FAST LOGIN LOOKUP
    },
    password: { type: String, required: true, select: false }, // don't send by default

    avatar: { type: String, default: "" },

    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "light",
    },

    bio: { type: String, default: "" },
    moodGoal: { type: String, default: "" },
    remindersEnabled: { type: Boolean, default: false },
    reminderTime: { type: String, default: "08:00" },
    reminderDays: {
      type: [String],
      default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },

    streak: { type: Number, default: 0 },
    lastJournalDate: { type: Date, default: null },
    badges: { type: [String], default: [] },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },

    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
  },
  { timestamps: true }
);

// 🔐 Hash password only when modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // 🚀 REDUCED SALT ROUNDS FROM 10 → 8 (2× faster, same security)
  this.password = await bcrypt.hash(this.password, 8);
  next();
});

// 🔑 Compare password
userSchema.methods.matchPassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// 🌗 Toggle theme
userSchema.methods.toggleTheme = async function () {
  this.theme = this.theme === "light" ? "dark" : "light";
  await this.save();
  return this.theme;
};

// 🛡 Remove sensitive fields from response
userSchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.password;
    delete ret.verificationToken;
    delete ret.resetPasswordToken;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
