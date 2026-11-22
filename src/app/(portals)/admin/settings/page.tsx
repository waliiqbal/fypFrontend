"use client";

import { useState } from "react";
import { api } from "@/shared/api";
import { fmtDateTime } from "@/shared/format";
import { Button, Card, CardHeader, DataTable, EmptyState, ErrorBox, Field, Input, Loading, Notice, PageHeader, Pager } from "@/shared/ui";
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
      <PageHeader eyebrow="Platform" title="Settings & Audit" />
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
