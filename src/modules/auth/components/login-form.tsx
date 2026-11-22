"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { homeFor, saveSession } from "@/infrastructure/auth/session-storage";
import { loginUser } from "@/modules/auth/api/auth.api";
import type { LoginUserType } from "@/modules/auth/types/auth.types";
import { AuthPageShell } from "./auth-page-shell";

const inputClass = "mt-2 h-14 w-full rounded-2xl border border-transparent bg-surface-input px-5 text-[15px] outline-none focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/10";
const labelClass = "block text-xs font-bold uppercase tracking-[0.18em] text-slate-600";

export function LoginForm() {
  const router = useRouter();
  const [userType, setUserType] = useState<LoginUserType>("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);

    try {
      const result = await loginUser({
        email: String(form.get("email") ?? "").trim(),
        password: String(form.get("password") ?? ""),
        userType,
      });
      const u = result.data.user;
      const user = { id: u.id, name: u.name, email: u.email, role: u.role, type: u.type, status: u.status, profileImage: u.profileImage };
      saveSession({ ...result.data.token, user });
      router.push(homeFor(user));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageShell eyebrow="Welcome back" title="Login to Askare" description="Access your secure healthcare profile and continue your wellness journey.">
      <div className="grid grid-cols-3 rounded-2xl bg-surface-muted p-1.5">
        {(["patient", "doctor", "admin"] as const).map((role) => (
          <button key={role} type="button" onClick={() => setUserType(role)} className={`h-11 rounded-xl font-semibold capitalize transition ${userType === role ? "bg-white text-brand shadow-sm" : "text-copy-muted"}`}>{role}</button>
        ))}
      </div>
      {userType === "admin" && <p className="mt-3 text-center text-xs text-copy-muted">For Super Admin and Hospital Admin accounts.</p>}
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <label className={labelClass}>Email<input className={inputClass} name="email" type="email" placeholder="name@clinical.com" autoComplete="email" required /></label>
        <label className={labelClass}>Password
          <span className="relative mt-2 block">
            <input className={`${inputClass} mt-0 pr-16`} name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 w-16 text-xs normal-case tracking-normal text-slate-500">{showPassword ? "Hide" : "Show"}</button>
          </span>
        </label>
        {error && <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        <button disabled={isSubmitting} className="h-14 w-full rounded-2xl bg-brand font-bold text-white transition hover:bg-brand-hover disabled:opacity-60">{isSubmitting ? "Logging in..." : "Login"}</button>
      </form>
      <p className="mt-4 text-center text-sm"><Link href="/forgot-password" className="font-semibold text-brand hover:underline">Forgot password?</Link></p>
      <p className="mt-3 text-center text-sm text-copy-muted">New to Askare? <Link href="/register" className="font-semibold text-brand hover:underline">Create profile</Link></p>
    </AuthPageShell>
  );
}
