import { Keypair } from "@stellar/stellar-sdk";
import { encryptSecret } from "../../utils/walletCrypto";

// Friendbot can hang under load, and a checkout is waiting on this call.
const FRIENDBOT_TIMEOUT_MS = 8000;

export interface CustodialWallet {
  publicKey: string;
  encryptedSecret: string;
}

/** Generates a new custodial Stellar keypair for a user's ticket wallet. */
export function generateCustodialWallet(): CustodialWallet {
  const keypair = Keypair.random();
  return {
    publicKey: keypair.publicKey(),
    encryptedSecret: encryptSecret(keypair.secret()),
  };
}

/** Funds a testnet account via Friendbot. Callers handle retries and fallback. */
export async function fundTestnetAccount(publicKey: string): Promise<void> {
  const res = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`,
    { signal: AbortSignal.timeout(FRIENDBOT_TIMEOUT_MS) }
  );
  if (!res.ok && res.status !== 400) {
    throw new Error(`Friendbot funding failed with status ${res.status}`);
  }
}
