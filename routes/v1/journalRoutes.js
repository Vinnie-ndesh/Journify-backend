
import express from "express";
import { authenticate } from "../../middleware/auth.js";


import { createJournal,getJournals ,getJournalsByCategory,editJournal,deleteJournal,getCategory,loadAllAnalysis} from "../../controllers/journalController.js";
import { createJournalValidator } from "../../validator/journalValidator.js";
import JoiValidator from "../../middleware/joiValidator.js";
const router = express.Router();
// journal routes
router.post("/create-journal", authenticate, JoiValidator(createJournalValidator), createJournal);
router.get("/my-journals", authenticate, getJournals);
router.get("/journals/:categoryId", authenticate, getJournalsByCategory);
router.put("/edit-journal/:journalId", authenticate,JoiValidator(createJournalValidator), editJournal);
router.delete("/delete-journal/:journalId", authenticate, deleteJournal);

router.get("/categories", authenticate, getCategory);

router.post("/analysis", authenticate,loadAllAnalysis)
export default router;