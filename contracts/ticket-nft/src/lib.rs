#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env, Symbol};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    NextId,
    Ticket(u64),
    EventSerial(Symbol, u32),
}

#[derive(Clone)]
#[contracttype]
pub struct Ticket {
    pub event_id: Symbol,
    pub serial: u32,
    pub owner: Address,
    pub checked_in: bool,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    TokenNotFound = 3,
    DuplicateTicket = 4,
    AlreadyCheckedIn = 5,
    NotOwner = 6,
}

#[contract]
pub struct TicketNft;

#[contractimpl]
impl TicketNft {
    /// Sets the contract admin (the BlockPass minting service's custodial
    /// issuer account). Must be called once, right after deployment.
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NextId, &0u64);
        Ok(())
    }

    /// Mints a new ticket NFT to `to` for the given event/serial pair.
    /// Only the admin (BlockPass's custodial minting service) may call this.
    /// Returns the newly minted token id.
    pub fn mint(
        env: Env,
        to: Address,
        event_id: Symbol,
        serial: u32,
    ) -> Result<u64, Error> {
        let admin = Self::get_admin(&env)?;
        admin.require_auth();

        let serial_key = DataKey::EventSerial(event_id.clone(), serial);
        if env.storage().persistent().has(&serial_key) {
            return Err(Error::DuplicateTicket);
        }

        let token_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextId)
            .unwrap_or(0u64);

        let ticket = Ticket {
            event_id,
            serial,
            owner: to,
            checked_in: false,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Ticket(token_id), &ticket);
        env.storage().persistent().set(&serial_key, &token_id);
        env.storage()
            .instance()
            .set(&DataKey::NextId, &(token_id + 1));

        Ok(token_id)
    }

    /// Returns the current owner of a ticket.
    pub fn owner_of(env: Env, token_id: u64) -> Result<Address, Error> {
        Ok(Self::get_ticket(env, token_id)?.owner)
    }

    /// Returns the full ticket record.
    pub fn get_ticket(env: Env, token_id: u64) -> Result<Ticket, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Ticket(token_id))
            .ok_or(Error::TokenNotFound)
    }

    /// Marks a ticket as used at the venue gate. Only the admin (the venue
    /// scanning device, authenticated as BlockPass's issuer account) may
    /// call this. Fails if the ticket was already checked in, which is the
    /// on-chain defense against duplicate-screenshot re-entry.
    pub fn check_in(env: Env, token_id: u64) -> Result<(), Error> {
        let admin = Self::get_admin(&env)?;
        admin.require_auth();

        let mut ticket = Self::get_ticket(env.clone(), token_id)?;
        if ticket.checked_in {
            return Err(Error::AlreadyCheckedIn);
        }
        ticket.checked_in = true;
        env.storage()
            .persistent()
            .set(&DataKey::Ticket(token_id), &ticket);
        Ok(())
    }

    /// Transfers a ticket to a new owner. Must be authorized by the current
    /// owner.
    pub fn transfer(env: Env, from: Address, to: Address, token_id: u64) -> Result<(), Error> {
        from.require_auth();

        let mut ticket = Self::get_ticket(env.clone(), token_id)?;
        if ticket.owner != from {
            return Err(Error::NotOwner);
        }
        ticket.owner = to;
        env.storage()
            .persistent()
            .set(&DataKey::Ticket(token_id), &ticket);
        Ok(())
    }

    fn get_admin(env: &Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }
}

mod test;
