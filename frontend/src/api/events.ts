import { api } from "./client";
import { EventItem } from "../types";

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
  return api.get<EventItem[]>("/events", { params }).then((res) => res.data);
}

export function getEvent(id: string) {
  return api.get<EventItem>(`/events/${id}`).then((res) => res.data);
}

export function createEvent(input: EventInput) {
  return api.post<EventItem>("/events", input).then((res) => res.data);
}

export function updateEvent(id: string, input: Partial<EventInput>) {
  return api.put<EventItem>(`/events/${id}`, input).then((res) => res.data);
}

export function deleteEvent(id: string) {
  return api.delete(`/events/${id}`).then((res) => res.data);
}
