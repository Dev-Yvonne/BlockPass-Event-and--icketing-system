"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { homeFor, useAuth } from "../context/AuthContext";
import { LogoMark } from "./Logo";

export function SiteHeader() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const hostHref = !user ? "/register?role=organizer" : user.role === "attendee" ? "/dashboard" : "/organizer/events/new";

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand">
          <LogoMark />
          BlockPass
        </Link>
        <button
          className="icon-btn site-menu-btn"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
        <nav className={open ? "site-nav open" : "site-nav"} aria-label="Main">
          <Link href="/#events">Find events</Link>
          <Link href={hostHref}>Host an event</Link>
          <Link href="/ledger">Ticket ledger</Link>
          {user ? (
            <Link className="btn small" href={homeFor(user.role)}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link className="btn small" href="/register">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
