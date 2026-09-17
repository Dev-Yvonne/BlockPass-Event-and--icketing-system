import path from "path";
import fs from "fs";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import eventRoutes from "./routes/eventRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import { notFound, errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);

// Serve the built React app, if present, and fall back to index.html for
// any non-API route so client-side routes survive a hard refresh.
const frontendDistPath = path.join(__dirname, "../../frontend/dist");
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;
