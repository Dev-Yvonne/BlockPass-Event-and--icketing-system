# BlockPass

**Verified event ticketing for Africa's concerts and community events.**

![License: Proprietary](https://img.shields.io/badge/license-All%20Rights%20Reserved-red)

BlockPass replaces spreadsheets, screenshots, and easily-duplicated tickets with a single
platform: organizers list and manage events, attendees book and pay in one flow, and every
ticket is a uniquely serialized, verifiable record instead of an image anyone can copy. The
platform is being built on the Stellar network so that verification can eventually happen
on-chain, at gate-scan speed, without attendees ever touching a crypto wallet directly.

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

BlockPass addresses this with atomic, oversell-safe booking on the backend today, and a
ticket-minting foundation on Stellar/Soroban designed to make each ticket a one-time-use,
verifiable on-chain asset as that work comes online.

## What's in this repository

| Directory | What it is | Stack |
| --- | --- | --- |
| [`backend/`](backend) | REST API for accounts, events, bookings, and reviews | Express, TypeScript, MongoDB/Mongoose, JWT |
| [`frontend/`](frontend) | The BlockPass web app (browse events, book tickets, manage bookings) | React, TypeScript, Vite |
| [`marketing/`](marketing) | The public marketing site | React, TypeScript, Vite, React Router |
| [`contracts/ticket-nft/`](contracts/ticket-nft) | Soroban smart contract for on-chain ticket minting and check-in | Rust, Soroban SDK |

## Core domains

- **Accounts** — registration and login with roles (`attendee`, `organizer`, `admin`), JWT-based auth.
- **Events** — organizers create and manage events; public listing and search for attendees.
- **Bookings** — attendees reserve tickets against an event's capacity, with atomic
  (`findOneAndUpdate`-based) oversell protection and cancellation.
- **Reviews** — attendees leave a rating and comment per event.

## Ticketing on Stellar

`contracts/ticket-nft` contains a Soroban smart contract (`TicketNft`) that represents each
ticket as a serialized, mintable on-chain asset with a one-time `check_in` — the mechanism
designed to make a duplicated screenshot fail a second scan at the gate. `backend/src/services/stellar`
contains the corresponding Node-side client (contract invocation, custodial wallet
generation, AES-256-GCM encrypted key storage) that the booking flow will call into.

This is under active development on Stellar's testnet and is **not yet wired into the live
checkout flow** — bookings today are recorded and capacity-protected in MongoDB. See
`contracts/ticket-nft/README.md` for contract build/deploy notes.

## Getting started

Each app is a standalone npm project — install and run them independently.

### Backend API

```bash
cd backend
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET at minimum
npm install
npm run dev
```

Runs on `http://localhost:5000` by default. The `STELLAR_*` and `WALLET_ENCRYPTION_KEY`
variables in `.env.example` are only needed once you're working on the contract-integration
work described above.

### Frontend (the app)

```bash
cd frontend
cp .env.example .env   # point VITE_API_URL at the backend
npm install
npm run dev
```

Runs on `http://localhost:5173` by default.

### Marketing site

```bash
cd marketing
npm install
npm run dev
```

Runs on `http://localhost:5173` by default (use a different port if running alongside the
frontend app, e.g. `npm run dev -- --port 5174`).

### Smart contract

See [`contracts/ticket-nft/README.md`](contracts/ticket-nft/README.md) for building, testing,
and deploying the Soroban contract with the Stellar CLI.

## Design principles

- **Africa-first, not city-first.** BlockPass is built for organizers and attendees across the
  continent — the [priority-markets map](marketing/src/components/AfricaMap.tsx) on the
  marketing site spans West, East, Central, North, and Southern Africa on purpose.
- **No wallet friction for attendees.** BlockPass custodies wallet keys on a user's behalf
  (encrypted at rest) so checkout looks and feels like any ordinary ticketing flow.
- **Oversell-proof by construction.** Capacity checks use atomic MongoDB updates today, backed
  by the contract's one-time `check_in` as the on-chain source of truth going forward.

## Development status

This project is under active development on the `Staging` branch and is not yet open to public
contributions.

## License

All rights reserved. This repository is proprietary — see [`LICENSE`](LICENSE) for details. No
part of this codebase may be copied, modified, or redistributed without prior written permission.
