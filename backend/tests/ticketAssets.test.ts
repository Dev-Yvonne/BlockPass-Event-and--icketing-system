import assert from "node:assert/strict";
import { test } from "node:test";
import { Account, Keypair, Networks, Operation } from "@stellar/stellar-sdk";
import {
  buildAssetCode,
  buildMintTransaction,
  deriveEventCode,
} from "../src/services/stellar/ticketAssets";

const issuer = Keypair.random().publicKey();
const distributor = Keypair.random().publicKey();
const attendee = Keypair.random().publicKey();

function build(assetCodes: string[]) {
  return buildMintTransaction({
    source: new Account(distributor, "100"),
    issuerPublicKey: issuer,
    distributorPublicKey: distributor,
    attendeePublicKey: attendee,
    assetCodes,
    reference: "ABCDEF0123456789",
  });
}

test("event codes are readable, uppercase and alphanumeric", () => {
  assert.equal(deriveEventCode("Lagos Live Nights"), "LAGOS");
  assert.equal(deriveEventCode("A-1 Show!"), "A1SHO");
  assert.match(deriveEventCode("***"), /^[A-Z0-9]+$/);
});

test("asset codes stay within Stellar's 12-character limit", () => {
  const code = buildAssetCode("LAGOS", "VIP", 42);
  assert.equal(code, "LAGOSV000042");
  assert.ok(buildAssetCode("LAGOS", "General Admission", 999999).length <= 12);
  assert.match(buildAssetCode("LAGOS", "---", 1), /^[A-Z0-9]{1,12}$/);
});

test("serials outside the valid range are refused", () => {
  for (const serial of [0, -1, 1.5, 1_000_000]) {
    assert.throws(() => buildAssetCode("LAGOS", "VIP", serial));
  }
});

test("a ticket mints as trust, trust, issue, distribute, close", () => {
  const ops = build(["LAGOSV000001"]).operations;
  assert.deepEqual(
    ops.map((op) => [op.type, op.source]),
    [
      ["changeTrust", distributor],
      ["changeTrust", attendee],
      ["payment", issuer],
      ["payment", distributor],
      ["changeTrust", distributor],
    ]
  );
  const [, attendeeTrust, issue, distribute, close] = ops as [
    Operation,
    Operation.ChangeTrust,
    Operation.Payment,
    Operation.Payment,
    Operation.ChangeTrust,
  ];
  assert.equal(Number(attendeeTrust.limit), 1);
  assert.equal(Number(issue.amount), 1);
  assert.equal(issue.destination, distributor);
  assert.equal(distribute.destination, attendee);
  assert.equal(Number(close.limit), 0);
});

test("the largest order fits in one atomic transaction on testnet", () => {
  const codes = Array.from({ length: 10 }, (_, i) => buildAssetCode("LAGOS", "G", i + 1));
  const tx = build(codes);
  assert.equal(tx.operations.length, 50);
  assert.ok(tx.operations.length <= 100);
  assert.equal(tx.networkPassphrase, Networks.TESTNET);
  assert.ok((tx.memo.value as Buffer).toString().startsWith("BP ABCDEF0123456789"));
});
