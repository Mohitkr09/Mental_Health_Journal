import express from "express";
import { createJournal, getJournals } from "../controllers/journalcontroller.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

router.get("/", protect, getJournals);
router.post("/", protect, createJournal);

export default router;
