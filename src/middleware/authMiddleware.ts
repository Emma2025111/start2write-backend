import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { verifyAdminJwt } from "../utils/jwt.js";

declare module "express-session" {
  interface SessionData {
    adminId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      adminId?: string;
    }
  }
}

export function requireAdminAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.admin_token as string | undefined;
  if (!token || !req.session?.adminId) {
    return next(createHttpError(401, "Authentication required"));
  }

  try {
    const { adminId } = verifyAdminJwt(token);
    if (adminId !== req.session.adminId) {
      throw createHttpError(401, "Session mismatch");
    }
    req.adminId = adminId;
    next();
  } catch (error) {
    next(createHttpError(401, "Authentication failed"));
  }
}
