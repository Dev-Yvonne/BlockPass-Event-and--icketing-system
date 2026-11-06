import Link from "next/link";
import { ReactNode } from "react";
import { LogoMark } from "../../components/Logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <div className="auth-photo">
        <img src="/images/accra-street-culture-fest.jpg" alt="" />
        <div className="auth-photo-overlay" />
        <p>Every event across Africa deserves tickets people can trust.</p>
      </div>
      <main className="auth-main">
        <Link href="/" className="brand">
          <LogoMark />
          BlockPass
        </Link>
        <div className="auth-form">{children}</div>
      </main>
    </div>
  );
}
