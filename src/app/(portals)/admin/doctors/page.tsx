"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/shared/api";
import { fmtDate, rs } from "@/shared/format";
import type { Specialization } from "@/shared/types";
import { Avatar, Badge, Button, Card, DataTable, EmptyState, ErrorBox, Field, Loading, Modal, Notice, PageHeader, Pager, SearchBox, Select, Tabs, Textarea } from "@/shared/ui";
import { useAction, useApi } from "@/shared/use-api";

type Doctor = { id: number; name: string; email: string; phone?: string | null; status: string; isVerified: boolean; licenseNumber?: string | null; experience?: number | null; consultationFee?: number | null; createdAt: string; rejectionReason?: string | null; hospital?: { id: number; name: string } | null; specializations: Specialization[]; _count: { appointments: number } };
type Status = "" | "PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED";

function Doctors() {
  const params = useSearchParams();
  const [status, setStatus] = useState<Status>((params.get("status") as Status) ?? "");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [rejecting, setRejecting] = useState<Doctor | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const { data, meta, error, loading, reload } = useApi(() => api.get<Doctor[]>("/api/super-admin/doctors", { status, type, search: q, page }), [status, type, q, page]);
  const action = useAction();
  const act = async (d: Doctor, path: string, body?: object, msg?: string) => {
    const r = await action.run(`${path}${d.id}`, () => api.patch(`/api/super-admin/doctors/${d.id}/${path}`, body));
    if (r) { setFlash(msg ?? "Updated."); void reload(); }
  };

  return (
    <div>
      <PageHeader eyebrow="Verification" title="Doctors" description="Approve private doctors after checking their license. Hospital doctors are normally approved by their hospital admin, but you can act on any doctor." />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Tabs value={status} onChange={(v) => { setStatus(v); setPage(1); }} items={[{ value: "", label: "All" }, { value: "PENDING", label: "Pending" }, { value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }, { value: "SUSPENDED", label: "Suspended" }]} />
        <Select aria-label="Type" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="mt-0 w-auto"><option value="">Private & hospital</option><option value="private">Private</option><option value="hospital">Hospital</option></Select>
        <div className="ml-auto"><SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Name or email" /></div>
      </div>
      {flash && <div className="mb-4"><Notice tone="success">{flash}</Notice></div>}
      {(error || action.error) && <div className="mb-4"><ErrorBox message={(error || action.error)!} /></div>}
      <Card className="p-0 sm:p-0">
        {loading ? <Loading /> : (
          <DataTable rows={data ?? []} rowKey={(d) => d.id} empty={<EmptyState icon="stethoscope" title="No doctors found" />} columns={[
            { header: "Doctor", cell: (d) => <div className="flex items-center gap-3"><Avatar name={d.name} size={38} /><div><p className="font-semibold">Dr. {d.name}</p><p className="text-xs text-copy-muted">{d.email}</p></div></div> },
            { header: "License", cell: (d) => <div><p className="text-sm">{d.licenseNumber ?? "—"}</p><p className="text-xs text-copy-muted">{d.experience ?? 0} yrs · joined {fmtDate(d.createdAt)}</p></div> },
            { header: "Practice", cell: (d) => d.hospital?.name ?? "Private" },
            { header: "Speciality", cell: (d) => d.specializations.map((s) => s.name).join(", ") || "—" },
            { header: "Fee", cell: (d) => (d.consultationFee ? rs(d.consultationFee) : "—") },
            { header: "Status", cell: (d) => <Badge value={d.status === "INACTIVE" && d.isVerified && !d.rejectionReason ? "PENDING" : d.status} label={d.status === "INACTIVE" && !d.isVerified ? "Email not verified" : d.status === "INACTIVE" && !d.rejectionReason ? "Pending" : d.rejectionReason ? "Rejected" : undefined} /> },
            { header: "", className: "text-right", cell: (d) => (
              <div className="flex justify-end gap-1.5">
                {d.status !== "ACTIVE" && d.isVerified && <Button className="h-9" icon="check" loading={action.busy === `approve${d.id}`} onClick={() => act(d, "approve", undefined, `Dr. ${d.name} approved.`)}>Approve</Button>}
                {d.status === "INACTIVE" && d.isVerified && !d.rejectionReason && <Button className="h-9" variant="danger" onClick={() => setRejecting(d)}>Reject</Button>}
                {d.status === "ACTIVE" && <Button className="h-9" variant="danger" loading={action.busy === `status${d.id}`} onClick={() => act(d, "status", { status: "SUSPENDED" }, `Dr. ${d.name} suspended.`)}>Suspend</Button>}
              </div>
            ) },
          ]} />
        )}
      </Card>
      {meta && <Pager page={page} totalPages={meta.totalPages} onPage={setPage} />}
      <RejectModal doctor={rejecting} onClose={() => setRejecting(null)} onDone={() => { setRejecting(null); setFlash("Doctor rejected and notified."); void reload(); }} />
    </div>
  );
}

function RejectModal({ doctor, onClose, onDone }: { doctor: Doctor | null; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const { busy, error, run } = useAction();
  if (!doctor) return null;
  return (
    <Modal open title={`Reject Dr. ${doctor.name}?`} onClose={onClose} footer={<Button variant="danger" loading={busy === "r"} onClick={async () => { if (await run("r", () => api.patch(`/api/super-admin/doctors/${doctor.id}/reject`, { reason: reason || undefined }))) onDone(); }}>Reject</Button>}>
      <Field label="Reason (sent to the doctor)"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. License number could not be verified with PMDC" /></Field>
      {error && <div className="mt-3"><ErrorBox message={error} /></div>}
    </Modal>
  );
}

export default function AdminDoctorsPage() {
  return <Suspense><Doctors /></Suspense>;
}
