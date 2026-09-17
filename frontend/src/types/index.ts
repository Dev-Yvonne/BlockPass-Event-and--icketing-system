export type UserRole = "attendee" | "organizer" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface EventItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  date: string;
  price: number;
  capacity: number;
  ticketsSold: number;
  ticketsRemaining?: number;
  imageUrl?: string;
  organizer: { _id: string; name: string; email: string } | string;
}

export interface Booking {
  _id: string;
  user: string;
  event: EventItem | string;
  quantity: number;
  totalPrice: number;
  status: "confirmed" | "cancelled";
  ticketCode: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  user: { _id: string; name: string } | string;
  event: string;
  rating: number;
  comment: string;
  createdAt: string;
}
