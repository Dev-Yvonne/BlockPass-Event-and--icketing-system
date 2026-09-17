import { Schema, model, Document, Types } from "mongoose";

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
  createdAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    price: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 1 },
    ticketsSold: { type: Number, default: 0, min: 0 },
    imageUrl: { type: String },
    organizer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

eventSchema.virtual("ticketsRemaining").get(function (this: IEvent) {
  return this.capacity - this.ticketsSold;
});

eventSchema.set("toJSON", { virtuals: true });

export default model<IEvent>("Event", eventSchema);
