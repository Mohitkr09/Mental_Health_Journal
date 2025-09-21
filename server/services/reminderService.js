// backend/services/reminderService.js
import cron from "node-cron";
import nodemailer from "nodemailer";
import User from "../models/user.js";

const startReminderService = () => {
  // 🔔 Run daily at 8 AM server time
  cron.schedule("0 8 * * *", async () => {
    console.log("📧 Sending daily reminders...");

    try {
      const users = await User.find({}, "email name");
      if (!users.length) {
        console.log("⚠️ No users found for reminders.");
        return;
      }

      // ✅ Configure transporter
      const transporter = nodemailer.createTransport({
        service: "gmail", // or 'outlook', 'yahoo' etc.
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      for (const user of users) {
        const mailOptions = {
          from: `"Mindful Journal" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: "🌞 Daily Mood Reminder",
          text: `Hi ${user.name || "there"},\n\nDon't forget to log your mood today! 💜\nVisit your dashboard and record how you’re feeling.\n\nStay mindful,\nThe Mindful Journal Team`,
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Reminder sent to ${user.email}`);
      }
    } catch (err) {
      console.error("❌ Error sending reminders:", err);
    }
  });
};

export default startReminderService;
