import { Router } from "express";
import {
  getEventDetail,
  getOverview,
  listFeedback,
  listOwnEvents,
  listOwnOrders,
} from "../controllers/organizerController";
import { authorize, protect } from "../middleware/auth";

const router = Router();

router.use(protect, authorize("organizer", "admin"));

router.get("/overview", getOverview);
router.get("/events", listOwnEvents);
router.get("/events/:id", getEventDetail);
router.get("/orders", listOwnOrders);
router.get("/feedback", listFeedback);

export default router;
