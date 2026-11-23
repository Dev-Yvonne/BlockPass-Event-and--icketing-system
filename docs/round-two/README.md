# BlockPass Round 2: gate verification

Round 2 adds the gate layer. Attendees show a signed QR pass that refreshes on its own,
organizers scan it in the browser, and each admitted ticket is moved on-chain into a
redeemed vault so it can't be used again.

| | |
| --- | --- |
| **Live app** | https://www.blockpass.co.ke |
| **Gate scanner** | https://www.blockpass.co.ke/organizer/scan (organizer sign-in) |
| **Redeemed vault** | [GBSK6VKO…UMOJI on StellarExpert](https://stellar.expert/explorer/testnet/account/GBSK6VKOFWMFMUWMJTNLQJIQDNDD7PO5CCBSAYDAG5YXKXRUMQKUMOJI) |
| **Network** | Stellar testnet. No real money moves. |

## How to review in five minutes

1. Buy a ticket on the live app and select **Open mobile pass** on the confirmation page.
2. The pass shows a QR code that changes every 10 seconds, plus a link to the issue transaction
   on StellarExpert. A screenshot of the code stops working within 30 seconds.
3. Sign in as an organizer, open **Gate scanner**, choose the event and scan the pass with the
   camera. The result is **Valid**.
4. Scan the same pass again. The result is **Already checked in**. A code from another event, or
   a forged code, shows **Invalid**.
5. In **Recent scans**, select the transaction link to see the ticket moved into the vault on
   StellarExpert.

## Deliverables

| Deliverable | What it does | Code |
| --- | --- | --- |
| 1. Mobile pass with dynamic QR | Ed25519-signed token (`BP1.<payload>.<signature>`) naming one ticket, valid for 30 seconds and refreshed every 10. Links to the ticket's StellarExpert transaction. | [`passToken.ts`](../../backend/src/services/passes/passToken.ts), [`PassView.tsx`](../../frontend/src/components/PassView.tsx), [`DynamicQr.tsx`](../../frontend/src/components/DynamicQr.tsx) |
| 2. Browser gate scanner | Uses the device camera, checks the signature, the booking and the ticket's holder on Horizon, and shows Valid, Already checked in or Invalid. Manual code entry is available. | [`GateScanner.tsx`](../../frontend/src/components/GateScanner.tsx), [`gate.ts`](../../backend/src/services/gate.ts) |
| 3. On-chain redemption | One atomic transaction per ticket: the vault opens a trustline, the attendee sends the ticket to the vault, and the attendee's trustline is closed. A database claim stops two gates admitting the same ticket. | [`redemption.ts`](../../backend/src/services/stellar/redemption.ts) |

## Gate drill results

Run on www.blockpass.co.ke on 22 November 2026 with
[`scripts/gateDrill.ts`](../../backend/scripts/gateDrill.ts).

| Check | Result |
| --- | --- |
| Valid tickets admitted | 25 of 25 |
| Duplicate scans refused | 5 of 5 |
| Same ticket scanned twice at once | Exactly one admitted |
| Invalid codes refused (forged, expired, wrong event, not a pass) | 7 of 7 |
| Redemptions confirmed on-chain | 25 of 25, all held by the vault |
| Admit decision on the server | Median 0.37 s, slowest 1.40 s |

Sample redemption transactions:

| Ticket | Ledger | Transaction |
| --- | --- | --- |
| NAIROG000045 | 5,872,593 | [924c6fa4…7c61844](https://stellar.expert/explorer/testnet/tx/924c6fa4090dc853bf080a2c4ef21d0dde338e0156dc9e8b1873016cf7c61844) |
| NAIROG000046 | 5,872,594 | [e5f8a30a…0bbae40](https://stellar.expert/explorer/testnet/tx/e5f8a30af6fd89826806ca5917e29c16b4d62cd3e7d56a5620db12b6f5bbae40) |
| NAIROG000047 | 5,872,595 | [d520ed5d…1ca184e](https://stellar.expert/explorer/testnet/tx/d520ed5df37d52957ac196161837e1ddf8a92b9cab0f45986b091b1211ca184e) |
| NAIROG000048 | 5,872,596 | [1931b33a…0fc882](https://stellar.expert/explorer/testnet/tx/1931b33ae377811919c27cecc946bc9d75f74d3d628fd4ec3acc7054027fc882) |
| NAIROG000049 | 5,872,597 | [b44d5a41…0fd87bf](https://stellar.expert/explorer/testnet/tx/b44d5a417fdc84d8e18b0688b1f1e3ffd063ec4299e224b4cabdcba6b0fd87bf) |

All 25 are listed in the vault's history on StellarExpert.

## Running the drill yourself

The drill buys fresh tickets, scans them through the live API and checks every redemption on
Horizon. It writes results to a file you choose, outside the repository.

```bash
cd backend
API_URL=https://www.blockpass.co.ke/api \
DRILL_ORGANIZER_EMAIL=<organizer email> DRILL_ORGANIZER_PASSWORD=<password> \
DRILL_OUT=/path/to/gate-drill-results.json \
npm run gate:drill
```

`DRILL_VALID` and `DRILL_DUPLICATES` change the counts (25 and 5 by default).

## Known limitations

- Redemptions from the single vault account are sent one at a time, so on-chain confirmation
  can lag the gate during a burst of arrivals. The admit decision itself is not delayed.
- The scanner needs a network connection for each scan.
- Gate staff currently sign in with an organizer account.
