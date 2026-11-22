"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession } from "@/infrastructure/auth/session-storage";
import { getProfile, logoutUser } from "@/modules/auth/api/auth.api";
import type { UserProfile } from "@/modules/auth/types/auth.types";

export function ProfileView() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    getProfile()
      .then((result) => { if (active) setProfile(result.data); })
      .catch((caughtError) => {
        if (!active) return;
        clearSession();
        setError(caughtError instanceof Error ? caughtError.message : "Profile could not be loaded.");
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logoutUser();
    } catch {
      // Local session must still be cleared if the server session already expired.
    } finally {
      clearSession();
      router.replace("/login");
    }
  }

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-canvas"><p className="font-semibold text-brand">Loading your profile...</p></main>;
  }

  if (!profile) {
    return <main className="flex min-h-screen items-center justify-center bg-canvas px-4"><section className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl"><h1 className="text-2xl font-semibold text-ink">Session unavailable</h1><p className="mt-3 text-sm text-rose-600">{error}</p><button onClick={() => router.replace("/login")} className="mt-6 h-12 w-full rounded-2xl bg-brand font-bold text-white hover:bg-brand-hover">Go to login</button></section></main>;
  }

  const details = profile.role === "doctor"
    ? [["Specializations", profile.specializations?.map(({ name }) => name).join(", ")], ["License number", profile.licenseNumber], ["Experience", profile.experience != null ? `${profile.experience} years` : null], ["Consultation fee", profile.consultationFee != null ? `${profile.consultationFee}` : null]]
    : [["Gender", profile.gender], ["Date of birth", profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : null], ["Blood group", profile.bloodGroup]];

  return (
    <main className="min-h-screen bg-canvas px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Askare profile</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Welcome, {profile.name}</h1></div><button onClick={handleLogout} disabled={isLoggingOut} className="h-11 rounded-xl border border-border bg-white px-5 font-semibold text-copy hover:border-danger/30 hover:text-danger disabled:opacity-60">{isLoggingOut ? "Logging out..." : "Logout"}</button></header>
        <section className="mt-8 overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_60px_rgba(28,65,69,0.10)]">
          <div className="bg-gradient-to-r from-brand-hover to-brand p-7 text-white"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold">{profile.name.charAt(0).toUpperCase()}</div><div><h2 className="text-2xl font-semibold">{profile.name}</h2><p className="mt-1 capitalize text-white/80">{profile.role} · {profile.isVerified ? "Verified" : "Not verified"}</p></div></div></div>
          <div className="grid gap-5 p-7 sm:grid-cols-2">
            {[["Email", profile.email], ["Phone", profile.phone], ["Address", profile.address], ...details].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">{label}</p><p className="mt-2 font-medium text-slate-800">{value || "Not provided"}</p></div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
