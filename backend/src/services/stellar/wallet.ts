import { Keypair } from "@stellar/stellar-sdk";
import { encryptSecret } from "../../utils/walletCrypto";

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

/**
 * Funds a testnet account via Friendbot so it exists on-ledger. Best-effort:
 * failures are expected to be caught and logged by the caller rather than
 * blocking registration, since Friendbot is a shared, rate-limited testnet
 * utility and BlockPass's minting flow does not require the buyer's account
 * to exist on-ledger (only the issuer signs mint/check-in transactions).
 */
export async function fundTestnetAccount(publicKey: string): Promise<void> {
  const res = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
  );
  if (!res.ok && res.status !== 400) {
    throw new Error(`Friendbot funding failed with status ${res.status}`);
  }
}
