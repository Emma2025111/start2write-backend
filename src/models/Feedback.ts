import { Schema, model, type Document } from "mongoose";
import mongoose from "mongoose";

export interface FeedbackDocument extends Document {
  easeOfUse: string;
  featureClarity: string;
  designImpression: string;
  explanationHelpfulness: string;
  usefulFeedbackTypes: string[];
  confidenceLevel: string;
  likedMost: string;
  improvements: string;
  useAgain: string;
  languageBackground: string;
  studyLevel: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<FeedbackDocument>(
  {
    easeOfUse: { type: String, required: true },
    featureClarity: { type: String, required: true },
    designImpression: { type: String, required: true },
    explanationHelpfulness: { type: String, required: true },
    usefulFeedbackTypes: { type: [String], required: true },
    confidenceLevel: { type: String, required: true },
    likedMost: { type: String, required: true },
    improvements: { type: String, required: true },
    useAgain: { type: String, required: true },
    languageBackground: { type: String, required: true },
    studyLevel: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

export const Feedback = mongoose.models.Feedback || model<FeedbackDocument>("Feedback", feedbackSchema);

export default Feedback;
