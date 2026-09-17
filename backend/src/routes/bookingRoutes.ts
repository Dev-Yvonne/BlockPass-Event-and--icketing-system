import { Router } from "express";
import {
  createBooking,
  getMyBookings,
  getEventBookings,
  cancelBooking,
} from "../controllers/bookingController";
import { protect } from "../middleware/auth";

const router = Router();

router.post("/", protect, createBooking);
router.get("/my", protect, getMyBookings);
router.get("/event/:eventId", protect, getEventBookings);
router.patch("/:id/cancel", protect, cancelBooking);

export default router;
