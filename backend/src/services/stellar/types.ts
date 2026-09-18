import { contract } from "@stellar/stellar-sdk";

export interface OnChainTicket {
  event_id: string;
  serial: number;
  owner: string;
  checked_in: boolean;
}

/**
 * `contract.Client.from()` generates its methods dynamically at runtime from
 * the on-chain contract spec, so TypeScript can't see them on the base
 * `Client` class. This interface describes the ticket-nft contract's surface
 * (see contracts/ticket-nft/src/lib.rs) so the rest of the backend gets type
 * safety when calling it.
 */
export interface TicketNftClient {
  initialize(args: { admin: string }): Promise<contract.AssembledTransaction<null>>;
  mint(args: {
    to: string;
    event_id: string;
    serial: number;
  }): Promise<contract.AssembledTransaction<bigint>>;
  owner_of(args: { token_id: bigint }): Promise<contract.AssembledTransaction<string>>;
  get_ticket(args: {
    token_id: bigint;
  }): Promise<contract.AssembledTransaction<OnChainTicket>>;
  check_in(args: { token_id: bigint }): Promise<contract.AssembledTransaction<null>>;
  transfer(args: {
    from: string;
    to: string;
    token_id: bigint;
  }): Promise<contract.AssembledTransaction<null>>;
}
