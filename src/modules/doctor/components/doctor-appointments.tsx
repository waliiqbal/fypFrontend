"use client";

import { useMemo, useState } from "react";
import { DoctorShell } from "./doctor-shell";

type AppointmentStatus = "Upcoming" | "Completed" | "No show";
type Appointment = { id: string; patient: string; initials: string; date: string; time: string; mode: "Video" | "In-person"; reason: string; status: AppointmentStatus; period: "Today" | "This Week" | "This Month"; reviewed?: boolean };

const appointments: Appointment[] = [
  { id: "AP-24081", patient: "Sarah Jenkins", initials: "SJ", date: "Today, 15 Aug", time: "09:00 AM", mode: "Video", reason: "Follow-up consultation", status: "Upcoming", period: "Today" },
  { id: "AP-24089", patient: "David Ahmed", initials: "DA", date: "Today, 15 Aug", time: "10:30 AM", mode: "In-person", reason: "Persistent migraines", status: "Upcoming", period: "Today" },
  { id: "AP-24102", patient: "Ayesha Gillani", initials: "AG", date: "Tomorrow, 16 Aug", time: "04:00 PM", mode: "Video", reason: "Medication review", status: "Upcoming", period: "This Week" },
  { id: "AP-24111", patient: "Haris Vohra", initials: "HV", date: "Mon, 18 Aug", time: "09:00 AM", mode: "In-person", reason: "Initial consultation", status: "Upcoming", period: "This Week" },
  { id: "AP-23977", patient: "Zubair Ahmed", initials: "ZA", date: "14 Aug 2026", time: "11:00 AM", mode: "Video", reason: "Blood pressure follow-up", status: "Completed", period: "This Week", reviewed: true },
  { id: "AP-23965", patient: "Zainab Khan", initials: "ZK", date: "13 Aug 2026", time: "02:30 PM", mode: "In-person", reason: "Care-plan review", status: "Completed", period: "This Month", reviewed: true },
  { id: "AP-23944", patient: "Maryam Shah", initials: "MS", date: "12 Aug 2026", time: "10:00 AM", mode: "Video", reason: "Prescription discussion", status: "No show", period: "This Month", reviewed: true },
];

export function DoctorAppointments() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | AppointmentStatus>("All");
  const [mode, setMode] = useState<"All" | Appointment["mode"]>("All");
  const [tab, setTab] = useState<"Upcoming" | "History">("Upcoming");
  const [range, setRange] = useState<Appointment["period"]>("Today");
  const periodAppointments = useMemo(() => appointments.filter((appointment) => appointment.period === range), [range]);
  const filtered = useMemo(() => appointments.filter((appointment) => {
    const matchesTab = tab === "Upcoming" ? appointment.status === "Upcoming" : appointment.status !== "Upcoming";
    const matchesQuery = `${appointment.patient} ${appointment.id} ${appointment.reason}`.toLowerCase().includes(query.toLowerCase());
    return appointment.period === range && matchesTab && matchesQuery && (status === "All" || appointment.status === status) && (mode === "All" || appointment.mode === mode);
  }), [mode, query, range, status, tab]);

  return (
    <DoctorShell activePage="appointments">
      <main className="px-5 py-10 sm:px-9 lg:px-10 lg:py-12">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-brand">Patient care</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Appointments</h1><p className="mt-3 max-w-2xl text-base leading-7 text-copy-muted">Your confirmed upcoming consultations and reviewed appointment history.</p></div>
        </div>

        <section className="mt-9 rounded-[1.5rem] bg-white p-5 shadow-[0_18px_45px_rgba(32,65,70,.07)] sm:p-6">
          <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 lg:flex-row lg:items-center"><div><h2 className="text-xl font-semibold">Appointment overview</h2><p className="mt-1 text-sm text-copy-muted">Summary for the selected period.</p></div><div className="flex w-full rounded-xl bg-surface-muted p-1 sm:w-auto">{(["Today", "This Week", "This Month"] as const).map((period) => <button key={period} onClick={() => setRange(period)} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${range === period ? "bg-white text-brand shadow-sm" : "text-copy-muted hover:text-copy"}`}>{period}</button>)}</div></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><SummaryCard label="Upcoming" value={periodAppointments.filter((appointment) => appointment.status === "Upcoming").length} tone="brand" /><SummaryCard label="Completed" value={periodAppointments.filter((appointment) => appointment.status === "Completed").length} tone="success" /><SummaryCard label="Video consultation" value={periodAppointments.filter((appointment) => appointment.mode === "Video").length} tone="violet" /><SummaryCard label="In-person" value={periodAppointments.filter((appointment) => appointment.mode === "In-person").length} tone="amber" /></div>
        </section>

        <section className="mt-5 rounded-[1.5rem] bg-white p-4 shadow-[0_18px_45px_rgba(32,65,70,.07)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <label className="relative w-full lg:max-w-sm"><span className="pointer-events-none absolute left-4 top-3.5 text-copy-muted">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search appointments" className="h-11 w-full rounded-xl border border-border bg-surface-muted pl-10 pr-4 text-sm outline-none focus:border-brand" /></label>
            <div className="flex flex-wrap items-center gap-2 lg:ml-auto"><span className="mr-1 text-xs font-bold uppercase tracking-[.12em] text-copy-muted">Filter by</span><FilterTag label="Status"><select value={status} onChange={(event) => setStatus(event.target.value as "All" | AppointmentStatus)}><option value="All">All statuses</option><option>Upcoming</option><option>Completed</option><option>No show</option></select></FilterTag><FilterTag label="Mode"><select value={mode} onChange={(event) => setMode(event.target.value as "All" | Appointment["mode"])}><option value="All">All modes</option><option>Video</option><option>In-person</option></select></FilterTag></div>
          </div>
        </section>

        <div className="mt-8 flex gap-2 border-b border-border"><TabButton active={tab === "Upcoming"} onClick={() => setTab("Upcoming")}>Upcoming appointments</TabButton><TabButton active={tab === "History"} onClick={() => setTab("History")}>Appointment history</TabButton></div>
        <section className="mt-6 overflow-hidden rounded-[1.5rem] bg-white shadow-[0_18px_45px_rgba(32,65,70,.07)]">
          <div className="hidden grid-cols-[1.2fr_.85fr_1fr_.8fr_100px] gap-4 border-b border-border bg-surface-muted px-6 py-4 text-[11px] font-bold uppercase tracking-[.12em] text-copy-muted lg:grid"><span>Patient</span><span>Appointment</span><span>Reason for visit</span><span>Consultation</span><span>Details</span></div>
          {filtered.length ? filtered.map((appointment) => <AppointmentRow key={appointment.id} appointment={appointment} />) : <div className="p-12 text-center"><p className="font-semibold">No appointments found</p><p className="mt-1 text-sm text-copy-muted">Try changing the search or filters.</p></div>}
        </section>
      </main>
    </DoctorShell>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) { return <button onClick={onClick} className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${active ? "border-brand text-brand" : "border-transparent text-copy-muted hover:text-copy"}`}>{children}</button>; }
function SummaryCard({ label, value, tone }: { label: string; value: number; tone: "brand" | "success" | "violet" | "amber" }) { const colors = { brand: "bg-brand-surface text-brand", success: "bg-brand-soft text-brand", violet: "bg-surface-muted text-copy", amber: "bg-surface-muted text-copy" }; return <div className={`rounded-2xl p-4 ${colors[tone]}`}><p className="text-[11px] font-bold uppercase tracking-[.12em] opacity-75">{label}</p><p className="mt-2 text-3xl font-semibold tracking-[-.04em]">{value}</p></div>; }
function FilterTag({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex h-10 items-center gap-2 rounded-xl border border-border bg-white pl-3 text-xs font-semibold text-copy"><span className="rounded-md bg-brand-surface px-1.5 py-1 text-brand">{label}</span>{children}</label>; }
function AppointmentRow({ appointment }: { appointment: Appointment }) { const upcoming = appointment.status === "Upcoming"; return <article className="grid gap-4 border-b border-border px-5 py-5 last:border-0 lg:grid-cols-[1.2fr_.85fr_1fr_.8fr_100px] lg:items-center lg:gap-4 lg:px-6"><div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-surface text-sm font-bold text-brand">{appointment.initials}</span><div className="min-w-0"><p className="truncate font-semibold">{appointment.patient}</p><p className="mt-0.5 text-xs text-copy-muted">{appointment.id}</p></div></div><div><p className="font-medium">{appointment.date}</p><p className="mt-0.5 text-sm text-copy-muted">{appointment.time}</p></div><p className="text-sm leading-6 text-copy">{appointment.reason}</p><div><p className="font-medium text-ink">{appointment.mode}</p><p className={`mt-1 text-xs font-semibold ${upcoming || appointment.status === "Completed" ? "text-brand" : "text-danger"}`}>{appointment.status}{appointment.reviewed ? " · Reviewed" : ""}</p></div><button className={`h-10 whitespace-nowrap rounded-xl px-3 text-sm font-semibold ${upcoming ? "bg-brand text-white hover:bg-brand-hover" : "border border-brand/30 text-brand hover:bg-brand-surface"}`}>{upcoming ? "View details" : "View record"}</button></article>; }
