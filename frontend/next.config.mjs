const apiUrl = process.env.API_URL || "http://localhost:5000/api";

/** @type {import("next").NextConfig} */
const nextConfig = {
  // The browser only talks to this origin, so the API needs no public CORS.
  async redirects() {
    return [
      { source: "/my-bookings", destination: "/dashboard/tickets", permanent: false },
      { source: "/create-event", destination: "/organizer/events/new", permanent: false },
    ];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/:path*` }];
  },
};

export default nextConfig;
