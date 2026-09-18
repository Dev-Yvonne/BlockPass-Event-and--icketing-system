import { Keypair, contract } from "@stellar/stellar-sdk";
import { AppError } from "../../utils/AppError";
import { TicketNftClient } from "./types";

let issuerKeypair: Keypair | null = null;
let clientPromise: Promise<TicketNftClient> | null = null;

function getConfig() {
  const contractId = process.env.STELLAR_CONTRACT_ID;
  const rpcUrl = process.env.STELLAR_RPC_URL;
  const networkPassphrase = process.env.STELLAR_NETWORK_PASSPHRASE;
  const issuerSecret = process.env.STELLAR_ISSUER_SECRET;

  if (!contractId || !rpcUrl || !networkPassphrase || !issuerSecret) {
    throw new AppError(
      "Stellar minting is not configured (missing STELLAR_CONTRACT_ID / STELLAR_RPC_URL / STELLAR_NETWORK_PASSPHRASE / STELLAR_ISSUER_SECRET)",
      500
    );
  }

  return { contractId, rpcUrl, networkPassphrase, issuerSecret };
}

/** The custodial keypair BlockPass uses as the ticket contract's admin. */
export function getIssuerKeypair(): Keypair {
  if (!issuerKeypair) {
    const { issuerSecret } = getConfig();
    issuerKeypair = Keypair.fromSecret(issuerSecret);
  }
  return issuerKeypair;
}

/**
 * A cached, ready-to-call client for the ticket-nft Soroban contract, bound
 * to sign transactions as BlockPass's custodial issuer/admin account.
 */
export async function getTicketContractClient(): Promise<TicketNftClient> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const { contractId, rpcUrl, networkPassphrase } = getConfig();
      const keypair = getIssuerKeypair();
      const { signTransaction, signAuthEntry } = contract.basicNodeSigner(
        keypair,
        networkPassphrase
      );

      const client = await contract.Client.from({
        contractId,
        rpcUrl,
        networkPassphrase,
        publicKey: keypair.publicKey(),
        signTransaction,
        signAuthEntry,
      });
      return client as unknown as TicketNftClient;
    })().catch((err) => {
      // Don't cache a failed connection attempt — allow the next call to retry.
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}
