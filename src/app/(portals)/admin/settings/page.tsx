"use client";

import { useState } from "react";
import { api } from "@/shared/api";
import { fmtDateTime } from "@/shared/format";
import { Badge, Button, Card, CardHeader, DataTable, EmptyState, ErrorBox, Field, Input, Loading, Notice, PageHeader, Pager } from "@/shared/ui";
import { useAction, useApi, useFormFrom } from "@/shared/use-api";

type Log = { id: number; actorRole: string; actorId: number; action: string; entity: string; entityId?: string | null; createdAt: string };

export default function AdminSettings() {
  const commission = useApi(() => api.get<{ commissionPercent: number }>("/api/super-admin/settings/commission"));
  const [value, setValue] = useFormFrom(commission.data, (c) => String(c.commissionPercent), "");
  const [saved, setSaved] = useState(false);
  const [page, setPage] = useState(1);
  const logs = useApi(() => api.get<Log[]>("/api/super-admin/audit-logs", { page }), [page]);
  const action = useAction();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Platform" title="Settings, Health & Audit" />
      <SystemHealth />
      <PlatformSettings />
      <Card className="max-w-xl">
        <CardHeader title="Platform commission" subtitle="Percentage AskCare keeps from each accepted consultation. Applies to newly accepted appointments." />
        {commission.loading ? <Loading /> : (
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-40"><Field label="Commission (%)"><Input type="number" min={0} max={100} value={value} onChange={(e) => { setSaved(false); setValue(e.target.value); }} /></Field></div>
            <Button loading={action.busy === "c"} disabled={value === "" || Number(value) < 0 || Number(value) > 100} onClick={async () => { if (await action.run("c", () => api.put("/api/super-admin/settings/commission", { commissionPercent: Number(value) }))) setSaved(true); }}>Save</Button>
          </div>
        )}
        {saved && <div className="mt-3"><Notice tone="success">Commission updated to {value}%.</Notice></div>}
        {action.error && <div className="mt-3"><ErrorBox message={action.error} /></div>}
        <p className="mt-4 text-xs text-copy-muted">Example: with 10%, a Rs 2,500 consultation gives the doctor Rs 2,250 and AskCare Rs 250.</p>
      </Card>
      <Card className="p-0 sm:p-0">
        <div className="p-5 pb-0"><CardHeader title="Audit log" subtitle="Approvals, suspensions, refunds and setting changes" /></div>
        {logs.loading ? <Loading /> : (
          <DataTable rows={logs.data ?? []} rowKey={(l) => l.id} empty={<EmptyState icon="log" title="No actions recorded yet" />} columns={[
            { header: "When", cell: (l) => fmtDateTime(l.createdAt) },
            { header: "Who", cell: (l) => `${l.actorRole.replace("_", " ").toLowerCase()} #${l.actorId}` },
            { header: "Action", cell: (l) => <b>{l.action.replace(/_/g, " ").toLowerCase()}</b> },
            { header: "Target", cell: (l) => `${l.entity}${l.entityId ? ` #${l.entityId}` : ""}` },
          ]} />
        )}
      </Card>
      {logs.meta && <Pager page={page} totalPages={logs.meta.totalPages} onPage={setPage} />}
    </div>
  );
}

type Health = {
  status: "healthy" | "degraded";
  uptimeSeconds: number;
  node: string;
  database: { ok: boolean; latencyMs: number; error?: string };
  redis: { ok: boolean; latencyMs: number; error?: string };
  ai: { provider: string; keyConfigured: boolean; chatModels: string; requestsLastHour: number; failuresLastHour: number };
  integrations: { stripe: boolean; stripeWebhook: boolean; email: boolean; cloudinary: boolean };
  queues: { pendingPayouts: number; doctorsAwaitingApproval: number };
};

const uptime = (s: number) => (s < 3600 ? `${Math.max(1, Math.round(s / 60))} min` : s < 86400 ? `${Math.round(s / 3600)} h` : `${Math.round(s / 86400)} days`);

function Dot({ ok }: { ok: boolean }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? "bg-[#2ea66f]" : "bg-[#d2503a]"}`} aria-hidden />;
}

function SystemHealth() {
  const { data, error, loading, reload } = useApi(() => api.get<Health>("/api/super-admin/system-health"));
  return (
    <Card>
      <CardHeader title="System health" subtitle="Live status of the services AskCare depends on" action={<div className="flex items-center gap-2">{data && <Badge value={data.status === "healthy" ? "ACTIVE" : "FAILED"} label={data.status === "healthy" ? "All systems normal" : "Degraded"} />}<Button variant="secondary" className="h-9" loading={loading} onClick={reload}>Refresh</Button></div>} />
      {error && !data ? <ErrorBox message={error} onRetry={reload} /> : !data ? <Loading /> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <HealthTile title="Database" ok={data.database.ok} detail={data.database.ok ? `${data.database.latencyMs} ms` : data.database.error} />
          <HealthTile title="Redis (sessions)" ok={data.redis.ok} detail={data.redis.ok ? `${data.redis.latencyMs} ms` : data.redis.error} />
          <HealthTile title={`AI · ${data.ai.provider}`} ok={data.ai.keyConfigured && data.ai.failuresLastHour <= data.ai.requestsLastHour / 2} detail={data.ai.keyConfigured ? `${data.ai.requestsLastHour} calls, ${data.ai.failuresLastHour} failed in the last hour` : "API key missing"} />
          <HealthTile title="Server" ok detail={`Up ${uptime(data.uptimeSeconds)} · Node ${data.node}`} />
          <HealthTile title="Stripe payments" ok={data.integrations.stripe} detail={data.integrations.stripe ? "Key configured" : "Key missing"} />
          <HealthTile title="Stripe webhook" ok={data.integrations.stripeWebhook} detail={data.integrations.stripeWebhook ? "Secret configured" : "Secret missing"} />
          <HealthTile title="Email (OTP)" ok={data.integrations.email} detail={data.integrations.email ? "Configured" : "Not configured"} />
          <HealthTile title="Image uploads" ok={data.integrations.cloudinary} detail={data.integrations.cloudinary ? "Cloudinary configured" : "Not configured"} />
          <div className="rounded-[16px] bg-[#fffaf2] p-4 text-sm sm:col-span-2 xl:col-span-4">
            <b>Needs attention:</b> {data.queues.pendingPayouts} payout request(s) waiting · {data.queues.doctorsAwaitingApproval} doctor(s) awaiting approval · AI chat models: {data.ai.chatModels}
          </div>
        </div>
      )}
      <p className="mt-3 text-xs text-copy-muted">The AI model is chosen with environment variables on the server (AI_PROVIDER and the model lists), so changing it needs a redeploy.</p>
    </Card>
  );
}

function HealthTile({ title, ok, detail }: { title: string; ok: boolean; detail?: string }) {
  return (
    <div className="rounded-[16px] border border-[#e3eeec] p-4">
      <p className="flex items-center gap-2 text-sm font-semibold"><Dot ok={ok} />{title}</p>
      <p className="mt-1 text-xs text-copy-muted">{detail}</p>
    </div>
  );
}

type PlatformSettingsData = { commissionPercent: number; payoutMinimum: number; supportEmail: string; aiProvider: string };

function PlatformSettings() {
  const { data, error, loading, reload } = useApi(() => api.get<PlatformSettingsData>("/api/super-admin/settings"));
  const [form, setForm] = useFormFrom(data, (d) => ({ payoutMinimum: String(d.payoutMinimum), supportEmail: d.supportEmail }), { payoutMinimum: "", supportEmail: "" });
  const [saved, setSaved] = useState(false);
  const action = useAction();
  const minimum = Number(form.payoutMinimum);
  const valid = form.payoutMinimum !== "" && minimum >= 0;

  async function save() {
    const r = await action.run("s", () => api.put("/api/super-admin/settings", { payoutMinimum: minimum, supportEmail: form.supportEmail.trim() }));
    if (r) { setSaved(true); void reload(); }
  }
  return (
    <Card className="max-w-3xl">
      <CardHeader title="Platform settings" subtitle="Rules that apply to every doctor on AskCare" />
      {loading && !data ? <Loading /> : error && !data ? <ErrorBox message={error} onRetry={reload} /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Minimum payout (Rs)" hint="Doctors cannot request a payout smaller than this."><Input type="number" min={0} value={form.payoutMinimum} onChange={(e) => { setSaved(false); setForm({ ...form, payoutMinimum: e.target.value }); }} /></Field>
          <Field label="Support email" hint="Contact address for platform support."><Input type="email" value={form.supportEmail} onChange={(e) => { setSaved(false); setForm({ ...form, supportEmail: e.target.value }); }} placeholder="support@example.com" /></Field>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button loading={action.busy === "s"} disabled={!valid} onClick={save}>Save settings</Button>
            {saved && <Notice tone="success">Settings saved.</Notice>}
          </div>
          {action.error && <div className="sm:col-span-2"><ErrorBox message={action.error} /></div>}
        </div>
      )}
    </Card>
  );
}
