import { Schema, model, Document, Types } from "mongoose";

export type ScanStage = "scan.verdict" | "redeem.submitted" | "redeem.confirmed" | "redeem.failed";
export type ScanVerdict = "valid" | "already_redeemed" | "invalid";

export interface IScanLog extends Document {
  stage: ScanStage;
  event?: Types.ObjectId;
  eventTitle?: string;
  booking?: Types.ObjectId;
  serial?: number;
  assetCode?: string;
  verdict?: ScanVerdict;
  reason?: string;
  /** Scan received to verdict sent, in milliseconds. */
  latencyMs?: number;
  scannedBy?: Types.ObjectId;
  attendeePublicKey?: string;
  txHash?: string;
  ledger?: number;
  error?: string;
  createdAt: Date;
}

const scanLogSchema = new Schema<IScanLog>(
  {
    stage: { type: String, required: true, index: true },
    event: { type: Schema.Types.ObjectId, ref: "Event", index: true },
    eventTitle: String,
    booking: { type: Schema.Types.ObjectId, ref: "Booking" },
    serial: Number,
    assetCode: String,
    verdict: String,
    reason: String,
    latencyMs: Number,
    scannedBy: { type: Schema.Types.ObjectId, ref: "User" },
    attendeePublicKey: String,
    txHash: String,
    ledger: Number,
    error: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default model<IScanLog>("ScanLog", scanLogSchema);
