import express from "express";
import { createJournal, getJournals } from "../controllers/journalcontroller.js";
import { protect } from "../middleware/authmiddleware.js";

const router = express.Router();

/*  
  ⭐ Updated GET Journals:
  - Returns ONLY last 30 days
  - Sorted newest first
*/
router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Last 30 days range
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch last 30 days only
    const journals = await getJournals(userId, thirtyDaysAgo);

    res.json(journals);
  } catch (err) {
    console.error("Error fetching journals:", err);
    res.status(500).json({ message: "Server error fetching journal entries" });
  }
});

/*  
  ⭐ POST route stays same  
*/
router.post("/", protect, createJournal);

export default router;
