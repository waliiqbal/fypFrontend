"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { fmtDateTime, rs } from "./format";
import type { Appointment } from "./types";
import { Badge, Button, Card, DataTable, EmptyState, ErrorBox, Field, Loading, Modal, Notice, Pager, SearchBox, Select, StatCard, Textarea } from "./ui";
import { useAction, useApi } from "./use-api";

type Totals = { collected: number; commission: number; doctorEarnings: number };

/** Appointment & payment list used by both the Hospital and Super Admin portals. */
export function AdminAppointments({ endpoint, mode }: { endpoint: string; mode: "hospital" | "admin" }) {
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<Appointment | null>(null);
  const [reassigning, setReassigning] = useState<Appointment | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => { const t = setTimeout(() => { setDebounced(q); setPage(1); }, 350); return () => clearTimeout(t); }, [q]);
  const { data, meta, error, loading, reload } = useApi(() => api.get<Appointment[]>(endpoint, { status, paymentStatus, search: debounced, page, limit: 20 }), [status, paymentStatus, debounced, page]);
  const totals = meta?.totals as Totals | undefined;

  return (
    <div>
      {totals && (
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <StatCard label="Collected (filtered)" value={rs(totals.collected)} icon="money" />
          <StatCard label="Platform commission" value={rs(totals.commission)} tone="warm" />
          <StatCard label="Doctor earnings" value={rs(totals.doctorEarnings)} tone="mint" />
        </div>
      )}
      <Card className="mb-4 flex flex-wrap items-center gap-3 p-4 sm:p-4">
        <SearchBox value={q} onChange={setQ} placeholder="Search patient or doctor" />
        <Select aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="mt-0 w-auto">
          <option value="">All statuses</option>{["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"].map((s) => <option key={s} value={s}>{s.replace("_", " ").toLowerCase()}</option>)}
        </Select>
        <Select aria-label="Payment" value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} className="mt-0 w-auto">
          <option value="">All payments</option>{["AUTHORIZED", "PAID", "CANCELLED", "REFUNDED", "FAILED"].map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}
        </Select>
      </Card>
      {flash && <div className="mb-4"><Notice tone="success">{flash}</Notice></div>}
      {error && <ErrorBox message={error} onRetry={reload} />}
      <Card className="p-0 sm:p-0">
        {loading ? <Loading /> : (
          <DataTable rows={data ?? []} rowKey={(a) => a.id} empty={<EmptyState icon="calendar" title="No appointments found" />} columns={[
            { header: "#", cell: (a) => <span className="text-copy-muted">{a.id}</span> },
            { header: "Patient", cell: (a) => <span className="font-semibold">{a.patient?.name}</span> },
            { header: "Doctor", cell: (a) => `Dr. ${a.doctor?.name}` },
            ...(mode === "admin" ? [{ header: "Hospital", cell: (a: Appointment) => a.hospital?.name ?? <span className="text-copy-muted">Private</span> }] : []),
            { header: "When", cell: (a) => fmtDateTime(a.slot.startAt) },
            { header: "Status", cell: (a) => <Badge value={a.status} /> },
            { header: "Payment", cell: (a) => <div className="flex flex-col gap-1"><span>{rs(a.consultationFee)}</span><Badge value={a.paymentStatus} className="w-fit" /></div> },
            { header: "", className: "text-right", cell: (a) => {
              if (mode === "hospital" && (a.status === "PENDING" || a.status === "CONFIRMED")) {
                const upcoming = new Date(a.slot.startAt).getTime() > Date.now();
                return (
                  <div className="flex justify-end gap-1.5">
                    {upcoming && <Button variant="secondary" className="h-9" onClick={() => setReassigning(a)}>Reassign</Button>}
                    <Button variant="danger" className="h-9" onClick={() => setTarget(a)}>Cancel</Button>
                  </div>
                );
              }
              if (mode === "admin" && a.paymentStatus === "PAID") return <Button variant="secondary" className="h-9" onClick={() => setTarget(a)}>Refund</Button>;
              return null;
            } },
          ]} />
        )}
      </Card>
      {meta && <Pager page={page} totalPages={meta.totalPages} onPage={setPage} />}
      <ReassignModal appointment={reassigning} onClose={() => setReassigning(null)} onDone={(m) => { setReassigning(null); setFlash(m); void reload(); }} />
      <ActionModal appointment={target} mode={mode} onClose={() => setTarget(null)} onDone={(m) => { setTarget(null); setFlash(m); void reload(); }} />
    </div>
  );
}

function ActionModal({ appointment, mode, onClose, onDone }: { appointment: Appointment | null; mode: "hospital" | "admin"; onClose: () => void; onDone: (msg: string) => void }) {
  const [reason, setReason] = useState("");
  const { busy, error, run } = useAction();
  if (!appointment) return null;
  const isRefund = mode === "admin";
  return (
    <Modal open title={isRefund ? "Issue full refund" : "Cancel appointment"} onClose={onClose} footer={
      <Button variant="danger" loading={busy === "x"} onClick={async () => {
        const r = await run("x", () => (isRefund ? api.post(`/api/super-admin/appointments/${appointment.id}/refund`, { reason: reason || undefined }) : api.patch(`/api/hospital/appointments/${appointment.id}/cancel`, { reason: reason || undefined })));
        if (r) onDone(isRefund ? "Refund issued." : "Appointment cancelled – the patient was released or refunded.");
      }}>{isRefund ? `Refund ${rs(appointment.consultationFee)}` : "Cancel appointment"}</Button>
    }>
      <Notice tone="warn">{isRefund ? `${appointment.patient?.name} gets ${rs(appointment.consultationFee)} back. The doctor's earning for this visit becomes zero.` : `${appointment.patient?.name} will be notified. A pending request is released; a confirmed one is fully refunded.`}</Notice>
      <div className="mt-4"><Field label="Reason"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></Field></div>
      {error && <div className="mt-3"><ErrorBox message={error} /></div>}
    </Modal>
  );
}

type DoctorOption = { id: number; name: string; consultationFee?: number | null };
type FreeSlot = { id: number; startAt: string; endAt: string };

/** Hospital admin moves a pending / confirmed appointment to another doctor of the same hospital. The patient's payment stays as it is. */
function ReassignModal({ appointment, onClose, onDone }: { appointment: Appointment | null; onClose: () => void; onDone: (msg: string) => void }) {
  const [doctorId, setDoctorId] = useState("");
  const [slotId, setSlotId] = useState("");
  const doctors = useApi(() => api.get<DoctorOption[]>("/api/hospital/doctors", { status: "ACTIVE" }), [appointment?.id]);
  const slots = useApi(
    () => (doctorId ? api.get<FreeSlot[]>(`/api/hospital/doctors/${doctorId}/free-slots`) : Promise.resolve({ success: true, message: "", data: [] as FreeSlot[] })),
    [doctorId],
  );
  const { busy, error, run } = useAction();
  if (!appointment) return null;
  const options = (doctors.data ?? []).filter((d) => d.id !== appointment.doctorId);

  async function save() {
    const r = await run("re", () => api.post(`/api/hospital/appointments/${appointment!.id}/reassign`, { doctorId: Number(doctorId), slotId: Number(slotId) }));
    if (r) onDone(`Appointment moved. ${appointment!.patient?.name} and both doctors were notified.`);
  }

  return (
    <Modal key={appointment.id} open title="Reassign to another doctor" onClose={onClose} footer={<Button loading={busy === "re"} disabled={!doctorId || !slotId} onClick={save}>Reassign appointment</Button>}>
      <Notice tone="info">{appointment.patient?.name} is booked with Dr. {appointment.doctor?.name} on {fmtDateTime(appointment.slot.startAt)}. Pick another doctor and one of their free slots. The patient keeps the same payment and is notified.</Notice>
      <div className="mt-4 flex flex-col gap-4">
        <Field label="New doctor">
          <Select value={doctorId} onChange={(e) => { setDoctorId(e.target.value); setSlotId(""); }}>
            <option value="">{doctors.loading ? "Loading doctors…" : "Select a doctor"}</option>
            {options.map((d) => <option key={d.id} value={d.id}>Dr. {d.name}{d.consultationFee ? ` · ${rs(d.consultationFee)}` : ""}</option>)}
          </Select>
        </Field>
        <Field label="Free slot" hint={doctorId && !slots.loading && !(slots.data ?? []).length ? "This doctor has no free upcoming slots." : undefined}>
          <Select value={slotId} disabled={!doctorId || slots.loading} onChange={(e) => setSlotId(e.target.value)}>
            <option value="">{slots.loading ? "Loading slots…" : "Select a slot"}</option>
            {(slots.data ?? []).map((s) => <option key={s.id} value={s.id}>{fmtDateTime(s.startAt)}</option>)}
          </Select>
        </Field>
        {error && <ErrorBox message={error} />}
      </div>
    </Modal>
  );
}
