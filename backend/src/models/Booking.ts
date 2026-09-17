import { Schema, model, Document, Types } from "mongoose";
import crypto from "crypto";

export type BookingStatus = "confirmed" | "cancelled";

export interface IBooking extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  event: Types.ObjectId;
  quantity: number;
  totalPrice: number;
  status: BookingStatus;
  ticketCode: string;
  createdAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
    ticketCode: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(8).toString("hex").toUpperCase(),
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default model<IBooking>("Booking", bookingSchema);
