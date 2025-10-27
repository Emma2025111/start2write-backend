import { Router } from "express";
import { forgotPassword, login, logout, me, resendOtp, resetPassword, signup, verifyOtp } from "../controllers/authController";

const router = Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/forgot", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", logout);
router.get("/me", me);

export default router;
