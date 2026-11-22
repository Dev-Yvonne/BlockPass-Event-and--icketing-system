import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  confirmRedemption,
  getRedemption,
  listGateEvents,
  listScanLogs,
  scan,
} from "../controllers/gateController";
import { authorize, protect } from "../middleware/auth";

const router = Router();

const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 240,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Scanning too fast. Please wait a moment." },
});

router.use(protect, authorize("organizer", "admin"));

router.get("/events", listGateEvents);
router.post("/scan", scanLimiter, scan);
router.get("/tickets/:bookingId/:serial", getRedemption);
router.post("/tickets/:bookingId/:serial/confirm", confirmRedemption);
router.get("/logs", listScanLogs);

export default router;
