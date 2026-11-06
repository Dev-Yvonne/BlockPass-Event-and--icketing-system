# BlockPass Round 1: submission pack

The formal report is [BlockPass-Round-1-Report.docx](BlockPass-Round-1-Report.docx), also available
as a [PDF](BlockPass-Round-1-Report.pdf).

BlockPass issues event tickets as serialized assets on the Stellar testnet. An attendee picks an
event and ticket type, pays in test mode, and receives on-chain tickets within seconds, without
needing a crypto wallet.

| | |
| --- | --- |
| **Live app** | https://www.blockpass.co.ke |
| **Demo video** | [BlockPass-Round-1-Demo.mp4](BlockPass-Round-1-Demo.mp4) |
| **Repository** | https://github.com/Dev-Yvonne/BlockPass-Event-and--icketing-system |
| **Network** | Stellar testnet. Local payments run in a sandbox. No real money moves. |

## How to review in five minutes

1. Open the live app and choose an event.
2. Pick a ticket type, enter a name and email, choose a payment method, and select **Pay**.
3. On the confirmation page, select **View on StellarExpert** to see the transaction on the public
   explorer.
4. Open **Ledger** in the navigation to see recent tickets issued by the platform.

## Deliverables

| Deliverable | Status | Where to verify |
| --- | --- | --- |
| 1. Minting service: Friendbot funding, event asset issuance, unique serialized distribution | Done | [`ticketAssets.ts`](../../backend/src/services/stellar/ticketAssets.ts), [testnet evidence](testnet-evidence.md) |
| 2. Responsive storefront: event details, ticket tiers, checkout form that triggers minting | Done in code, deployment pending | [`frontend/`](../../frontend), [screenshots](screenshots) |
| 3. Confirmation screen and logger: transaction hash shown, asset parameters stored | Done | [`orders/[reference]/page.tsx`](../../frontend/src/app/orders/%5Breference%5D/page.tsx), [`mintLogger.ts`](../../backend/src/services/mintLogger.ts), [log sample](backend-log-sample.jsonl) |

## Evidence required by the SOW

| Evidence | Location |
| --- | --- |
| Commit links for issuance and transaction logic | [Commit 513205f](https://github.com/Dev-Yvonne/BlockPass-Event-and--icketing-system/commit/513205fc582ab2cda5e17a9c93c84a5c68eecc11) on the [Staging branch](https://github.com/Dev-Yvonne/BlockPass-Event-and--icketing-system/tree/Staging) |
| 5+ StellarExpert transaction links | [testnet-evidence.md](testnet-evidence.md) |
| Deployed app URL | https://www.blockpass.co.ke |
| Screenshots of event selection and checkout | [screenshots](screenshots) |
| 2-minute demo video | [BlockPass-Round-1-Demo.mp4](BlockPass-Round-1-Demo.mp4) ([script](demo-script.md)) |
| Backend logs showing order receipt and Horizon hash | [backend-log-sample.jsonl](backend-log-sample.jsonl) |

## How a ticket is minted

Each order is one atomic Stellar transaction, so it is either fully issued or not issued at all.

1. **Reserve.** The database takes stock and serial numbers in a single update, so a tier can't
   oversell and two buyers can't receive one serial.
2. **Provision.** The event has its own issuer account. The attendee gets a custodial testnet wallet,
   so they never handle keys.
3. **Mint.** For each ticket, the distributor and attendee open trustlines capped at 1, the issuer
   issues one unit, the distributor delivers it, and then closes its own trustline.
4. **Record.** The order stores the transaction hash, and each stage is written to the server log and
   the database.

Ticket codes read as event, tier and serial: `LAGOSV000014` is Lagos Live Nights, VIP, serial 14.

If Stellar rejects a mint, the order is marked failed and its stock is released.

## Deliberate decisions

- **Payments are beyond the SOW and run in test mode.** Stablecoin payments use BPUSD, a test asset
  with no value, inside the same atomic transaction as the mint. Local-currency payments use a
  sandbox provider that approves every charge and moves no money, at fixed test rates. A live provider
  such as M-Pesa or Flutterwave needs a merchant account.
- **Custodial wallets.** The form has no wallet field, so BlockPass creates a testnet wallet per email
  address. Encrypted keys are stored with AES-256-GCM.
- **Database.** The SOW's "lightweight local database" is the project's existing MongoDB.
- **Reviews come from ticket holders.** The seeded reviews on the ended demo event come from real
  testnet purchases, are written as samples, and carry a "Sample review" label.
- **Tickets are not cancellable once issued.** Revoking an on-chain ticket belongs with the gate
  scanner work.

## Out of scope, as agreed in the SOW

- Mobile ticket view, dynamic QR codes and offline passes
- Organizer gate scanner, on-chain redemption and burn at the gate

## Added beyond the SOW

- Attendee, organizer and admin workspaces, with admin access enforced by the API
- Event profiles with photo galleries, highlights, schedules and venue guidance
- Attendee ratings and reviews, with an organizer feedback section
- Test-mode stablecoin and local-currency payment

## Known limitations

- Confirmation emails are not sent. Attendees keep their tickets through the confirmation page, or
  through My Tickets if they are logged in.
- One custodial wallet funds about 38 tickets at its 20 XLM starting balance.
- A ticket's supply of 1 is enforced by the service. The event issuer stays active so it can keep
  minting, and locking it after sales close is not part of this round.
- Stellar resets testnet periodically, which removes old transactions from explorers. If evidence
  links stop working, run `npm run stellar:e2e` again to regenerate them.

## Reproduce locally

See [Getting started](../../README.md#getting-started). `npm test` runs the unit tests, and
`npm run stellar:e2e` regenerates [testnet-evidence.md](testnet-evidence.md).
