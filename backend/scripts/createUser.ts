/**
 * Creates a user or updates an existing one's role and password. This is the
 * only way to make the first admin, since sign-up can't grant that role.
 *
 *   npm run user:create -- <email> <admin|organizer|attendee> "<Name>"
 *
 * The password comes from NEW_USER_PASSWORD, or one is generated and printed.
 */
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../src/config/db";
import User, { UserRole } from "../src/models/User";

async function main() {
  const [email, role, name] = process.argv.slice(2);
  if (!email || !["admin", "organizer", "attendee"].includes(role)) {
    throw new Error('Usage: npm run user:create -- <email> <admin|organizer|attendee> "<Name>"');
  }

  const password = process.env.NEW_USER_PASSWORD || crypto.randomBytes(12).toString("base64url");
  await connectDB();

  const user = (await User.findOne({ email: email.toLowerCase() })) ?? new User({ email });
  user.role = role as UserRole;
  user.password = password;
  user.suspended = false;
  if (name) user.name = name;
  if (!user.name) user.name = email.split("@")[0];
  await user.save();

  console.log(`${role}: ${user.email}`);
  if (!process.env.NEW_USER_PASSWORD) console.log(`password: ${password}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
