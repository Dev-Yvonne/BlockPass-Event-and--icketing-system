import {
  ActivityEntry,
  AdminEvent,
  AdminOverview,
  AdminUser,
  EventItem,
  EventRow,
  Order,
  OrderRow,
  OrganizerEventDetail,
  OrganizerOverview,
  PaymentMethod,
  Review,
  User,
  UserRole,
} from "../types";

export const TOKEN_KEY = "blockpass_token";

/** Browser-side request through this app's /api proxy. */
async function request<T>(route: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`/api${route}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw Object.assign(new Error(body?.message ?? "Something went wrong. Please try again."), { body });
  return body;
}

const post = <T,>(route: string, data?: unknown) =>
  request<T>(route, { method: "POST", body: JSON.stringify(data ?? {}) });
const patch = <T,>(route: string, data: unknown) =>
  request<T>(route, { method: "PATCH", body: JSON.stringify(data) });

interface AuthResponse {
  token: string;
  user: User;
}

export const login = (email: string, password: string) =>
  post<AuthResponse>("/auth/login", { email, password });
export const register = (name: string, email: string, password: string, role: UserRole) =>
  post<AuthResponse>("/auth/register", { name, email, password, role });
export const getMe = () => request<User>("/auth/me");
export const becomeOrganizer = () => post<User>("/auth/become-organizer");

export interface CheckoutInput {
  eventId: string;
  tierId: string;
  name: string;
  email: string;
  quantity: number;
  checkoutId: string;
  paymentMethod: PaymentMethod;
  currency?: string;
  phone?: string;
}

export const checkout = (input: CheckoutInput) => post<Order>("/checkout", input);
export const getMyTickets = () => request<Order[]>("/bookings/my");

export const listReviews = (eventId: string) => request<Review[]>(`/events/${eventId}/reviews`);
export const createReview = (eventId: string, rating: number, comment: string) =>
  post<Review>(`/events/${eventId}/reviews`, { rating, comment });

export interface EventInput {
  title: string;
  description: string;
  category: string;
  venue: string;
  date: string;
  imageUrl?: string;
  gallery?: string[];
  highlights?: string[];
  schedule?: { time: string; title: string }[];
  venueNotes?: string;
  localCurrency?: string;
  tiers?: { name: string; description?: string; price: number; capacity: number }[];
}

export const createEvent = (input: EventInput) => post<EventItem>("/events", input);
export const updateEvent = (id: string, input: EventInput) =>
  request<EventItem>(`/events/${id}`, { method: "PUT", body: JSON.stringify(input) });
export const deleteEvent = (id: string) => request(`/events/${id}`, { method: "DELETE" });

export const getOrganizerOverview = () => request<OrganizerOverview>("/organizer/overview");
export const getOrganizerEvents = () => request<EventRow[]>("/organizer/events");
export const getOrganizerEvent = (id: string) =>
  request<OrganizerEventDetail>(`/organizer/events/${id}`);
export const getOrganizerFeedback = () => request<Review[]>("/organizer/feedback");
export const getOrganizerOrders = () => request<OrderRow[]>("/organizer/orders");

export const getAdminOverview = () => request<AdminOverview>("/admin/overview");
export const getAdminUsers = () => request<AdminUser[]>("/admin/users");
export const updateAdminUser = (id: string, change: { role?: UserRole; suspended?: boolean }) =>
  patch<AdminUser>(`/admin/users/${id}`, change);
export const getAdminEvents = () => request<AdminEvent[]>("/admin/events");
export const setEventHidden = (id: string, hidden: boolean) =>
  patch(`/admin/events/${id}`, { hidden });
export const getAdminOrders = () => request<OrderRow[]>("/admin/orders");
export const getAdminActivity = () => request<ActivityEntry[]>("/admin/activity");
