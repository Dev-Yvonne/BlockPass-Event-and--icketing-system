"use client";

import { CalendarPlus, Ticket } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { homeFor, useAuth } from "../../../context/AuthContext";
import { UserRole } from "../../../types";

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<UserRole>(
    params.get("role") === "organizer" ? "organizer" : "attendee"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await register(name, email, password, role);
      router.push(homeFor(user.role));
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1>Create your account</h1>
      <p className="muted">Join BlockPass to attend or host events.</p>
      <form onSubmit={handleSubmit} className="form">
        <fieldset className="role-options">
          <legend>I want to</legend>
          <label className={role === "attendee" ? "selected" : ""}>
            <input
              type="radio"
              name="role"
              checked={role === "attendee"}
              onChange={() => setRole("attendee")}
            />
            <Ticket size={20} aria-hidden="true" />
            Attend events
          </label>
          <label className={role === "organizer" ? "selected" : ""}>
            <input
              type="radio"
              name="role"
              checked={role === "organizer"}
              onChange={() => setRole("organizer")}
            />
            <CalendarPlus size={20} aria-hidden="true" />
            Host events
          </label>
        </fieldset>
        <label className="field">
          Full name
          <input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="field">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="field">
          Password
          <input
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <small>At least 6 characters.</small>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn full" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
