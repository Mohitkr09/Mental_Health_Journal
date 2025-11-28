import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      index: true, // Faster lookups
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // Do not expose by default
    },

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

/* ===========================================================
   🔐 HASH PASSWORD BEFORE SAVE
=========================================================== */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* ===========================================================
   🔑 VERIFY PASSWORD
=========================================================== */
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) {
    throw new Error("Password not loaded. Use select('+password') in query");
  }
  return bcrypt.compare(enteredPassword, this.password);
};

/* ===========================================================
   🎨 THEME TOGGLE
=========================================================== */
userSchema.methods.toggleTheme = async function () {
  this.theme = this.theme === "light" ? "dark" : "light";
  await this.save();
  return this.theme;
};

/* ===========================================================
   🚫 REMOVE SENSITIVE FIELDS FROM API RESPONSE
=========================================================== */
userSchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.password;
    delete ret.verificationToken;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpire;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
