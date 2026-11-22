"use client";

import { useState, type KeyboardEvent } from "react";
import { env } from "@/config/env";
import { getAccessToken } from "@/infrastructure/auth/session-storage";
import { Icon } from "./icons";
import { cx } from "./ui";

/** Chips input for lists like conditions / allergies. Enter or comma adds a chip. */
export function TagInput({ value, onChange, placeholder, suggestions = [] }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; suggestions?: string[] }) {
  const [text, setText] = useState("");
  const add = (raw: string) => {
    const v = raw.trim();
    if (v && !value.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...value, v]);
    setText("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(text);
    } else if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
  };
  const remaining = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));
  return (
    <div className="mt-1.5">
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-[13px] border border-[#dcebe8] bg-[#f7fbfa] px-2 py-1.5 focus-within:border-brand focus-within:bg-white">
        {value.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-[10px] bg-[#e3f4f2] px-2.5 py-1 text-[13px] font-semibold text-[#00545a]">
            {v}
            <button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(value.filter((x) => x !== v))} className="opacity-60 hover:opacity-100"><Icon name="x" size={13} /></button>
          </span>
        ))}
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} onBlur={() => text && add(text)} placeholder={value.length ? "" : placeholder} className="min-w-[140px] flex-1 bg-transparent px-1.5 text-sm font-normal outline-none" />
      </div>
      {remaining.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {remaining.slice(0, 8).map((s) => (
            <button type="button" key={s} onClick={() => add(s)} className="rounded-full border border-[#dcebe8] bg-white px-2.5 py-1 text-xs font-medium text-copy hover:border-brand hover:text-brand">+ {s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Stars({ value, onChange, size = 22 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className="flex gap-1" role={onChange ? "radiogroup" : "img"} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const star = <Icon name="star" size={size} className={n <= value ? "fill-[#f5b301] text-[#f5b301]" : "text-[#cfd9d8]"} />;
        return onChange ? (
          <button key={n} type="button" role="radio" aria-checked={n === value} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => onChange(n)}>{star}</button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </div>
  );
}

/** Uploads one image to Cloudinary through the backend. Returns the public URL. */
export async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const token = getAccessToken();
  const res = await fetch(`${env.apiBaseUrl}/upload/image`, { method: "POST", body, headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const data = (await res.json().catch(() => ({}))) as { url?: string; message?: string };
  if (!res.ok || !data.url) throw new Error(data.message || "Upload failed");
  return data.url;
}

export function UrgencyBanner({ urgency, message }: { urgency: string; message?: string | null }) {
  if (urgency !== "EMERGENCY" && urgency !== "URGENT") return null;
  return (
    <div role="alert" className={cx("flex gap-3 rounded-2xl p-4 text-sm leading-6", urgency === "EMERGENCY" ? "bg-[#ffe3dc] text-[#7a1f10]" : "bg-[#fff1dc] text-[#6b3d0a]")}>
      <Icon name="alert" className="mt-0.5 shrink-0" />
      <p><b>{urgency === "EMERGENCY" ? "This may be an emergency." : "Please see a doctor soon."}</b> {message ?? (urgency === "EMERGENCY" ? "Call 1122 or go to the nearest emergency department now." : "Book a consultation in the next 24 hours.")}</p>
    </div>
  );
}
