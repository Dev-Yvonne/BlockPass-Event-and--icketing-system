# BlockPass — Event and Ticketing System

Comprehensive Event Management System featuring real-time ticketing, secure checkout, and a dynamic event dashboard. Built on the MERN stack (MongoDB, Express, React, Node.js) with TypeScript throughout.

## Structure

- `backend/` — Express + TypeScript API, MongoDB via Mongoose, JWT auth
- `frontend/` — React + TypeScript client, built with Vite

## Getting started

### Backend

```bash
cd backend
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
npm install
npm run dev
```

API runs on `http://localhost:5000` by default.

### Frontend

```bash
cd frontend
cp .env.example .env   # point VITE_API_URL at the backend
npm install
npm run dev
```

App runs on `http://localhost:5173` by default.

## Domains

- **Accounts** — registration/login with roles (`attendee`, `organizer`, `admin`), JWT-based auth
- **Events** — organizers create/manage events; public listing and search
- **Bookings** — attendees reserve tickets against an event's capacity, with atomic oversell protection and cancellation
- **Reviews** — attendees leave a rating and comment per event
