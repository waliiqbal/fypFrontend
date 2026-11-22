"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { clearSession } from "@/infrastructure/auth/session-storage";
import { logoutUser } from "@/modules/auth/api/auth.api";
import { PortalIcon } from "./portal-icon";

const nav = [
  ["/patient/dashboard", "grid", "Health Overview"],
  ["/patient/dashboard#clinical-archive", "file", "Medical Records"],
  ["/patient/appointments", "calendar", "Appointments"],
] as const;

export function AskareLogo() {
  return <span className="text-[2rem] font-medium tracking-[-0.08em] text-slate-800">as<span className="text-teal-600">⌁</span>are</span>;
}

export function PatientShell({ children, patientName = "Patient", patientId }: { children: ReactNode; patientName?: string; patientId?: number }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    try { await logoutUser(); } catch { /* Clear the local session either way. */ }
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-canvas text-ink lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-border bg-surface-muted px-5 py-6 lg:fixed lg:inset-y-0 lg:w-[260px] lg:border-b-0 lg:border-r lg:px-4 lg:py-10">
        <div className="px-3"><h2 className="text-xl font-semibold text-brand">Patient Portal</h2><p className="mt-1 text-sm text-copy-muted">Askare Access</p></div>
        <nav className="mt-7 flex gap-2 overflow-x-auto lg:mt-14 lg:block lg:space-y-2">
          {nav.map(([href, icon, label]) => {
            const isActive = href.includes("#")
              ? false
              : pathname === href;

            return <Link key={href} href={href} className={`flex min-w-max items-center gap-4 rounded-2xl px-4 py-4 text-sm font-medium transition ${isActive ? "bg-surface text-brand shadow-sm ring-1 ring-border" : "text-copy hover:bg-white/60"}`}><PortalIcon name={icon} className="h-6 w-6"/>{label}</Link>;
          })}
        </nav>
        <div className="mt-6 border-t border-slate-200 pt-5 lg:absolute lg:inset-x-4 lg:bottom-8">
          <Link href="/patient/appointments" className="flex h-14 items-center justify-center rounded-2xl bg-brand font-semibold text-white hover:bg-brand-hover">Book Consultation</Link>
          <button className="mt-5 flex w-full items-center gap-4 px-4 py-2 text-slate-600"><PortalIcon name="help" className="h-6 w-6"/>Help Center</button>
          <button onClick={signOut} className="mt-1 flex w-full items-center gap-4 px-4 py-2 text-red-700"><PortalIcon name="logout" className="h-6 w-6"/>Sign Out</button>
        </div>
      </aside>
      <div className="lg:col-start-2">
        <header className="flex h-20 items-center justify-between border-b border-slate-100 bg-white/90 px-5 sm:px-10">
          <AskareLogo />
          <nav className="hidden items-center gap-10 text-[15px] text-slate-700 md:flex"><Link href="/patient/dashboard">Home</Link><span>About Us</span><span>Contact</span></nav>
          <div className="flex items-center gap-4"><div className="relative"><PortalIcon name="bell" className="h-6 w-6 text-slate-500"/><span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500"/></div><div className="flex items-center gap-3 rounded-full border border-slate-200 py-1.5 pl-1.5 pr-4"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 font-bold text-white">{patientName.charAt(0)}</span><span className="hidden text-xs sm:block"><b className="block text-sm">{patientName}</b>#{patientId ?? "—"}</span><span className="text-slate-400">⌄</span></div></div>
        </header>
        {children}
        <footer className="border-t border-border bg-surface-muted px-6 py-10 sm:px-10"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><AskareLogo/><p className="mt-4 max-w-lg text-sm leading-6 text-copy-muted">Redefining cognitive healthcare through intelligent diagnostics and verified professional care.</p></div><div className="flex gap-8 text-sm text-copy"><span>Privacy Policy</span><span>Terms of Use</span><span>About Us</span></div></div></footer>
      </div>
    </div>
  );
}
