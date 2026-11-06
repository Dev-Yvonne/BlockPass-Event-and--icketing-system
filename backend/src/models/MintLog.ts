import { Schema, model, Document } from "mongoose";

export type MintStage = "order.received" | "mint.submitted" | "mint.confirmed" | "mint.failed";

export interface IMintLog extends Document {
  stage: MintStage;
  reference: string;
  eventTitle?: string;
  tierName?: string;
  quantity?: number;
  attendee?: string;
  assetCodes?: string[];
  issuer?: string;
  attendeePublicKey?: string;
  txHash?: string;
  ledger?: number;
  error?: string;
  createdAt: Date;
}

const mintLogSchema = new Schema<IMintLog>(
  {
    stage: { type: String, required: true, index: true },
    reference: { type: String, required: true, index: true },
    eventTitle: String,
    tierName: String,
    quantity: Number,
    attendee: String,
    assetCodes: [String],
    issuer: String,
    attendeePublicKey: String,
    txHash: String,
    ledger: Number,
    error: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default model<IMintLog>("MintLog", mintLogSchema);
