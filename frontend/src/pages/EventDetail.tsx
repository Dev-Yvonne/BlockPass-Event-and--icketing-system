import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { EventItem, Review } from "../types";
import * as eventsApi from "../api/events";
import * as bookingsApi from "../api/bookings";
import * as reviewsApi from "../api/reviews";
import { useAuth } from "../context/AuthContext";

export function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [bookingMessage, setBookingMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    eventsApi.getEvent(id).then(setEvent);
    reviewsApi.listEventReviews(id).then(setReviews);
  }, [id]);

  async function handleBook(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setBookingMessage("");
    try {
      await bookingsApi.createBooking(id, quantity);
      setBookingMessage("Booking confirmed!");
      const refreshed = await eventsApi.getEvent(id);
      setEvent(refreshed);
    } catch (err: any) {
      setBookingMessage(err?.response?.data?.message || "Booking failed");
    }
  }

  async function handleReview(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setReviewMessage("");
    try {
      const review = await reviewsApi.createReview(id, rating, comment);
      setReviews((prev) => [review, ...prev]);
      setComment("");
      setReviewMessage("Review submitted!");
    } catch (err: any) {
      setReviewMessage(err?.response?.data?.message || "Failed to submit review");
    }
  }

  if (!event) return <p className="status">Loading…</p>;

  const remaining = event.capacity - event.ticketsSold;

  return (
    <div className="page">
      <h1>{event.title}</h1>
      <p className="event-card-meta">
        {new Date(event.date).toLocaleString()} · {event.venue} · {event.category}
      </p>
      <p>{event.description}</p>
      <p>
        <strong>${event.price.toFixed(2)}</strong> · {remaining > 0 ? `${remaining} tickets left` : "Sold out"}
      </p>

      {user ? (
        <form onSubmit={handleBook} className="form inline">
          <label>
            Quantity
            <input
              type="number"
              min={1}
              max={Math.max(remaining, 1)}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </label>
          <button type="submit" disabled={remaining <= 0}>
            {remaining > 0 ? "Book tickets" : "Sold out"}
          </button>
        </form>
      ) : (
        <p className="status">Login to book tickets.</p>
      )}
      {bookingMessage && <p className="status">{bookingMessage}</p>}

      <h2>Reviews</h2>
      {user && (
        <form onSubmit={handleReview} className="form">
          <label>
            Rating
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} star{r > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            Comment
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} required />
          </label>
          <button type="submit">Submit review</button>
        </form>
      )}
      {reviewMessage && <p className="status">{reviewMessage}</p>}

      <ul className="review-list">
        {reviews.map((review) => (
          <li key={review._id}>
            <strong>{typeof review.user === "object" ? review.user.name : "Anonymous"}</strong>{" "}
            — {review.rating}★
            <p>{review.comment}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
