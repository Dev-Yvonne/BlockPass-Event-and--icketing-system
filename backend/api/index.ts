import type { IncomingMessage, ServerResponse } from "http";
import app from "../src/app";
import { connectDB } from "../src/config/db";

/** Vercel entry point: same Express app, connected on each cold start. */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await connectDB();
  app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1]);
}
