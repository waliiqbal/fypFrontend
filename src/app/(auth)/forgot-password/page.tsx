"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthPageShell } from "@/modules/auth/components/auth-page-shell";
import { apiRequest } from "@/infrastructure/http/api-client";

const inputClass = "mt-2 h-14 w-full rounded-2xl border border-transparent bg-surface-input px-5 text-[15px] outline-none focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/10";
const labelClass = "block text-xs font-bold uppercase tracking-[0.18em] text-slate-600";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<"patient" | "doctor" | "admin">("patient");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function requestOtp(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await apiRequest("/api/auth/forgot-password", { method: "POST", body: { email: email.trim(), userType } });
      setStep("reset");
      setMessage({ ok: true, text: "We emailed you a 6-digit code." });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Could not send code" });
    } finally {
      setBusy(false);
    }
  }

  async function reset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setMessage(null);
    try {
      await apiRequest("/api/auth/reset-password", { method: "POST", body: { email: email.trim(), userType, otp: String(form.get("otp")), newPassword: String(form.get("password")) } });
      router.push("/login");
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Reset failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthPageShell eyebrow="Account recovery" title="Reset your password" description="We'll send a one-time code to your email.">
      {step === "email" ? (
        <form onSubmit={requestOtp} className="space-y-5">
          <div className="grid grid-cols-3 rounded-2xl bg-surface-muted p-1.5">
            {(["patient", "doctor", "admin"] as const).map((r) => <button key={r} type="button" onClick={() => setUserType(r)} className={`h-11 rounded-xl font-semibold capitalize ${userType === r ? "bg-white text-brand shadow-sm" : "text-copy-muted"}`}>{r}</button>)}
          </div>
          <label className={labelClass}>Email<input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          {message && <p role="alert" className={`rounded-2xl px-4 py-3 text-sm ${message.ok ? "bg-brand-surface text-brand" : "bg-rose-50 text-rose-700"}`}>{message.text}</p>}
          <button disabled={busy} className="h-14 w-full rounded-2xl bg-brand font-bold text-white disabled:opacity-60">{busy ? "Sending…" : "Send code"}</button>
        </form>
      ) : (
        <form onSubmit={reset} className="space-y-5">
          <label className={labelClass}>6-digit code<input className={inputClass} name="otp" inputMode="numeric" maxLength={6} required /></label>
          <label className={labelClass}>New password<input className={inputClass} name="password" type="password" minLength={6} autoComplete="new-password" required /></label>
          {message && <p role="alert" className={`rounded-2xl px-4 py-3 text-sm ${message.ok ? "bg-brand-surface text-brand" : "bg-rose-50 text-rose-700"}`}>{message.text}</p>}
          <button disabled={busy} className="h-14 w-full rounded-2xl bg-brand font-bold text-white disabled:opacity-60">{busy ? "Saving…" : "Set new password"}</button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-copy-muted"><Link href="/login" className="font-semibold text-brand hover:underline">Back to login</Link></p>
    </AuthPageShell>
  );
}
