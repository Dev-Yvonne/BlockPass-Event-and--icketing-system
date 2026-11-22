import assert from "node:assert/strict";
import test from "node:test";
import { Account, Keypair } from "@stellar/stellar-sdk";
import { buildRedemptionTransaction } from "../src/services/stellar/redemption";

test("a redemption moves one ticket to the vault and closes the attendee's trustline", () => {
  const vault = Keypair.random().publicKey();
  const attendee = Keypair.random().publicKey();
  const issuer = Keypair.random().publicKey();
  const tx = buildRedemptionTransaction({
    source: new Account(vault, "100"),
    vaultPublicKey: vault,
    attendeePublicKey: attendee,
    assetCode: "NAIROG000012",
    issuerPublicKey: issuer,
  });

  assert.equal(tx.source, vault);
  assert.equal(tx.memo.value?.toString(), "RDM NAIROG000012");
  assert.deepEqual(
    tx.operations.map((op) => [op.type, op.source]),
    [
      ["changeTrust", vault],
      ["payment", attendee],
      ["changeTrust", attendee],
    ]
  );
  const [open, move, close] = tx.operations as unknown as Array<Record<string, any>>;
  assert.equal(open.limit, "1.0000000");
  assert.equal(move.destination, vault);
  assert.equal(move.amount, "1.0000000");
  assert.equal(move.asset.code, "NAIROG000012");
  assert.equal(move.asset.issuer, issuer);
  assert.equal(close.limit, "0.0000000");
});
