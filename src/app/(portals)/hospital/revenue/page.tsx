"use client";

import { api } from "@/shared/api";
import { rs } from "@/shared/format";
import { Card, DataTable, EmptyState, ErrorBox, Loading, PageHeader, StatCard } from "@/shared/ui";
import { useApi } from "@/shared/use-api";

type Revenue = { totals: { consultations: number; gross: number; commission: number; net: number }; byDoctor: { doctorId: number; name?: string; consultations: number; gross: number; commission: number; net: number }[] };

export default function HospitalRevenue() {
  const { data, error, loading } = useApi(() => api.get<Revenue>("/api/hospital/revenue"));
  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox message={error ?? "Failed"} />;
  return (
    <div>
      <PageHeader eyebrow="Finance" title="Revenue" description="Collected consultation fees per doctor (all time)." actions={<button onClick={() => downloadCsv(data)} className="h-11 rounded-[13px] border border-border bg-white px-4 text-sm font-semibold">Export CSV</button>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Consultations" value={data.totals.consultations} icon="calendar" />
        <StatCard label="Collected" value={rs(data.totals.gross)} icon="money" />
        <StatCard label="AskCare commission" value={rs(data.totals.commission)} tone="warm" />
        <StatCard label="Doctors' share" value={rs(data.totals.net)} tone="deep" />
      </div>
      <Card className="p-0 sm:p-0">
        <DataTable rows={data.byDoctor} rowKey={(r) => r.doctorId} empty={<EmptyState icon="money" title="No revenue yet" />} columns={[
          { header: "Doctor", cell: (r) => <b>Dr. {r.name}</b> },
          { header: "Consultations", cell: (r) => r.consultations },
          { header: "Collected", cell: (r) => rs(r.gross) },
          { header: "Commission", cell: (r) => rs(r.commission) },
          { header: "Doctor share", cell: (r) => rs(r.net) },
        ]} />
      </Card>
    </div>
  );
}

function downloadCsv(data: Revenue) {
  const rows = [["Doctor", "Consultations", "Collected", "Commission", "Doctor share"], ...data.byDoctor.map((r) => [r.name ?? "", r.consultations, r.gross, r.commission, r.net])];
  const blob = new Blob([rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "hospital-revenue.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}
