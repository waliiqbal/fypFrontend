"use client";

import { api } from "@/shared/api";
import { fmtDateTime } from "@/shared/format";
import { Card, CardHeader, DataTable, EmptyState, ErrorBox, Loading, Notice, PageHeader, StatCard } from "@/shared/ui";
import { useApi } from "@/shared/use-api";

type Usage = {
  thisMonth: { total: number; failures: number; emergencies: number; successRate: number | null };
  byFeature: { feature: string; requests: number; avgLatencyMs: number }[];
  recentEmergencies: { id: number; feature: string; userRole?: string | null; userId?: number | null; createdAt: string }[];
};
const label: Record<string, string> = { "symptom-analysis": "Symptom checker", "patient-chat": "Patient assistant", "doctor-summary": "Doctor patient brief", "prescription-check": "Prescription check", "rag-index:embed": "Memory indexing", "rag-query:embed": "Memory search" };

export default function AdminAi() {
  const { data, error, loading } = useApi(() => api.get<Usage>("/api/super-admin/ai-usage"));
  const health = useApi(() => api.public<{ provider: string }>("/api/ai/health"));
  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox message={error ?? "Failed"} />;
  return (
    <div>
      <PageHeader eyebrow="AI monitoring" title="AI usage & safety" description={`Provider: ${health.data?.provider ?? "…"} (free tier). Change it with AI_PROVIDER in the backend .env.`} />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Requests this month" value={data.thisMonth.total} icon="spark" />
        <StatCard label="Success rate" value={data.thisMonth.successRate != null ? `${data.thisMonth.successRate}%` : "—"} tone="mint" />
        <StatCard label="Failed / rate-limited" value={data.thisMonth.failures} tone="warm" />
        <StatCard label="Emergency flags" value={data.thisMonth.emergencies} icon="alert" />
      </div>
      {data.thisMonth.failures > data.thisMonth.total * 0.2 && data.thisMonth.total > 10 && <div className="mb-5"><Notice tone="warn">Many AI requests are failing – the free-tier daily limit may be reached. Consider adding a second provider or a paid key.</Notice></div>}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-0 sm:p-0">
          <div className="p-5 pb-0"><CardHeader title="By feature" /></div>
          <DataTable rows={data.byFeature} rowKey={(r) => r.feature} empty={<EmptyState icon="spark" title="No AI usage yet" />} columns={[
            { header: "Feature", cell: (r) => <b>{label[r.feature] ?? r.feature}</b> },
            { header: "Requests", cell: (r) => r.requests },
            { header: "Avg. time", cell: (r) => `${(r.avgLatencyMs / 1000).toFixed(1)}s` },
          ]} />
        </Card>
        <Card className="p-0 sm:p-0">
          <div className="p-5 pb-0"><CardHeader title="Recent emergency flags" subtitle="Messages where red-flag symptoms were detected" /></div>
          <DataTable rows={data.recentEmergencies} rowKey={(r) => r.id} empty={<EmptyState icon="shield" title="No emergencies flagged" />} columns={[
            { header: "When", cell: (r) => fmtDateTime(r.createdAt) },
            { header: "Feature", cell: (r) => label[r.feature] ?? r.feature },
            { header: "User", cell: (r) => `${r.userRole ?? "—"} #${r.userId ?? "—"}` },
          ]} />
        </Card>
      </div>
    </div>
  );
}
