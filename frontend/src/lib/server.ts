import { CheckoutOptions, EventItem, Mint, Order } from "../types";

const API_URL = process.env.API_URL || "http://localhost:5000/api";

/** Server-side read. Returns null on a 404; other failures reach error.tsx. */
async function read<T>(route: string): Promise<T | null> {
  const res = await fetch(`${API_URL}${route}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API responded ${res.status} for ${route}`);
  return res.json();
}

export const listEvents = async (search?: string, category?: string) => {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (category) query.set("category", category);
  const suffix = query.size > 0 ? `?${query}` : "";
  return (await read<EventItem[]>(`/events${suffix}`)) ?? [];
};
export const getCheckoutOptions = () => read<CheckoutOptions>("/checkout/options");
export const getEvent = (id: string) => read<EventItem>(`/events/${encodeURIComponent(id)}`);
export const getOrder = (reference: string) =>
  read<Order>(`/checkout/${encodeURIComponent(reference)}`);
export const listMints = async () => (await read<Mint[]>("/checkout/mints")) ?? [];
