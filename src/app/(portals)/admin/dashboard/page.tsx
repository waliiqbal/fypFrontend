"use client";

import Link from "next/link";
import { api } from "@/shared/api";
import { rs } from "@/shared/format";
import { Icon } from "@/shared/icons";
import { BarChart, Card, CardHeader, ErrorBox, LinkButton, Loading, PageHeader, StatCard } from "@/shared/ui";
import { useApi } from "@/shared/use-api";

type Dashboard = {
  stats: { hospitals: number; activeHospitals: number; doctors: number; privateDoctors: number; hospitalDoctors: number; pendingDoctorApprovals: number; patients: number; newPatientsToday: number; appointments: number; totalRevenue: number; totalCommission: number; revenueThisMonth: number; commissionThisMonth: number; aiRequestsToday: number; aiEmergencyFlagsThisMonth: number };
  appointmentsByStatus: Record<string, number>;
  monthly: { label: string; appointments: number; revenue: number; commission: number; newPatients: number; newDoctors: number }[];
  topSpecializations: { name: string; doctors: number }[];
};

export default function AdminDashboard() {
  const { data, error, loading, reload } = useApi(() => api.get<Dashboard>("/api/super-admin/dashboard"));
  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;
  const s = data.stats;
  const k = (v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v));
  const statusTotal = Object.values(data.appointmentsByStatus).reduce((a, b) => a + b, 0) || 1;
  const statusColors: Record<string, string> = { CONFIRMED: "#007d85", COMPLETED: "#3a6fd1", PENDING: "#e0a23b", CANCELLED: "#9aa9ab", NO_SHOW: "#d4694f" };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Platform overview" title="AskCare at a glance" description="Hospitals, doctors, patients, money and AI – across the whole platform." actions={<LinkButton href="/admin/hospitals?add=1" icon="plus">New hospital</LinkButton>} />
      {s.pendingDoctorApprovals > 0 && (
        <Link href="/admin/doctors?status=PENDING" className="flex flex-wrap items-center gap-4 rounded-[22px] bg-[#102a2e] p-5 text-white">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3fb8ae] text-[#08211f]"><Icon name="shield" size={24} /></span>
          <div className="flex-1"><p className="text-lg font-bold">{s.pendingDoctorApprovals} doctor{s.pendingDoctorApprovals > 1 ? "s" : ""} waiting for verification</p><p className="text-sm text-[#c3d8d6]">Check license details before they become bookable.</p></div>
          <span className="flex items-center gap-1 font-bold">Review <Icon name="arrow" size={18} /></span>
        </Link>
      )}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Hospitals" value={s.hospitals} hint={`${s.activeHospitals} active`} icon="building" />
        <StatCard label="Active doctors" value={s.doctors} hint={`${s.hospitalDoctors} hospital · ${s.privateDoctors} private`} icon="stethoscope" />
        <StatCard label="Patients" value={s.patients} hint={`+${s.newPatientsToday} today`} icon="users" />
        <StatCard label="Paid appointments" value={s.appointments} icon="calendar" />
        <StatCard tone="deep" label="Total collected" value={rs(s.totalRevenue)} hint={`${rs(s.revenueThisMonth)} this month`} />
        <StatCard tone="mint" label="AskCare commission" value={rs(s.totalCommission)} hint={`${rs(s.commissionThisMonth)} this month`} />
        <StatCard label="AI requests today" value={s.aiRequestsToday} icon="spark" />
        <StatCard tone="warm" label="AI emergency flags" value={s.aiEmergencyFlagsThisMonth} hint="This month" icon="alert" />
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <Card><CardHeader title="Revenue" subtitle="Collected fees, last 12 months" /><BarChart data={data.monthly} valueKey="revenue" format={k} /></Card>
        <Card><CardHeader title="Growth" subtitle="New patients per month" /><BarChart data={data.monthly} valueKey="newPatients" /></Card>
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Appointments by status" />
          <div className="flex h-4 overflow-hidden rounded-full bg-[#eef4f3]">
            {Object.entries(data.appointmentsByStatus).map(([st, n]) => <span key={st} style={{ width: `${(n / statusTotal) * 100}%`, background: statusColors[st] ?? "#ccc" }} title={`${st}: ${n}`} />)}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {Object.entries(data.appointmentsByStatus).map(([st, n]) => <li key={st} className="flex items-center gap-2"><span className="h-3 w-3 rounded" style={{ background: statusColors[st] ?? "#ccc" }} />{st.replace("_", " ").toLowerCase()} <b className="ml-auto">{n}</b></li>)}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Top specializations" subtitle="By number of doctors" action={<Link href="/admin/specializations" className="text-[13px] font-semibold text-brand">Manage</Link>} />
          <ul className="flex flex-col gap-3">
            {data.topSpecializations.map((t) => {
              const max = Math.max(1, ...data.topSpecializations.map((x) => x.doctors));
              return <li key={t.name} className="text-sm"><div className="flex justify-between"><span className="font-semibold">{t.name}</span><span className="text-copy-muted">{t.doctors}</span></div><div className="mt-1 h-2 rounded-full bg-[#eef4f3]"><div className="h-2 rounded-full bg-brand" style={{ width: `${(t.doctors / max) * 100}%` }} /></div></li>;
            })}
            {!data.topSpecializations.length && <p className="text-sm text-copy-muted">No doctors yet.</p>}
          </ul>
        </Card>
      </section>
    </div>
  );
}
