"use client";

import { useState } from "react";
import { DoctorShell } from "./doctor-shell";

type IconName = "dashboard" | "calendar" | "records" | "help" | "logout" | "bell" | "trend" | "alert" | "timer" | "heart" | "chevron" | "video";

const stats: { label: string; value: string; note: string; icon: IconName; warning?: boolean }[] = [
  { label: "Patients today", value: "2", note: "Active schedule", icon: "trend" },
  { label: "Pending reports", value: "08", note: "High priority needed", icon: "alert", warning: true },
  { label: "Avg. consultation", value: "18m", note: "Optimal performance", icon: "timer" },
  { label: "Active care plans", value: "142", note: "In monitoring phase", icon: "heart" },
  { label: "Total income", value: "PKR 487K", note: "+18% this month", icon: "trend" },
];

const agenda = [
  { time: "09:00", period: "AM", patient: "Mrs. Sarah Jenkins", featured: true },
  { time: "10:30", period: "AM", patient: "Mr. David Ahmed", featured: false },
];

const monthlyAppointments = [
  { month: "Jan", count: 24 },
  { month: "Feb", count: 31 },
  { month: "Mar", count: 28 },
  { month: "Apr", count: 42 },
  { month: "May", count: 36 },
  { month: "Jun", count: 48 },
  { month: "Jul", count: 44 },
  { month: "Aug", count: 53, current: true },
  { month: "Sep", count: 46 },
  { month: "Oct", count: 58 },
  { month: "Nov", count: 51 },
  { month: "Dec", count: 63 },
];

const initialRequests = [
  { id: 1, name: "Ayesha Gillani", time: "Today, 4:00 PM", initials: "AG" },
  { id: 2, name: "Haris Vohra", time: "Tomorrow, 9:00 AM", initials: "HV" },
];

const records = [
  { kind: "Consultation", detail: "Completed Video Consult with Zubair Ahmed", time: "1 hour ago", active: true },
  { kind: "Lab Records", detail: "Blood panel reviewed for Ayesha Gillani", time: "3 hours ago" },
  { kind: "Care Management", detail: "Updated Care Plan for Zainab Khan", time: "5 hours ago" },
  { kind: "Pharmacy", detail: "Prescription Refill Approved for Maryam Shah", time: "Yesterday" },
];

export function DoctorDashboard() {
  const [requests, setRequests] = useState(initialRequests);

  return (
    <DoctorShell activePage="dashboard">
      <main>
          <section className="px-5 pb-12 pt-10 sm:px-9 lg:px-10 lg:pb-16 lg:pt-12">
            <h1 className="text-4xl font-light tracking-[-0.045em] text-ink sm:text-5xl">Welcome back, <strong className="font-semibold text-brand">Wali Muhammad</strong></h1>
            <p className="mt-3 max-w-4xl text-base leading-7 text-[#66747a] sm:text-lg">Your clinical agenda is ready. You have 2 consultations scheduled for today and {requests.length} pending booking requests.</p>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
            </div>
          </section>

          <section id="agenda" className="scroll-mt-24 border-t border-slate-100 px-5 py-12 sm:px-9 lg:px-10">
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2.45fr)_minmax(290px,.72fr)]">
              <div>
                <div className="mb-6 flex items-center justify-between gap-4"><h2 className="text-3xl font-semibold tracking-[-0.04em]">Today&apos;s Agenda</h2><a href="#agenda" className="font-semibold text-brand">View Full Schedule →</a></div>
                <div className="space-y-6">
  {agenda.map((item) => (
    <article key={item.time} className="grid items-center gap-4 rounded-[1.35rem] bg-white px-5 py-4 shadow-[0_18px_45px_rgba(32,65,70,.07)] sm:grid-cols-[82px_1fr] xl:grid-cols-[82px_1fr_auto]">
      <div className={`flex flex-col items-center justify-center self-stretch rounded-xl px-3 py-4 ${item.featured ? "bg-brand-soft text-brand" : "bg-surface-muted text-copy"}`}>
        <b className="text-xs">{item.time}</b>
        <strong className="mt-0.5 text-lg">{item.period}</strong>
      </div>
      <div>
        <h3 className="text-lg font-semibold">{item.patient}</h3>
        <p className="mt-0.5 text-sm text-[#69757a]">Video Consultation</p>
      </div>
      <div className="flex flex-wrap gap-2 sm:col-start-2 xl:col-start-auto">
        <button className="flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-bold text-white hover:bg-brand-hover">
          <Icon name="video" className="h-4 w-4" />
          Join Video Call
        </button>
        <button className="h-11 rounded-full bg-[#eaf0f2] px-5 text-sm font-medium">
          Reschedule
        </button>
      </div>
    </article>
  ))}
</div>
                <MonthlyAppointmentsChart />
              </div>

              <div className="space-y-8">
                <section className="rounded-[1.5rem] bg-white p-7 shadow-[0_18px_45px_rgba(32,65,70,.07)]">
                  <h2 className="text-2xl font-semibold">New Requests</h2>
                  <div className="mt-7 space-y-7">
                    {requests.length ? requests.map((request) => (
                      <article key={request.id} className="flex items-start gap-4">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#183f47] text-sm font-bold text-white">{request.initials}</span>
                        <div><h3 className="font-semibold">{request.name}</h3><p className="text-sm text-copy-muted">{request.time}</p><div className="mt-3 flex gap-2"><button onClick={() => setRequests((current) => current.filter(({ id }) => id !== request.id))} className="rounded-xl bg-brand-soft px-4 py-2 text-sm font-bold text-brand">Accept</button><button onClick={() => setRequests((current) => current.filter(({ id }) => id !== request.id))} className="rounded-xl bg-danger-soft px-4 py-2 text-sm font-bold text-accent">Reject</button></div></div>
                      </article>
                    )) : <p className="rounded-xl bg-brand-surface p-4 text-sm text-brand">All booking requests have been reviewed.</p>}
                  </div>
                </section>

                <section id="records" className="scroll-mt-28 rounded-[1.5rem] bg-surface-muted p-7">
                  <h2 className="text-2xl font-semibold">Patient Records</h2>
                  <div className="relative mt-8 space-y-8 before:absolute before:bottom-4 before:left-[13px] before:top-3 before:w-px before:bg-[#cbd6da]">
                    {records.map((record) => <RecordItem key={`${record.kind}-${record.time}`} {...record} />)}
                  </div>
                  <button className="mt-9 h-14 w-full rounded-2xl border border-brand/30 font-bold text-brand">View All Records</button>
                </section>
              </div>
            </div>
          </section>
      </main>

        <footer className="hidden border-t border-border bg-surface-muted px-5 py-14 sm:px-9 lg:px-10">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><AskareLogo /><p className="mt-5 max-w-xl text-sm leading-7 text-[#526a73]">Redefining cognitive healthcare through intelligent diagnostics and verified professional care.</p></div><div className="flex flex-wrap gap-8 text-sm text-[#496570]"><span>Privacy Policy</span><span>Terms of Use</span><span>About Us</span></div></div>
        </footer>
    </DoctorShell>
  );
}

function AskareLogo() {
  return <span className="text-[2rem] font-medium tracking-[-0.08em] text-slate-800">as<span className="text-teal-600">⌁</span>are</span>;
}

function StatCard({ label, value, note, icon, warning }: (typeof stats)[number]) {
  return <article className="min-h-52 rounded-[1.3rem] bg-surface-muted p-6"><p className="min-h-10 text-[11px] font-bold uppercase tracking-[.15em] text-brand">{label}</p><strong className="mt-3 block text-[2.15rem] font-semibold leading-tight tracking-[-0.03em]">{value}</strong><div className={`mt-5 flex items-start gap-3 text-sm leading-5 ${warning ? "text-accent" : "text-copy"}`}><Icon name={icon} className="mt-0.5 h-6 w-6 shrink-0" /><span>{note}</span></div></article>;
}

function MonthlyAppointmentsChart() {
  const maxCount = Math.max(...monthlyAppointments.map(({ count }) => count));
  const total = monthlyAppointments.reduce((sum, { count }) => sum + count, 0);

  return (
    <section className="mt-8 rounded-[1.5rem] bg-white p-6 shadow-[0_18px_45px_rgba(32,65,70,.07)] sm:p-7" aria-labelledby="appointments-chart-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.15em] text-brand">Appointment analytics</p>
          <h2 id="appointments-chart-title" className="mt-2 text-2xl font-semibold tracking-[-0.035em]">Monthly Appointments</h2>
          <p className="mt-1 text-sm text-copy-muted">Consultations received during 2026</p>
        </div>
        <div className="rounded-2xl bg-brand-surface px-5 py-3 text-right">
          <p className="text-[10px] font-bold uppercase tracking-[.12em] text-copy-muted">Year total</p>
          <p className="mt-0.5 text-2xl font-semibold text-brand">{total}</p>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto pb-1">
        <div className="relative min-w-[650px]">
          <div className="pointer-events-none absolute inset-x-0 bottom-7 top-0 flex flex-col justify-between" aria-hidden="true">
            {[60, 40, 20, 0].map((value) => <span key={value} className="block border-t border-dashed border-border" />)}
          </div>
          <div className="relative grid h-[240px] grid-cols-12 items-end gap-3">
            {monthlyAppointments.map(({ month, count, current }) => (
              <div key={month} className="flex h-full flex-col items-center justify-end gap-2" title={`${month}: ${count} appointments`}>
                <span className={`text-xs font-bold ${current ? "text-brand" : "text-copy-muted"}`}>{count}</span>
                <div className="flex h-[178px] w-full items-end justify-center">
                  <span
                    className={`w-full max-w-9 rounded-t-lg transition-all hover:opacity-80 ${current ? "bg-brand" : "bg-brand/35"}`}
                    style={{ height: `${Math.max((count / maxCount) * 100, 8)}%` }}
                  />
                </div>
                <span className={`text-xs ${current ? "font-bold text-brand" : "text-copy-muted"}`}>{month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function RecordItem({ kind, detail, time, active }: (typeof records)[number]) {
  return <article className="relative flex gap-4"><span className={`relative z-[1] mt-0.5 h-7 w-7 shrink-0 rounded-full border-[3px] bg-surface-muted ${active ? "border-brand after:absolute after:inset-[6px] after:rounded-full after:bg-brand" : "border-copy-muted"}`} /><div><h3 className={`text-sm font-bold ${active ? "text-brand" : "text-copy"}`}>{kind}</h3><p className="mt-1 leading-6">{detail}</p><p className="mt-1 text-[10px] uppercase text-copy-muted">{time}</p></div></article>;
}

function Icon({ name, className }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    records: <><rect x="4" y="6" width="16" height="15" rx="2"/><path d="M9 6V4h6v2M12 10v6M9 13h6"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.3 2.3 0 1 1 3.6 1.9c-.9.6-1.4 1-1.4 2.1M12 17h.01"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    trend: <path d="m4 16 5-5 4 4 7-8M15 7h5v5"/>,
    alert: <><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/></>,
    timer: <><circle cx="12" cy="13" r="8"/><path d="M9 2h6M12 9v4l3 2"/></>,
    heart: <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"/>,
    chevron: <path d="m7 9 5 5 5-5"/>,
    video: <><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>{paths[name]}</svg>;
}
