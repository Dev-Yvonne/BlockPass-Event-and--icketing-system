"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  EyeOff,
  LucideIcon,
  Search,
  XCircle,
} from "lucide-react";
import { ReactNode, useEffect, useRef } from "react";
import { formatNumber } from "../../lib/format";
import { OrderStatus } from "../../types";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function StatCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note?: string;
  icon: LucideIcon;
}) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <Icon size={18} aria-hidden="true" />
      </div>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  flush,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  flush?: boolean;
}) {
  return (
    <section className="panel">
      {title && (
        <div className="panel-head">
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={flush ? "panel-body flush" : "panel-body"}>{children}</div>
    </section>
  );
}

const ORDER_STATUS: Record<OrderStatus, { label: string; tone: string; icon: LucideIcon }> = {
  confirmed: { label: "Issued", tone: "good", icon: CheckCircle2 },
  failed: { label: "Failed", tone: "bad", icon: XCircle },
  pending: { label: "Processing", tone: "neutral", icon: Clock },
  cancelled: { label: "Cancelled", tone: "neutral", icon: XCircle },
};

export function Badge({
  tone,
  icon: Icon,
  children,
}: {
  tone: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <span className={`badge ${tone}`}>
      {Icon && <Icon size={13} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function OrderBadge({ status }: { status: OrderStatus }) {
  const { label, tone, icon } = ORDER_STATUS[status];
  return (
    <Badge tone={tone} icon={icon}>
      {label}
    </Badge>
  );
}

export function EventBadge({
  date,
  hidden,
  soldOut,
}: {
  date: string;
  hidden?: boolean;
  soldOut?: boolean;
}) {
  if (hidden) {
    return (
      <Badge tone="warn" icon={EyeOff}>
        Hidden
      </Badge>
    );
  }
  if (new Date(date).getTime() < Date.now()) return <Badge tone="neutral">Ended</Badge>;
  if (soldOut) {
    return (
      <Badge tone="warn" icon={AlertTriangle}>
        Sold out
      </Badge>
    );
  }
  return (
    <Badge tone="good" icon={CheckCircle2}>
      On sale
    </Badge>
  );
}

export function Meter({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="meter">
      <div className="meter-text">
        <span>{label}</span>
        <span>
          {formatNumber(value)} of {formatNumber(max)}
        </span>
      </div>
      <div
        className="meter-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <div className="meter-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={22} aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="loading-grid" role="status" aria-label="Loading">
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton tall" />
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="We couldn't load this page"
      action={
        <button className="btn secondary" onClick={onRetry}>
          Try again
        </button>
      }
    >
      {message}
    </EmptyState>
  );
}

export function SearchField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <label className="search-field">
      <Search size={16} aria-hidden="true" />
      <input
        type="search"
        value={value}
        placeholder={label}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  return (
    <dialog ref={dialog} className="dialog" onCancel={onCancel}>
      <h2>{title}</h2>
      <p>{body}</p>
      <div className="dialog-actions">
        <button className="btn secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className={danger ? "btn danger" : "btn"} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
