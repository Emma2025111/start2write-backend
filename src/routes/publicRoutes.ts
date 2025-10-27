import { Router } from "express";
import { createFeedback } from "../controllers/feedbackController";

const router = Router();

router.post("/feedback", createFeedback);

export default router;
