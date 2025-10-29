import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { verifyAdminJwt } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      adminId?: string;
    }
  }
}

export function requireAdminAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(createHttpError(401, "Authentication required"));
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  try {
    const { adminId } = verifyAdminJwt(token);
    req.adminId = adminId;
    next();
  } catch (error) {
    next(createHttpError(401, "Authentication failed"));
  }
}
