"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/shared/api";
import { fmtDate, rs } from "@/shared/format";
import { Avatar, Badge, Button, Card, DataTable, EmptyState, ErrorBox, Field, Input, Loading, Modal, Notice, PageHeader, Pager, SearchBox } from "@/shared/ui";
import { useAction, useApi } from "@/shared/use-api";

type Hospital = { id: number; name: string; city?: string | null; phone?: string | null; status: string; createdAt: string; logo?: string | null; revenue: number; hospitalAdmin?: { name: string; email: string } | null; _count: { doctors: number; appointments: number } };

function Hospitals() {
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(params.get("add") === "1");
  const [flash, setFlash] = useState<string | null>(null);
  const { data, meta, error, loading, reload } = useApi(() => api.get<Hospital[]>("/api/super-admin/hospitals", { search: q, page }), [q, page]);
  const action = useAction();

  async function setStatus(h: Hospital, status: string) {
    const r = await action.run(`s${h.id}`, () => api.patch(`/api/super-admin/hospitals/${h.id}/status`, { status }));
    if (r) { setFlash(`${h.name} is now ${status.toLowerCase()}.`); void reload(); }
  }

  return (
    <div>
      <PageHeader eyebrow="Network" title="Hospitals" description="Create hospitals with their admin account and control their access." actions={<><SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search hospital or city" /><Button icon="plus" onClick={() => setAdding(true)}>New hospital</Button></>} />
      {flash && <div className="mb-4"><Notice tone="success">{flash}</Notice></div>}
      {(error || action.error) && <div className="mb-4"><ErrorBox message={(error || action.error)!} /></div>}
      <Card className="p-0 sm:p-0">
        {loading ? <Loading /> : (
          <DataTable rows={data ?? []} rowKey={(h) => h.id} empty={<EmptyState icon="building" title="No hospitals yet" action={<Button icon="plus" onClick={() => setAdding(true)}>Add the first hospital</Button>} />} columns={[
            { header: "Hospital", cell: (h) => <div className="flex items-center gap-3"><Avatar name={h.name} src={h.logo} size={40} /><div><p className="font-semibold">{h.name}</p><p className="text-xs text-copy-muted">{h.city ?? "—"} · since {fmtDate(h.createdAt)}</p></div></div> },
            { header: "Admin", cell: (h) => h.hospitalAdmin ? <div><p className="text-sm">{h.hospitalAdmin.name}</p><p className="text-xs text-copy-muted">{h.hospitalAdmin.email}</p></div> : "—" },
            { header: "Doctors", cell: (h) => h._count.doctors },
            { header: "Appointments", cell: (h) => h._count.appointments },
            { header: "Revenue", cell: (h) => rs(h.revenue) },
            { header: "Status", cell: (h) => <Badge value={h.status} /> },
            { header: "", className: "text-right", cell: (h) => h.status === "ACTIVE"
              ? <Button variant="danger" className="h-9" loading={action.busy === `s${h.id}`} onClick={() => setStatus(h, "SUSPENDED")}>Suspend</Button>
              : <Button variant="soft" className="h-9" loading={action.busy === `s${h.id}`} onClick={() => setStatus(h, "ACTIVE")}>Activate</Button> },
          ]} />
        )}
      </Card>
      {meta && <Pager page={page} totalPages={meta.totalPages} onPage={setPage} />}
      <CreateModal open={adding} onClose={() => setAdding(false)} onDone={(m) => { setAdding(false); setFlash(m); void reload(); }} />
    </div>
  );
}

function CreateModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (m: string) => void }) {
  const [h, setH] = useState({ name: "", address: "", city: "", phone: "", latitude: "24.8607", longitude: "67.0011" });
  const [a, setA] = useState({ name: "", email: "", phone: "" });
  const { busy, error, run } = useAction();
  async function save() {
    const r = await run("c", () => api.post<{ emailSent: boolean }>("/api/super-admin/create-hospital-and-admin", {
      hospital: { name: h.name, address: h.address, city: h.city || undefined, phone: h.phone || undefined, latitude: Number(h.latitude), longitude: Number(h.longitude) },
      admin: { name: a.name, email: a.email, phone: a.phone || undefined },
    }));
    if (r) onDone(r.data.emailSent ? `${h.name} created. Login details were emailed to ${a.email}.` : `${h.name} created. Email failed – the admin can use "Forgot password" to sign in.`);
  }
  return (
    <Modal open={open} title="New hospital" onClose={onClose} footer={<Button loading={busy === "c"} disabled={!h.name || !h.address || !a.name || !a.email} onClick={save}>Create hospital & admin</Button>}>
      <p className="mb-3 text-[13px] font-bold uppercase tracking-[.1em] text-copy-muted">Hospital</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name"><Input value={h.name} onChange={(e) => setH({ ...h, name: e.target.value })} /></Field>
        <Field label="City"><Input value={h.city} onChange={(e) => setH({ ...h, city: e.target.value })} /></Field>
        <div className="sm:col-span-2"><Field label="Address"><Input value={h.address} onChange={(e) => setH({ ...h, address: e.target.value })} /></Field></div>
        <Field label="Phone"><Input value={h.phone} onChange={(e) => setH({ ...h, phone: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-2"><Field label="Latitude"><Input value={h.latitude} onChange={(e) => setH({ ...h, latitude: e.target.value })} /></Field><Field label="Longitude"><Input value={h.longitude} onChange={(e) => setH({ ...h, longitude: e.target.value })} /></Field></div>
      </div>
      <p className="mb-3 mt-5 text-[13px] font-bold uppercase tracking-[.1em] text-copy-muted">Hospital admin login</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Admin name"><Input value={a.name} onChange={(e) => setA({ ...a, name: e.target.value })} /></Field>
        <Field label="Admin email"><Input type="email" value={a.email} onChange={(e) => setA({ ...a, email: e.target.value })} /></Field>
        <Field label="Admin phone"><Input value={a.phone} onChange={(e) => setA({ ...a, phone: e.target.value })} /></Field>
      </div>
      <p className="mt-3 text-xs text-copy-muted">A secure password is generated and emailed to the admin. They log in with “Admin”.</p>
      {error && <div className="mt-3"><ErrorBox message={error} /></div>}
    </Modal>
  );
}

export default function HospitalsPage() {
  return <Suspense><Hospitals /></Suspense>;
}
