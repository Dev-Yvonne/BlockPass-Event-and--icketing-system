"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "../lib/api";

/** A new code well before the 30-second token expires, so the one shown is always valid. */
const REFRESH_MS = 10_000;
const TICK_MS = 250;

function clock(ms: number) {
  return new Date(ms).toLocaleTimeString("en-GB", { hour12: false });
}

/**
 * The scannable part of a pass. Each code is a server-signed token that names
 * one ticket and expires 30 seconds after it was issued, so a forwarded
 * screenshot stops working almost immediately. The running clock and progress
 * bar make a still image easy to spot at the gate.
 */
export function DynamicQr({
  reference,
  serial,
  onUsed,
}: {
  reference: string;
  serial: number;
  onUsed: () => void;
}) {
  const [svg, setSvg] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [issuedAt, setIssuedAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState("");
  const skew = useRef(0);
  const usedRef = useRef(onUsed);
  usedRef.current = onUsed;

  const refresh = useCallback(async () => {
    try {
      const pass = await api.getPassToken(reference, serial);
      skew.current = pass.serverTime - Date.now();
      const markup = await QRCode.toString(pass.token, {
        type: "svg",
        errorCorrectionLevel: "M",
        margin: 1,
        color: { dark: "#14151a", light: "#ffffff" },
      });
      setSvg(markup);
      setExpiresAt(pass.expiresAt);
      setIssuedAt(pass.serverTime);
      setError("");
    } catch (err) {
      const status = (err as { body?: { message?: string } }).body?.message ?? "";
      if (/checked in/i.test(status)) usedRef.current();
      else setError((err as Error).message);
    }
  }, [reference, serial]);

  useEffect(() => {
    setSvg("");
    refresh();
    const refreshTimer = setInterval(refresh, REFRESH_MS);
    const tick = setInterval(() => setNow(Date.now()), TICK_MS);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(refreshTimer);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const serverNow = now + skew.current;
  const expired = !!expiresAt && serverNow >= expiresAt;
  const sinceIssue = Math.max(0, serverNow - issuedAt);
  const nextIn = Math.max(0, Math.ceil((REFRESH_MS - sinceIssue) / 1000));
  const progress = Math.min(1, sinceIssue / REFRESH_MS);

  return (
    <div className="dynamic-qr">
      <div className={expired || error ? "qr-frame stale" : "qr-frame"}>
        {svg && !expired ? (
          <div className="qr-image" role="img" aria-label="Ticket QR code" dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <div className="qr-placeholder">
            {error || expired ? (
              <>
                <WifiOff size={28} aria-hidden="true" />
                <p>{error ? "Can't load your code" : "Reconnecting"}</p>
                <button type="button" className="btn small secondary" onClick={refresh}>
                  <RefreshCw size={14} aria-hidden="true" />
                  Try again
                </button>
              </>
            ) : (
              <span className="spinner" aria-label="Loading code" />
            )}
          </div>
        )}
      </div>

      <div className="qr-live" aria-live="off">
        <span className="live-dot" aria-hidden="true" />
        <strong>{clock(serverNow)}</strong>
        <span>{expired || error ? "Code paused" : `New code in ${nextIn}s`}</span>
      </div>
      <div className="qr-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${expired ? 0 : 1 - progress})` }} />
      </div>
      <p className="qr-caption">
        This code changes every 10 seconds and only works on this screen. Screenshots won&apos;t scan.
      </p>
    </div>
  );
}
