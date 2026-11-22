import crypto from "crypto";
import { Keypair } from "@stellar/stellar-sdk";

/**
 * A pass QR code holds a short-lived token signed with Ed25519:
 *
 *   BP1.<payload>.<signature>     (both base64url)
 *
 * The payload names one ticket and a 30-second validity window. A screenshot
 * stops scanning once the window closes, and the signature means nobody can
 * forge or edit a token without the server's key.
 */
export const PASS_TOKEN_PREFIX = "BP1";
export const PASS_TOKEN_TTL_SECONDS = 30;
/** Allows for a phone clock or network that runs a little behind. */
const CLOCK_LEEWAY_SECONDS = 5;

export interface PassTokenPayload {
  /** Booking id. */
  b: string;
  /** Ticket serial within the event. */
  s: number;
  /** Issued at, in Unix seconds. */
  iat: number;
  /** Expires at, in Unix seconds. */
  exp: number;
  /** Random, so two tokens issued in the same second still differ. */
  n: string;
}

export type PassTokenFailure = "malformed" | "bad_signature" | "expired";

export type PassTokenResult =
  | { ok: true; payload: PassTokenPayload }
  | { ok: false; reason: PassTokenFailure };

const toBase64Url = (data: Buffer) => data.toString("base64url");
const fromBase64Url = (data: string) => Buffer.from(data, "base64url");

export function signPassToken(
  ticket: { bookingId: string; serial: number },
  signer: Keypair,
  now = Date.now()
): { token: string; expiresAt: number } {
  const iat = Math.floor(now / 1000);
  const payload: PassTokenPayload = {
    b: ticket.bookingId,
    s: ticket.serial,
    iat,
    exp: iat + PASS_TOKEN_TTL_SECONDS,
    n: crypto.randomBytes(4).toString("hex"),
  };
  const body = toBase64Url(Buffer.from(JSON.stringify(payload)));
  const signature = signer.sign(Buffer.from(`${PASS_TOKEN_PREFIX}.${body}`));
  return {
    token: `${PASS_TOKEN_PREFIX}.${body}.${toBase64Url(signature)}`,
    expiresAt: payload.exp * 1000,
  };
}

function isPayload(value: unknown): value is PassTokenPayload {
  const p = value as PassTokenPayload;
  return (
    typeof p === "object" &&
    p !== null &&
    typeof p.b === "string" &&
    /^[a-f0-9]{24}$/.test(p.b) &&
    Number.isInteger(p.s) &&
    p.s > 0 &&
    Number.isInteger(p.iat) &&
    Number.isInteger(p.exp) &&
    p.exp > p.iat
  );
}

/** Checks the signature first, so nothing in an unsigned token is trusted. */
export function verifyPassToken(
  token: string,
  verifier: Keypair,
  now = Date.now()
): PassTokenResult {
  const parts = typeof token === "string" ? token.trim().split(".") : [];
  if (parts.length !== 3 || parts[0] !== PASS_TOKEN_PREFIX || !parts[1] || !parts[2]) {
    return { ok: false, reason: "malformed" };
  }

  const signature = fromBase64Url(parts[2]);
  let valid = false;
  try {
    valid = signature.length === 64 && verifier.verify(Buffer.from(`${parts[0]}.${parts[1]}`), signature);
  } catch {
    valid = false;
  }
  if (!valid) return { ok: false, reason: "bad_signature" };

  let payload: unknown;
  try {
    payload = JSON.parse(fromBase64Url(parts[1]).toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!isPayload(payload)) return { ok: false, reason: "malformed" };

  const seconds = now / 1000;
  if (seconds > payload.exp + CLOCK_LEEWAY_SECONDS || seconds < payload.iat - CLOCK_LEEWAY_SECONDS) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, payload };
}
