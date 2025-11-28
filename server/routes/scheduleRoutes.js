// server/routes/scheduleRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createOrUpdateSchedule,
  getSchedule,
  toggleComplete,
  getWeeklyDashboard,
  getRecommendations,
} from "../controllers/scheduleController.js";

const router = express.Router();

router.post("/", protect, createOrUpdateSchedule); // create / upsert
router.get("/", protect, getSchedule); // get today's schedule (optional ?date=YYYY-MM-DD)
router.post("/complete", protect, toggleComplete); // toggle completion { date?, index }
router.get("/dashboard", protect, getWeeklyDashboard);
router.get("/recommendations", protect, getRecommendations);

export default router;
