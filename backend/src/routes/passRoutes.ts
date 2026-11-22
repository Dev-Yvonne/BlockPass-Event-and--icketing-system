import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getPass, issuePassToken } from "../controllers/passController";

const router = Router();

// A pass refreshes its code every few seconds, so allow that and little more.
const tokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 90,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please wait a moment." },
});

router.get("/:reference", getPass);
router.post("/:reference/tickets/:serial/token", tokenLimiter, issuePassToken);

export default router;
