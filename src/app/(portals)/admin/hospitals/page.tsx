"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/shared/api";
import { fmtDate, rs } from "@/shared/format";
import { Avatar, Badge, Button, Card, DataTable, EmptyState, ErrorBox, Field, Input, Loading, Modal, Notice, PageHeader, Pager, SearchBox, Textarea } from "@/shared/ui";
import { useAction, useApi } from "@/shared/use-api";

type Hospital = { id: number; name: string; city?: string | null; phone?: string | null; status: string; createdAt: string; logo?: string | null; revenue: number; hospitalAdmin?: { name: string; email: string } | null; _count: { doctors: number; appointments: number } };

function Hospitals() {
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(params.get("add") === "1");
  const [editing, setEditing] = useState<Hospital | null>(null);
  const [resetting, setResetting] = useState<Hospital | null>(null);
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
            { header: "", className: "text-right", cell: (h) => (
              <div className="flex justify-end gap-1.5">
                <Button variant="secondary" className="h-9" onClick={() => setEditing(h)}>Edit</Button>
                {h.hospitalAdmin && <Button variant="ghost" icon="key" className="h-9" onClick={() => setResetting(h)}>Reset password</Button>}
                {h.status === "ACTIVE"
                  ? <Button variant="danger" className="h-9" loading={action.busy === `s${h.id}`} onClick={() => setStatus(h, "SUSPENDED")}>Suspend</Button>
                  : <Button variant="soft" className="h-9" loading={action.busy === `s${h.id}`} onClick={() => setStatus(h, "ACTIVE")}>Activate</Button>}
              </div>
            ) },
          ]} />
        )}
      </Card>
      {meta && <Pager page={page} totalPages={meta.totalPages} onPage={setPage} />}
      <EditModal hospital={editing} onClose={() => setEditing(null)} onDone={(m) => { setEditing(null); setFlash(m); void reload(); }} />
      <ResetModal hospital={resetting} onClose={() => setResetting(null)} onDone={(m) => { setResetting(null); setFlash(m); }} />
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

type HospitalFull = { name: string; address?: string | null; city?: string | null; phone?: string | null; email?: string | null; description?: string | null };

function EditModal({ hospital, onClose, onDone }: { hospital: Hospital | null; onClose: () => void; onDone: (m: string) => void }) {
  const detail = useApi(() => (hospital ? api.get<HospitalFull>(`/api/super-admin/hospitals/${hospital.id}`) : Promise.resolve({ success: true, message: "", data: null as unknown as HospitalFull })), [hospital?.id]);
  const [form, setForm] = useState<{ id: number | null; v: HospitalFull }>({ id: null, v: { name: "" } });
  const { busy, error, run } = useAction();
  if (!hospital) return null;
  // Fill the form once per opened hospital, as soon as its details arrive.
  if (detail.data && form.id !== hospital.id) setForm({ id: hospital.id, v: { name: detail.data.name ?? "", address: detail.data.address ?? "", city: detail.data.city ?? "", phone: detail.data.phone ?? "", email: detail.data.email ?? "", description: detail.data.description ?? "" } });
  const v = form.v;
  const set = (k: keyof HospitalFull, value: string) => setForm((f) => ({ ...f, v: { ...f.v, [k]: value } }));

  async function save() {
    const r = await run("e", () => api.patch(`/api/super-admin/hospitals/${hospital!.id}`, {
      name: v.name.trim(), address: v.address ?? "", city: v.city ?? "", phone: v.phone ?? "", description: v.description ?? "", ...(v.email?.trim() ? { email: v.email.trim() } : {}),
    }));
    if (r) onDone(`${v.name.trim()} updated.`);
  }
  return (
    <Modal key={hospital.id} open title={`Edit ${hospital.name}`} onClose={onClose} footer={<Button loading={busy === "e"} disabled={form.id !== hospital.id || v.name.trim().length < 2} onClick={save}>Save changes</Button>}>
      {form.id !== hospital.id ? <Loading /> : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name"><Input value={v.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="City"><Input value={v.city ?? ""} onChange={(e) => set("city", e.target.value)} /></Field>
          <div className="sm:col-span-2"><Field label="Address"><Input value={v.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field></div>
          <Field label="Phone"><Input value={v.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Email"><Input type="email" value={v.email ?? ""} onChange={(e) => set("email", e.target.value)} /></Field>
          <div className="sm:col-span-2"><Field label="Description"><Textarea value={v.description ?? ""} onChange={(e) => set("description", e.target.value)} className="min-h-20" /></Field></div>
        </div>
      )}
      {error && <div className="mt-3"><ErrorBox message={error} /></div>}
    </Modal>
  );
}

/** Super Admin resets a hospital admin's password. The new temporary password is emailed, never shown here. */
function ResetModal({ hospital, onClose, onDone }: { hospital: Hospital | null; onClose: () => void; onDone: (m: string) => void }) {
  const { busy, error, run } = useAction();
  if (!hospital) return null;
  async function reset() {
    const r = await run("r", () => api.post<{ adminEmail: string; emailSent: boolean }>(`/api/super-admin/hospitals/${hospital!.id}/reset-admin-password`));
    if (r) onDone(r.data.emailSent ? `A new temporary password was emailed to ${r.data.adminEmail}.` : `Password was reset but the email could not be sent. ${r.data.adminEmail} can use "Forgot password" to set a new one.`);
  }
  return (
    <Modal open title="Reset admin password?" onClose={onClose} footer={<Button variant="danger" icon="key" loading={busy === "r"} onClick={reset}>Reset and email password</Button>}>
      <Notice tone="warn">The current password of <b>{hospital.hospitalAdmin?.name}</b> ({hospital.hospitalAdmin?.email}) stops working immediately. A new temporary password is sent to that email address. This action is recorded in the audit log.</Notice>
      {error && <div className="mt-3"><ErrorBox message={error} /></div>}
    </Modal>
  );
}

export default function HospitalsPage() {
  return <Suspense><Hospitals /></Suspense>;
}
