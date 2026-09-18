/**
 * One-time setup: run once after deploying the ticket-nft contract (see
 * contracts/ticket-nft/README.md) to set BlockPass's custodial issuer
 * account as the contract admin.
 *
 * Usage: npm run stellar:init
 */
import dotenv from "dotenv";
dotenv.config();

import { initializeContract } from "../src/services/stellar/ticketMinting";
import { getIssuerKeypair } from "../src/services/stellar/contractClient";

async function main() {
  console.log(`Initializing contract with admin ${getIssuerKeypair().publicKey()}...`);
  const hash = await initializeContract();
  console.log(`Done. Transaction hash: ${hash}`);
}

main().catch((err) => {
  console.error("Failed to initialize contract:", err);
  process.exit(1);
});
