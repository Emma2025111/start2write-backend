import jwt from "jsonwebtoken";
import env from "../config/env.js";

export interface AdminJwtPayload {
  adminId: string;
}

export function signAdminJwt(payload: AdminJwtPayload, expiresIn: string = "1h"): string {
  return jwt.sign(payload, env.jwtSecret as string, { expiresIn: expiresIn as any });
}

export function verifyAdminJwt(token: string): AdminJwtPayload {
  return jwt.verify(token, env.jwtSecret as string) as AdminJwtPayload;
}
