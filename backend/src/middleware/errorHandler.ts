import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export function notFound(req: Request, res: Response) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }

  if ((err as { code?: number }).code === 11000) {
    return res.status(409).json({ message: "Duplicate resource" });
  }

  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
}
