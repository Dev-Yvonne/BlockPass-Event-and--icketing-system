import jwt, { SignOptions } from "jsonwebtoken";

export function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in the environment");
  }
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
  };
  return jwt.sign({ id: userId }, secret, options);
}
