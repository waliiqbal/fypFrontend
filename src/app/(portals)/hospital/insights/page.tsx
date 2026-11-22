"use client";

import { api } from "@/shared/api";
import { rs } from "@/shared/format";
import { Icon } from "@/shared/icons";
import { Badge, Button, Card, CardHeader, DataTable, EmptyState, ErrorBox, Loading, Notice, PageHeader, StatCard } from "@/shared/ui";
import { useApi } from "@/shared/use-api";

type Insights = {
  metrics: {
    periodDays: number;
    totalRequests: number;
    confirmedOrCompleted: number;
    cancelled: number;
    noShows: number;
    cancellationRate: number;
    activeDoctors: number;
    revenue: number;
    peakHours: { hour: string; appointments: number }[];
    doctors: { name: string; appointments: number; revenue: number; rating: number | null }[];
  };
  observations: string[];
  aiSummary: string | null;
  recommendations: string[];
  aiGenerated: boolean;
};

export default function HospitalInsights() {
  const { data, error, loading, reload } = useApi(() => api.get<Insights>("/api/hospital/insights"));
  if (loading && !data) return <Loading label="Analysing the last 30 days…" />;
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;
  const m = data.metrics;

  return (
    <div>
      <PageHeader eyebrow="AI insights" title="Hospital Insights" description={`What the last ${m.periodDays} days of activity say about your hospital. Only totals are analysed, never patient records.`} actions={<Button variant="secondary" icon="spark" onClick={reload}>Refresh</Button>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Appointment requests" value={m.totalRequests} icon="calendar" hint={`${m.confirmedOrCompleted} confirmed or completed`} />
        <StatCard label="Revenue" value={rs(m.revenue)} icon="money" tone="deep" />
        <StatCard label="Cancellation rate" value={`${m.cancellationRate}%`} tone={m.cancellationRate >= 20 ? "warm" : "mint"} hint={`${m.cancelled} cancelled · ${m.noShows} no-shows`} />
        <StatCard label="Active doctors" value={m.activeDoctors} icon="stethoscope" />
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="What stands out" subtitle="Calculated directly from your numbers" />
          {data.observations.length ? (
            <ul className="flex flex-col gap-3 text-sm">
              {data.observations.map((o) => <li key={o} className="flex gap-2.5"><Icon name="alert" size={17} className="mt-0.5 shrink-0 text-[#c78a1a]" />{o}</li>)}
            </ul>
          ) : <p className="text-sm text-copy-muted">Nothing unusual in this period.</p>}
        </Card>
        <Card>
          <CardHeader title="AI summary & suggestions" action={<Badge value={data.aiGenerated ? "ACTIVE" : "INACTIVE"} label={data.aiGenerated ? "AI" : "Unavailable"} />} />
          {data.aiSummary ? (
            <>
              <p className="text-sm leading-6">{data.aiSummary}</p>
              {data.recommendations.length > 0 && <ul className="mt-3 flex flex-col gap-2 text-sm">{data.recommendations.map((r) => <li key={r} className="flex gap-2.5"><Icon name="spark" size={16} className="mt-0.5 shrink-0 text-brand" />{r}</li>)}</ul>}
            </>
          ) : m.totalRequests ? <Notice tone="warn">The AI assistant is busy right now. The observations on the left are still accurate. Try refreshing in a minute.</Notice> : <p className="text-sm text-copy-muted">AI suggestions appear once there is appointment activity.</p>}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card className="p-0 sm:p-0">
          <div className="p-5 pb-0"><CardHeader title="Doctor performance" /></div>
          <DataTable rows={m.doctors} rowKey={(d) => d.name} empty={<EmptyState icon="stethoscope" title="No consultations yet" />} columns={[
            { header: "Doctor", cell: (d) => <span className="font-semibold">Dr. {d.name}</span> },
            { header: "Consultations", cell: (d) => d.appointments },
            { header: "Revenue", cell: (d) => rs(d.revenue) },
            { header: "Rating", cell: (d) => (d.rating ? `${d.rating} ★` : "—") },
          ]} />
        </Card>
        <Card>
          <CardHeader title="Peak hours" subtitle="Most booked times (UTC)" />
          {m.peakHours.length ? (
            <ul className="flex flex-col gap-2.5 text-sm">
              {m.peakHours.map((h) => <li key={h.hour} className="flex items-center justify-between rounded-xl bg-[#f7fbfa] px-3.5 py-2.5"><span className="font-semibold">{h.hour}</span><span className="text-copy-muted">{h.appointments} appointments</span></li>)}
            </ul>
          ) : <p className="text-sm text-copy-muted">Not enough data yet.</p>}
        </Card>
      </div>
    </div>
  );
}
