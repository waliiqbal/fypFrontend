"use client";

import { useState } from "react";
import { api } from "@/shared/api";
import { ageFrom, fmtDate } from "@/shared/format";
import { Avatar, Card, DataTable, EmptyState, ErrorBox, LinkButton, Loading, PageHeader, SearchBox } from "@/shared/ui";
import { useApi } from "@/shared/use-api";

type Row = { patient: { id: number; name: string; gender?: string | null; dateOfBirth?: string | null; profileImage?: string | null }; visits: number; lastVisit: string };

export default function DoctorPatients() {
  const [q, setQ] = useState("");
  const { data, error, loading } = useApi(() => api.get<Row[]>("/api/doctors/me/patients", { search: q }), [q]);
  return (
    <div>
      <PageHeader eyebrow="Patient records" title="My Patients" description="Only patients who consulted you. Open a record to see their full history." actions={<SearchBox value={q} onChange={setQ} placeholder="Search patient" />} />
      {error && <ErrorBox message={error} />}
      <Card className="p-0 sm:p-0">
        {loading ? <Loading /> : (
          <DataTable rows={data ?? []} rowKey={(r) => r.patient.id} empty={<EmptyState icon="users" title="No patients yet" />} columns={[
            { header: "Patient", cell: (r) => <div className="flex items-center gap-3"><Avatar name={r.patient.name} src={r.patient.profileImage} size={38} /><span className="font-semibold">{r.patient.name}</span></div> },
            { header: "Age / gender", cell: (r) => [ageFrom(r.patient.dateOfBirth) != null && `${ageFrom(r.patient.dateOfBirth)} yrs`, r.patient.gender].filter(Boolean).join(" · ") || "—" },
            { header: "Visits", cell: (r) => r.visits },
            { header: "Last visit", cell: (r) => fmtDate(r.lastVisit) },
            { header: "", className: "text-right", cell: (r) => <LinkButton href={`/doctor/patients/${r.patient.id}`} variant="secondary" className="h-9">Open record</LinkButton> },
          ]} />
        )}
      </Card>
    </div>
  );
}
