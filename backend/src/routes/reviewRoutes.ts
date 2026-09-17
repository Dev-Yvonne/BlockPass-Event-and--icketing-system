import { Router } from "express";
import {
  listEventReviews,
  createReview,
  deleteReview,
} from "../controllers/reviewController";
import { protect } from "../middleware/auth";

const router = Router({ mergeParams: true });

router.get("/", listEventReviews);
router.post("/", protect, createReview);
router.delete("/:id", protect, deleteReview);

export default router;
