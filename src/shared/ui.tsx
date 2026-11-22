"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { initials } from "./format";
import { Icon, type IconName } from "./icons";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type Variant = "primary" | "secondary" | "danger" | "ghost" | "soft";
const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  secondary: "border border-border bg-white text-ink hover:border-brand/40 hover:text-brand",
  danger: "border border-[#f0c9bf] bg-white text-[#a33a22] hover:bg-[#fff4f1]",
  ghost: "text-copy hover:bg-surface-muted",
  soft: "bg-brand-surface text-brand hover:bg-brand-soft",
};

export function Button({ variant = "primary", icon, loading, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: IconName; loading?: boolean }) {
  return (
    <button {...rest} disabled={rest.disabled || loading} className={cx("inline-flex h-11 items-center justify-center gap-2 rounded-[13px] px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55", variants[variant], className)}>
      {icon && <Icon name={icon} size={17} />}
      {loading ? "Please wait…" : children}
    </button>
  );
}

export function LinkButton({ href, variant = "primary", icon, className, children }: { href: string; variant?: Variant; icon?: IconName; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={cx("inline-flex h-11 items-center justify-center gap-2 rounded-[13px] px-4 text-sm font-semibold transition", variants[variant], className)}>
      {icon && <Icon name={icon} size={17} />}
      {children}
    </Link>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cx("rounded-[24px] border border-[#e3eeec] bg-white p-5 sm:p-6", className)}>{children}</section>;
}

export function CardHeader({ title, action, subtitle }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-[17px] font-bold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-copy-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-bold uppercase tracking-[.14em] text-brand">{eyebrow}</p>}
        <h1 className="font-display mt-1.5 text-[28px] font-extrabold tracking-[-0.03em] sm:text-[30px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-copy-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function StatCard({ label, value, hint, tone = "plain", icon }: { label: string; value: ReactNode; hint?: string; tone?: "plain" | "mint" | "deep" | "warm"; icon?: IconName }) {
  const tones = {
    plain: "border border-[#e3eeec] bg-white",
    mint: "bg-[#e3f4f2] text-[#00545a]",
    deep: "bg-[#00646b] text-white",
    warm: "border border-[#f6e3c2] bg-[#fffaf2]",
  };
  return (
    <div className={cx("rounded-[20px] p-5", tones[tone])}>
      <div className="flex items-center justify-between gap-2">
        <p className={cx("text-[13px] font-medium", tone === "deep" ? "text-[#cdeeea]" : tone === "mint" ? "text-[#00545a]" : "text-copy-muted")}>{label}</p>
        {icon && <Icon name={icon} size={18} className={tone === "deep" ? "text-[#9fd6d1]" : "text-brand"} />}
      </div>
      <p className="font-display mt-2 text-[26px] font-extrabold tracking-[-0.02em]">{value}</p>
      {hint && <p className={cx("mt-1 text-xs", tone === "deep" ? "text-[#cdeeea]" : "text-copy-muted")}>{hint}</p>}
    </div>
  );
}

const badgeTones: Record<string, string> = {
  PENDING: "bg-[#fff1dc] text-[#8a4b0f]",
  AUTHORIZED: "bg-[#fff1dc] text-[#8a4b0f]",
  CONFIRMED: "bg-[#e3f4f2] text-[#00545a]",
  ACTIVE: "bg-[#e3f4f2] text-[#00545a]",
  PAID: "bg-[#e3f4f2] text-[#00545a]",
  COMPLETED: "bg-[#e7eefc] text-[#284b8f]",
  CANCELLED: "bg-[#f1f4f5] text-[#4d6266]",
  INACTIVE: "bg-[#f1f4f5] text-[#4d6266]",
  NO_SHOW: "bg-[#fff0ec] text-[#8a3b24]",
  SUSPENDED: "bg-[#fff0ec] text-[#8a3b24]",
  FAILED: "bg-[#fff0ec] text-[#8a3b24]",
  REFUNDED: "bg-[#f3ecfb] text-[#5b3a8a]",
  EMERGENCY: "bg-[#ffe3dc] text-[#9b2c1a]",
  URGENT: "bg-[#ffe9d6] text-[#8a3b0f]",
  SOON: "bg-[#fff1dc] text-[#8a4b0f]",
  ROUTINE: "bg-[#e3f4f2] text-[#00545a]",
  VIDEO: "bg-[#e3f4f2] text-[#00545a]",
  IN_PERSON: "bg-[#f1f4f5] text-[#3d4f52]",
};
const badgeLabel: Record<string, string> = { PENDING: "Awaiting doctor", AUTHORIZED: "On hold", NO_SHOW: "No-show", IN_PERSON: "In-person", PAID: "Paid", REFUNDED: "Refunded" };

export function Badge({ value, label, className }: { value: string; label?: string; className?: string }) {
  return (
    <span className={cx("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold", badgeTones[value] ?? "bg-[#f1f4f5] text-[#3d4f52]", className)}>
      {label ?? badgeLabel[value] ?? value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ")}
    </span>
  );
}

const avatarTones = ["bg-[#ffe7c7] text-[#7a4a12]", "bg-[#dcebff] text-[#1f4f8a]", "bg-[#e3f4f2] text-[#00545a]", "bg-[#f3e6fb] text-[#5b3a8a]", "bg-[#ffe3dc] text-[#8a3b24]"];
export function Avatar({ name, src, size = 44 }: { name?: string | null; src?: string | null; size?: number }) {
  const tone = avatarTones[(name ?? "").length % avatarTones.length];
  // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary images
  if (src) return <img src={src} alt="" width={size} height={size} className="shrink-0 rounded-[14px] object-cover" style={{ width: size, height: size }} />;
  return (
    <span className={cx("flex shrink-0 items-center justify-center rounded-[14px] font-bold", tone)} style={{ width: size, height: size, fontSize: size * 0.34 }}>
      {initials(name)}
    </span>
  );
}

export function EmptyState({ icon = "inbox", title, text, action }: { icon?: IconName; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-surface text-brand"><Icon name={icon} size={24} /></span>
      <p className="mt-4 font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-copy-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-copy-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand/25 border-t-brand" />
      {label}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
      <span>{message}</span>
      {onRetry && <button onClick={onRetry} className="font-semibold underline">Try again</button>}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "success"; children: ReactNode }) {
  const t = { info: "bg-[#f0f7f6] text-[#2d4b4e] border-[#d3e9e6]", warn: "bg-[#fffaf2] text-[#6b4b20] border-[#f6e3c2]", success: "bg-[#e3f4f2] text-[#00545a] border-[#bfe0dc]" }[tone];
  return <div className={cx("rounded-2xl border px-4 py-3 text-sm leading-6", t)}>{children}</div>;
}

const fieldBase = "mt-1.5 w-full rounded-[13px] border border-[#dcebe8] bg-[#f7fbfa] px-3.5 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-[13px] font-semibold text-[#3d4f52]">
      {label}
      {children}
      {hint && <span className="mt-1 block text-xs font-normal text-copy-muted">{hint}</span>}
    </label>
  );
}
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(fieldBase, "h-11", p.className)} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx(fieldBase, "h-11", p.className)} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cx(fieldBase, "min-h-24 py-2.5", p.className)} />;

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; count?: number }[] }) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto rounded-[14px] bg-[#e7f0ee] p-1">
      {items.map((i) => (
        <button key={i.value} onClick={() => onChange(i.value)} className={cx("whitespace-nowrap rounded-[11px] px-4 py-2 text-[13px] font-semibold transition", value === i.value ? "bg-white text-[#00545a] shadow-sm" : "text-[#4d6266] hover:text-ink")}>
          {i.label}
          {i.count !== undefined && <span className="ml-1.5 opacity-70">{i.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = "Search" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="flex h-11 w-full items-center gap-2 rounded-[13px] border border-[#e3eeec] bg-white px-3.5 sm:w-72">
      <Icon name="search" size={17} className="text-copy-muted" />
      <input aria-label={placeholder} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-sm outline-none" />
    </label>
  );
}

export function Modal({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0b2a2d]/45 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full overflow-y-auto rounded-t-[26px] bg-white p-6 sm:max-w-lg sm:rounded-[26px]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button aria-label="Close" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl text-copy hover:bg-surface-muted"><Icon name="x" size={18} /></button>
        </div>
        {children}
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/** Simple responsive table; on phones each row becomes a card. */
export function DataTable<T>({ rows, columns, empty, rowKey }: { rows: T[]; rowKey: (r: T) => string | number; empty?: ReactNode; columns: { header: string; cell: (r: T) => ReactNode; className?: string }[] }) {
  if (!rows.length) return <>{empty ?? <EmptyState title="Nothing here yet" />}</>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#e3eeec] text-[11px] font-bold uppercase tracking-[.1em] text-copy-muted">
            {columns.map((c) => <th key={c.header} className={cx("px-4 py-3 font-bold", c.className)}>{c.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className="border-b border-[#eef4f3] last:border-0 hover:bg-[#f7fbfa]">
              {columns.map((c) => <td key={c.header} className={cx("px-4 py-3.5 align-middle", c.className)}>{c.cell(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pager({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
      <span className="px-2 text-copy-muted">Page {page} of {totalPages}</span>
      <Button variant="secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</Button>
    </div>
  );
}

/** Lightweight bar chart (no chart library needed). */
export function BarChart({ data, valueKey, labelKey = "label", format = (v: number) => String(v), height = 170 }: { data: Record<string, unknown>[]; valueKey: string; labelKey?: string; format?: (v: number) => string; height?: number }) {
  const values = data.map((d) => Number(d[valueKey] ?? 0));
  const max = Math.max(1, ...values);
  return (
    <div className="flex items-end gap-2 sm:gap-3" style={{ height }} role="img" aria-label={`Bar chart: ${data.map((d, i) => `${d[labelKey]} ${format(values[i])}`).join(", ")}`}>
      {data.map((d, i) => (
        <div key={String(d[labelKey]) + i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-[10px] font-semibold text-copy-muted">{values[i] ? format(values[i]) : ""}</span>
          <div className={cx("w-full max-w-10 rounded-t-[8px]", i === data.length - 1 ? "bg-brand" : "bg-[#bfe0dc]")} style={{ height: `${Math.max(3, (values[i] / max) * (height - 44))}px` }} />
          <span className="text-[11px] text-copy-muted">{String(d[labelKey])}</span>
        </div>
      ))}
    </div>
  );
}
