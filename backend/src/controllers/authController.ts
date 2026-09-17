import { Request, Response } from "express";
import User from "../models/User";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { generateToken } from "../utils/generateToken";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    throw new AppError("Name, email and password are required", 400);
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new AppError("Email is already registered", 409);

  const user = await User.create({
    name,
    email,
    password,
    role: role === "organizer" ? "organizer" : "attendee",
  });

  const token = generateToken(user._id.toString());
  res.status(201).json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = generateToken(user._id.toString());
  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user!;
  res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
});
