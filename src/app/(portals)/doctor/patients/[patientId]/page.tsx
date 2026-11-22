"use client";

import Link from "next/link";
import { use } from "react";
import { api } from "@/shared/api";
import { ageFrom, fmtDate } from "@/shared/format";
import { Icon } from "@/shared/icons";
import type { Consultation, MedicalDocument, MedicalProfile, Prescription } from "@/shared/types";
import { Avatar, Card, CardHeader, EmptyState, ErrorBox, Loading } from "@/shared/ui";
import { useApi } from "@/shared/use-api";

type Record = { patient: { id: number; name: string; gender?: string | null; dateOfBirth?: string | null; bloodGroup?: string | null; profileImage?: string | null }; profile: MedicalProfile | null; consultations: Consultation[]; prescriptions: Prescription[]; documents: MedicalDocument[] };

export default function PatientRecord({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params);
  const { data, error, loading } = useApi(() => api.get<Record>(`/api/doctors/me/patients/${patientId}`), [patientId]);
  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox message={error ?? "Not found"} />;
  const p = data.profile;
  const chips = (list: string[] | undefined, tone: string) => list?.length ? list.map((c) => <span key={c} className={`rounded-[10px] px-2.5 py-1 text-xs font-semibold ${tone}`}>{c}</span>) : <span className="text-sm text-copy-muted">None recorded</span>;

  return (
    <div className="flex flex-col gap-5">
      <Link href="/doctor/patients" className="flex w-fit items-center gap-1 text-sm font-semibold text-brand"><Icon name="back" size={16} />Patients</Link>
      <Card className="flex flex-wrap items-center gap-4">
        <Avatar name={data.patient?.name} src={data.patient?.profileImage} size={64} />
        <div><h1 className="font-display text-2xl font-extrabold">{data.patient?.name}</h1><p className="text-sm text-copy-muted">{[ageFrom(data.patient?.dateOfBirth) != null && `${ageFrom(data.patient?.dateOfBirth)} yrs`, data.patient?.gender, data.patient?.bloodGroup && `Blood ${data.patient.bloodGroup}`].filter(Boolean).join(" · ")}</p></div>
      </Card>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card><CardHeader title="Conditions" /><div className="flex flex-wrap gap-1.5">{chips(p?.conditions, "bg-[#e3f4f2] text-[#00545a]")}</div></Card>
        <Card><CardHeader title="Allergies" /><div className="flex flex-wrap gap-1.5">{chips(p?.allergies, "bg-[#fff0ec] text-[#8a3b24]")}</div></Card>
        <Card><CardHeader title="Regular medicines" /><div className="flex flex-wrap gap-1.5">{chips(p?.currentMedications, "bg-[#f0f7f6] text-ink")}</div></Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Consultation history" />
          {data.consultations.length ? data.consultations.map((c) => (
            <div key={c.id} className="border-b border-[#eef4f3] py-3 text-sm last:border-0">
              <p className="font-semibold">{c.diagnosis || "Consultation"} <span className="font-normal text-copy-muted">· Dr. {c.doctor?.name} · {fmtDate(c.createdAt)}</span></p>
              {c.notes && <p className="mt-1 text-copy">{c.notes}</p>}
              {c.advice && <p className="mt-1 text-copy"><b>Advice:</b> {c.advice}</p>}
            </div>
          )) : <EmptyState title="No consultations yet" />}
        </Card>
        <Card>
          <CardHeader title="Prescriptions" />
          {data.prescriptions.length ? data.prescriptions.map((rx) => (
            <div key={rx.id} className="border-b border-[#eef4f3] py-3 text-sm last:border-0">
              <p className="text-xs text-copy-muted">Dr. {rx.doctor?.name} · {fmtDate(rx.createdAt)}</p>
              <ul className="mt-1">{rx.items.map((i, k) => <li key={k}><b>{i.medicine}</b> {i.dosage} – {i.frequency}</li>)}</ul>
            </div>
          )) : <EmptyState icon="pill" title="No prescriptions" />}
        </Card>
      </div>
      <Card>
        <CardHeader title="Reports" />
        {data.documents.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.documents.map((d) => (
              <a key={d.id} href={d.fileUrl} target="_blank" rel="noreferrer" className="rounded-[16px] border border-[#eef4f3] p-3 hover:border-brand/40">
                <p className="text-sm font-semibold">{d.title}</p>
                <p className="text-xs text-copy-muted">{d.type.replace(/_/g, " ").toLowerCase()} · {fmtDate(d.recordedAt ?? d.createdAt)}</p>
                {d.notes && <p className="mt-1 text-xs">{d.notes}</p>}
              </a>
            ))}
          </div>
        ) : <EmptyState icon="file" title="No reports uploaded" />}
      </Card>
    </div>
  );
}
