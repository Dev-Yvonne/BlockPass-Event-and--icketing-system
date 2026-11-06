import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createCheckout, getCheckoutOptions, getOrder, listMints } from "../controllers/checkoutController";
import { optionalAuth } from "../middleware/auth";

const router = Router();

// Checkout is public and spends testnet resources, so cap it per client.
const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.CHECKOUT_RATE_LIMIT_PER_MINUTE) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many checkout attempts. Please wait a minute and try again." },
});

router.post("/", checkoutLimiter, optionalAuth, createCheckout);
router.get("/mints", listMints);
router.get("/options", getCheckoutOptions);
router.get("/:reference", getOrder);

export default router;
