/**
 * Simulated gate entry drill against a running API and the real Stellar testnet.
 * It buys tickets through the public checkout, opens each pass the way a
 * phone does, and scans it the way the gate scanner does:
 *
 *   - 25 valid tickets, each admitted once and moved to the vault on-chain
 *   - 5 duplicate scans of tickets that were already used
 *   - one ticket scanned twice at the same moment
 *   - invalid codes: forged, edited, expired, wrong event and not a pass
 *
 * Every redemption is then checked directly on Horizon. Results are written as
 * JSON to DRILL_OUT, outside the repository.
 *
 *   API_URL=https://www.blockpass.co.ke/api DRILL_ORGANIZER_EMAIL=... \
 *   DRILL_ORGANIZER_PASSWORD=... DRILL_OUT=/path/results.json npm run gate:drill
 */
import crypto from "crypto";
import fs from "fs";
import { Keypair } from "@stellar/stellar-sdk";
import { getHorizon } from "../src/services/stellar/config";
import { signPassToken } from "../src/services/passes/passToken";

const API = process.env.API_URL || "http://localhost:5000/api";
const VALID_COUNT = Number(process.env.DRILL_VALID) || 25;
const DUPLICATE_COUNT = Math.min(Number(process.env.DRILL_DUPLICATES) || 5, VALID_COUNT);
const EVENT_TITLE = process.env.DRILL_EVENT || "Nairobi Cultural Nights";
const OTHER_EVENT_TITLE = process.env.DRILL_OTHER_EVENT || "Lagos Live Nights";
const OUT = process.env.DRILL_OUT;
const TICKETS_PER_ORDER = 5;
const CONFIRM_CONCURRENCY = 2;
const EXPIRY_WAIT_MS = 37_000;

interface Ticket { serial: number; assetCode: string }
interface Order {
  reference: string;
  status: string;
  tickets: Ticket[];
  stellar: { txHash: string; issuer: string; attendeePublicKey: string };
}
interface ScanResult {
  verdict: "valid" | "already_redeemed" | "invalid";
  reason?: string;
  source?: string;
  message: string;
  latencyMs: number;
  ticket?: { bookingId: string; serial: number; assetCode: string };
}
interface Redemption { status: string; txHash: string | null; ledger: number | null; admittedAt: string; confirmedAt: string | null }

let authToken = "";

async function call<T>(route: string, init: RequestInit = {}): Promise<{ status: number; body: T; ms: number }> {
  const started = performance.now();
  const res = await fetch(`${API}${route}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(90_000),
  });
  const body = (await res.json().catch(() => null)) as T;
  return { status: res.status, body, ms: Math.round(performance.now() - started) };
}

const post = <T>(route: string, data: unknown) => call<T>(route, { method: "POST", body: JSON.stringify(data) });
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const percentile = (values: number[], p: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
};

async function buy(eventId: string, tierId: string, quantity: number, index: number): Promise<Order> {
  const { status, body } = await post<Order>("/checkout", {
    eventId,
    tierId,
    checkoutId: crypto.randomUUID(),
    name: `Gate Drill ${String(index).padStart(2, "0")}`,
    email: `gate-drill-${String(index).padStart(2, "0")}@blockpass.co.ke`,
    quantity,
    ...(index % 2 ? { paymentMethod: "stablecoin" } : { paymentMethod: "local", currency: "KES", phone: "+254700000100" }),
  });
  if (status !== 201 || body.status !== "confirmed") throw new Error(`Checkout failed: ${status} ${JSON.stringify(body)}`);
  return body;
}

async function passToken(reference: string, serial: number): Promise<string> {
  const { status, body } = await post<{ token: string }>(`/passes/${reference}/tickets/${serial}/token`, {});
  if (status !== 200) throw new Error(`Pass token failed: ${status} ${JSON.stringify(body)}`);
  return body.token;
}

async function main() {
  if (!OUT) throw new Error("Set DRILL_OUT to the JSON file to write, outside the repository");
  const email = process.env.DRILL_ORGANIZER_EMAIL;
  const password = process.env.DRILL_ORGANIZER_PASSWORD;
  if (!email || !password) throw new Error("Set DRILL_ORGANIZER_EMAIL and DRILL_ORGANIZER_PASSWORD");

  const login = await post<{ token: string }>("/auth/login", { email, password });
  if (login.status !== 200) throw new Error(`Organizer login failed: ${login.status}`);
  authToken = login.body.token;

  const gate = await call<{ vault: { publicKey: string }; events: { id: string; title: string }[] }>("/gate/events");
  const drillEvent = gate.body.events.find((e) => e.title === EVENT_TITLE);
  const otherEvent = gate.body.events.find((e) => e.title === OTHER_EVENT_TITLE);
  if (!drillEvent || !otherEvent) throw new Error("Drill events not found for this organizer");
  const vault = gate.body.vault.publicKey;

  const events = await call<{ _id: string; title: string; tiers: { _id: string; name: string; remaining: number }[] }[]>(
    "/events"
  );
  const tierFor = (id: string) => {
    const event = events.body.find((e) => e._id === id)!;
    return event.tiers.find((t) => t.remaining >= TICKETS_PER_ORDER) ?? event.tiers[0];
  };

  // 1. Buy the drill tickets through the public checkout.
  console.log(`Buying ${VALID_COUNT} tickets for ${drillEvent.title}...`);
  const tier = tierFor(drillEvent.id);
  const passes: { reference: string; ticket: Ticket; order: Order }[] = [];
  for (let i = 0; passes.length < VALID_COUNT; i++) {
    const order = await buy(drillEvent.id, tier._id, Math.min(TICKETS_PER_ORDER, VALID_COUNT - passes.length), i + 1);
    for (const ticket of order.tickets) passes.push({ reference: order.reference, ticket, order });
    console.log(`  ${order.reference}: ${order.tickets.map((t) => t.assetCode).join(", ")}`);
  }
  const otherOrder = await buy(otherEvent.id, tierFor(otherEvent.id)._id, 1, 99);

  // A token taken now will have expired by the time the invalid checks run.
  const expiringToken = await passToken(passes[0].reference, passes[0].ticket.serial);
  const expiringIssuedAt = Date.now();

  const scan = (token: string, eventId = drillEvent.id) => post<ScanResult>("/gate/scan", { token, eventId });
  const confirmations: Promise<void>[] = [];
  const redemptions = new Map<string, Redemption>();
  let active = 0;
  const confirm = async (bookingId: string, serial: number, assetCode: string) => {
    while (active >= CONFIRM_CONCURRENCY) await sleep(100);
    active++;
    try {
      for (let attempt = 0; attempt < 4; attempt++) {
        const { body } = await post<Redemption>(`/gate/tickets/${bookingId}/${serial}/confirm`, {});
        if (body?.status === "redeemed") return void redemptions.set(assetCode, body);
        await sleep(3000);
      }
      const { body } = await call<Redemption>(`/gate/tickets/${bookingId}/${serial}`);
      redemptions.set(assetCode, body);
    } finally {
      active--;
    }
  };

  // 2. Scan every valid ticket once, the race ticket twice at the same moment.
  console.log("Scanning valid tickets...");
  const validScans: { assetCode: string; verdict: string; serverMs: number; roundTripMs: number }[] = [];
  const firstTokens: string[] = [];
  let race: { verdicts: string[] } | null = null;
  for (const [index, pass] of passes.entries()) {
    const token = await passToken(pass.reference, pass.ticket.serial);
    let result: { body: ScanResult; ms: number };
    if (index === passes.length - 1) {
      const pair = await Promise.all([scan(token), scan(token)]);
      race = { verdicts: pair.map((r) => r.body.verdict).sort() };
      result = pair.find((r) => r.body.verdict === "valid") ?? pair[0];
    } else {
      result = await scan(token);
    }
    firstTokens.push(token);
    validScans.push({
      assetCode: pass.ticket.assetCode,
      verdict: result.body.verdict,
      serverMs: result.body.latencyMs,
      roundTripMs: result.ms,
    });
    console.log(`  ${pass.ticket.assetCode}: ${result.body.verdict} (${result.body.latencyMs} ms server, ${result.ms} ms round trip)`);
    if (result.body.verdict === "valid" && result.body.ticket) {
      confirmations.push(confirm(result.body.ticket.bookingId, pass.ticket.serial, pass.ticket.assetCode));
    }
  }

  // 3. Duplicates: the same codes again, as if forwarded as screenshots.
  console.log("Scanning duplicates...");
  const duplicateScans: { assetCode: string; verdict: string; source?: string; serverMs: number }[] = [];
  for (let i = 0; i < DUPLICATE_COUNT; i++) {
    const { body } = await scan(firstTokens[i]);
    duplicateScans.push({ assetCode: passes[i].ticket.assetCode, verdict: body.verdict, source: body.source, serverMs: body.latencyMs });
    console.log(`  ${passes[i].ticket.assetCode}: ${body.verdict}`);
  }
  const usedPassToken = await post(`/passes/${passes[0].reference}/tickets/${passes[0].ticket.serial}/token`, {});

  // 4. Invalid codes.
  console.log("Scanning invalid codes...");
  const [prefix, body] = firstTokens[1].split(".");
  const edited = JSON.parse(Buffer.from(body, "base64url").toString());
  edited.s += 1;
  // A real ticket, signed by a key that isn't the server's.
  const forged = signPassToken({ bookingId: edited.b, serial: edited.s - 1 }, Keypair.random()).token;
  const wait = EXPIRY_WAIT_MS - (Date.now() - expiringIssuedAt);
  if (wait > 0) await sleep(wait);
  const invalidCases: [string, string][] = [
    ["Forged: signed with another key", forged],
    ["Edited: serial changed after signing", `${prefix}.${Buffer.from(JSON.stringify(edited)).toString("base64url")}.${firstTokens[1].split(".")[2]}`],
    ["Expired: 30-second window passed", expiringToken],
    ["Wrong event: ticket for another event", await passToken(otherOrder.reference, otherOrder.tickets[0].serial)],
    ["Not a pass: a web address", "https://example.com/ticket/12345"],
    ["Not a pass: random text", crypto.randomBytes(24).toString("hex")],
  ];
  const invalidScans: { case: string; verdict: string; reason?: string; serverMs: number }[] = [];
  for (const [name, token] of invalidCases) {
    const { body } = await scan(token);
    invalidScans.push({ case: name, verdict: body.verdict, reason: body.reason, serverMs: body.latencyMs });
    console.log(`  ${name}: ${body.verdict} (${body.reason})`);
  }

  // 5. Wait for every on-chain redemption, then check each on Horizon.
  console.log("Waiting for on-chain redemptions...");
  await Promise.all(confirmations);
  const horizon = getHorizon();
  const vaultAccount = await horizon.loadAccount(vault);
  const onChain: Record<string, unknown>[] = [];
  for (const pass of passes) {
    const r = redemptions.get(pass.ticket.assetCode);
    const tx = r?.txHash ? await horizon.transactions().transaction(r.txHash).call() : null;
    const ops = tx ? await horizon.operations().forTransaction(tx.hash).call() : null;
    const inVault = vaultAccount.balances.some(
      (b) => "asset_code" in b && b.asset_code === pass.ticket.assetCode && b.asset_issuer === pass.order.stellar.issuer && Number(b.balance) === 1
    );
    const attendee = await horizon.loadAccount(pass.order.stellar.attendeePublicKey);
    const stillHeld = attendee.balances.some(
      (b) => "asset_code" in b && b.asset_code === pass.ticket.assetCode && b.asset_issuer === pass.order.stellar.issuer
    );
    const confirmSeconds = r?.confirmedAt ? (Date.parse(r.confirmedAt) - Date.parse(r.admittedAt)) / 1000 : null;
    onChain.push({
      assetCode: pass.ticket.assetCode,
      reference: pass.reference,
      txHash: r?.txHash ?? null,
      ledger: tx?.ledger_attr ?? null,
      createdAt: tx?.created_at ?? null,
      successful: tx?.successful ?? false,
      memo: tx?.memo ?? null,
      operations: ops?.records.map((op) => op.type) ?? [],
      inVault,
      attendeeTrustlineClosed: !stillHeld,
      admittedToConfirmedSeconds: confirmSeconds,
    });
  }

  const logs = await call<unknown[]>(`/gate/logs?eventId=${drillEvent.id}&limit=200`);
  const serverMs = validScans.map((s) => s.serverMs);
  const roundTrip = validScans.map((s) => s.roundTripMs);
  const confirmTimes = onChain.map((o) => o.admittedToConfirmedSeconds as number).filter((n) => n !== null);
  const summary = {
    api: API,
    ranAt: new Date().toISOString(),
    event: drillEvent.title,
    vault,
    valid: { scanned: validScans.length, admitted: validScans.filter((s) => s.verdict === "valid").length },
    duplicates: { scanned: duplicateScans.length, rejected: duplicateScans.filter((s) => s.verdict === "already_redeemed").length },
    race,
    usedPassTokenStatus: usedPassToken.status,
    invalid: { scanned: invalidScans.length, rejected: invalidScans.filter((s) => s.verdict === "invalid").length },
    onChain: {
      confirmed: onChain.filter((o) => o.successful).length,
      inVault: onChain.filter((o) => o.inVault).length,
      attendeeTrustlinesClosed: onChain.filter((o) => o.attendeeTrustlineClosed).length,
    },
    latency: {
      verdictServerMs: { p50: percentile(serverMs, 50), p95: percentile(serverMs, 95), max: Math.max(...serverMs) },
      verdictRoundTripMs: { p50: percentile(roundTrip, 50), p95: percentile(roundTrip, 95), max: Math.max(...roundTrip) },
      onChainConfirmSeconds: confirmTimes.length
        ? { p50: percentile(confirmTimes, 50), p95: percentile(confirmTimes, 95), max: Math.max(...confirmTimes) }
        : null,
    },
  };

  fs.writeFileSync(
    OUT,
    JSON.stringify({ summary, validScans, duplicateScans, invalidScans, onChain, scanLogs: logs.body }, null, 2)
  );
  console.log(JSON.stringify(summary, null, 2));
  console.log(`Wrote ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
