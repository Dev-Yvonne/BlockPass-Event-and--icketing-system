/**
 * Mints one ticket directly through the service, with no web app or database,
 * and prints the Horizon transaction hash.
 *
 *   npm run stellar:mint-demo
 */
import dotenv from "dotenv";
dotenv.config();

import { Keypair } from "@stellar/stellar-sdk";
import { ensureFunded } from "../src/services/stellar/accounts";
import { explorer } from "../src/services/stellar/config";
import { buildAssetCode, deriveEventCode, mintTickets } from "../src/services/stellar/ticketAssets";

async function main() {
  const issuer = Keypair.random();
  const attendee = Keypair.random();
  await ensureFunded(issuer.publicKey());
  await ensureFunded(attendee.publicKey());

  const assetCode = buildAssetCode(deriveEventCode("BlockPass Demo"), "General", 1);
  const { txHash, ledger } = await mintTickets({
    reference: "MINTDEMO",
    assetCodes: [assetCode],
    issuer,
    attendee,
  });

  console.log(`Asset:    ${assetCode}`);
  console.log(`Issuer:   ${issuer.publicKey()}`);
  console.log(`Attendee: ${attendee.publicKey()}`);
  console.log(`Ledger:   ${ledger}`);
  console.log(`Tx hash:  ${txHash}`);
  console.log(`Explorer: ${explorer.tx(txHash)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
