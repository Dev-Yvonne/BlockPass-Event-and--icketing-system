const dateTime = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});
const dateOnly = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: "UTC" });
const month = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export const formatDate = (value: string) => dateTime.format(new Date(value));
export const formatShortDate = (value: string) => dateOnly.format(new Date(value));
export const formatDayMonth = (value: string) => dayMonth.format(new Date(value));
export const dateParts = (value: string) => ({
  day: day.format(new Date(value)),
  month: month.format(new Date(value)),
});
export const formatPrice = (value: number) =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const formatMoney = (value: number, currency: string) =>
  `${currency} ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const formatNumber = (value: number) => value.toLocaleString("en-US");
export const shorten = (value: string, size = 6) => `${value.slice(0, size)}…${value.slice(-size)}`;
export const isPast = (value: string) => new Date(value).getTime() < Date.now();

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Downloads rows as a CSV, quoting cells so names with commas stay intact. */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escape = (cell: string | number) => {
    const text = String(cell);
    // A leading formula character would execute when opened in a spreadsheet.
    const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
