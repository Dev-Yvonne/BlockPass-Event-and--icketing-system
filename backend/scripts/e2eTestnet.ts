/**
 * End-to-end evidence run against a running API and the real Stellar testnet.
 * Every order goes through the public checkout endpoint and is then verified
 * independently on Horizon. Writes docs/round-one/testnet-evidence.md.
 *
 *   API_URL=http://localhost:5000/api npm run stellar:e2e
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getHorizon } from "../src/services/stellar/config";

const API = process.env.API_URL || "http://localhost:5000/api";
const ORDER_COUNT = Number(process.env.E2E_ORDERS) || 24;
const ATTENDEE_COUNT = 8;
const REPORT_PATH = path.join(__dirname, "../../docs/round-one/testnet-evidence.md");

interface Tier { _id: string; name: string; price: number; remaining: number }
interface EventRow { _id: string; title: string; tiers: Tier[] }
interface Order {
  reference: string;
  status: string;
  tierName: string;
  quantity: number;
  tickets: { serial: number; assetCode: string; explorerUrl: string }[];
  payment: { method: string; status: string };
  stellar: { txHash: string; ledger: number; issuer: string; attendeePublicKey: string; txUrl: string };
}

async function call<T>(route: string, options: RequestInit = {}) {
  const res = await fetch(`${API}${route}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  return { status: res.status, body: (await res.json()) as T };
}

function buyPayload(event: EventRow, tier: Tier, attendee: number, quantity: number) {
  return {
    eventId: event._id,
    tierId: tier._id,
    name: `Test Attendee ${attendee}`,
    email: `attendee${attendee}@blockpass.co.ke`,
    quantity,
    checkoutId: crypto.randomUUID(),
    // Alternate so the run covers both ways of paying.
    ...(attendee % 2 === 0
      ? { paymentMethod: "stablecoin" }
      : { paymentMethod: "local", currency: "KES", phone: "+254700000000" }),
  };
}

function buy(payload: object) {
  return call<Order & { message?: string }>("/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Checks the chain itself, not what our API claims happened. */
async function verifyOnChain(order: Order) {
  const horizon = getHorizon();
  const tx = await horizon.transactions().transaction(order.stellar.txHash).call();
  if (!tx.successful) throw new Error(`${order.reference}: transaction failed`);
  if (tx.memo !== `BP ${order.reference}`) throw new Error(`${order.reference}: memo mismatch`);
  if (order.payment.status !== "paid") throw new Error(`${order.reference}: payment not recorded`);

  const { records } = await horizon.operations().forTransaction(order.stellar.txHash).limit(200).call();
  const collected = records.some(
    (op) => op.type === "payment" && "asset_code" in op && op.asset_code === "BPUSD" && op.from === order.stellar.attendeePublicKey
  );
  if (collected !== (order.payment.method === "stablecoin")) {
    throw new Error(`${order.reference}: stablecoin payment doesn't match the order`);
  }

  const attendee = await horizon.loadAccount(order.stellar.attendeePublicKey);
  for (const ticket of order.tickets) {
    const line = attendee.balances.find(
      (b) =>
        "asset_code" in b &&
        b.asset_code === ticket.assetCode &&
        b.asset_issuer === order.stellar.issuer
    );
    if (Number(line?.balance) !== 1) {
      throw new Error(`${ticket.assetCode}: attendee does not hold exactly 1`);
    }
    const assets = await horizon
      .assets()
      .forCode(ticket.assetCode)
      .forIssuer(order.stellar.issuer)
      .call();
    const supply = Number(assets.records[0]?.balances?.authorized);
    if (supply !== 1) throw new Error(`${ticket.assetCode}: supply is ${supply}, expected 1`);
  }
}

function check(name: string, passed: boolean, results: [string, boolean][]) {
  results.push([name, passed]);
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}`);
}

async function main() {
  const checks: [string, boolean][] = [];
  const orders: (Order & { eventTitle: string })[] = [];

  const { body: events } = await call<EventRow[]>("/events");
  const seeded = events.filter((event) => event.tiers?.length >= 2);
  if (seeded.length === 0) throw new Error("No seeded events. Run `npm run seed` first.");

  for (let i = 0; i < ORDER_COUNT; i += 1) {
    const event = seeded[i % seeded.length];
    const tier = event.tiers[i % event.tiers.length];
    const attendee = (i % ATTENDEE_COUNT) + 1;
    const quantity = (i % 3) + 1;

    const { status, body } = await buy(buyPayload(event, tier, attendee, quantity));
    if (status !== 201 || body.status !== "confirmed") {
      throw new Error(`Order ${i + 1} failed (${status}): ${JSON.stringify(body)}`);
    }
    await verifyOnChain(body);
    orders.push({ ...body, eventTitle: event.title });
    console.log(`  ${i + 1}/${ORDER_COUNT} ${body.tickets.map((t) => t.assetCode).join(",")} ${body.stellar.txHash}`);
  }
  check(`${ORDER_COUNT} checkouts minted and verified on Horizon`, true, checks);

  const assetCodes = orders.flatMap((o) => o.tickets.map((t) => `${t.assetCode}:${o.stellar.issuer}`));
  check("Every issued ticket is unique", new Set(assetCodes).size === assetCodes.length, checks);

  const repeat = buyPayload(seeded[0], seeded[0].tiers[0], 1, 1);
  const first = await buy(repeat);
  const second = await buy(repeat);
  check(
    "Double submit returns the same order and mints once",
    first.body.stellar.txHash === second.body.stellar.txHash &&
      first.body.reference === second.body.reference,
    checks
  );

  const email = `organizer-${Date.now()}@blockpass.co.ke`;
  const { body: auth } = await call<{ token: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "E2E Organizer", email, password: crypto.randomUUID(), role: "organizer" }),
  });
  const { body: limited } = await call<EventRow>("/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({
      title: "Oversell Test",
      description: "Created by the end-to-end run.",
      category: "Test",
      venue: "Testnet",
      // Expires minutes after the run, so it never lingers on the storefront.
      date: new Date(Date.now() + 10 * 60_000).toISOString(),
      imageUrl: "/images/nairobi-skyline.jpg",
      tiers: [{ name: "Limited", price: 1, capacity: 3 }],
    }),
  });
  const rush = await Promise.all(
    [1, 2, 3, 4, 5].map((n) => buy(buyPayload(limited, limited.tiers[0], n, 1)))
  );
  const won = rush.filter((r) => r.status === 201 && r.body.status === "confirmed").length;
  const refused = rush.filter((r) => r.status === 409).length;
  check(`5 concurrent buyers for 3 tickets: ${won} minted, ${refused} refused`, won === 3 && refused === 2, checks);

  const invalid = await Promise.all([
    buy({ ...buyPayload(seeded[0], seeded[0].tiers[0], 1, 1), email: "not-an-email" }),
    buy({ ...buyPayload(seeded[0], seeded[0].tiers[0], 1, 1), quantity: 11 }),
    buy({ ...buyPayload(seeded[0], seeded[0].tiers[0], 1, 1), name: "" }),
    buy({ ...buyPayload(seeded[0], seeded[0].tiers[0], 1, 1), eventId: { $ne: null } }),
  ]);
  check("Invalid orders are rejected with 400", invalid.every((r) => r.status === 400), checks);

  const methods = new Set(orders.map((o) => o.payment.method));
  check("Both payment methods were exercised", methods.size === 2, checks);

  const failed = checks.filter(([, passed]) => !passed);
  const tickets = assetCodes.length;
  const attendees = new Set(orders.map((o) => o.stellar.attendeePublicKey)).size;
  const issuers = new Set(orders.map((o) => o.stellar.issuer)).size;

  const report = [
    "# BlockPass Round 1: testnet evidence",
    "",
    `Generated by \`npm run stellar:e2e\` on ${new Date().toISOString()} against ${API}.`,
    "Each order went through the public checkout endpoint, then was checked on Horizon:",
    "transaction successful, memo matches the order, attendee holds exactly 1 of each",
    "ticket asset, and each asset's total supply is 1. Stablecoin orders were also checked for",
    "the BPUSD test payment inside the same transaction. Local-currency orders use the sandbox",
    "provider, which moves no money.",
    "",
    `**${orders.length} orders, ${tickets} tickets, ${attendees} attendee accounts, ${issuers} event issuers.**`,
    "",
    "## Checks",
    "",
    ...checks.map(([name, passed]) => `- ${passed ? "Passed" : "FAILED"}: ${name}`),
    "",
    "## Transactions",
    "",
    "| # | Event | Tier | Tickets | Ledger | Transaction |",
    "| --- | --- | --- | --- | --- | --- |",
    ...orders.map(
      (o, i) =>
        `| ${i + 1} | ${o.eventTitle} | ${o.tierName} | ${o.tickets
          .map((t) => `[${t.assetCode}](${t.explorerUrl})`)
          .join(" ")} | ${o.stellar.ledger} | [${o.stellar.txHash.slice(0, 12)}…](${o.stellar.txUrl}) |`
    ),
    "",
  ].join("\n");

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, report);
  console.log(`\nReport: ${REPORT_PATH}`);

  if (failed.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
