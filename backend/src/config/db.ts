import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  // Serverless invocations reuse a warm process and its connection.
  if (mongoose.connection.readyState === 1) return;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in the environment");
  }

  await mongoose.connect(uri);
}
