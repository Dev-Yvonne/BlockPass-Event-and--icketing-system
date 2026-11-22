import { Horizon, Keypair, Networks } from "@stellar/stellar-sdk";
import { AppError } from "../../utils/AppError";

/**
 * Round 1 is testnet only. The passphrase is a constant rather than an env var
 * so a misconfigured deploy cannot point this service at mainnet.
 */
export const NETWORK_PASSPHRASE = Networks.TESTNET;

const DEFAULT_HORIZON_URL = "https://horizon-testnet.stellar.org";
const EXPLORER_BASE = "https://stellar.expert/explorer/testnet";

let horizon: Horizon.Server | null = null;

export function getHorizon(): Horizon.Server {
  if (!horizon) {
    horizon = new Horizon.Server(process.env.STELLAR_HORIZON_URL || DEFAULT_HORIZON_URL);
  }
  return horizon;
}

/** The platform account every ticket passes through on its way to an attendee. */
export function getDistributorKeypair(): Keypair {
  const secret = process.env.STELLAR_DISTRIBUTOR_SECRET;
  if (!secret) {
    throw new AppError(
      "Stellar minting is not configured (missing STELLAR_DISTRIBUTOR_SECRET). Run npm run stellar:setup.",
      500
    );
  }
  return Keypair.fromSecret(secret);
}

/** Clearly named test asset: it stands in for a stablecoin and has no value. */
export const STABLECOIN_CODE = "BPUSD";

export function getStablecoinIssuerKeypair(): Keypair {
  const secret = process.env.STELLAR_STABLECOIN_ISSUER_SECRET;
  if (!secret) {
    throw new AppError(
      "Stablecoin payments are not configured (missing STELLAR_STABLECOIN_ISSUER_SECRET). Run npm run stellar:setup.",
      500
    );
  }
  return Keypair.fromSecret(secret);
}

/**
 * Holds every ticket that has been scanned at a gate. Moving a ticket here,
 * rather than tracking it only in the database, makes reuse visible on-chain.
 */
export function getVaultKeypair(): Keypair {
  const secret = process.env.STELLAR_VAULT_SECRET;
  if (!secret) {
    throw new AppError(
      "Gate redemption is not configured (missing STELLAR_VAULT_SECRET). Run npm run stellar:setup.",
      500
    );
  }
  return Keypair.fromSecret(secret);
}

/** Signs pass QR codes. A separate key, so it can rotate without touching funds. */
export function getPassSigningKeypair(): Keypair {
  const secret = process.env.PASS_SIGNING_SECRET;
  if (!secret) {
    throw new AppError(
      "Passes are not configured (missing PASS_SIGNING_SECRET). Run npm run stellar:setup.",
      500
    );
  }
  return Keypair.fromSecret(secret);
}

export const explorer = {
  tx: (hash: string) => `${EXPLORER_BASE}/tx/${hash}`,
  account: (publicKey: string) => `${EXPLORER_BASE}/account/${publicKey}`,
  asset: (code: string, issuer: string) => `${EXPLORER_BASE}/asset/${code}-${issuer}`,
};
