#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::Env;

fn setup() -> (Env, TicketNftClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(TicketNft, ());
    let client = TicketNftClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    client.initialize(&admin);

    (env, client, admin)
}

#[test]
fn mint_assigns_sequential_token_ids() {
    let (env, client, _admin) = setup();
    let buyer = Address::generate(&env);
    let event_id = Symbol::new(&env, "AFROFEST2026");

    let first = client.mint(&buyer, &event_id, &1);
    let second = client.mint(&buyer, &event_id, &2);

    assert_eq!(first, 0);
    assert_eq!(second, 1);

    let ticket = client.get_ticket(&first);
    assert_eq!(ticket.owner, buyer);
    assert_eq!(ticket.serial, 1);
    assert!(!ticket.checked_in);
}

#[test]
fn duplicate_serial_for_same_event_is_rejected() {
    let (env, client, _admin) = setup();
    let buyer = Address::generate(&env);
    let event_id = Symbol::new(&env, "AFROFEST2026");

    client.mint(&buyer, &event_id, &1);
    let result = client.try_mint(&buyer, &event_id, &1);

    assert_eq!(result, Err(Ok(Error::DuplicateTicket)));
}

#[test]
fn check_in_is_one_time_only() {
    let (env, client, _admin) = setup();
    let buyer = Address::generate(&env);
    let event_id = Symbol::new(&env, "AFROFEST2026");
    let token_id = client.mint(&buyer, &event_id, &1);

    client.check_in(&token_id);
    let ticket = client.get_ticket(&token_id);
    assert!(ticket.checked_in);

    let second_attempt = client.try_check_in(&token_id);
    assert_eq!(second_attempt, Err(Ok(Error::AlreadyCheckedIn)));
}

#[test]
fn owner_can_transfer_ticket() {
    let (env, client, _admin) = setup();
    let buyer = Address::generate(&env);
    let new_owner = Address::generate(&env);
    let event_id = Symbol::new(&env, "AFROFEST2026");
    let token_id = client.mint(&buyer, &event_id, &1);

    client.transfer(&buyer, &new_owner, &token_id);

    assert_eq!(client.owner_of(&token_id), new_owner);
}
