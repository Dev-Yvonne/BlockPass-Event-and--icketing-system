import { Star } from "lucide-react";
import { formatShortDate } from "../lib/format";
import { Review } from "../types";
import { Badge } from "./ui";

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="stars" role="img" aria-label={`${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={15}
          aria-hidden="true"
          className={value <= Math.round(rating) ? "filled" : ""}
        />
      ))}
    </span>
  );
}

/** Average score beside the breakdown of each star level. */
export function ReviewSummary({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return <p className="muted">No reviews yet.</p>;

  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <div className="review-summary">
      <div className="review-score">
        <strong>{average.toFixed(1)}</strong>
        <Stars rating={average} />
        <small>
          {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </small>
      </div>
      <ul className="review-bars">
        {[5, 4, 3, 2, 1].map((level) => {
          const count = reviews.filter((review) => review.rating === level).length;
          return (
            <li key={level}>
              <span>{level} star</span>
              <div className="meter-track">
                <div className="meter-fill" style={{ width: `${(count / reviews.length) * 100}%` }} />
              </div>
              <span>{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ReviewList({ reviews, showEvent }: { reviews: Review[]; showEvent?: boolean }) {
  return (
    <ul className="review-list">
      {reviews.map((review) => (
        <li key={review._id}>
          <div className="review-head">
            <div>
              <strong>{typeof review.user === "object" ? review.user.name : "Attendee"}</strong>
              {showEvent && typeof review.event === "object" && (
                <span className="review-event">{review.event.title}</span>
              )}
            </div>
            <Stars rating={review.rating} />
          </div>
          <p>{review.comment}</p>
          <div className="review-foot">
            <small>{formatShortDate(review.createdAt)}</small>
            {review.sample ? <Badge tone="neutral">Sample review</Badge> : <Badge tone="good">Ticket holder</Badge>}
          </div>
        </li>
      ))}
    </ul>
  );
}
