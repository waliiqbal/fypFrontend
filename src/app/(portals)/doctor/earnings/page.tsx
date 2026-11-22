"use client";

import { api } from "@/shared/api";
import { fmtDate, rs } from "@/shared/format";
import { Badge, Card, DataTable, EmptyState, ErrorBox, Loading, PageHeader, StatCard } from "@/shared/ui";
import { useApi } from "@/shared/use-api";

type Earnings = {
  totals: { gross: number; commission: number; net: number; count: number };
  items: { id: number; consultationFee: string; platformFee: string | null; doctorEarning: string | null; acceptedAt: string; status: string; patient: { name: string }; slot: { startAt: string } }[];
};

export default function DoctorEarnings() {
  const { data, error, loading } = useApi(() => api.get<Earnings>("/api/doctors/me/earnings"));
  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox message={error ?? "Failed"} />;
  return (
    <div>
      <PageHeader eyebrow="Finance" title="Earnings" description="Fees are collected when you accept a request. AskCare keeps a small platform commission." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Consultations" value={data.totals.count} icon="calendar" />
        <StatCard label="Collected from patients" value={rs(data.totals.gross)} icon="money" />
        <StatCard label="Platform commission" value={rs(data.totals.commission)} tone="warm" />
        <StatCard label="Your earnings" value={rs(data.totals.net)} tone="deep" />
      </div>
      <Card className="p-0 sm:p-0">
        <DataTable rows={data.items} rowKey={(r) => r.id} empty={<EmptyState icon="money" title="No earnings yet" />} columns={[
          { header: "Patient", cell: (r) => <span className="font-semibold">{r.patient.name}</span> },
          { header: "Consultation", cell: (r) => fmtDate(r.slot.startAt) },
          { header: "Status", cell: (r) => <Badge value={r.status} /> },
          { header: "Fee", cell: (r) => rs(r.consultationFee) },
          { header: "Commission", cell: (r) => rs(r.platformFee) },
          { header: "You earn", cell: (r) => <b>{rs(r.doctorEarning)}</b> },
        ]} />
      </Card>
    </div>
  );
}
