import { Schema, model, Document } from "mongoose";

export interface IAttendeeWallet extends Document {
  email: string;
  publicKey: string;
  encryptedSecret: string;
}

/** Custodial testnet wallet, so attendees hold tickets without any crypto setup. */
const attendeeWalletSchema = new Schema<IAttendeeWallet>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    publicKey: { type: String, required: true },
    encryptedSecret: { type: String, required: true, select: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default model<IAttendeeWallet>("AttendeeWallet", attendeeWalletSchema);
