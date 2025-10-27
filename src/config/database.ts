import mongoose from "mongoose";
import env from "./env.js";

export async function connectDatabase() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  console.log("MongoDB connected successfully");
}

export default mongoose;
