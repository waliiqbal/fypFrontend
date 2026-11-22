"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { homeFor, saveSession } from "@/infrastructure/auth/session-storage";
import { resendOtp, verifyOtp } from "@/modules/auth/api/auth.api";
import type { UserType } from "@/modules/auth/types/auth.types";
import { AuthPageShell } from "./auth-page-shell";

type VerifyOtpFormProps = { initialEmail?: string; initialUserType?: UserType };

export function VerifyOtpForm({ initialEmail = "", initialUserType = "patient" }: VerifyOtpFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [userType, setUserType] = useState<UserType>(initialUserType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await verifyOtp({ email: email.trim(), userType, otp: String(form.get("otp") ?? "") });
      {
        const u = result.data.user;
        const user = { id: u.id, name: u.name, email: u.email, role: u.role, type: u.type, status: userType === "doctor" ? "INACTIVE" : "ACTIVE", profileImage: u.profileImage };
        saveSession({ ...result.data.token, user });
        router.push(homeFor(user));
      }
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "OTP verification failed." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setFeedback(null);
    setIsResending(true);
    try {
      const result = await resendOtp({ email: email.trim(), userType });
      setFeedback({ type: "success", message: result.message });
    } catch (error) {
      setFeedback({ type: "error", message: error instanceof Error ? error.message : "Could not resend OTP." });
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthPageShell eyebrow="Email verification" title="Verify your account" description="Enter the six-digit code sent to your email. The code is time-sensitive.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block text-xs font-bold uppercase tracking-[0.18em] text-copy">Account type<select value={userType} onChange={(event) => setUserType(event.target.value as UserType)} className="mt-2 h-14 w-full rounded-2xl bg-surface-input px-5 outline-none focus:ring-4 focus:ring-brand/10"><option value="patient">Patient</option><option value="doctor">Doctor</option></select></label>
        <label className="block text-xs font-bold uppercase tracking-[0.18em] text-copy">Email<input value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-14 w-full rounded-2xl bg-surface-input px-5 outline-none focus:ring-4 focus:ring-brand/10" type="email" required /></label>
        <label className="block text-xs font-bold uppercase tracking-[0.18em] text-copy">Verification code<input name="otp" className="mt-2 h-16 w-full rounded-2xl bg-surface-input px-5 text-center text-2xl font-bold tracking-[0.45em] outline-none focus:ring-4 focus:ring-brand/10" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="000000" required /></label>
        {feedback && <p role="alert" className={`rounded-2xl px-4 py-3 text-sm ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{feedback.message}</p>}
        <button disabled={isSubmitting} className="h-14 w-full rounded-2xl bg-brand font-bold text-white hover:bg-brand-hover disabled:opacity-60">{isSubmitting ? "Verifying..." : "Verify account"}</button>
      </form>
      <div className="mt-5 flex items-center justify-between text-sm"><button type="button" onClick={handleResend} disabled={isResending || !email} className="font-semibold text-brand disabled:opacity-50">{isResending ? "Sending..." : "Resend OTP"}</button><Link href="/login" className="text-copy-muted hover:text-brand">Back to login</Link></div>
    </AuthPageShell>
  );
}
