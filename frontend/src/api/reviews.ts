import { Review } from "../types";
import { apiError, delay, getCurrentUser, getReviews, newId, saveReviews } from "../mockStore";

export function listEventReviews(eventId: string) {
  return delay(getReviews().filter((r) => r.event === eventId));
}

export function createReview(eventId: string, rating: number, comment: string) {
  const user = getCurrentUser();
  if (!user) return Promise.reject(apiError("Not authenticated"));

  const review: Review = {
    _id: newId("rev"),
    user: { _id: user.id, name: user.name },
    event: eventId,
    rating,
    comment,
    createdAt: new Date().toISOString(),
  };
  const reviews = getReviews();
  reviews.unshift(review);
  saveReviews(reviews);
  return delay(review);
}
