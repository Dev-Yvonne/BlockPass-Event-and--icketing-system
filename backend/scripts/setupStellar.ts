/**
 * Creates backend/.env with a funded testnet distributor account and generated
 * secrets, then provisions and funds a sample issuer to prove the pipeline.
 * Safe to re-run: existing values are kept. Secrets are never printed.
 *
 *   npm run stellar:setup
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Keypair } from "@stellar/stellar-sdk";
import { getHorizon, explorer } from "../src/services/stellar/config";
import { ensureFunded } from "../src/services/stellar/accounts";

const ENV_PATH = path.join(__dirname, "../.env");
const EXAMPLE_PATH = path.join(__dirname, "../.env.example");

function setEnvValue(contents: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  return pattern.test(contents) ? contents.replace(pattern, line) : `${contents.trimEnd()}\n${line}\n`;
}

async function fundAndReport(label: string, publicKey: string) {
  // Friendbot is often slow, so the distributor can open the other accounts.
  await ensureFunded(publicKey, { allowDistributorFallback: label !== "Distributor" });
  const account = await getHorizon().loadAccount(publicKey);
  const xlm = account.balances.find((b) => b.asset_type === "native")?.balance;
  console.log(`${label}: ${publicKey}\n  balance: ${xlm} XLM\n  ${explorer.account(publicKey)}`);
}

async function main() {
  let env = fs.readFileSync(fs.existsSync(ENV_PATH) ? ENV_PATH : EXAMPLE_PATH, "utf8");
  const current = dotenv.parse(env);

  if (!current.JWT_SECRET || current.JWT_SECRET === "change_this_secret") {
    env = setEnvValue(env, "JWT_SECRET", crypto.randomBytes(32).toString("hex"));
  }
  if (!current.WALLET_ENCRYPTION_KEY) {
    env = setEnvValue(env, "WALLET_ENCRYPTION_KEY", crypto.randomBytes(32).toString("base64"));
  }

  const distributor = current.STELLAR_DISTRIBUTOR_SECRET
    ? Keypair.fromSecret(current.STELLAR_DISTRIBUTOR_SECRET)
    : Keypair.random();
  env = setEnvValue(env, "STELLAR_DISTRIBUTOR_SECRET", distributor.secret());
  const stablecoin = current.STELLAR_STABLECOIN_ISSUER_SECRET
    ? Keypair.fromSecret(current.STELLAR_STABLECOIN_ISSUER_SECRET)
    : Keypair.random();
  env = setEnvValue(env, "STELLAR_STABLECOIN_ISSUER_SECRET", stablecoin.secret());
  fs.writeFileSync(ENV_PATH, env, { mode: 0o600 });
  dotenv.config({ path: ENV_PATH, override: true });

  await fundAndReport("Distributor", distributor.publicKey());
  await fundAndReport("Test stablecoin issuer", stablecoin.publicKey());
  await fundAndReport("Sample issuer", Keypair.random().publicKey());
  console.log(`\nSaved configuration to ${ENV_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
