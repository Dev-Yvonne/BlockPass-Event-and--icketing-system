"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="center-page">
      <h1>We can't reach BlockPass right now</h1>
      <p>Please try again in a moment.</p>
      <button className="btn" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
