import { EventItem } from "../types";
import { apiError, delay, getCurrentUser, getEvents, newId, saveEvents } from "../mockStore";

export interface EventInput {
  title: string;
  description: string;
  category: string;
  venue: string;
  date: string;
  price: number;
  capacity: number;
  imageUrl?: string;
}

export function listEvents(params?: { category?: string; search?: string }) {
  let events = getEvents();
  if (params?.category) {
    const category = params.category.toLowerCase();
    events = events.filter((e) => e.category.toLowerCase() === category);
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    events = events.filter(
      (e) => e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q)
    );
  }
  events = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return delay(events);
}

export function getEvent(id: string) {
  const event = getEvents().find((e) => e._id === id);
  if (!event) return Promise.reject(apiError("Event not found"));
  return delay(event);
}

export function createEvent(input: EventInput) {
  const user = getCurrentUser();
  if (!user) return Promise.reject(apiError("Not authenticated"));
  const events = getEvents();
  const event: EventItem = {
    _id: newId("evt"),
    ...input,
    ticketsSold: 0,
    organizer: { _id: user.id, name: user.name, email: user.email },
  };
  events.unshift(event);
  saveEvents(events);
  return delay(event);
}

export function updateEvent(id: string, input: Partial<EventInput>) {
  const events = getEvents();
  const event = events.find((e) => e._id === id);
  if (!event) return Promise.reject(apiError("Event not found"));
  Object.assign(event, input);
  saveEvents(events);
  return delay(event);
}

export function deleteEvent(id: string) {
  saveEvents(getEvents().filter((e) => e._id !== id));
  return delay({ success: true });
}
