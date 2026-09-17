import { Router } from "express";
import {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController";
import { protect, authorize } from "../middleware/auth";
import reviewRoutes from "./reviewRoutes";

const router = Router();

router.use("/:eventId/reviews", reviewRoutes);

router.get("/", listEvents);
router.get("/:id", getEvent);
router.post("/", protect, authorize("organizer", "admin"), createEvent);
router.put("/:id", protect, authorize("organizer", "admin"), updateEvent);
router.delete("/:id", protect, authorize("organizer", "admin"), deleteEvent);

export default router;
