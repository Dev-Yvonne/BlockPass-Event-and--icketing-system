import Link from "next/link";

export default function NotFound() {
  return (
    <div className="center-page">
      <h1>Page not found</h1>
      <p>This page doesn't exist, or the event is no longer available.</p>
      <Link className="btn" href="/">
        Browse events
      </Link>
    </div>
  );
}
