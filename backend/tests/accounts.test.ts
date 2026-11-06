import assert from "node:assert/strict";
import test from "node:test";
import { isAccountAlreadyCreated } from "../src/services/stellar/accounts";

function horizonError(operations: string[]) {
  return { response: { data: { extras: { result_codes: { operations } } } } };
}

test("an account that already exists counts as created", () => {
  assert.equal(isAccountAlreadyCreated(horizonError(["op_already_exists"])), true);
});

test("other Horizon failures are not ignored", () => {
  assert.equal(isAccountAlreadyCreated(horizonError(["op_underfunded"])), false);
  assert.equal(isAccountAlreadyCreated(new Error("network down")), false);
});
