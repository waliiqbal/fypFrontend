"use client";

import Link from "next/link";
import { use, useState } from "react";
import { api } from "@/shared/api";
import { fmtDate, rs } from "@/shared/format";
import { Icon } from "@/shared/icons";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, ErrorBox, Field, Loading, Notice, PageHeader, Select, StatCard } from "@/shared/ui";
import { useAction, useApi } from "@/shared/use-api";

type Detail = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  status: string;
  consultationFee?: number | null;
  experience?: number | null;
  qualification?: string | null;
  bio?: string | null;
  licenseNumber?: string | null;
  specializations: { specialization: { name: string } }[];
  availabilities: { id: number; dayOfWeek: number; startTime: string; endTime: string; slotDuration: number }[];
  documents: { id: number; title: string; type: string; fileUrl: string; createdAt: string }[];
  department?: { id: number; name: string } | null;
  stats: { consultations: number; revenue: number; rating: number | null; reviews: number };
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const time12 = (t: string) => { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; };

export default function HospitalDoctorDetail({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = use(params);
  const id = Number(doctorId);
  const { data, error, loading, reload } = useApi(() => api.get<Detail>(`/api/hospital/doctors/${id}`), [id]);
  const departments = useApi(() => api.get<{ id: number; name: string }[]>("/api/hospital/departments"));
  const [flash, setFlash] = useState<string | null>(null);
  const action = useAction();

  async function assign(value: string) {
    setFlash(null);
    const r = await action.run("dept", () => api.patch(`/api/hospital/doctors/${id}/department`, { departmentId: value ? Number(value) : null }));
    if (r) { setFlash(value ? "Department updated." : "Doctor removed from department."); void reload(); }
  }

  if (loading && !data) return <Loading />;
  if (error || !data) return <ErrorBox message={error ?? "Doctor not found"} onRetry={reload} />;

  return (
    <div className="flex flex-col gap-5">
      <Link href="/hospital/doctors" className="flex w-fit items-center gap-1 text-sm font-semibold text-brand"><Icon name="back" size={16} />Doctors</Link>
      <PageHeader eyebrow="Doctor" title={`Dr. ${data.name}`} description={[data.specializations.map((s) => s.specialization.name).join(", "), data.qualification].filter(Boolean).join(" · ") || undefined} actions={<Badge value={data.status} />} />
      {flash && <Notice tone="success">{flash}</Notice>}
      {action.error && <ErrorBox message={action.error} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Consultations" value={data.stats.consultations} icon="calendar" />
        <StatCard label="Revenue generated" value={rs(data.stats.revenue)} icon="money" tone="deep" />
        <StatCard label="Rating" value={data.stats.rating ? `${Math.round(data.stats.rating * 10) / 10} ★` : "—"} hint={`${data.stats.reviews} review${data.stats.reviews === 1 ? "" : "s"}`} icon="star" />
        <StatCard label="Consultation fee" value={data.consultationFee ? rs(data.consultationFee) : "—"} tone="mint" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profile" />
          <div className="mb-4 flex items-center gap-4"><Avatar name={data.name} size={60} /><div><p className="font-semibold">{data.email}</p><p className="text-sm text-copy-muted">{data.phone ?? "No phone"} · License {data.licenseNumber ?? "—"} · {data.experience ?? 0} yrs</p></div></div>
          {data.bio && <p className="mb-4 text-sm leading-6 text-copy">{data.bio}</p>}
          <Field label="Department">
            <Select value={data.department?.id ?? ""} disabled={action.busy === "dept"} onChange={(e) => assign(e.target.value)}>
              <option value="">No department</option>
              {departments.data?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
          {departments.data && departments.data.length === 0 && <p className="mt-2 text-xs text-copy-muted">Create departments first from the <Link href="/hospital/departments" className="font-semibold text-brand">Departments</Link> page.</p>}
        </Card>

        <Card>
          <CardHeader title="Weekly schedule" subtitle="Recurring consultation hours set by the doctor" />
          {data.availabilities.length ? (
            <ul className="flex flex-col gap-2">
              {DAYS.map((day, i) => {
                const rules = data.availabilities.filter((a) => a.dayOfWeek === i);
                return (
                  <li key={day} className="flex items-start gap-3 rounded-xl bg-[#f7fbfa] px-3.5 py-2.5 text-sm">
                    <span className="w-24 shrink-0 font-semibold">{day}</span>
                    {rules.length ? <span className="flex flex-wrap gap-x-4 gap-y-1">{rules.map((r) => <span key={r.id}>{time12(r.startTime)} – {time12(r.endTime)} <span className="text-xs text-copy-muted">({r.slotDuration} min)</span></span>)}</span> : <span className="text-copy-muted">Not available</span>}
                  </li>
                );
              })}
            </ul>
          ) : <EmptyState icon="clock" title="No weekly hours set" text="The doctor has not added consultation hours yet." />}
        </Card>
      </div>

      <Card>
        <CardHeader title="Verification documents" subtitle="Licence and degree files uploaded by the doctor" />
        {data.documents.length ? (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.documents.map((d) => (
              <li key={d.id}>
                <a href={d.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-[16px] border border-[#eef4f3] p-3 hover:border-brand/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.fileUrl} alt={d.title} className="h-14 w-14 rounded-xl bg-[#f0f7f6] object-cover" />
                  <span className="min-w-0"><span className="block truncate text-sm font-semibold">{d.title}</span><span className="text-xs text-copy-muted">{d.type.toLowerCase()} · {fmtDate(d.createdAt)}</span></span>
                </a>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-copy-muted">No documents uploaded yet. You can ask the doctor to add their licence from their profile.</p>}
        {data.status === "INACTIVE" && <div className="mt-4"><Link href="/hospital/doctors?status=PENDING"><Button variant="soft">Go to approval queue</Button></Link></div>}
      </Card>
    </div>
  );
}
