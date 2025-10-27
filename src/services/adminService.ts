import env from "../config/env";
import Admin from "../models/Admin";
import { hashPassword } from "../utils/password";

export async function ensureDefaultAdmin(): Promise<void> {
  const existingAdmin = await Admin.findOne({ email: env.adminEmail });
  if (!existingAdmin) {
    const passwordHash = await hashPassword(env.adminPassword);
    await Admin.create({ email: env.adminEmail, passwordHash, name: "Start2Write Admin" });
    return;
  }

  if (env.nodeEnv !== "production" && env.adminPassword && !(await existingAdmin.compare?.(env.adminPassword))) {
    // In dev we optionally keep env password in sync when ADMIN_PASSWORD changes.
    existingAdmin.passwordHash = await hashPassword(env.adminPassword);
    await existingAdmin.save();
  }
}

export async function updateAdminPassword(email: string, newPassword: string): Promise<void> {
  const admin = await Admin.findOne({ email });
  if (!admin) {
    throw new Error("Admin not found");
  }
  admin.passwordHash = await hashPassword(newPassword);
  await admin.save();
}

export async function createAdmin(email: string, password: string, name: string): Promise<any> {
  // Check if admin already exists
  const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
  if (existingAdmin) {
    throw new Error("Email already registered");
  }

  // Hash the password
  const passwordHash = await hashPassword(password);

  // Create new admin
  const newAdmin = await Admin.create({
    email: email.toLowerCase(),
    passwordHash,
    name,
    isActive: true,
  });

  return {
    email: newAdmin.email,
    name: newAdmin.name,
    _id: newAdmin._id,
  };
}
