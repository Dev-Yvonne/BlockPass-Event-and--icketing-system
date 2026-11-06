"use client";

import {
  Activity,
  CalendarDays,
  Compass,
  LayoutDashboard,
  LogOut,
  LucideIcon,
  Menu,
  MessageSquareText,
  Plus,
  Receipt,
  ShieldCheck,
  Ticket,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { homeFor, useAuth } from "../context/AuthContext";
import { initials } from "../lib/format";
import { UserRole } from "../types";
import { LogoMark } from "./Logo";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const ATTENDING: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/tickets", label: "My tickets", icon: Ticket },
  { href: "/", label: "Find events", icon: Compass, exact: true },
];

const HOSTING: NavItem[] = [
  { href: "/organizer", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/organizer/events", label: "Events", icon: CalendarDays },
  { href: "/organizer/orders", label: "Orders", icon: Receipt },
  { href: "/organizer/feedback", label: "Feedback", icon: MessageSquareText },
];

const PLATFORM: NavItem[] = [
  { href: "/admin", label: "Overview", icon: ShieldCheck, exact: true },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/activity", label: "Activity", icon: Activity },
];

const ROLE_LABEL: Record<UserRole, string> = {
  attendee: "Attendee",
  organizer: "Organizer",
  admin: "Admin",
};

function requiredRoles(pathname: string): UserRole[] | null {
  if (pathname.startsWith("/admin")) return ["admin"];
  if (pathname.startsWith("/organizer")) return ["organizer", "admin"];
  return null;
}

function NavGroup({ title, items, pathname }: { title: string; items: NavItem[]; pathname: string }) {
  return (
    <div className="nav-group">
      <p>{title}</p>
      <ul>
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
                <Icon size={18} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const roles = requiredRoles(pathname);
  const signedOut = !loading && !user;
  const forbidden = !!user && !!roles && !roles.includes(user.role);

  useEffect(() => {
    if (signedOut) router.replace("/login");
    else if (forbidden) router.replace(homeFor(user!.role));
  }, [signedOut, forbidden, user, router]);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", close);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  if (loading || !user || forbidden) {
    return (
      <div className="shell-loading" role="status">
        <LogoMark size={36} />
      </div>
    );
  }

  const hosting = user.role === "organizer" || user.role === "admin";

  return (
    <div className="shell">
      <div className="shell-topbar">
        <button className="icon-btn" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
          <Menu size={20} aria-hidden="true" />
        </button>
        <Link href="/" className="brand">
          <LogoMark />
          BlockPass
        </Link>
      </div>

      {menuOpen && <button className="shell-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}

      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="sidebar-head">
          <Link href="/" className="brand">
            <LogoMark />
            BlockPass
          </Link>
          <button className="icon-btn sidebar-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {hosting && (
          <Link href="/organizer/events/new" className="btn sidebar-cta">
            <Plus size={16} aria-hidden="true" />
            Create event
          </Link>
        )}

        <nav aria-label="Workspace">
          {user.role === "admin" && <NavGroup title="Platform" items={PLATFORM} pathname={pathname} />}
          {hosting && <NavGroup title="Hosting" items={HOSTING} pathname={pathname} />}
          <NavGroup title="Attending" items={ATTENDING} pathname={pathname} />
        </nav>

        <div className="sidebar-user">
          <span className="avatar">{initials(user.name)}</span>
          <div>
            <strong>{user.name}</strong>
            <small>{ROLE_LABEL[user.role]}</small>
          </div>
          <button
            className="icon-btn"
            aria-label="Log out"
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <main className="shell-main">
        <p className="testnet-note">Test mode. No real money moves.</p>
        {children}
      </main>
    </div>
  );
}
