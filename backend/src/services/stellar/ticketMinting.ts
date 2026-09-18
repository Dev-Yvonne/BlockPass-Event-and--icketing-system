import { getIssuerKeypair, getTicketContractClient } from "./contractClient";
import { AppError } from "../../utils/AppError";
import { OnChainTicket } from "./types";

export interface MintResult {
  tokenId: string;
  txHash: string;
}

export type { OnChainTicket };

function assertSucceeded(status: string | undefined, action: string): void {
  if (status !== "SUCCESS") {
    throw new AppError(
      `${action} did not succeed on-chain (status: ${status ?? "UNKNOWN"})`,
      502
    );
  }
}

/** One-time setup: sets BlockPass's issuer account as the contract admin. */
export async function initializeContract(): Promise<string> {
  const client = await getTicketContractClient();
  const assembled = await client.initialize({ admin: getIssuerKeypair().publicKey() });
  const sent = await assembled.signAndSend();
  assertSucceeded(sent.getTransactionResponse?.status, "Contract initialization");
  const hash = sent.sendTransactionResponse?.hash;
  if (!hash) throw new AppError("Initialization transaction was not submitted", 502);
  return hash;
}

/**
 * Mints a single ticket NFT to the buyer's custodial wallet. Called once per
 * ticket in a booking so each physical ticket maps to exactly one on-chain
 * token id.
 */
export async function mintTicket(params: {
  toPublicKey: string;
  eventId: string;
  serial: number;
}): Promise<MintResult> {
  const client = await getTicketContractClient();

  const assembled = await client.mint({
    to: params.toPublicKey,
    event_id: params.eventId,
    serial: params.serial,
  });
  const sent = await assembled.signAndSend();
  assertSucceeded(sent.getTransactionResponse?.status, "Ticket mint");

  const hash = sent.sendTransactionResponse?.hash;
  if (!hash) throw new AppError("Mint transaction was not submitted", 502);

  const tokenId = sent.result as unknown as bigint;
  return { tokenId: tokenId.toString(), txHash: hash };
}

/**
 * Marks a ticket as used at the venue gate. Rejects a second scan of the
 * same token id, which is the on-chain defense against duplicate-screenshot
 * re-entry.
 */
export async function checkInTicket(tokenId: string): Promise<string> {
  const client = await getTicketContractClient();
  const assembled = await client.check_in({ token_id: BigInt(tokenId) });
  const sent = await assembled.signAndSend();
  assertSucceeded(sent.getTransactionResponse?.status, "Ticket check-in");
  const hash = sent.sendTransactionResponse?.hash;
  if (!hash) throw new AppError("Check-in transaction was not submitted", 502);
  return hash;
}

/** Reads a ticket's current on-chain state (owner, event, check-in status). */
export async function getTicketOnChain(tokenId: string): Promise<OnChainTicket> {
  const client = await getTicketContractClient();
  const assembled = await client.get_ticket({ token_id: BigInt(tokenId) });
  return assembled.result as unknown as OnChainTicket;
}
