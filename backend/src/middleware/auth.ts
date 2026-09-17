import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { UserRole } from "../models/User";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

interface TokenPayload {
  id: string;
}

export const protect = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new AppError("Not authorized, no token provided", 401);
    }

    const token = header.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new AppError("Server misconfiguration", 500);

    let payload: TokenPayload;
    try {
      payload = jwt.verify(token, secret) as TokenPayload;
    } catch {
      throw new AppError("Not authorized, invalid token", 401);
    }

    const user = await User.findById(payload.id);
    if (!user) throw new AppError("User no longer exists", 401);

    req.user = user;
    next();
  }
);

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError("Not authorized to perform this action", 403);
    }
    next();
  };
}
