"use client";

import { useState } from "react";
import { api } from "@/shared/api";
import { Icon } from "@/shared/icons";
import { Badge, Card, CardHeader, ErrorBox, Input, Loading, Notice, PageHeader, StatCard } from "@/shared/ui";
import { useApi } from "@/shared/use-api";

type Report = {
  month: string;
  label: string;
  summary: string;
  highlights: string[];
  recommendations: string[];
  aiGenerated: boolean;
  stats: { appointments: number; completed: number; cancelled: number; consultations: number; prescriptions: number; medicines: string[]; reportsUploaded: number };
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function MonthlyHealthReport() {
  const [month, setMonth] = useState(currentMonth());
  const { data, error, loading, reload } = useApi(() => api.get<Report>("/api/patients/me/health-report", { month }), [month]);

  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow="AI summary"
        title="Monthly Health Report"
        description="A plain-language recap of your consultations, medicines and reports, written from your own AskCare records."
        actions={<Input aria-label="Month" type="month" max={currentMonth()} value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className="mt-0 w-48" />}
      />
      {loading && !data ? <Loading label="Preparing your report…" /> : error && !data ? <ErrorBox message={error} onRetry={reload} /> : data && (
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Appointments" value={data.stats.appointments} icon="calendar" hint={`${data.stats.completed} completed · ${data.stats.cancelled} cancelled`} />
            <StatCard label="Consultations" value={data.stats.consultations} icon="stethoscope" />
            <StatCard label="Prescriptions" value={data.stats.prescriptions} icon="pill" />
            <StatCard label="Reports uploaded" value={data.stats.reportsUploaded} icon="file" />
          </div>
          <Card>
            <CardHeader title={data.label} action={<Badge value={data.aiGenerated ? "ACTIVE" : "PENDING"} label={data.aiGenerated ? "AI written" : "Summary"} />} />
            <p className="leading-7 text-copy">{data.summary}</p>
            {data.stats.medicines.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {data.stats.medicines.map((m) => <span key={m} className="rounded-[10px] bg-[#e3f4f2] px-2.5 py-1 text-xs font-semibold text-[#00545a]">{m}</span>)}
              </div>
            )}
          </Card>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Highlights" />
              {data.highlights.length ? (
                <ul className="flex flex-col gap-3 text-sm">
                  {data.highlights.map((h) => <li key={h} className="flex gap-2.5"><Icon name="check" size={17} className="mt-0.5 shrink-0 text-brand" />{h}</li>)}
                </ul>
              ) : <p className="text-sm text-copy-muted">Nothing to highlight for this month.</p>}
            </Card>
            <Card>
              <CardHeader title="Suggestions" />
              {data.recommendations.length ? (
                <ul className="flex flex-col gap-3 text-sm">
                  {data.recommendations.map((r) => <li key={r} className="flex gap-2.5"><Icon name="spark" size={17} className="mt-0.5 shrink-0 text-brand" />{r}</li>)}
                </ul>
              ) : <p className="text-sm text-copy-muted">No suggestions this month.</p>}
            </Card>
          </div>
          {!data.aiGenerated && data.stats.appointments + data.stats.consultations > 0 && <Notice tone="warn">The AI assistant was busy, so this summary was built directly from your records.</Notice>}
          <p className="text-xs text-copy-muted">This report is a summary of your records, not medical advice. Talk to your doctor before changing any treatment.</p>
        </div>
      )}
    </div>
  );
}
