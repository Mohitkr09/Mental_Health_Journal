import express from "express";
import { createJournal, getJournals } from "../controllers/journalcontroller.js";
import { protect } from "../middleware/authmiddleware.js";  // ✅ import middleware

const router = express.Router();

// Protected routes
router.post("/", protect, createJournal);   // save new journal
router.get("/", protect, getJournals);      // fetch all journals

export default router;
