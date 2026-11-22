import assert from "node:assert/strict";
import test from "node:test";
import { Keypair } from "@stellar/stellar-sdk";
import { PASS_TOKEN_TTL_SECONDS, signPassToken, verifyPassToken } from "../src/services/passes/passToken";

const signer = Keypair.random();
const ticket = { bookingId: "6aedae9d287070373f9df776", serial: 12 };
const now = Date.UTC(2026, 10, 27, 17, 0, 0);

test("a fresh token verifies and names its ticket", () => {
  const { token, expiresAt } = signPassToken(ticket, signer, now);
  const result = verifyPassToken(token, signer, now + 1000);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.payload.b, ticket.bookingId);
    assert.equal(result.payload.s, ticket.serial);
  }
  assert.equal(expiresAt, now + PASS_TOKEN_TTL_SECONDS * 1000);
});

test("two tokens for the same ticket and second are different", () => {
  assert.notEqual(signPassToken(ticket, signer, now).token, signPassToken(ticket, signer, now).token);
});

test("a screenshot stops working once the window closes", () => {
  const { token } = signPassToken(ticket, signer, now);
  const later = now + (PASS_TOKEN_TTL_SECONDS + 6) * 1000;
  assert.deepEqual(verifyPassToken(token, signer, later), { ok: false, reason: "expired" });
});

test("editing the payload breaks the signature", () => {
  const { token } = signPassToken(ticket, signer, now);
  const [prefix, body, signature] = token.split(".");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString());
  payload.s = 13;
  const forged = `${prefix}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.${signature}`;
  assert.deepEqual(verifyPassToken(forged, signer, now), { ok: false, reason: "bad_signature" });
});

test("a token signed by another key is rejected", () => {
  const { token } = signPassToken(ticket, Keypair.random(), now);
  assert.deepEqual(verifyPassToken(token, signer, now), { ok: false, reason: "bad_signature" });
});

test("random input is reported as malformed", () => {
  for (const input of ["", "hello", "BP1..", "BP2.a.b", "https://example.com"]) {
    assert.deepEqual(verifyPassToken(input, signer, now), { ok: false, reason: "malformed" });
  }
});
