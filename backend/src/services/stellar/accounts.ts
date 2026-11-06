import { Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { getDistributorKeypair, getHorizon, NETWORK_PASSPHRASE } from "./config";
import { enqueueDistributorTx } from "./txQueue";
import { fundTestnetAccount } from "./wallet";

// Covers the 1 XLM base reserve plus 38 tickets at 0.5 XLM per trustline.
const STARTING_BALANCE = "20";
const FRIENDBOT_ATTEMPTS = 2;

export async function accountExists(publicKey: string): Promise<boolean> {
  try {
    await getHorizon().loadAccount(publicKey);
    return true;
  } catch (err) {
    if ((err as { response?: { status?: number } }).response?.status === 404) return false;
    throw err;
  }
}

/** Friendbot can finish after our timeout, so the account beats our fallback to the ledger. */
export function isAccountAlreadyCreated(err: unknown): boolean {
  const operations = (
    err as { response?: { data?: { extras?: { result_codes?: { operations?: string[] } } } } }
  ).response?.data?.extras?.result_codes?.operations;
  return operations?.includes("op_already_exists") ?? false;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createFromDistributor(publicKey: string): Promise<void> {
  await enqueueDistributorTx(async () => {
    // Two first orders from one email can queue up for the same new account.
    if (await accountExists(publicKey)) return;
    const distributor = getDistributorKeypair();
    const source = await getHorizon().loadAccount(distributor.publicKey());
    const tx = new TransactionBuilder(source, {
      fee: "1000",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.createAccount({
          destination: publicKey,
          startingBalance: STARTING_BALANCE,
        })
      )
      .setTimeout(120)
      .build();
    tx.sign(distributor);
    try {
      await getHorizon().submitTransaction(tx);
    } catch (err) {
      if (!isAccountAlreadyCreated(err)) throw err;
    }
  });
}

/** Creates an attendee wallet without making a buyer wait on Friendbot. */
export async function ensureAttendeeAccount(publicKey: string): Promise<void> {
  if (!(await accountExists(publicKey))) await createFromDistributor(publicKey);
}

/**
 * Makes sure an issuer account exists on the ledger. Friendbot is the primary
 * route; because it is a shared, rate-limited testnet service, the distributor
 * can create the account directly so an outage doesn't fail a checkout.
 */
export async function ensureFunded(
  publicKey: string,
  options: { allowDistributorFallback?: boolean } = {}
): Promise<void> {
  if (await accountExists(publicKey)) return;

  for (let attempt = 1; attempt <= FRIENDBOT_ATTEMPTS; attempt++) {
    try {
      await fundTestnetAccount(publicKey);
      if (await accountExists(publicKey)) return;
    } catch (err) {
      console.warn(`Friendbot attempt ${attempt} failed for ${publicKey}:`, (err as Error).message);
    }
    if (attempt < FRIENDBOT_ATTEMPTS) await sleep(1000 * attempt);
  }

  if (!options.allowDistributorFallback) {
    throw new Error(`Could not fund ${publicKey} via Friendbot`);
  }
  await createFromDistributor(publicKey);
}
