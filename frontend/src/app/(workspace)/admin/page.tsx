"use client";

import { ArrowRight, CalendarDays, CheckCircle2, ExternalLink, Receipt, ShieldCheck, Ticket, Users, Wallet, XCircle } from "lucide-react";
import Link from "next/link";
import { BarChart } from "../../../components/BarChart";
import { Badge, ErrorState, LoadingState, PageHeader, Panel, StatCard } from "../../../components/ui";
import * as api from "../../../lib/api";
import { formatDate, formatNumber, formatPrice, shorten } from "../../../lib/format";
import { useResource } from "../../../lib/useResource";

export default function AdminOverview() {
  const { data, error, reload } = useResource(api.getAdminOverview);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return <LoadingState />;

  const { stats, daily, distributor, activity } = data;
  const rate = stats.successRate === null ? "None yet" : `${(stats.successRate * 100).toFixed(1)}%`;

  return (
    <>
      <PageHeader title="Platform overview" description="BlockPass activity across all organizers." />

      <div className="stat-grid">
        <StatCard label="Tickets issued" value={formatNumber(stats.tickets)} note={`${formatNumber(stats.orders)} orders`} icon={Ticket} />
        <StatCard label="Order value" value={formatPrice(stats.orderValue)} note="Test mode" icon={Receipt} />
        <StatCard label="Events on sale" value={formatNumber(stats.liveEvents)} icon={CalendarDays} />
        <StatCard label="Accounts" value={formatNumber(stats.attendees + stats.organizers + stats.admins)} note={`${stats.organizers} organizers, ${stats.attendees} attendees`} icon={Users} />
      </div>

      <div className="workspace-grid">
        <Panel title="Tickets issued per day" description="Last 14 days">
          <BarChart data={daily} label="Tickets issued per day, last 14 days" />
        </Panel>

        <Panel title="Minting health">
          <dl className="health">
            <div>
              <dt>
                <ShieldCheck size={16} aria-hidden="true" />
                Success rate
              </dt>
              <dd>{rate}</dd>
            </div>
            <div>
              <dt>
                <XCircle size={16} aria-hidden="true" />
                Failed orders
              </dt>
              <dd>{formatNumber(stats.failedOrders)}</dd>
            </div>
            <div>
              <dt>
                <Wallet size={16} aria-hidden="true" />
                Distributor balance
              </dt>
              <dd>
                {distributor ? `${formatNumber(Math.floor(distributor.balance))} XLM` : "Unavailable"}
              </dd>
            </div>
          </dl>
          {distributor && (
            <a className="inline-link" href={distributor.url} target="_blank" rel="noreferrer">
              {shorten(distributor.publicKey)}
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          )}
        </Panel>
      </div>

      <Panel
        title="Recent minting activity"
        action={
          <Link className="text-link" href="/admin/activity">
            All activity
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        }
      >
        {activity.length === 0 ? (
          <p className="muted">No activity yet.</p>
        ) : (
          <ul className="activity-list">
            {activity.map((entry) => {
              const ok = entry.stage === "mint.confirmed";
              return (
                <li key={entry._id}>
                  <Badge tone={ok ? "good" : "bad"} icon={ok ? CheckCircle2 : XCircle}>
                    {ok ? "Issued" : "Failed"}
                  </Badge>
                  <span className="activity-main">
                    {entry.eventTitle} · {entry.quantity ?? entry.assetCodes?.length ?? 0} × {entry.tierName}
                  </span>
                  <time>{formatDate(entry.createdAt)}</time>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
