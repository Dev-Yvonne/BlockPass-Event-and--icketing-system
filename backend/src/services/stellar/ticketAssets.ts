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
import {
  getDistributorKeypair,
  getHorizon,
  getStablecoinIssuerKeypair,
  NETWORK_PASSPHRASE,
  STABLECOIN_CODE,
} from "./config";
import { enqueueDistributorTx } from "./txQueue";

const EVENT_CODE_LENGTH = 5;
const SERIAL_DIGITS = 6;
export const MAX_SERIAL = 10 ** SERIAL_DIGITS - 1;

const MAX_FEE_PER_OP = "1000";
const TX_TIMEOUT_SECONDS = 180;
const SUBMIT_ATTEMPTS = 4;

/** Short, readable, event-specific prefix: "Lagos Live Nights" -> "LAGOS". */
export function deriveEventCode(title: string): string {
  const letters = title.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return letters.slice(0, EVENT_CODE_LENGTH).padEnd(3, "X");
}

/**
 * Stellar asset codes are at most 12 alphanumerics: 5 event + 1 tier + 6
 * serial. An asset is identified by code + issuer, and each event has its own
 * issuer, so codes only have to be unique within an event.
 */
export function buildAssetCode(eventCode: string, tierName: string, serial: number): string {
  if (!Number.isInteger(serial) || serial < 1 || serial > MAX_SERIAL) {
    throw new Error(`Serial out of range: ${serial}`);
  }
  const tierLetter = tierName.toUpperCase().replace(/[^A-Z0-9]/g, "").charAt(0) || "T";
  return `${eventCode}${tierLetter}${String(serial).padStart(SERIAL_DIGITS, "0")}`;
}

export interface MintTransactionInput {
  source: Account;
  issuerPublicKey: string;
  distributorPublicKey: string;
  attendeePublicKey: string;
  assetCodes: string[];
  reference: string;
  /** Present when the attendee pays in the test stablecoin. */
  stablecoin?: { issuerPublicKey: string; amount: string };
}

/**
 * Builds one atomic transaction for a whole order. For each ticket it:
 *   1. opens a trustline on the distributor and the attendee, each capped at 1
 *   2. issues exactly one unit from the issuer to the distributor
 *   3. distributes that unit to the attendee
 *   4. closes the distributor's now-empty trustline to release its reserve
 *
 * The attendee's limit of 1 means replaying a mint fails with op_line_full
 * rather than issuing a second copy of a serial.
 */
export function buildMintTransaction(input: MintTransactionInput): Transaction {
  const { source, issuerPublicKey, distributorPublicKey, attendeePublicKey } = input;

  const builder = new TransactionBuilder(source, {
    fee: MAX_FEE_PER_OP,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addMemo(Memo.text(`BP ${input.reference}`.slice(0, 28)))
    .setTimeout(TX_TIMEOUT_SECONDS);

  // Payment shares the mint's transaction, so an attendee can't pay without
  // receiving tickets, or receive tickets without paying.
  if (input.stablecoin) {
    const { issuerPublicKey: payIssuer, amount } = input.stablecoin;
    const dollar = new Asset(STABLECOIN_CODE, payIssuer);
    builder
      .addOperation(Operation.changeTrust({ asset: dollar, source: distributorPublicKey }))
      .addOperation(Operation.changeTrust({ asset: dollar, source: attendeePublicKey }))
      // Test funds: the attendee's custodial wallet has no other source of them.
      .addOperation(
        Operation.payment({
          destination: attendeePublicKey,
          asset: dollar,
          amount,
          source: payIssuer,
        })
      )
      .addOperation(
        Operation.payment({
          destination: distributorPublicKey,
          asset: dollar,
          amount,
          source: attendeePublicKey,
        })
      );
  }

  for (const code of input.assetCodes) {
    const asset = new Asset(code, issuerPublicKey);
    builder
      .addOperation(
        Operation.changeTrust({ asset, limit: "1", source: distributorPublicKey })
      )
      .addOperation(Operation.changeTrust({ asset, limit: "1", source: attendeePublicKey }))
      .addOperation(
        Operation.payment({
          destination: distributorPublicKey,
          asset,
          amount: "1",
          source: issuerPublicKey,
        })
      )
      .addOperation(
        Operation.payment({
          destination: attendeePublicKey,
          asset,
          amount: "1",
          source: distributorPublicKey,
        })
      )
      .addOperation(
        Operation.changeTrust({ asset, limit: "0", source: distributorPublicKey })
      );
  }

  return builder.build();
}

interface HorizonSubmitError {
  response?: {
    status?: number;
    data?: { extras?: { result_codes?: { transaction?: string; operations?: string[] } } };
  };
}

function resultCodes(err: unknown) {
  return (err as HorizonSubmitError).response?.data?.extras?.result_codes;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findLandedTransaction(hash: string) {
  try {
    const tx = await getHorizon().transactions().transaction(hash).call();
    return tx.successful ? tx : null;
  } catch {
    return null;
  }
}

export interface MintResult {
  txHash: string;
  ledger: number;
}

export interface MintParams {
  reference: string;
  assetCodes: string[];
  issuer: Keypair;
  attendee: Keypair;
  /** Stablecoin amount to collect in the mint transaction, e.g. "50.00". */
  stablecoinAmount?: string;
}

async function submitMint(params: MintParams): Promise<MintResult> {
  const horizon = getHorizon();
  const distributor = getDistributorKeypair();
  const payIssuer = params.stablecoinAmount ? getStablecoinIssuerKeypair() : null;

  for (let attempt = 1; attempt <= SUBMIT_ATTEMPTS; attempt++) {
    const source = await horizon.loadAccount(distributor.publicKey());
    const tx = buildMintTransaction({
      source,
      issuerPublicKey: params.issuer.publicKey(),
      distributorPublicKey: distributor.publicKey(),
      attendeePublicKey: params.attendee.publicKey(),
      assetCodes: params.assetCodes,
      reference: params.reference,
      stablecoin: payIssuer
        ? { issuerPublicKey: payIssuer.publicKey(), amount: params.stablecoinAmount! }
        : undefined,
    });
    tx.sign(distributor, params.issuer, params.attendee);
    if (payIssuer) tx.sign(payIssuer);

    try {
      const result = await horizon.submitTransaction(tx);
      return { txHash: result.hash, ledger: result.ledger };
    } catch (err) {
      const status = (err as HorizonSubmitError).response?.status;
      const codes = resultCodes(err);

      // A timeout or dropped connection does not mean the transaction failed, so check before
      // rebuilding. If it lands late the rebuild loses on sequence or line
      // limit, so a serial can't be issued twice either way.
      if (status === undefined || status === 504) {
        await sleep(5000);
        const landed = await findLandedTransaction(tx.hash().toString("hex"));
        if (landed) return { txHash: landed.hash, ledger: landed.ledger_attr };
      } else if (codes?.transaction !== "tx_bad_seq") {
        const detail = codes
          ? `${codes.transaction}${codes.operations ? ` [${codes.operations.join(", ")}]` : ""}`
          : (err as Error).message;
        throw new AppError(`Stellar rejected the mint: ${detail}`, 502);
      }
      if (attempt < SUBMIT_ATTEMPTS) await sleep(500 * attempt);
    }
  }

  throw new AppError("Stellar did not confirm the mint in time", 504);
}

/** Issues and distributes every ticket in an order in a single transaction. */
export function mintTickets(params: MintParams): Promise<MintResult> {
  return enqueueDistributorTx(() => submitMint(params));
}
