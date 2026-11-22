"use client";

import Link from "next/link";
import { api } from "@/shared/api";
import { fmtTime, rs } from "@/shared/format";
import { Icon } from "@/shared/icons";
import type { Appointment } from "@/shared/types";
import { Avatar, Badge, BarChart, Card, CardHeader, EmptyState, ErrorBox, LinkButton, Loading, Notice, PageHeader, StatCard } from "@/shared/ui";
import { useApi } from "@/shared/use-api";

type Dashboard = {
  stats: { pendingRequests: number; todaysConsultations: number; upcomingConfirmed: number; earningsThisMonth: number; totalEarnings: number; totalPatients: number; rating: number | null; reviewCount: number };
  today: Appointment[];
  monthly: { label: string; appointments: number; earnings: number }[];
};
type Profile = { status: string; rejectionReason?: string | null; name: string };

export default function DoctorDashboard() {
  const { data, error, loading, reload } = useApi(() => api.get<Dashboard>("/api/doctors/me/dashboard"));
  const profile = useApi(() => api.get<Profile>("/api/doctors/me/profile"));
  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;
  const s = data.stats;
  const pendingApproval = profile.data && profile.data.status !== "ACTIVE";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Overview" title={`Welcome, Dr. ${profile.data?.name?.split(" ")[0] ?? ""}`} description="Your day at a glance." actions={<LinkButton href="/doctor/schedule" variant="secondary" icon="clock">Manage schedule</LinkButton>} />
      {pendingApproval && (
        <Notice tone="warn">
          {profile.data?.status === "SUSPENDED" ? <><b>Your account is suspended.</b> Contact AskCare support.</> : profile.data?.rejectionReason ? <><b>Your profile was not approved:</b> {profile.data.rejectionReason}. Update your <Link href="/doctor/profile" className="font-semibold underline">profile</Link> and contact support.</> : <><b>Your profile is waiting for approval.</b> Patients can find and book you once your hospital (or AskCare for private doctors) approves you. Meanwhile set up your schedule and profile.</>}
        </Notice>
      )}
      {s.pendingRequests > 0 && (
        <Link href="/doctor/requests" className="flex flex-wrap items-center gap-4 rounded-[22px] bg-[#00646b] p-5 text-white">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><Icon name="inbox" size={24} /></span>
          <div className="flex-1"><p className="text-lg font-bold">{s.pendingRequests} appointment request{s.pendingRequests > 1 ? "s" : ""} waiting</p><p className="text-sm text-[#cdeeea]">Payment is already on hold. Accept or reject before the slot time.</p></div>
          <span className="flex items-center gap-1 font-bold">Review <Icon name="arrow" size={18} /></span>
        </Link>
      )}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's consultations" value={s.todaysConsultations} icon="calendar" />
        <StatCard label="Upcoming confirmed" value={s.upcomingConfirmed} icon="clock" />
        <StatCard label="Patients treated" value={s.totalPatients} icon="users" />
        <StatCard tone="mint" label="Earned this month" value={rs(s.earningsThisMonth)} hint={`Total ${rs(s.totalEarnings)}`} icon="money" />
      </section>
      <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader title="Today's schedule" action={<Link href="/doctor/appointments" className="text-[13px] font-semibold text-brand">All appointments</Link>} />
          {data.today.length ? (
            <ul className="flex flex-col gap-2.5">
              {data.today.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-[16px] border border-[#eef4f3] p-3">
                  <span className="w-16 text-sm font-bold text-brand">{fmtTime(a.slot.startAt)}</span>
                  <Avatar name={a.patient?.name} size={38} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{a.patient?.name}</p><p className="text-xs text-copy-muted">{a.consultationType === "VIDEO" ? "Video call" : "In-person"}</p></div>
                  <Badge value={a.status} />
                  {a.status === "CONFIRMED" && a.consultationType === "VIDEO" && <LinkButton href={`/doctor/call/${a.id}`} icon="video" className="h-9">Start</LinkButton>}
                  <LinkButton href={`/doctor/appointments/${a.id}`} variant="secondary" className="h-9">Open</LinkButton>
                </li>
              ))}
            </ul>
          ) : <EmptyState icon="calendar" title="No consultations today" text="Enjoy your day – new requests will appear here." />}
        </Card>
        <Card>
          <CardHeader title="Monthly appointments" subtitle="Accepted consultations, last 6 months" />
          <BarChart data={data.monthly} valueKey="appointments" />
          <div className="mt-5 flex items-center justify-between border-t border-[#eef4f3] pt-4 text-sm">
            <span className="text-copy-muted">Rating</span>
            <span className="flex items-center gap-1 font-bold"><Icon name="star" size={16} className="fill-[#f5b301] text-[#f5b301]" />{s.rating ?? "—"} <span className="font-normal text-copy-muted">({s.reviewCount} reviews)</span></span>
          </div>
        </Card>
      </section>
    </div>
  );
}
