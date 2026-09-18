# ticket-nft

Soroban smart contract that mints each BlockPass ticket as a serialized,
authenticated on-chain token. One token id = one physical ticket. The
contract also enforces single-use check-in at the venue gate, which is the
direct on-chain defense against the duplicate-screenshot re-entry problem.

## Contract surface

- `initialize(admin: Address)` — one-time setup. `admin` is BlockPass's
  custodial issuer account (the backend's minting service).
- `mint(to: Address, event_id: Symbol, serial: u32) -> u64` — admin-only.
  Mints a new ticket to `to` and returns its token id. Rejects a duplicate
  `(event_id, serial)` pair.
- `owner_of(token_id: u64) -> Address`
- `get_ticket(token_id: u64) -> Ticket { event_id, serial, owner, checked_in }`
- `check_in(token_id: u64)` — admin-only (the venue scanner, authenticated
  as the issuer account). Fails with `AlreadyCheckedIn` on a second scan.
- `transfer(from: Address, to: Address, token_id: u64)` — owner-authorized
  resale/transfer.

## Building and deploying (run from a machine with a normal Rust toolchain
and network access — this repo's sandbox has neither, so this was written
and unit-tested here but not deployed from here)

```bash
# one-time toolchain setup
rustup target add wasm32-unknown-unknown
cargo install --locked stellar-cli --features opt

cd contracts/ticket-nft

# run the unit tests
cargo test

# build the optimized wasm
stellar contract build

# create + fund a testnet issuer identity (this is BlockPass's custodial
# admin account — its secret key is what the backend's STELLAR_ISSUER_SECRET
# env var holds)
stellar keys generate issuer --network testnet --fund

# deploy to testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/ticket_nft.wasm \
  --source issuer \
  --network testnet

# note the returned contract id, then initialize it
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source issuer \
  --network testnet \
  -- initialize --admin $(stellar keys address issuer)
```

Put the resulting values into `backend/.env`:

```
STELLAR_CONTRACT_ID=<CONTRACT_ID>
STELLAR_ISSUER_SECRET=$(stellar keys show issuer)
```

The backend's `stellarService` (see `backend/src/services/stellar/`) talks to
this contract over Soroban RPC using `@stellar/stellar-sdk` — no local Rust
toolchain is needed at runtime, only for building/deploying the contract
itself.
