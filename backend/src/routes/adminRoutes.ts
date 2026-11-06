import { Router } from "express";
import {
  getOverview,
  listActivity,
  listAllEvents,
  listAllOrders,
  listUsers,
  updateEventVisibility,
  updateUser,
} from "../controllers/adminController";
import { authorize, protect } from "../middleware/auth";

const router = Router();

router.use(protect, authorize("admin"));

router.get("/overview", getOverview);
router.get("/users", listUsers);
router.patch("/users/:id", updateUser);
router.get("/events", listAllEvents);
router.patch("/events/:id", updateEventVisibility);
router.get("/orders", listAllOrders);
router.get("/activity", listActivity);

export default router;
