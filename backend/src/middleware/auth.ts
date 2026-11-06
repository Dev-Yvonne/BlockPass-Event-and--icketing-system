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
    if (user.suspended) throw new AppError("This account has been suspended", 403);

    req.user = user;
    next();
  }
);

/** Attaches the user when a valid token is sent; guests pass straight through. */
export const optionalAuth = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const secret = process.env.JWT_SECRET;
    if (header?.startsWith("Bearer ") && secret) {
      try {
        const payload = jwt.verify(header.split(" ")[1], secret) as TokenPayload;
        const user = await User.findById(payload.id);
        if (user && !user.suspended) req.user = user;
      } catch {
        // An expired session shouldn't block a guest checkout.
      }
    }
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
