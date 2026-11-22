"use client";

import {
  Camera,
  CameraOff,
  CircleAlert,
  CircleCheck,
  CircleX,
  ExternalLink,
  Keyboard,
  Loader2,
  ScanLine,
  TriangleAlert,
} from "lucide-react";
import type QrScannerType from "qr-scanner";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import * as api from "../lib/api";
import { formatShortDate, shorten } from "../lib/format";
import { GateEvent, Redemption, ScanResult } from "../types";
import { EmptyState, Meter } from "./ui";

const EVENT_KEY = "blockpass_gate_event";
/** How long a verdict stays on screen before the camera looks for the next pass. */
const RESULT_MS = 2600;
/** A pass held in view is read many times a second; act on it once per code (codes change every 10s). */
const REPEAT_WINDOW_MS = 12_000;
const HISTORY_SIZE = 12;

type CameraState = "idle" | "starting" | "running" | "denied" | "unsupported";

interface HistoryEntry {
  id: number;
  at: number;
  result: ScanResult;
  redemption?: Redemption | null;
}

const VERDICT = {
  valid: { title: "Valid. Admit one.", tone: "valid", icon: CircleCheck },
  already_redeemed: { title: "Already checked in", tone: "used", icon: TriangleAlert },
  invalid: { title: "Invalid ticket", tone: "invalid", icon: CircleX },
} as const;

function readStored(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Remembering the event is a convenience only.
  }
}

export function GateScanner() {
  const [events, setEvents] = useState<GateEvent[] | null>(null);
  const [vaultUrl, setVaultUrl] = useState("");
  const [loadError, setLoadError] = useState("");
  const [eventId, setEventId] = useState("");
  const [camera, setCamera] = useState<CameraState>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [manual, setManual] = useState("");
  const [showManual, setShowManual] = useState(false);

  const video = useRef<HTMLVideoElement>(null);
  const scanner = useRef<QrScannerType | null>(null);
  const busy = useRef(false);
  const lastCode = useRef({ text: "", at: 0 });
  const eventRef = useRef("");
  const clearTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const nextId = useRef(1);
  eventRef.current = eventId;

  const loadEvents = useCallback(async () => {
    try {
      const data = await api.getGateEvents();
      setEvents(data.events);
      setVaultUrl(data.vault.url);
      setEventId((current) => {
        if (current) return current;
        const stored = readStored(EVENT_KEY);
        const upcoming = data.events.find((e) => new Date(e.date).getTime() > Date.now() - 864e5);
        return data.events.some((e) => e.id === stored) ? stored! : (upcoming ?? data.events[0])?.id ?? "";
      });
    } catch (err) {
      setLoadError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const settle = useCallback(
    async (entryId: number, bookingId: string, serial: number) => {
      // The scanner already admitted the guest; this records it on Stellar.
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const redemption = await api.confirmRedemption(bookingId, serial);
          setHistory((list) => list.map((e) => (e.id === entryId ? { ...e, redemption } : e)));
          if (redemption.status === "redeemed") {
            loadEvents();
            return;
          }
        } catch {
          // Try again shortly; the server also resumes interrupted check-ins.
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    },
    [loadEvents]
  );

  const submit = useCallback(
    async (code: string) => {
      const text = code.trim();
      if (!text || busy.current || !eventRef.current) return;
      const now = Date.now();
      if (text === lastCode.current.text && now - lastCode.current.at < REPEAT_WINDOW_MS) return;
      lastCode.current = { text, at: now };

      busy.current = true;
      setChecking(true);
      clearTimeout(clearTimer.current);
      let verdict: ScanResult;
      try {
        verdict = await api.scanPass(eventRef.current, text);
      } catch (err) {
        verdict = { verdict: "invalid", message: (err as Error).message, latencyMs: 0 };
      }
      setChecking(false);
      setResult(verdict);
      navigator.vibrate?.(verdict.verdict === "valid" ? 80 : [60, 60, 60]);

      const id = nextId.current++;
      setHistory((list) =>
        [{ id, at: now, result: verdict, redemption: verdict.redemption ?? null }, ...list].slice(0, HISTORY_SIZE)
      );
      if (verdict.verdict === "valid" && verdict.ticket) {
        settle(id, verdict.ticket.bookingId, verdict.ticket.serial);
      }

      clearTimer.current = setTimeout(() => {
        setResult(null);
        busy.current = false;
      }, RESULT_MS);
    },
    [settle]
  );

  const stopCamera = useCallback(() => {
    scanner.current?.stop();
    scanner.current?.destroy();
    scanner.current = null;
    setCamera("idle");
  }, []);

  const startCamera = useCallback(async () => {
    if (!video.current) return;
    setCamera("starting");
    try {
      const QrScanner = (await import("qr-scanner")).default;
      if (!(await QrScanner.hasCamera())) {
        setCamera("unsupported");
        setShowManual(true);
        return;
      }
      const instance = new QrScanner(video.current, (scan) => submit(scan.data), {
        preferredCamera: "environment",
        maxScansPerSecond: 12,
        highlightScanRegion: false,
        highlightCodeOutline: false,
        returnDetailedScanResult: true,
      });
      scanner.current = instance;
      await instance.start();
      setCamera("running");
    } catch {
      scanner.current?.destroy();
      scanner.current = null;
      setCamera("denied");
      setShowManual(true);
    }
  }, [submit]);

  useEffect(() => () => {
    clearTimeout(clearTimer.current);
    scanner.current?.destroy();
  }, []);

  function chooseEvent(id: string) {
    setEventId(id);
    writeStored(EVENT_KEY, id);
    setHistory([]);
  }

  function onManual(e: FormEvent) {
    e.preventDefault();
    lastCode.current = { text: "", at: 0 };
    submit(manual);
    setManual("");
  }

  if (loadError) {
    return (
      <EmptyState icon={CircleAlert} title="Scanner unavailable">
        {loadError}
      </EmptyState>
    );
  }
  if (!events) return <div className="gate-loading"><span className="spinner" aria-label="Loading" /></div>;
  if (events.length === 0) {
    return (
      <EmptyState icon={ScanLine} title="No events to scan">
        Create an event first. Tickets can only be scanned at their own event.
      </EmptyState>
    );
  }

  const current = events.find((e) => e.id === eventId);
  const session = {
    admitted: history.filter((h) => h.result.verdict === "valid").length,
    duplicates: history.filter((h) => h.result.verdict === "already_redeemed").length,
    invalid: history.filter((h) => h.result.verdict === "invalid").length,
  };
  const shown = result ? VERDICT[result.verdict] : null;

  return (
    <div className="gate">
      <div className="gate-camera-col">
        <div className={`gate-camera ${camera}`}>
          <video ref={video} muted playsInline aria-label="Camera preview" />
          {camera !== "running" && (
            <div className="gate-camera-idle">
              {camera === "denied" || camera === "unsupported" ? (
                <>
                  <CameraOff size={34} aria-hidden="true" />
                  <p>
                    {camera === "denied"
                      ? "Camera access was blocked. Allow it in your browser settings, or enter codes by hand."
                      : "No camera found on this device. Enter codes by hand."}
                  </p>
                </>
              ) : (
                <>
                  <ScanLine size={34} aria-hidden="true" />
                  <p>Point the camera at the attendee&apos;s pass.</p>
                </>
              )}
              <button type="button" className="btn" onClick={startCamera} disabled={camera === "starting" || !eventId}>
                {camera === "starting" ? <Loader2 size={16} className="spin" aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />}
                {camera === "starting" ? "Starting camera" : "Start scanning"}
              </button>
            </div>
          )}
          {camera === "running" && !result && (
            <div className="gate-viewfinder" aria-hidden="true">
              <span />
            </div>
          )}
          {checking && (
            <div className="gate-checking" role="status">
              <Loader2 size={22} className="spin" aria-hidden="true" />
              Checking the ledger
            </div>
          )}
          {result && shown && (
            <div className={`gate-result ${shown.tone}`} role="alert">
              <shown.icon size={44} aria-hidden="true" />
              <h2>{shown.title}</h2>
              <p>
                {result.message}
                {result.verdict === "already_redeemed" && result.redemption?.admittedAt
                  ? ` Checked in at ${new Date(result.redemption.admittedAt).toLocaleTimeString("en-GB", { hour12: false })}.`
                  : ""}
              </p>
              {result.ticket && (
                <dl>
                  <div>
                    <dt>Name</dt>
                    <dd>{result.ticket.attendeeName}</dd>
                  </div>
                  <div>
                    <dt>Ticket</dt>
                    <dd>{result.ticket.tierName}</dd>
                  </div>
                  <div>
                    <dt>Code</dt>
                    <dd>
                      <code>{result.ticket.assetCode}</code>
                    </dd>
                  </div>
                </dl>
              )}
              {result.latencyMs > 0 && (
                <small>
                  Verified in {(result.latencyMs / 1000).toFixed(2)} s
                  {result.source === "ledger" ? " against the Stellar ledger" : ""}
                </small>
              )}
              <button type="button" className="btn light small" onClick={() => {
                clearTimeout(clearTimer.current);
                setResult(null);
                busy.current = false;
              }}>
                Scan next
              </button>
            </div>
          )}
        </div>

        <div className="gate-camera-actions">
          {camera === "running" ? (
            <button type="button" className="btn secondary small" onClick={stopCamera}>
              <CameraOff size={15} aria-hidden="true" />
              Stop camera
            </button>
          ) : null}
          <button type="button" className="btn secondary small" onClick={() => setShowManual((v) => !v)}>
            <Keyboard size={15} aria-hidden="true" />
            {showManual ? "Hide code entry" : "Enter a code"}
          </button>
        </div>

        {showManual && (
          <form className="gate-manual" onSubmit={onManual}>
            <label htmlFor="gate-code">Pass code</label>
            <div>
              <input
                id="gate-code"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="BP1.…"
                autoComplete="off"
                spellCheck={false}
              />
              <button className="btn" type="submit" disabled={!manual.trim() || checking}>
                Check
              </button>
            </div>
          </form>
        )}
      </div>

      <aside className="gate-side">
        <section className="panel gate-event">
          <label htmlFor="gate-event">Scanning for</label>
          <select id="gate-event" value={eventId} onChange={(e) => chooseEvent(e.target.value)}>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} · {formatShortDate(e.date)}
              </option>
            ))}
          </select>
          {current && <Meter value={current.checkedIn} max={current.issued} label="Checked in" />}
          <ul className="gate-session">
            <li className="valid">
              <strong>{session.admitted}</strong>
              Admitted
            </li>
            <li className="used">
              <strong>{session.duplicates}</strong>
              Duplicates
            </li>
            <li className="invalid">
              <strong>{session.invalid}</strong>
              Invalid
            </li>
          </ul>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Recent scans</h2>
              <p>This device, newest first.</p>
            </div>
            {vaultUrl && (
              <a className="text-link" href={vaultUrl} target="_blank" rel="noreferrer">
                Vault
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            )}
          </div>
          {history.length === 0 ? (
            <p className="gate-empty">Scanned passes appear here.</p>
          ) : (
            <ol className="gate-history">
              {history.map((entry) => {
                const v = VERDICT[entry.result.verdict];
                return (
                  <li key={entry.id} className={v.tone}>
                    <v.icon size={18} aria-hidden="true" />
                    <div>
                      <strong>{entry.result.ticket?.attendeeName ?? v.title}</strong>
                      <span>
                        {entry.result.ticket?.assetCode ?? entry.result.message}
                      </span>
                      {entry.result.verdict === "valid" && (
                        <span className="gate-chain">
                          {entry.redemption?.status === "redeemed" && entry.redemption.txUrl ? (
                            <a href={entry.redemption.txUrl} target="_blank" rel="noreferrer">
                              Moved to vault · {shorten(entry.redemption.txHash!, 5)}
                              <ExternalLink size={11} aria-hidden="true" />
                            </a>
                          ) : entry.redemption?.status === "failed" ? (
                            "On-chain step will retry"
                          ) : (
                            <>
                              <Loader2 size={11} className="spin" aria-hidden="true" />
                              Recording on Stellar
                            </>
                          )}
                        </span>
                      )}
                    </div>
                    <time>
                      {new Date(entry.at).toLocaleTimeString("en-GB", { hour12: false })}
                    </time>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </aside>
    </div>
  );
}
