export type UserRole = "attendee" | "organizer" | "admin";
export type PaymentMethod = "stablecoin" | "local";
export type OrderStatus = "pending" | "confirmed" | "failed" | "cancelled";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Tier {
  _id: string;
  name: string;
  description?: string;
  price: number;
  capacity: number;
  remaining: number;
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
  ticketsRemaining: number;
  imageUrl?: string;
  hidden?: boolean;
  gallery: string[];
  highlights: string[];
  schedule: { time: string; title: string }[];
  venueNotes?: string;
  localCurrency: string;
  tiers: Tier[];
  ticketing?: { eventCode?: string; issuerPublicKey?: string };
  organizer: { _id: string; name: string } | string;
}

export interface Order {
  reference: string;
  status: OrderStatus;
  attendeeName: string;
  attendeeEmail: string;
  tierName: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  event: { id: string; title: string; date: string; venue: string; imageUrl?: string };
  payment: {
    method: PaymentMethod;
    currency: string;
    amount: number;
    provider: string;
    reference?: string;
    status: "pending" | "paid" | "refunded" | "failed";
  };
  tickets: { serial: number; assetCode: string; explorerUrl: string; redemption: Redemption | null }[];
  stellar: {
    txHash: string | null;
    ledger: number | null;
    issuer: string | null;
    attendeePublicKey: string | null;
    txUrl: string | null;
    attendeeUrl: string | null;
    issuerUrl: string | null;
  };
}

export interface OrderRow {
  reference: string;
  status: OrderStatus;
  attendeeName: string;
  attendeeEmail: string;
  tierName: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  eventId?: string;
  eventTitle: string;
  assetCodes: string[];
  txUrl: string | null;
}

export interface DailyPoint {
  date: string;
  tickets: number;
}

export interface EventRow {
  _id: string;
  title: string;
  category: string;
  venue: string;
  date: string;
  imageUrl?: string;
  capacity: number;
  ticketsSold: number;
  hidden: boolean;
  orders: number;
  orderValue: number;
}

export interface OrganizerOverview {
  stats: {
    orders: number;
    tickets: number;
    orderValue: number;
    events: number;
    upcomingEvents: number;
    capacity: number;
  };
  daily: DailyPoint[];
  upcoming: EventRow[];
  recentOrders: OrderRow[];
}

export interface OrganizerEventDetail {
  event: EventItem;
  sales: { orders: number; tickets: number; orderValue: number };
  daily: DailyPoint[];
  orders: OrderRow[];
  reviews: Review[];
}

export interface ActivityEntry {
  _id: string;
  stage: string;
  reference: string;
  eventTitle?: string;
  tierName?: string;
  quantity?: number;
  assetCodes?: string[];
  txHash?: string;
  ledger?: number;
  error?: string;
  createdAt: string;
}

export interface AdminOverview {
  stats: {
    orders: number;
    tickets: number;
    orderValue: number;
    failedOrders: number;
    successRate: number | null;
    liveEvents: number;
    attendees: number;
    organizers: number;
    admins: number;
  };
  daily: DailyPoint[];
  distributor: { publicKey: string; balance: number; url: string } | null;
  activity: ActivityEntry[];
}

export interface AdminUser extends User {
  suspended: boolean;
  createdAt: string;
}

export interface AdminEvent {
  _id: string;
  title: string;
  venue: string;
  category: string;
  date: string;
  capacity: number;
  ticketsSold: number;
  hidden: boolean;
  organizerName: string;
  orderValue: number;
}

export interface Mint {
  reference: string;
  eventTitle: string;
  tierName: string;
  assetCodes: string[];
  txHash: string;
  ledger: number;
  createdAt: string;
  txUrl: string;
}

export interface Review {
  _id: string;
  user: { _id: string; name: string } | string;
  rating: number;
  comment: string;
  sample: boolean;
  createdAt: string;
  event?: { _id: string; title: string } | string;
}

export interface CheckoutOptions {
  stablecoin: string;
  rates: Record<string, number>;
}

/** A ticket's gate check-in: admitted at once, then moved to the vault on Stellar. */
export interface Redemption {
  status: "redeeming" | "redeemed" | "failed";
  admittedAt: string;
  txHash: string | null;
  txUrl: string | null;
  ledger: number | null;
  confirmedAt: string | null;
}

export interface PassToken {
  token: string;
  expiresAt: number;
  serverTime: number;
}

export interface GateEvent {
  id: string;
  title: string;
  date: string;
  venue: string;
  issued: number;
  checkedIn: number;
}

export interface GateEvents {
  vault: { publicKey: string; url: string };
  events: GateEvent[];
}

export type ScanVerdict = "valid" | "already_redeemed" | "invalid";

export interface ScanResult {
  verdict: ScanVerdict;
  reason?: string;
  message: string;
  source?: "database" | "ledger";
  latencyMs: number;
  ticket?: {
    bookingId: string;
    serial: number;
    assetCode: string;
    attendeeName: string;
    tierName: string;
    eventTitle: string;
    mintTxUrl: string | null;
    assetUrl: string | null;
  };
  redemption?: Redemption;
}

export interface ScanLogEntry {
  id: string;
  stage: "scan.verdict" | "redeem.submitted" | "redeem.confirmed" | "redeem.failed";
  verdict: ScanVerdict | null;
  reason: string | null;
  assetCode: string | null;
  serial: number | null;
  latencyMs: number | null;
  txHash: string | null;
  txUrl: string | null;
  error: string | null;
  createdAt: string;
}
