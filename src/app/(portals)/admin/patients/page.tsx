"use client";

import { useState } from "react";
import { api } from "@/shared/api";
import { fmtDate } from "@/shared/format";
import { Avatar, Badge, Button, Card, DataTable, EmptyState, ErrorBox, Loading, Notice, PageHeader, Pager, SearchBox } from "@/shared/ui";
import { useAction, useApi } from "@/shared/use-api";

type Patient = { id: number; name: string; email: string; phone?: string | null; gender?: string | null; status: string; isVerified: boolean; createdAt: string; _count: { appointments: number } };

export default function AdminPatients() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [flash, setFlash] = useState<string | null>(null);
  const { data, meta, error, loading, reload } = useApi(() => api.get<Patient[]>("/api/super-admin/patients", { search: q, page }), [q, page]);
  const action = useAction();
  async function setStatus(p: Patient, status: string) {
    const r = await action.run(`p${p.id}`, () => api.patch(`/api/super-admin/patients/${p.id}/status`, { status }));
    if (r) { setFlash(`${p.name} ${status === "SUSPENDED" ? "blocked" : "unblocked"}.`); void reload(); }
  }
  return (
    <div>
      <PageHeader eyebrow="People" title="Patients" description="Account information only – medical records stay private to the patient and their doctors." actions={<SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Name, email or phone" />} />
      {flash && <div className="mb-4"><Notice tone="success">{flash}</Notice></div>}
      {(error || action.error) && <div className="mb-4"><ErrorBox message={(error || action.error)!} /></div>}
      <Card className="p-0 sm:p-0">
        {loading ? <Loading /> : (
          <DataTable rows={data ?? []} rowKey={(p) => p.id} empty={<EmptyState icon="users" title="No patients found" />} columns={[
            { header: "Patient", cell: (p) => <div className="flex items-center gap-3"><Avatar name={p.name} size={36} /><div><p className="font-semibold">{p.name}</p><p className="text-xs text-copy-muted">{p.email}</p></div></div> },
            { header: "Phone", cell: (p) => p.phone ?? "—" },
            { header: "Joined", cell: (p) => fmtDate(p.createdAt) },
            { header: "Appointments", cell: (p) => p._count.appointments },
            { header: "Status", cell: (p) => <Badge value={p.status} label={!p.isVerified ? "Unverified" : p.status === "SUSPENDED" ? "Blocked" : undefined} /> },
            { header: "", className: "text-right", cell: (p) => p.status === "SUSPENDED"
              ? <Button variant="soft" className="h-9" loading={action.busy === `p${p.id}`} onClick={() => setStatus(p, "ACTIVE")}>Unblock</Button>
              : <Button variant="danger" className="h-9" loading={action.busy === `p${p.id}`} onClick={() => setStatus(p, "SUSPENDED")}>Block</Button> },
          ]} />
        )}
      </Card>
      {meta && <Pager page={page} totalPages={meta.totalPages} onPage={setPage} />}
    </div>
  );
}
