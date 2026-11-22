const tz = "Asia/Karachi";
export const fmtDate = (d?: string | Date | null) =>
  d ? new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeZone: tz }).format(new Date(d)) : "—";
export const fmtTime = (d?: string | Date | null) =>
  d ? new Intl.DateTimeFormat("en-PK", { timeStyle: "short", timeZone: tz }).format(new Date(d)) : "—";
export const fmtDateTime = (d?: string | Date | null) =>
  d ? new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short", timeZone: tz }).format(new Date(d)) : "—";
export const fmtDay = (d?: string | Date | null) =>
  d ? new Intl.DateTimeFormat("en-PK", { weekday: "short", day: "numeric", month: "short", timeZone: tz }).format(new Date(d)) : "—";
export const rs = (v?: number | string | null) => `Rs ${Math.round(Number(v ?? 0)).toLocaleString("en-PK")}`;
export const initials = (name?: string | null) =>
  (name ?? "?").replace(/^Dr\.?\s+/i, "").split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
export const ageFrom = (dob?: string | null) =>
  dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000)) : null;
export const todayIso = () => new Date().toISOString().slice(0, 10);
export const addDaysIso = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
