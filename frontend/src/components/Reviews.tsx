"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import * as api from "../lib/api";
import { Review } from "../types";
import { ReviewList, ReviewSummary } from "./ReviewSummary";

export function Reviews({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.listReviews(eventId).then(setReviews).catch(() => setReviews([]));
  }, [eventId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    try {
      await api.createReview(eventId, rating, comment);
      setReviews(await api.listReviews(eventId));
      setComment("");
    } catch (err) {
      setMessage((err as Error).message);
    }
  }

  return (
    <section className="reviews" id="reviews">
      <h2>Ratings and reviews</h2>
      <ReviewSummary reviews={reviews} />
      {reviews.length > 0 && <ReviewList reviews={reviews} />}
      {user && (
        <form onSubmit={handleSubmit} className="form review-form">
          <h3>Share your experience</h3>
          <label className="field">
            Rating
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} out of 5
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Your review
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} required />
          </label>
          {message && <p className="form-error">{message}</p>}
          <button type="submit" className="btn secondary">
            Post review
          </button>
        </form>
      )}
    </section>
  );
}
