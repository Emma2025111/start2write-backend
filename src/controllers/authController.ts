import type { Request, Response } from "express";
import createHttpError from "http-errors";
import { z } from "zod";
import env from "../config/env";
import Admin from "../models/Admin";
import OtpToken from "../models/OtpToken";
import { updateAdminPassword, createAdmin } from "../services/adminService";
import { deliverOtp, generateOtp, hashOtp } from "../services/otpService";
import { verifyPassword } from "../utils/password";
import { signAdminJwt } from "../utils/jwt";
import asyncHandler from "../utils/asyncHandler";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  name: z.string().min(2),
});

const otpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  context: z.enum(["login", "reset"]),
  newPassword: z.string().min(8).optional(),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const admin = await Admin.findOne({ email });
  if (!admin) {
    throw createHttpError(401, "Invalid credentials");
  }

  const passwordValid = await verifyPassword(password, admin.passwordHash);
  if (!passwordValid) {
    throw createHttpError(401, "Invalid credentials");
  }

  // If OTP is disabled, log in directly
  if (!env.requireOtp) {
    const token = signAdminJwt({ adminId: admin._id.toString() });

    res.json({
      success: true,
      token,
      admin: {
        email: admin.email,
        name: admin.name ?? "Administrator",
      },
    });
    return;
  }

  // OTP enabled - send code
  await OtpToken.deleteMany({ adminId: admin._id, context: "login" });

  const otp = generateOtp();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + env.otpExpiryMinutes * 60 * 1000);
  const resendAvailableAt = new Date(now.getTime() + env.otpResendWindowSeconds * 1000);

  await OtpToken.create({
    adminId: admin._id,
    codeHash: hashOtp(otp),
    context: "login",
    expiresAt,
    resendAvailableAt,
    attempts: 0,
  });

  await deliverOtp({ email: admin.email, otp, context: "login" });

  res.json({ success: true, message: "OTP sent", resendAvailableAt });
});

export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, context } = otpSchema.pick({ email: true, context: true }).parse(req.body);

  const admin = await Admin.findOne({ email });
  if (!admin) {
    throw createHttpError(404, "Admin not found");
  }

  const existing = await OtpToken.findOne({ adminId: admin._id, context }).sort({ createdAt: -1 });
  const now = new Date();
  if (existing && existing.resendAvailableAt > now) {
    throw createHttpError(429, "Please wait before requesting a new OTP");
  }

  await OtpToken.deleteMany({ adminId: admin._id, context });

  const otp = generateOtp();
  const expiresAt = new Date(now.getTime() + env.otpExpiryMinutes * 60 * 1000);
  const resendAvailableAt = new Date(now.getTime() + env.otpResendWindowSeconds * 1000);

  await OtpToken.create({
    adminId: admin._id,
    codeHash: hashOtp(otp),
    context,
    expiresAt,
    resendAvailableAt,
    attempts: 0,
  });

  await deliverOtp({ email: admin.email, otp, context });

  res.json({ success: true, message: "OTP resent", resendAvailableAt });
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, context, newPassword } = otpSchema.parse(req.body);

  const admin = await Admin.findOne({ email });
  if (!admin) {
    throw createHttpError(404, "Admin not found");
  }

  const storedOtp = await OtpToken.findOne({ adminId: admin._id, context }).sort({ createdAt: -1 });
  if (!storedOtp) {
    throw createHttpError(400, "OTP not found or expired");
  }

  if (storedOtp.expiresAt < new Date()) {
    await storedOtp.deleteOne();
    throw createHttpError(400, "OTP expired");
  }

  if (storedOtp.attempts >= 5) {
    await storedOtp.deleteOne();
    throw createHttpError(429, "Too many attempts");
  }

  storedOtp.attempts += 1;
  await storedOtp.save();

  if (storedOtp.codeHash !== hashOtp(otp)) {
    throw createHttpError(400, "Invalid OTP");
  }

  await OtpToken.deleteMany({ adminId: admin._id, context });

  if (context === "reset") {
    if (newPassword) {
      await updateAdminPassword(admin.email, newPassword);
      res.json({ success: true, message: "Password updated" });
    } else {
      // Store reset email in a temporary way (could use JWT or database)
      res.json({ success: true, message: "OTP verified", resetToken: admin.email });
    }
    return;
  }

  const token = signAdminJwt({ adminId: admin._id.toString() });

  res.json({
    success: true,
    token,
    admin: {
      email: admin.email,
      name: admin.name ?? "Administrator",
    },
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    resetToken: z.string(),
    newPassword: z.string().min(8),
  });

  const { resetToken, newPassword } = schema.parse(req.body);

  // The resetToken contains the email (this is a simplified approach)
  // In a production app, you might want to use a proper JWT token for this
  await updateAdminPassword(resetToken, newPassword);

  res.json({ success: true, message: "Password updated" });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = forgotSchema.parse(req.body);
  const admin = await Admin.findOne({ email });
  if (!admin) {
    throw createHttpError(404, "Admin not found");
  }

  await OtpToken.deleteMany({ adminId: admin._id, context: "reset" });

  const otp = generateOtp();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + env.otpExpiryMinutes * 60 * 1000);
  const resendAvailableAt = new Date(now.getTime() + env.otpResendWindowSeconds * 1000);

  await OtpToken.create({
    adminId: admin._id,
    codeHash: hashOtp(otp),
    context: "reset",
    expiresAt,
    resendAvailableAt,
    attempts: 0,
  });

  await deliverOtp({ email: admin.email, otp, context: "reset" });

  res.json({ success: true, message: "OTP sent for password reset", resendAvailableAt });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.adminId) {
    res.status(401).json({ success: false, message: "Not authenticated" });
    return;
  }

  const admin = await Admin.findById(req.adminId);
  if (!admin) {
    res.status(401).json({ success: false, message: "Not authenticated" });
    return;
  }

  res.json({
    success: true,
    admin: {
      email: admin.email,
      name: admin.name ?? "Administrator",
    },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  // With stateless JWT tokens, we just need to respond success
  // The client will remove the token from localStorage
  res.json({ success: true, message: "Logged out successfully" });
});

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, confirmPassword, name } = signupSchema.parse(req.body);

  // Validate password match
  if (password !== confirmPassword) {
    throw createHttpError(400, "Passwords do not match");
  }

  // Create new admin
  const admin = await createAdmin(email, password, name);

  // Generate token and return it
  const token = signAdminJwt({ adminId: admin._id.toString() });

  res.json({
    success: true,
    token,
    admin: {
      email: admin.email,
      name: admin.name,
    },
  });
});
