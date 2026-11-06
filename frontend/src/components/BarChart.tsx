"use client";

import { useState } from "react";
import { formatDayMonth, formatNumber } from "../lib/format";
import { DailyPoint } from "../types";

function niceMax(value: number) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((m) => value <= m * magnitude) ?? 10;
  return step * magnitude;
}

/** Tickets issued per day. Each bar reveals its value on hover or keyboard focus. */
export function BarChart({ data, label }: { data: DailyPoint[]; label: string }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((point) => point.tickets), 1));
  const peak = data.reduce((best, point, i) => (point.tickets > data[best].tickets ? i : best), 0);
  const ticks = [max, max / 2, 0];

  return (
    <figure className="chart">
      <div className="chart-plot" onMouseLeave={() => setActive(null)}>
        <div className="chart-grid" aria-hidden="true">
          {ticks.map((tick) => (
            <div key={tick} className="chart-gridline">
              <span>{formatNumber(tick)}</span>
            </div>
          ))}
        </div>
        <div className="chart-bars">
          {data.map((point, i) => {
            const height = (point.tickets / max) * 100;
            const name = `${formatDayMonth(point.date)}: ${point.tickets} ${
              point.tickets === 1 ? "ticket" : "tickets"
            }`;
            return (
              <button
                key={point.date}
                type="button"
                className="chart-slot"
                aria-label={name}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              >
                <span className="chart-bar-area">
                  {i === peak && point.tickets > 0 && active === null && (
                    <span className="chart-peak" style={{ bottom: `${height}%` }}>
                      {formatNumber(point.tickets)}
                    </span>
                  )}
                  <span
                    className={point.tickets > 0 ? "chart-bar" : "chart-bar empty"}
                    style={{ height: point.tickets > 0 ? `${height}%` : undefined }}
                  />
                  {active === i && (
                    <span
                      className={`chart-tip ${i > data.length / 2 ? "left" : "right"}`}
                      style={{ bottom: `${Math.min(height, 78)}%` }}
                    >
                      <strong>{formatNumber(point.tickets)}</strong>
                      <small>{formatDayMonth(point.date)}</small>
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="chart-axis" aria-hidden="true">
        <span>{formatDayMonth(data[0].date)}</span>
        <span>{formatDayMonth(data[Math.floor(data.length / 2)].date)}</span>
        <span>{formatDayMonth(data[data.length - 1].date)}</span>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Tickets</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.date}>
              <td>{formatDayMonth(point.date)}</td>
              <td>{point.tickets}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
