"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { clearSession, getSessionUser, homeFor, type SessionUser } from "@/infrastructure/auth/session-storage";
import { logoutUser } from "@/modules/auth/api/auth.api";
import { api } from "./api";
import { fmtDateTime } from "./format";
import { Icon, type IconName } from "./icons";
import { Avatar, cx } from "./ui";

export type Portal = "patient" | "doctor" | "hospital" | "admin";
type NavItem = { href: string; label: string; icon: IconName };

const NAV: Record<Portal, NavItem[]> = {
  patient: [
    { href: "/patient/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/patient/symptom-checker", label: "AI Symptom Checker", icon: "spark" },
    { href: "/patient/doctors", label: "Find a Doctor", icon: "search" },
    { href: "/patient/appointments", label: "Appointments", icon: "calendar" },
    { href: "/patient/assistant", label: "My AI Assistant", icon: "chat" },
    { href: "/patient/medical-records", label: "Medical Records", icon: "file" },
    { href: "/patient/health-profile", label: "Health Profile", icon: "heart" },
  ],
  doctor: [
    { href: "/doctor/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/doctor/requests", label: "Requests", icon: "inbox" },
    { href: "/doctor/appointments", label: "Appointments", icon: "calendar" },
    { href: "/doctor/schedule", label: "My Schedule", icon: "clock" },
    { href: "/doctor/patients", label: "Patients", icon: "users" },
    { href: "/doctor/earnings", label: "Earnings", icon: "money" },
    { href: "/doctor/profile", label: "Profile", icon: "user" },
  ],
  hospital: [
    { href: "/hospital/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/hospital/doctors", label: "Doctors", icon: "stethoscope" },
    { href: "/hospital/appointments", label: "Appointments", icon: "calendar" },
    { href: "/hospital/revenue", label: "Revenue", icon: "money" },
    { href: "/hospital/patients", label: "Patients", icon: "users" },
    { href: "/hospital/profile", label: "Hospital Profile", icon: "building" },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/admin/hospitals", label: "Hospitals", icon: "building" },
    { href: "/admin/doctors", label: "Doctors", icon: "stethoscope" },
    { href: "/admin/patients", label: "Patients", icon: "users" },
    { href: "/admin/appointments", label: "Appointments & Payments", icon: "money" },
    { href: "/admin/specializations", label: "Specializations", icon: "tag" },
    { href: "/admin/reviews", label: "Reviews", icon: "star" },
    { href: "/admin/ai", label: "AI Monitoring", icon: "spark" },
    { href: "/admin/settings", label: "Settings & Audit", icon: "settings" },
  ],
};

const THEME: Record<Portal, { label: string; side: string; text: string; active: string; idle: string; card: string }> = {
  patient: { label: "Patient", side: "bg-white border-r border-[#e3eeec]", text: "text-ink", active: "bg-[#e3f4f2] text-[#00545a] font-semibold", idle: "text-[#4d6266] hover:bg-[#f3f8f7]", card: "bg-[#fff4ef] text-[#6b4b40]" },
  doctor: { label: "Doctor portal", side: "bg-[#00545a]", text: "text-white", active: "bg-white text-[#00545a] font-bold", idle: "text-[#d8efec] hover:bg-[#0a6a70]", card: "bg-[#0a6a70] text-[#d8efec]" },
  hospital: { label: "Hospital portal", side: "bg-[#0d3f44]", text: "text-white", active: "bg-[#d9f3ef] text-[#0d3f44] font-bold", idle: "text-[#cde7e4] hover:bg-[#15535a]", card: "bg-[#15535a] text-[#cde7e4]" },
  admin: { label: "Super Admin", side: "bg-[#102a2e]", text: "text-white", active: "bg-[#3fb8ae] text-[#08211f] font-bold", idle: "text-[#c3d8d6] hover:bg-[#1a3c41]", card: "bg-[#1a3c41] text-[#c3d8d6]" },
};

function allowed(portal: Portal, user: SessionUser | null) {
  if (!user) return false;
  if (portal === "patient" || portal === "doctor") return user.role === portal;
  if (user.role !== "admin") return false;
  return portal === "hospital" ? user.type === "HOSPITAL_ADMIN" : user.type === "SUPER_ADMIN";
}

export function AppShell({ portal, children }: { portal: Portal; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // Session lives in localStorage: read it as an external store (null on the server).
  const raw = useSyncExternalStore(subscribeStorage, readSessionKey, () => "server");
  const user = useMemo<SessionUser | null>(() => (raw === "server" ? null : getSessionUser()), [raw]);
  const ready = raw !== "server" && allowed(portal, user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }
  const theme = THEME[portal];

  useEffect(() => {
    if (raw !== "server" && !allowed(portal, user)) router.replace(user ? homeFor(user) : "/login");
  }, [raw, portal, user, router]);

  async function signOut() {
    try { await logoutUser(); } catch { /* session is cleared anyway */ }
    clearSession();
    router.replace("/login");
  }

  if (!ready) return <div className="flex min-h-screen items-center justify-center bg-canvas"><span className="h-6 w-6 animate-spin rounded-full border-2 border-brand/25 border-t-brand" /></div>;

  const dark = portal !== "patient";
  return (
    <div className="flex min-h-screen bg-[#f3f8f7] text-ink">
      <nav aria-label="Main" className={cx("fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col gap-6 overflow-y-auto px-4 py-6 transition-transform lg:translate-x-0", theme.side, menuOpen ? "translate-x-0" : "-translate-x-full")}>
        <Link href={NAV[portal][0].href} className="flex items-center gap-2.5 px-2">
          <span className={cx("flex h-10 w-10 items-center justify-center rounded-xl", dark ? "bg-white text-[#007d85]" : "bg-[#007d85] text-white")}><Icon name="heart" size={22} /></span>
          <span>
            <span className={cx("font-display block text-[20px] font-extrabold tracking-[-0.02em]", dark ? "text-white" : "text-ink")}>Ask<span className={dark ? "text-[#7fd3cb]" : "text-[#007d85]"}>Care</span></span>
            <span className={cx("block text-[10px] font-bold uppercase tracking-[.14em]", dark ? "text-[#9fd6d1]" : "text-[#5d7276]")}>{theme.label}</span>
          </span>
        </Link>
        <div className="flex flex-col gap-1">
          {NAV[portal].map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cx("flex items-center gap-3 rounded-[14px] px-3.5 py-3 text-sm transition", active ? theme.active : theme.idle)}>
                <Icon name={item.icon} size={19} />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="mt-auto flex flex-col gap-3">
          {portal === "patient" && (
            <div className={cx("rounded-[18px] p-4 text-[13px] leading-5", theme.card)}>
              <p className="font-bold text-[#8a3b24]">Emergency?</p>
              <p className="mt-1">For chest pain or breathing trouble, call 1122 right away.</p>
            </div>
          )}
          <button onClick={signOut} className={cx("flex items-center gap-3 rounded-[14px] px-3.5 py-3 text-sm", dark ? "text-[#ffc9bd] hover:bg-white/10" : "text-[#b23535] hover:bg-[#fff0ed]")}>
            <Icon name="logout" size={19} /> Sign out
          </button>
        </div>
      </nav>
      {menuOpen && <button aria-label="Close menu" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 bg-black/30 lg:hidden" />}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[264px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center gap-3 border-b border-[#e3eeec] bg-white/90 px-4 backdrop-blur sm:px-8">
          <button aria-label="Open menu" onClick={() => setMenuOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e3eeec] lg:hidden"><Icon name="menu" /></button>
          <div className="flex-1" />
          <NotificationBell />
          <Link href={portal === "patient" ? "/patient/profile" : portal === "doctor" ? "/doctor/profile" : portal === "hospital" ? "/hospital/profile" : "/admin/settings"} className="flex items-center gap-2.5 rounded-[14px] border border-[#e3eeec] py-1 pl-1 pr-3">
            <Avatar name={user?.name} src={user?.profileImage} size={36} />
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-[13px] font-bold">{portal === "doctor" ? `Dr. ${user?.name?.replace(/^Dr\.?\s*/i, "")}` : user?.name}</span>
              <span className="block text-[11px] text-copy-muted">{theme.label}</span>
            </span>
          </Link>
        </header>
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-7 sm:px-8">{children}</main>
      </div>
    </div>
  );
}

function subscribeStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}
function readSessionKey() {
  return window.localStorage.getItem("askare.auth.session") ?? "";
}

type Notification = { id: number; title: string; body: string; link?: string | null; readAt?: string | null; createdAt: string };

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  function load() {
    return api
      .get<{ items: Notification[]; unread: number }>("/api/notifications")
      .then((res) => {
        setItems(res.data.items);
        setUnread(res.data.unread);
      })
      .catch(() => undefined); // the bell is optional
  }
  useEffect(() => {
    void load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={box} className="relative">
      <button aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} onClick={() => setOpen((o) => !o)} className="relative flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#e3eeec] bg-white">
        <Icon name="bell" />
        {unread > 0 && <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e2725b] px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-[52px] z-50 w-[340px] max-w-[90vw] overflow-hidden rounded-[20px] border border-[#e3eeec] bg-white shadow-[0_20px_50px_rgba(16,42,46,.15)]">
          <div className="flex items-center justify-between border-b border-[#eef4f3] px-4 py-3">
            <p className="font-bold">Notifications</p>
            {unread > 0 && <button onClick={async () => { await api.patch("/api/notifications/read-all"); void load(); }} className="text-xs font-semibold text-brand">Mark all read</button>}
          </div>
          <div className="max-h-[380px] overflow-y-auto">
            {!items.length && <p className="px-4 py-8 text-center text-sm text-copy-muted">You&apos;re all caught up.</p>}
            {items.map((n) => (
              <Link key={n.id} href={n.link || "#"} onClick={() => { if (!n.readAt) void api.patch(`/api/notifications/${n.id}/read`).then(load); setOpen(false); }} className={cx("block border-b border-[#f1f6f5] px-4 py-3 last:border-0 hover:bg-[#f7fbfa]", !n.readAt && "bg-[#f3fbfa]")}>
                <p className="flex items-center gap-2 text-sm font-semibold">{!n.readAt && <span className="h-2 w-2 rounded-full bg-brand" />}{n.title}</p>
                <p className="mt-0.5 text-[13px] leading-5 text-copy">{n.body}</p>
                <p className="mt-1 text-[11px] text-copy-muted">{fmtDateTime(n.createdAt)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
