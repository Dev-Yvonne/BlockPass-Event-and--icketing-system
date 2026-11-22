import {
  Account,
  Asset,
  Keypair,
  Memo,
  Operation,
  Transaction,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { AppError } from "../../utils/AppError";
import { getDistributorKeypair, getHorizon, getVaultKeypair, NETWORK_PASSPHRASE } from "./config";
import { enqueueDistributorTx, enqueueVaultTx } from "./txQueue";

const MAX_FEE_PER_OP = "1000";
const TX_TIMEOUT_SECONDS = 120;
const SUBMIT_ATTEMPTS = 4;
/** Each ticket the vault holds locks 0.5 XLM of reserve. */
const VAULT_TOP_UP_XLM = "100";

export type Holding = "held" | "not_held";

interface HorizonError {
  response?: {
    status?: number;
    data?: { extras?: { result_codes?: { transaction?: string; operations?: string[] } } };
  };
}

const resultCodes = (err: unknown) => (err as HorizonError).response?.data?.extras?.result_codes;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Reads the ledger directly: does this account hold one unit of the ticket? */
export async function ticketHolding(
  publicKey: string,
  assetCode: string,
  issuer: string
): Promise<Holding> {
  try {
    const account = await getHorizon().loadAccount(publicKey);
    const line = account.balances.find(
      (b) =>
        (b.asset_type === "credit_alphanum4" || b.asset_type === "credit_alphanum12") &&
        b.asset_code === assetCode &&
        b.asset_issuer === issuer
    );
    return line && Number(line.balance) >= 1 ? "held" : "not_held";
  } catch (err) {
    if ((err as HorizonError).response?.status === 404) return "not_held";
    throw err;
  }
}

export interface RedemptionTransactionInput {
  source: Account;
  vaultPublicKey: string;
  attendeePublicKey: string;
  assetCode: string;
  issuerPublicKey: string;
}

/**
 * One atomic transaction per check-in:
 *   1. the vault opens a trustline for this ticket, capped at 1
 *   2. the attendee's wallet sends the ticket to the vault
 *   3. the attendee's empty trustline is closed, returning its reserve
 *
 * Replaying it fails on-chain because the attendee no longer holds the ticket,
 * so the ledger itself refuses a second check-in.
 */
export function buildRedemptionTransaction(input: RedemptionTransactionInput): Transaction {
  const asset = new Asset(input.assetCode, input.issuerPublicKey);
  return new TransactionBuilder(input.source, {
    fee: MAX_FEE_PER_OP,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addMemo(Memo.text(`RDM ${input.assetCode}`.slice(0, 28)))
    .setTimeout(TX_TIMEOUT_SECONDS)
    .addOperation(Operation.changeTrust({ asset, limit: "1", source: input.vaultPublicKey }))
    .addOperation(
      Operation.payment({
        destination: input.vaultPublicKey,
        asset,
        amount: "1",
        source: input.attendeePublicKey,
      })
    )
    .addOperation(Operation.changeTrust({ asset, limit: "0", source: input.attendeePublicKey }))
    .build();
}

async function findLandedTransaction(hash: string) {
  try {
    const tx = await getHorizon().transactions().transaction(hash).call();
    return tx.successful ? { txHash: tx.hash, ledger: tx.ledger_attr } : null;
  } catch {
    return null;
  }
}

/** Public so a retry can check a transaction that was sent but never confirmed. */
export const findConfirmedTransaction = findLandedTransaction;

async function topUpVault(vaultPublicKey: string): Promise<void> {
  await enqueueDistributorTx(async () => {
    const distributor = getDistributorKeypair();
    const source = await getHorizon().loadAccount(distributor.publicKey());
    const tx = new TransactionBuilder(source, { fee: MAX_FEE_PER_OP, networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(
        Operation.payment({ destination: vaultPublicKey, asset: Asset.native(), amount: VAULT_TOP_UP_XLM })
      )
      .setTimeout(TX_TIMEOUT_SECONDS)
      .build();
    tx.sign(distributor);
    await getHorizon().submitTransaction(tx);
  });
}

export interface RedemptionParams {
  assetCode: string;
  issuerPublicKey: string;
  attendee: Keypair;
  /** Called with each transaction's hash before it is sent. */
  onBuilt?: (hash: string) => Promise<void>;
}

export interface RedemptionResult {
  txHash: string;
  ledger: number;
}

async function submitRedemption(params: RedemptionParams): Promise<RedemptionResult> {
  const horizon = getHorizon();
  const vault = getVaultKeypair();
  let toppedUp = false;

  for (let attempt = 1; attempt <= SUBMIT_ATTEMPTS; attempt++) {
    const source = await horizon.loadAccount(vault.publicKey());
    const tx = buildRedemptionTransaction({
      source,
      vaultPublicKey: vault.publicKey(),
      attendeePublicKey: params.attendee.publicKey(),
      assetCode: params.assetCode,
      issuerPublicKey: params.issuerPublicKey,
    });
    tx.sign(vault, params.attendee);
    const hash = tx.hash().toString("hex");
    await params.onBuilt?.(hash);

    try {
      const result = await horizon.submitTransaction(tx);
      return { txHash: result.hash, ledger: result.ledger };
    } catch (err) {
      const status = (err as HorizonError).response?.status;
      const codes = resultCodes(err);
      const ops = codes?.operations ?? [];

      if (status === undefined || status === 504) {
        // A timeout doesn't mean failure: look before building another one.
        await sleep(5000);
        const landed = await findLandedTransaction(hash);
        if (landed) return landed;
      } else if (!toppedUp && ops.includes("op_low_reserve")) {
        await topUpVault(vault.publicKey());
        toppedUp = true;
      } else if (codes?.transaction !== "tx_bad_seq") {
        const detail = codes
          ? `${codes.transaction}${ops.length ? ` [${ops.join(", ")}]` : ""}`
          : (err as Error).message;
        throw new AppError(`Stellar rejected the redemption: ${detail}`, 502);
      }
      if (attempt < SUBMIT_ATTEMPTS) await sleep(400 * attempt);
    }
  }
  throw new AppError("Stellar did not confirm the redemption in time", 504);
}

/** Moves one ticket from its attendee to the vault. */
export function redeemTicketOnChain(params: RedemptionParams): Promise<RedemptionResult> {
  return enqueueVaultTx(() => submitRedemption(params));
}
