import { ExternalLink } from "lucide-react";
import { formatShortDate, shorten } from "../../../lib/format";
import { listMints } from "../../../lib/server";

export const metadata = { title: "Ticket ledger | BlockPass" };

export default async function LedgerPage() {
  const mints = await listMints();

  return (
    <div className="section ledger-page">
      <h1>Ticket ledger</h1>
      <p className="lead">
        Recent tickets issued on the Stellar testnet. Each row links to its public transaction, so
        anyone can check it independently of BlockPass.
      </p>
      {mints.length === 0 ? (
        <p className="no-results">No tickets have been issued yet.</p>
      ) : (
        <div className="table-wrap bordered">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Event</th>
                <th scope="col">Tier</th>
                <th scope="col">Tickets</th>
                <th scope="col">Ledger</th>
                <th scope="col">Issued</th>
                <th scope="col">Transaction</th>
              </tr>
            </thead>
            <tbody>
              {mints.map((mint) => (
                <tr key={mint.txHash}>
                  <td data-label="Event">
                    <span className="cell-title">{mint.eventTitle}</span>
                  </td>
                  <td data-label="Tier">{mint.tierName}</td>
                  <td data-label="Tickets">
                    <code>{mint.assetCodes.join(", ")}</code>
                  </td>
                  <td data-label="Ledger">{mint.ledger}</td>
                  <td data-label="Issued">{formatShortDate(mint.createdAt)}</td>
                  <td data-label="Transaction">
                    <a className="inline-link" href={mint.txUrl} target="_blank" rel="noreferrer">
                      {shorten(mint.txHash)}
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
