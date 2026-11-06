"use client";

import { Ban, CircleCheck } from "lucide-react";
import { useState } from "react";
import { Badge, ConfirmDialog, ErrorState, LoadingState, PageHeader, Panel, SearchField } from "../../../../components/ui";
import { useAuth } from "../../../../context/AuthContext";
import * as api from "../../../../lib/api";
import { formatShortDate, initials } from "../../../../lib/format";
import { useResource } from "../../../../lib/useResource";
import { AdminUser, UserRole } from "../../../../types";

export default function AdminUsers() {
  const { user: me } = useAuth();
  const { data: users, error, reload } = useResource(api.getAdminUsers);
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [actionError, setActionError] = useState("");

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!users) return <LoadingState />;

  const needle = query.toLowerCase();
  const shown = users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(needle));

  async function change(id: string, update: { role?: UserRole; suspended?: boolean }) {
    setActionError("");
    try {
      await api.updateAdminUser(id, update);
      await reload();
    } catch (err) {
      setActionError((err as Error).message);
    }
  }

  return (
    <>
      <PageHeader title="Users" description="Manage roles and account access." />
      <div className="toolbar">
        <SearchField value={query} onChange={setQuery} label="Search by name or email" />
      </div>
      {actionError && <p className="form-error">{actionError}</p>}
      <Panel flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">Joined</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((user) => {
                const self = user.id === me?.id;
                return (
                  <tr key={user.id}>
                    <td data-label="User">
                      <div className="user-cell">
                        <span className="avatar">{initials(user.name)}</span>
                        <span>
                          <span className="cell-title">
                            {user.name}
                            {self && " (you)"}
                          </span>
                          <span className="cell-sub">{user.email}</span>
                        </span>
                      </div>
                    </td>
                    <td data-label="Role">
                      <select
                        className="select-compact"
                        aria-label={`Role for ${user.name}`}
                        value={user.role}
                        disabled={self}
                        onChange={(e) => change(user.id, { role: e.target.value as UserRole })}
                      >
                        <option value="attendee">Attendee</option>
                        <option value="organizer">Organizer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td data-label="Status">
                      {user.suspended ? (
                        <Badge tone="bad" icon={Ban}>
                          Suspended
                        </Badge>
                      ) : (
                        <Badge tone="good" icon={CircleCheck}>
                          Active
                        </Badge>
                      )}
                    </td>
                    <td data-label="Joined">{formatShortDate(user.createdAt)}</td>
                    <td className="cell-actions">
                      {!self && (
                        <button className="btn secondary small" onClick={() => setTarget(user)}>
                          {user.suspended ? "Restore" : "Suspend"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      <ConfirmDialog
        open={!!target}
        title={target?.suspended ? "Restore this account?" : "Suspend this account?"}
        body={
          target?.suspended
            ? `${target.name} will be able to log in again.`
            : `${target?.name} will be logged out and unable to log in. Their issued tickets stay valid.`
        }
        confirmLabel={target?.suspended ? "Restore account" : "Suspend account"}
        danger={!target?.suspended}
        onConfirm={() => {
          if (target) change(target.id, { suspended: !target.suspended });
          setTarget(null);
        }}
        onCancel={() => setTarget(null)}
      />
    </>
  );
}
