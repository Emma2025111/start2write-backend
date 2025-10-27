import { Router } from "express";
import { feedbackStats, listFeedback, exportFeedback, deleteFeedback } from "../controllers/feedbackController";
import { requireAdminAuth } from "../middleware/authMiddleware";

const router = Router();

router.use(requireAdminAuth);
router.get("/feedback", listFeedback);
router.get("/feedback/export", exportFeedback);
router.delete("/feedback/:id", deleteFeedback);
router.get("/stats", feedbackStats);

export default router;
