import { Booking, EventItem, Review, User, UserRole } from "./types";

export const TOKEN_KEY = "blockpass_token";

const EVENTS_KEY = "blockpass_mock_events_v1";
const BOOKINGS_KEY = "blockpass_mock_bookings_v1";
const REVIEWS_KEY = "blockpass_mock_reviews_v1";
const USERS_KEY = "blockpass_mock_users_v1";

const TOKEN_PREFIX = "mock:";

export interface StoredUser extends User {
  password: string;
}

const DEMO_ORGANIZER = {
  _id: "u-organizer",
  name: "Amara Organizer",
  email: "organizer@blockpass.app",
};

const SEED_USERS: StoredUser[] = [
  {
    id: "u-organizer",
    name: "Amara Organizer",
    email: "organizer@blockpass.app",
    role: "organizer",
    password: "demo1234",
  },
  {
    id: "u-attendee",
    name: "Kofi Attendee",
    email: "attendee@blockpass.app",
    role: "attendee",
    password: "demo1234",
  },
];

const SEED_EVENTS: EventItem[] = [
  {
    _id: "evt-lagos-live-nights",
    title: "Lagos Live Nights",
    description:
      "An open-air night of Afrobeat, amapiano, and live band sets on Lagos's biggest outdoor stage. Doors open at 6pm with food vendors and DJ sets before the headline acts.",
    category: "Concert",
    venue: "Tafawa Balewa Square, Lagos",
    date: "2026-11-14T18:00:00.000Z",
    price: 25,
    capacity: 500,
    ticketsSold: 341,
    imageUrl: "/images/lagos-live-nights.jpg",
    organizer: DEMO_ORGANIZER,
  },
  {
    _id: "evt-kinshasa-sound-stage",
    title: "Kinshasa Sound Stage",
    description:
      "Congolese rumba legends and rising stars share one stage for a night celebrating the sound that built Kinshasa's music scene.",
    category: "Concert",
    venue: "Stade des Martyrs, Kinshasa",
    date: "2026-10-24T19:00:00.000Z",
    price: 18,
    capacity: 800,
    ticketsSold: 612,
    imageUrl: "/images/kinshasa-sound-stage.jpg",
    organizer: DEMO_ORGANIZER,
  },
  {
    _id: "evt-accra-street-culture-fest",
    title: "Accra Street Culture Fest",
    description:
      "A full day of street art, live mural painting, drumming circles, and local designers taking over Jamestown's streets.",
    category: "Community",
    venue: "Jamestown, Accra",
    date: "2026-12-06T10:00:00.000Z",
    price: 8,
    capacity: 1200,
    ticketsSold: 405,
    imageUrl: "/images/accra-street-culture-fest.jpg",
    organizer: DEMO_ORGANIZER,
  },
  {
    _id: "evt-golden-coast-concert",
    title: "Golden Coast Concert",
    description:
      "Ghana's top highlife and hiplife acts headline an evening concert on the Accra coastline, with a sunset opening set.",
    category: "Concert",
    venue: "Black Star Square, Accra",
    date: "2026-11-01T17:30:00.000Z",
    price: 20,
    capacity: 600,
    ticketsSold: 588,
    imageUrl: "/images/golden-coast-concert.jpg",
    organizer: DEMO_ORGANIZER,
  },
  {
    _id: "evt-kilifi-cultural-gathering",
    title: "Kilifi Cultural Gathering",
    description:
      "A community celebration of Mijikenda heritage — traditional dance, drumming, and food stalls along the Kilifi coastline.",
    category: "Community",
    venue: "Kilifi Creek Grounds, Kilifi",
    date: "2026-10-10T09:00:00.000Z",
    price: 5,
    capacity: 400,
    ticketsSold: 96,
    imageUrl: "/images/kilifi-cultural-gathering.jpg",
    organizer: DEMO_ORGANIZER,
  },
];

export function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function apiError(message: string) {
  return { response: { data: { message } } };
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getEvents(): EventItem[] {
  return readJSON(EVENTS_KEY, SEED_EVENTS);
}

export function saveEvents(events: EventItem[]) {
  writeJSON(EVENTS_KEY, events);
}

export function getBookings(): Booking[] {
  return readJSON(BOOKINGS_KEY, [] as Booking[]);
}

export function saveBookings(bookings: Booking[]) {
  writeJSON(BOOKINGS_KEY, bookings);
}

export function getReviews(): Review[] {
  return readJSON(REVIEWS_KEY, [] as Review[]);
}

export function saveReviews(reviews: Review[]) {
  writeJSON(REVIEWS_KEY, reviews);
}

export function getUsers(): StoredUser[] {
  return readJSON(USERS_KEY, SEED_USERS);
}

export function saveUsers(users: StoredUser[]) {
  writeJSON(USERS_KEY, users);
}

export function tokenFor(userId: string) {
  return TOKEN_PREFIX + userId;
}

export function getCurrentUser(): StoredUser | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || !token.startsWith(TOKEN_PREFIX)) return null;
  const userId = token.slice(TOKEN_PREFIX.length);
  return getUsers().find((u) => u.id === userId) || null;
}

export function toPublicUser(user: StoredUser): User {
  const { password: _password, ...publicUser } = user;
  return publicUser;
}

export type { UserRole };
