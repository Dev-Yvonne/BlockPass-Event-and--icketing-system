"use client";

import { CheckCircle2, CircleDashed, ExternalLink, Inbox, XCircle } from "lucide-react";
import Link from "next/link";
import { Badge, ErrorState, LoadingState, PageHeader, Panel } from "../../../../components/ui";
import * as api from "../../../../lib/api";
import { formatDate } from "../../../../lib/format";
import { useResource } from "../../../../lib/useResource";

const STAGES: Record<string, { label: string; tone: string; icon: typeof Inbox }> = {
  "order.received": { label: "Received", tone: "neutral", icon: Inbox },
  "mint.submitted": { label: "Submitted", tone: "neutral", icon: CircleDashed },
  "mint.confirmed": { label: "Confirmed", tone: "good", icon: CheckCircle2 },
  "mint.failed": { label: "Failed", tone: "bad", icon: XCircle },
};

export default function AdminActivity() {
  const { data: entries, error, reload } = useResource(api.getAdminActivity);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!entries) return <LoadingState />;

  return (
    <>
      <PageHeader title="Activity" description="The latest 100 stages of the checkout and minting pipeline." />
      <Panel flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Stage</th>
                <th scope="col">Event</th>
                <th scope="col">Detail</th>
                <th scope="col">Time</th>
                <th scope="col">
                  <span className="sr-only">Links</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const stage = STAGES[entry.stage] ?? STAGES["order.received"];
                return (
                  <tr key={entry._id}>
                    <td data-label="Stage">
                      <Badge tone={stage.tone} icon={stage.icon}>
                        {stage.label}
                      </Badge>
                    </td>
                    <td data-label="Event">
                      <span className="cell-title">{entry.eventTitle}</span>
                      <span className="cell-sub">{entry.tierName}</span>
                    </td>
                    <td data-label="Detail">
                      {entry.error ? <span className="cell-error">{entry.error}</span> : <code>{entry.assetCodes?.join(", ")}</code>}
                    </td>
                    <td data-label="Time">{formatDate(entry.createdAt)}</td>
                    <td className="cell-actions">
                      <Link href={`/orders/${entry.reference}`}>Open</Link>
                      {entry.txHash && (
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${entry.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="View transaction on StellarExpert"
                        >
                          <ExternalLink size={15} aria-hidden="true" />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
