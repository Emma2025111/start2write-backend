import mongoose from "mongoose";
import env from "./env";

export async function connectDatabase() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
}

export default mongoose;
