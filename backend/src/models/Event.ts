import { Schema, model, Document, Types } from "mongoose";

export interface ITicketTier {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  capacity: number;
  remaining: number;
}

export interface IEventTicketing {
  eventCode?: string;
  issuerPublicKey?: string;
  issuerSecretEncrypted?: string;
  nextSerial: number;
}

export interface IEvent extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  venue: string;
  date: Date;
  price: number;
  capacity: number;
  ticketsSold: number;
  imageUrl?: string;
  organizer: Types.ObjectId;
  tiers: Types.DocumentArray<ITicketTier>;
  ticketing: IEventTicketing;
  /** Extra photos for the event page. */
  gallery: string[];
  highlights: string[];
  schedule: { time: string; title: string }[];
  venueNotes?: string;
  /** Currency pre-selected for local payment at checkout. */
  localCurrency: string;
  /** Set by an admin to take an event off the storefront. */
  hidden: boolean;
  createdAt: Date;
}

const ticketTierSchema = new Schema<ITicketTier>({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  capacity: { type: Number, required: true, min: 1 },
  remaining: { type: Number, required: true, min: 0 },
});

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    // Lowest tier price and total tier capacity, kept for listings.
    price: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 1 },
    ticketsSold: { type: Number, default: 0, min: 0 },
    imageUrl: { type: String },
    organizer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    gallery: { type: [String], default: [] },
    highlights: { type: [String], default: [] },
    schedule: { type: [{ _id: false, time: String, title: String }], default: [] },
    venueNotes: { type: String, trim: true },
    localCurrency: { type: String, default: "KES" },
    hidden: { type: Boolean, default: false },
    tiers: { type: [ticketTierSchema], default: [] },
    ticketing: {
      eventCode: { type: String },
      issuerPublicKey: { type: String },
      issuerSecretEncrypted: { type: String, select: false },
      nextSerial: { type: Number, default: 0 },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

eventSchema.virtual("ticketsRemaining").get(function (this: IEvent) {
  return this.capacity - this.ticketsSold;
});

eventSchema.set("toJSON", { virtuals: true });

export default model<IEvent>("Event", eventSchema);
