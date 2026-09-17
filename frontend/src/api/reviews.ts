import { api } from "./client";
import { Review } from "../types";

export function listEventReviews(eventId: string) {
  return api.get<Review[]>(`/events/${eventId}/reviews`).then((res) => res.data);
}

export function createReview(eventId: string, rating: number, comment: string) {
  return api
    .post<Review>(`/events/${eventId}/reviews`, { rating, comment })
    .then((res) => res.data);
}
