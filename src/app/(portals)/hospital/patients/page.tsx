"use client";

import { useState } from "react";
import { api } from "@/shared/api";
import { fmtDate } from "@/shared/format";
import { Avatar, Card, DataTable, EmptyState, ErrorBox, Loading, PageHeader, SearchBox } from "@/shared/ui";
import { useApi } from "@/shared/use-api";

type Row = { patient: { id: number; name: string; gender?: string | null; phone?: string | null }; visits: number; lastVisit: string; lastDoctor: string };

export default function HospitalPatients() {
  const [q, setQ] = useState("");
  const { data, error, loading } = useApi(() => api.get<Row[]>("/api/hospital/patients", { search: q }), [q]);
  return (
    <div>
      <PageHeader eyebrow="People" title="Patients" description="Patients seen by your doctors. Medical details are only visible to their doctors." actions={<SearchBox value={q} onChange={setQ} placeholder="Search patient" />} />
      {error && <ErrorBox message={error} />}
      <Card className="p-0 sm:p-0">
        {loading ? <Loading /> : (
          <DataTable rows={data ?? []} rowKey={(r) => r.patient.id} empty={<EmptyState icon="users" title="No patients yet" />} columns={[
            { header: "Patient", cell: (r) => <div className="flex items-center gap-3"><Avatar name={r.patient.name} size={36} /><b>{r.patient.name}</b></div> },
            { header: "Phone", cell: (r) => r.patient.phone ?? "—" },
            { header: "Visits", cell: (r) => r.visits },
            { header: "Last visit", cell: (r) => `${fmtDate(r.lastVisit)} · Dr. ${r.lastDoctor}` },
          ]} />
        )}
      </Card>
    </div>
  );
}
