"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { clearSession } from "@/infrastructure/auth/session-storage";
import { logoutUser } from "@/modules/auth/api/auth.api";

type DoctorShellProps = { children: ReactNode; activePage: "dashboard" | "schedule" | "appointments" | "patientRecords" };

export function DoctorShell({ children, activePage }: DoctorShellProps) {
  const router = useRouter();

  async function signOut() {
    try { await logoutUser(); } catch { /* The local session must always be cleared. */ }
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-canvas text-ink lg:grid lg:grid-cols-[300px_1fr]">
      <aside className="border-b border-border bg-surface-muted px-5 py-6 lg:fixed lg:inset-y-0 lg:z-20 lg:flex lg:w-[300px] lg:flex-col lg:border-b-0 lg:border-r lg:px-5 lg:py-10">
        <div className="px-4"><h2 className="text-[1.65rem] font-semibold tracking-[-0.03em] text-brand">Doctor&apos;s Portal</h2><p className="mt-1 text-sm text-[#8aa0a8]">Askare Access</p></div>
        <nav className="mt-7 flex gap-2 overflow-x-auto lg:mt-14 lg:block lg:space-y-2">
          <NavLink href="/doctor/dashboard" icon="dashboard" label="Dashboard" active={activePage === "dashboard"} />
          <NavLink href="/doctor/schedule" icon="calendar" label="My Schedule" active={activePage === "schedule"} />
          <NavLink href="/doctor/appointments" icon="appointments" label="Appointments" active={activePage === "appointments"} />
          <NavLink href="/doctor/patient-records" icon="records" label="Patient Records" active={activePage === "patientRecords"} />
        </nav>
        <div className="mt-6 border-t border-slate-200 pt-5 lg:mt-auto">
          <button type="button" className="flex w-full items-center gap-4 rounded-xl px-5 py-3 text-left text-[#496570]"><ShellIcon name="help" className="h-6 w-6" />Help Center</button>
          <button type="button" onClick={signOut} className="mt-1 flex w-full items-center gap-4 rounded-xl px-5 py-3 text-left text-[#b23535]"><ShellIcon name="logout" className="h-6 w-6" />Sign Out</button>
        </div>
      </aside>
      <div className="lg:col-start-2">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-100 bg-white/95 px-5 backdrop-blur sm:px-9 lg:h-[92px] lg:px-10">
          <Link href="/doctor/dashboard" className="text-[2rem] font-medium tracking-[-0.08em] text-slate-800">as<span className="text-teal-600">⌁</span>are</Link>
          <nav className="hidden items-center gap-12 text-[15px] text-slate-700 md:flex"><span>About Us</span><span>Contact</span></nav>
          <div className="flex items-center gap-4"><span className="relative hidden sm:block"><ShellIcon name="bell" className="h-6 w-6 text-[#496570]" /><i className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#b63a3a]" /></span><div className="flex items-center gap-3 rounded-full border border-slate-200 py-1.5 pl-1.5 pr-4"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#174d55] to-[#008a91] text-sm font-bold text-white">WM</span><span className="hidden text-xs leading-tight sm:block"><b className="block text-sm">Wali Muhammad</b><span className="text-[#59717a]">#ASK-99284</span></span><ShellIcon name="chevron" className="ml-1 h-5 w-5 text-[#496570]" /></div></div>
        </header>
        {children}
        <footer className="border-t border-border bg-surface-muted px-5 py-14 sm:px-9 lg:px-10"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><Link href="/doctor/dashboard" className="text-[2rem] font-medium tracking-[-0.08em] text-slate-800">as<span className="text-teal-600">⌁</span>are</Link><p className="mt-5 max-w-xl text-sm leading-7 text-[#526a73]">Redefining cognitive healthcare through intelligent diagnostics and verified professional care.</p></div><div className="flex flex-wrap gap-8 text-sm text-[#496570]"><span>Privacy Policy</span><span>Terms of Use</span><span>About Us</span></div></div></footer>
      </div>
    </div>
  );
}

function NavLink({ href, icon, label, active = false }: { href: string; icon: IconName; label: string; active?: boolean }) { return <Link href={href} className={`flex min-w-max items-center gap-4 rounded-2xl px-5 py-4 text-sm font-medium transition ${active ? "bg-surface text-brand shadow-sm" : "text-copy hover:bg-white/60"}`}><ShellIcon name={icon} className="h-6 w-6" />{label}</Link>; }
type IconName = "dashboard" | "calendar" | "appointments" | "records" | "help" | "logout" | "bell" | "chevron";
function ShellIcon({ name, className }: { name: IconName; className?: string }) { const paths: Record<IconName, ReactNode> = { dashboard: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>, calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>, appointments: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="m8 15 2.5 2.5L16.5 12"/></>, records: <><rect x="4" y="6" width="16" height="15" rx="2"/><path d="M9 6V4h6v2M12 10v6M9 13h6"/></>, help: <><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.3 2.3 0 1 1 3.6 1.9c-.9.6-1.4 1-1.4 2.1M12 17h.01"/></>, logout: <><path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></>, bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>, chevron: <path d="m7 9 5 5 5-5"/> }; return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>{paths[name]}</svg>; }
