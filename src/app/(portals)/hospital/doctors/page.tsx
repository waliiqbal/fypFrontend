"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/shared/api";
import { rs } from "@/shared/format";
import type { Specialization } from "@/shared/types";
import { Avatar, Badge, Button, Card, cx, DataTable, EmptyState, ErrorBox, Field, Input, Loading, Modal, Notice, PageHeader, SearchBox, Tabs, Textarea } from "@/shared/ui";
import { useAction, useApi } from "@/shared/use-api";

type Doctor = { id: number; name: string; email: string; phone?: string | null; status: string; isVerified: boolean; consultationFee?: number | null; experience?: number | null; licenseNumber?: string | null; profileImage?: string | null; rejectionReason?: string | null; specializations: Specialization[]; _count: { appointments: number } };
type Status = "" | "PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED";

function HospitalDoctors() {
  const params = useSearchParams();
  const [status, setStatus] = useState<Status>((params.get("status") as Status) ?? "");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(params.get("add") === "1");
  const [rejecting, setRejecting] = useState<Doctor | null>(null);
  const [feeFor, setFeeFor] = useState<Doctor | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const { data, error, loading, reload } = useApi(() => api.get<Doctor[]>("/api/hospital/doctors", { status, search: q }), [status, q]);
  const action = useAction();

  async function act(d: Doctor, path: string, body?: object, msg?: string) {
    const r = await action.run(`${path}${d.id}`, () => api.patch(`/api/hospital/doctors/${d.id}/${path}`, body));
    if (r) { setFlash(msg ?? "Updated."); void reload(); }
  }

  return (
    <div>
      <PageHeader eyebrow="Team" title="Doctors" description="Approve doctors who registered under your hospital, add new doctor accounts, and manage fees and status." actions={<Button icon="plus" onClick={() => setAdding(true)}>Add doctor</Button>} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={status} onChange={setStatus} items={[{ value: "", label: "All" }, { value: "PENDING", label: "Pending approval" }, { value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }, { value: "SUSPENDED", label: "Suspended" }]} />
        <SearchBox value={q} onChange={setQ} placeholder="Search doctor" />
      </div>
      {flash && <div className="mb-4"><Notice tone="success">{flash}</Notice></div>}
      {(error || action.error) && <div className="mb-4"><ErrorBox message={(error || action.error)!} /></div>}
      <Card className="p-0 sm:p-0">
        {loading ? <Loading /> : (
          <DataTable rows={data ?? []} rowKey={(d) => d.id} empty={<EmptyState icon="stethoscope" title="No doctors here" />} columns={[
            { header: "Doctor", cell: (d) => <div className="flex items-center gap-3"><Avatar name={d.name} src={d.profileImage} size={40} /><div><p className="font-semibold">Dr. {d.name}</p><p className="text-xs text-copy-muted">{d.email}</p></div></div> },
            { header: "Speciality", cell: (d) => d.specializations.map((s) => s.name).join(", ") || "—" },
            { header: "Fee", cell: (d) => (d.consultationFee ? rs(d.consultationFee) : "—") },
            { header: "Visits", cell: (d) => d._count.appointments },
            { header: "Status", cell: (d) => <Badge value={d.status === "INACTIVE" && d.isVerified && !d.rejectionReason ? "PENDING" : d.status} label={d.status === "INACTIVE" && d.isVerified && !d.rejectionReason ? "Pending approval" : d.rejectionReason ? "Rejected" : undefined} /> },
            { header: "", className: "text-right", cell: (d) => (
              <div className="flex justify-end gap-1.5">
                {d.status === "INACTIVE" && d.isVerified ? (
                  <>
                    <Button className="h-9" icon="check" loading={action.busy === `approve${d.id}`} onClick={() => act(d, "approve", undefined, `Dr. ${d.name} approved – now bookable.`)}>Approve</Button>
                    {!d.rejectionReason && <Button className="h-9" variant="danger" onClick={() => setRejecting(d)}>Reject</Button>}
                  </>
                ) : d.status === "ACTIVE" ? (
                  <>
                    <Button className="h-9" variant="secondary" onClick={() => setFeeFor(d)}>Fee</Button>
                    <Button className="h-9" variant="ghost" loading={action.busy === `status${d.id}`} onClick={() => act(d, "status", { status: "INACTIVE" }, `Dr. ${d.name} deactivated.`)}>Deactivate</Button>
                  </>
                ) : (
                  <Button className="h-9" variant="soft" loading={action.busy === `status${d.id}`} onClick={() => act(d, "status", { status: "ACTIVE" }, `Dr. ${d.name} activated.`)}>Activate</Button>
                )}
              </div>
            ) },
          ]} />
        )}
      </Card>
      <AddDoctorModal open={adding} onClose={() => setAdding(false)} onDone={(msg) => { setAdding(false); setFlash(msg); void reload(); }} />
      <RejectModal doctor={rejecting} onClose={() => setRejecting(null)} onDone={() => { setRejecting(null); setFlash("Doctor rejected."); void reload(); }} />
      <FeeModal doctor={feeFor} onClose={() => setFeeFor(null)} onDone={() => { setFeeFor(null); setFlash("Fee updated."); void reload(); }} />
    </div>
  );
}

function AddDoctorModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (msg: string) => void }) {
  const specs = useApi(() => api.public<Specialization[]>("/api/public/specializations"));
  const [form, setForm] = useState({ name: "", email: "", phone: "", licenseNumber: "", experience: "", consultationFee: "", qualification: "" });
  const [specIds, setSpecIds] = useState<number[]>([]);
  const { busy, error, run } = useAction();
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  async function save() {
    const r = await run("add", () => api.post<{ emailSent: boolean }>("/api/hospital/doctors", {
      name: form.name, email: form.email, phone: form.phone || undefined, licenseNumber: form.licenseNumber || undefined, qualification: form.qualification || undefined,
      experience: form.experience ? Number(form.experience) : undefined, consultationFee: form.consultationFee ? Number(form.consultationFee) : undefined, specializationIds: specIds,
    }));
    if (r) onDone(r.data.emailSent ? `Account created. Login details were emailed to ${form.email}.` : `Account created, but the email failed. Ask the doctor to use "Forgot password".`);
  }
  return (
    <Modal open={open} title="Add a doctor" onClose={onClose} footer={<Button loading={busy === "add"} disabled={!form.name || !form.email} onClick={save}>Create account</Button>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Email"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="License number"><Input value={form.licenseNumber} onChange={(e) => set("licenseNumber", e.target.value)} /></Field>
        <Field label="Experience (years)"><Input type="number" value={form.experience} onChange={(e) => set("experience", e.target.value)} /></Field>
        <Field label="Fee (Rs)"><Input type="number" value={form.consultationFee} onChange={(e) => set("consultationFee", e.target.value)} /></Field>
        <div className="sm:col-span-2"><Field label="Qualification"><Input value={form.qualification} onChange={(e) => set("qualification", e.target.value)} /></Field></div>
      </div>
      <p className="mb-2 mt-4 text-[13px] font-semibold">Specializations</p>
      <div className="flex flex-wrap gap-1.5">{specs.data?.map((s) => { const on = specIds.includes(s.id); return <button key={s.id} onClick={() => setSpecIds(on ? specIds.filter((x) => x !== s.id) : [...specIds, s.id])} className={cx("rounded-full border px-3 py-1 text-xs font-semibold", on ? "border-brand bg-[#e3f4f2] text-[#00545a]" : "border-[#dcebe8]")}>{s.name}</button>; })}</div>
      <p className="mt-4 text-xs text-copy-muted">The account is active immediately and a temporary password is emailed to the doctor.</p>
      {error && <div className="mt-3"><ErrorBox message={error} /></div>}
    </Modal>
  );
}

function RejectModal({ doctor, onClose, onDone }: { doctor: Doctor | null; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const { busy, error, run } = useAction();
  if (!doctor) return null;
  return (
    <Modal open title={`Reject Dr. ${doctor.name}?`} onClose={onClose} footer={<Button variant="danger" loading={busy === "r"} onClick={async () => { if (await run("r", () => api.patch(`/api/hospital/doctors/${doctor.id}/reject`, { reason: reason || undefined }))) onDone(); }}>Reject</Button>}>
      <Field label="Reason (sent to the doctor)"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. License could not be verified" /></Field>
      {error && <div className="mt-3"><ErrorBox message={error} /></div>}
    </Modal>
  );
}

function FeeModal({ doctor, onClose, onDone }: { doctor: Doctor | null; onClose: () => void; onDone: () => void }) {
  const [fee, setFee] = useState("");
  const { busy, error, run } = useAction();
  if (!doctor) return null;
  return (
    <Modal open title={`Consultation fee – Dr. ${doctor.name}`} onClose={onClose} footer={<Button loading={busy === "f"} disabled={!Number(fee)} onClick={async () => { if (await run("f", () => api.patch(`/api/hospital/doctors/${doctor.id}/fee`, { consultationFee: Number(fee) }))) onDone(); }}>Save fee</Button>}>
      <Field label="Fee (Rs)" hint={`Current: ${doctor.consultationFee ? rs(doctor.consultationFee) : "not set"}. Applies to new bookings.`}><Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} /></Field>
      {error && <div className="mt-3"><ErrorBox message={error} /></div>}
    </Modal>
  );
}

export default function HospitalDoctorsPage() {
  return <Suspense><HospitalDoctors /></Suspense>;
}
