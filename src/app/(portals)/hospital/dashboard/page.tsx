"use client";

import Link from "next/link";
import { api } from "@/shared/api";
import { rs } from "@/shared/format";
import { Icon } from "@/shared/icons";
import { BarChart, Card, CardHeader, ErrorBox, LinkButton, Loading, PageHeader, StatCard } from "@/shared/ui";
import { useApi } from "@/shared/use-api";

type Dashboard = {
  hospital: { id: number; name: string; city?: string | null };
  stats: { activeDoctors: number; inactiveDoctors: number; pendingApprovals: number; todaysAppointments: number; appointmentsThisMonth: number; totalPatients: number; revenueThisMonth: number };
  monthly: { label: string; appointments: number; revenue: number }[];
  busiestDoctors: { doctorId: number; name?: string; appointments: number }[];
};

export default function HospitalDashboard() {
  const { data, error, loading, reload } = useApi(() => api.get<Dashboard>("/api/hospital/dashboard"));
  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;
  const s = data.stats;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow={data.hospital.city ?? "Hospital"} title={data.hospital.name} description="Doctors, appointments and revenue for your hospital." actions={<LinkButton href="/hospital/doctors?add=1" icon="plus">Add doctor</LinkButton>} />
      {s.pendingApprovals > 0 && (
        <Link href="/hospital/doctors?status=PENDING" className="flex flex-wrap items-center gap-4 rounded-[22px] bg-[#0d3f44] p-5 text-white">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><Icon name="stethoscope" size={24} /></span>
          <div className="flex-1"><p className="text-lg font-bold">{s.pendingApprovals} doctor{s.pendingApprovals > 1 ? "s" : ""} waiting for approval</p><p className="text-sm text-[#cde7e4]">They registered under your hospital and can&apos;t be booked until you approve them.</p></div>
          <span className="flex items-center gap-1 font-bold">Review <Icon name="arrow" size={18} /></span>
        </Link>
      )}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active doctors" value={s.activeDoctors} hint={`${s.inactiveDoctors} inactive`} icon="stethoscope" />
        <StatCard label="Today's appointments" value={s.todaysAppointments} icon="calendar" />
        <StatCard label="Patients served" value={s.totalPatients} icon="users" />
        <StatCard tone="deep" label="Revenue this month" value={rs(s.revenueThisMonth)} hint={`${s.appointmentsThisMonth} consultations`} />
      </section>
      <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Revenue trend" subtitle="Collected consultation fees, last 6 months" />
          <BarChart data={data.monthly} valueKey="revenue" format={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
        </Card>
        <Card>
          <CardHeader title="Busiest doctors" action={<Link href="/hospital/revenue" className="text-[13px] font-semibold text-brand">Revenue</Link>} />
          {data.busiestDoctors.length ? (
            <ol className="flex flex-col gap-3">
              {data.busiestDoctors.map((d, i) => (
                <li key={d.doctorId} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e3f4f2] text-sm font-bold text-[#00545a]">{i + 1}</span>
                  <span className="flex-1 font-semibold">Dr. {d.name}</span>
                  <span className="text-sm text-copy-muted">{d.appointments} visits</span>
                </li>
              ))}
            </ol>
          ) : <p className="text-sm text-copy-muted">No consultations yet.</p>}
        </Card>
      </section>
    </div>
  );
}
