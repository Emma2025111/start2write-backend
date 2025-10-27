import { Schema, model, type Document } from "mongoose";
import mongoose from "mongoose";

export interface AdminDocument extends Document {
  email: string;
  passwordHash: string;
  name?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const adminSchema = new Schema<AdminDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Admin = mongoose.models.Admin || model<AdminDocument>("Admin", adminSchema);

export default Admin;
