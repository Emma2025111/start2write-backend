import { Schema, model, type Document, type Types } from "mongoose";
import mongoose from "mongoose";

export type OtpContext = "login" | "reset";

export interface OtpTokenDocument extends Document {
  adminId: Types.ObjectId;
  codeHash: string;
  context: OtpContext;
  expiresAt: Date;
  resendAvailableAt: Date;
  attempts: number;
  createdAt: Date;
}

const otpTokenSchema = new Schema<OtpTokenDocument>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    codeHash: { type: String, required: true },
    context: { type: String, enum: ["login", "reset"], required: true },
    expiresAt: { type: Date, required: true },
    resendAvailableAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpTokenSchema.index({ adminId: 1, context: 1 });

export const OtpToken = mongoose.models.OtpToken || model<OtpTokenDocument>("OtpToken", otpTokenSchema);

export default OtpToken;
