# BlockPass

**Verified event ticketing for Africa's concerts and community events.**

![License: Proprietary](https://img.shields.io/badge/license-All%20Rights%20Reserved-red)

BlockPass replaces spreadsheets, screenshots, and easily-duplicated tickets with a single
platform: organizers list and manage events, attendees pay in local currency or stablecoins,
and every ticket is a uniquely serialized asset on the Stellar testnet instead of an image anyone
can copy. Payments run in test mode today, and no real money moves.
Attendees get their tickets without ever touching a crypto wallet directly.

Round 1 deliverables and evidence are in [`docs/round-one`](docs/round-one/README.md).

---

## The problem

Concerts and community events across Africa frequently run into the same failure modes:

- **Fake and duplicated tickets** — a screenshot of a valid ticket is indistinguishable from
  the original, so the same "ticket" gets used by multiple people at the gate.
- **Manual, error-prone sales tracking** — spreadsheets and ad-hoc messaging apps make it hard
  for organizers to know real-time sales, remaining capacity, or who actually holds a valid
  ticket.
- **No transparency for attendees or organizers** — there's no simple way to prove a ticket is
  authentic before you're standing at the door.

BlockPass addresses this with atomic, oversell-safe checkout and automated ticket issuance on
the Stellar testnet. Gate verification is the next phase.

## What's in this repository

| Directory | What it is | Stack |
| --- | --- | --- |
| [`backend/`](backend) | REST API for accounts, events, checkout, ticket minting, and reviews | Express, TypeScript, MongoDB/Mongoose, JWT, Stellar SDK |
| [`frontend/`](frontend) | The BlockPass web app (browse events, check out, view on-chain receipts) | Next.js, React, TypeScript |
| [`marketing/`](marketing) | The public marketing site | React, TypeScript, Vite, React Router |
| [`contracts/ticket-nft/`](contracts/ticket-nft) | Soroban contract planned for gate check-in, not used by Round 1 | Rust, Soroban SDK |

## Workspaces

| Role | Route | What it covers |
| --- | --- | --- |
| Attendee | `/dashboard` | Tickets, upcoming events, and the option to start hosting |
| Organizer | `/organizer` | Events, sales, attendees, CSV export, and attendee feedback |
| Admin | `/admin` | Platform metrics, minting health, users, event moderation, activity |

Roles are enforced by the API, not only by the interface.

## Core domains

- **Accounts** — registration and login with roles (`attendee`, `organizer`, `admin`), JWT-based auth.
- **Events** — organizers create and manage events; public listing and search for attendees.
- **Checkout** — guests or logged-in attendees reserve tickets per tier, with atomic
  (`findOneAndUpdate`-based) oversell protection, and tickets mint in the same request.
- **Reviews** — attendees leave a rating and comment per event.

## Ticketing on Stellar

Each order is one atomic transaction on the Stellar testnet, built with `@stellar/stellar-sdk`
and submitted through Horizon. Every event has its own issuer account, a platform distributor
routes tickets, and each attendee has a custodial testnet wallet. A ticket is a unique asset
with a supply of 1 and a readable code, such as `LAGOSV000014`.

The code is in `backend/src/services/stellar`, and `backend/src/services/checkout.ts` runs an
order from form submission to confirmed mint. See
[`docs/round-one`](docs/round-one/README.md) for the full flow.

`contracts/ticket-nft` and its `ticketMinting.ts` client are a separate Soroban path kept for
the gate check-in phase. Round 1 doesn't use them.

## Getting started

Each app is a standalone npm project — install and run them independently.

### Backend API

Needs Node 18+ and a MongoDB database. See [Connecting MongoDB](docs/mongodb-setup.md) for Atlas
and local setup.

```bash
cd backend
npm install
npm run stellar:setup   # creates .env with a funded testnet distributor and secrets
npm run seed            # adds demo events and funds their issuers
npm run dev
```

Runs on `http://localhost:5000` by default.

| Command | What it does |
| --- | --- |
| `npm test` | Unit tests for asset codes and transaction construction |
| `npm run user:create -- <email> admin "<Name>"` | Creates the first admin, since sign-up can't grant that role |
| `npm run stellar:mint-demo` | Mints one ticket directly and prints the transaction hash |
| `npm run stellar:e2e` | Runs 24+ checkouts against a running API, verifies them on Horizon, and writes `docs/round-one/testnet-evidence.md` |

### Frontend (the app)

```bash
cd frontend
cp .env.example .env.local   # point API_URL at the backend
npm install
npm run dev
```

Runs on `http://localhost:3000` by default.

### Marketing site

```bash
cd marketing
npm install
npm run dev
```

Runs on `http://localhost:5173` by default.

### Smart contract

See [`contracts/ticket-nft/README.md`](contracts/ticket-nft/README.md) for building, testing,
and deploying the Soroban contract with the Stellar CLI.

## Design principles

- **Africa-first, not city-first.** BlockPass is built for organizers and attendees across the
  continent — the [priority-markets map](marketing/src/components/AfricaMap.tsx) on the
  marketing site spans West, East, Central, North, and Southern Africa on purpose.
- **No wallet friction for attendees.** BlockPass custodies wallet keys on a user's behalf
  (encrypted at rest) so checkout looks and feels like any ordinary ticketing flow.
- **Oversell-proof by construction.** Stock and serial numbers are taken in one atomic MongoDB
  update, so a tier can't oversell and a serial can't repeat.

## Development status

This project is under active development on the `Staging` branch and is not yet open to public
contributions.

## License

All rights reserved. This repository is proprietary — see [`LICENSE`](LICENSE) for details. No
part of this codebase may be copied, modified, or redistributed without prior written permission.
