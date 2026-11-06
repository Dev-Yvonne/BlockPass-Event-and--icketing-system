import crypto from "crypto";
import { AppError } from "../utils/AppError";

export type PaymentMethod = "stablecoin" | "local";

/**
 * Fixed indicative rates per 1 USD for test mode. A live deployment needs a
 * rate feed, and the customer's quote must be locked when they pay.
 */
export const LOCAL_RATES: Record<string, number> = {
  KES: 129,
  NGN: 1550,
  GHS: 11,
  ZAR: 18,
  UGX: 3700,
  TZS: 2600,
  CDF: 2850,
};

export interface LocalCharge {
  amount: number;
  currency: string;
  phone: string;
  reference: string;
}

/** The seam a real provider plugs into: M-Pesa, Flutterwave and the like. */
export interface LocalPaymentProvider {
  name: string;
  charge(charge: LocalCharge): Promise<{ providerReference: string }>;
  refund(providerReference: string): Promise<void>;
}

/** Approves every charge and moves no money. It is the only provider today. */
export const sandboxProvider: LocalPaymentProvider = {
  name: "sandbox",
  async charge() {
    return { providerReference: `SBX-${crypto.randomBytes(5).toString("hex").toUpperCase()}` };
  },
  async refund() {},
};

export function quoteLocal(usd: number, currency: string) {
  const rate = LOCAL_RATES[currency];
  if (!rate) throw new AppError("That currency isn't supported", 400);
  return { rate, amount: Math.round(usd * rate * 100) / 100 };
}
