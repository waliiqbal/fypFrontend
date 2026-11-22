"use client";

import { useEffect, useState } from "react";
import { api } from "@/shared/api";
import { ageFrom, fmtDateTime, rs } from "@/shared/format";
import { Icon } from "@/shared/icons";
import type { Appointment } from "@/shared/types";
import { Avatar, Button, Card, EmptyState, ErrorBox, Field, Loading, Modal, Notice, PageHeader, Textarea } from "@/shared/ui";
import { useAction, useApi } from "@/shared/use-api";

type Brief = { summary: string; keyPoints: string[]; redFlags: string[]; aiGenerated: boolean };

export default function DoctorRequests() {
  const { data, error, loading, reload } = useApi(() => api.get<Appointment[]>("/api/doctors/me/requests"));
  const [rejecting, setRejecting] = useState<Appointment | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const action = useAction();
  const total = (data ?? []).reduce((s, a) => s + Number(a.consultationFee), 0);

  async function accept(a: Appointment) {
    const res = await action.run(`a${a.id}`, () => api.patch(`/api/doctors/me/appointments/${a.id}/accept`));
    if (res) { setFlash(`Accepted ${a.patient?.name}'s appointment. ${rs(a.consultationFee)} collected.`); void reload(); }
  }

  return (
    <div>
      <PageHeader eyebrow="Appointment requests" title={data?.length ? `${data.length} patient${data.length > 1 ? "s are" : " is"} waiting for you` : "Appointment requests"} description="Payment is already on hold. Accept to confirm and collect the fee – reject to release it back to the patient." />
      {data && data.length > 0 && <p className="-mt-3 mb-5 text-sm text-copy-muted">Fees on hold: <b className="text-ink">{rs(total)}</b></p>}
      {flash && <div className="mb-4"><Notice tone="success">{flash}</Notice></div>}
      {(error || action.error) && <div className="mb-4"><ErrorBox message={(error || action.error)!} /></div>}
      {loading ? <Loading /> : !data?.length ? (
        <Card><EmptyState icon="inbox" title="No pending requests" text="New bookings appear here after the patient authorises payment." /></Card>
      ) : (
        <div className="flex flex-col gap-4">
          {data.map((a) => (
            <article key={a.id} className="flex flex-wrap items-center gap-5 rounded-[24px] border border-[#e3eeec] bg-white p-5">
              <div className="flex min-w-[240px] flex-1 items-center gap-3.5">
                <Avatar name={a.patient?.name} size={54} />
                <div>
                  <p className="text-base font-bold">{a.patient?.name}</p>
                  <p className="mt-0.5 text-[13px] text-copy-muted">{[ageFrom(a.patient?.dateOfBirth) != null ? `${ageFrom(a.patient?.dateOfBirth)} yrs` : null, a.patient?.gender].filter(Boolean).join(" · ") || "Patient"}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-[9px] bg-[#f0f7f6] px-2.5 py-1 text-xs font-semibold text-[#00545a]">{fmtDateTime(a.slot.startAt)}</span>
                    <span className="rounded-[9px] bg-[#f0f7f6] px-2.5 py-1 text-xs font-semibold text-[#00545a]">{a.consultationType === "VIDEO" ? "Video" : "In-person"}</span>
                  </div>
                </div>
              </div>
              <AiBrief appointment={a} />
              <div className="flex min-w-[200px] flex-col gap-2">
                <p className="text-right text-[13px] text-copy-muted">Fee on hold <b className="text-ink">{rs(a.consultationFee)}</b></p>
                <div className="flex gap-2">
                  <Button variant="danger" icon="x" className="flex-1" onClick={() => setRejecting(a)}>Reject</Button>
                  <Button icon="check" className="flex-[1.3]" loading={action.busy === `a${a.id}`} onClick={() => accept(a)}>Accept</Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      <RejectModal appointment={rejecting} onClose={() => setRejecting(null)} onDone={(name) => { setRejecting(null); setFlash(`Rejected ${name}'s request. The payment hold was released.`); void reload(); }} />
    </div>
  );
}

function AiBrief({ appointment }: { appointment: Appointment }) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    api.get<Brief>(`/api/ai/doctor/appointments/${appointment.id}/summary`).then((r) => setBrief(r.data)).catch(() => setFailed(true));
  }, [appointment.id]);
  return (
    <div className="min-w-[260px] flex-[2] rounded-[16px] border border-dashed border-[#bfe0dc] bg-[#f6faf9] px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs font-bold text-brand"><Icon name="spark" size={14} />AI summary</p>
      {appointment.reason && <p className="mt-1.5 text-[13px]"><b>Reason:</b> {appointment.reason}</p>}
      <p className="mt-1.5 text-[13px] leading-5 text-[#3d4f52]">{brief ? brief.summary || "No history recorded yet." : failed ? "Summary unavailable right now." : "Reading patient history…"}</p>
      {brief?.redFlags?.length ? <p className="mt-1.5 text-xs font-semibold text-[#9b2c1a]">⚠ {brief.redFlags.join(" · ")}</p> : null}
    </div>
  );
}

function RejectModal({ appointment, onClose, onDone }: { appointment: Appointment | null; onClose: () => void; onDone: (name: string) => void }) {
  const [reason, setReason] = useState("");
  const { busy, error, run } = useAction();
  if (!appointment) return null;
  return (
    <Modal open title={`Reject ${appointment.patient?.name}'s request?`} onClose={onClose} footer={<>
      <Button variant="secondary" onClick={onClose}>Back</Button>
      <Button variant="danger" loading={busy === "r"} onClick={async () => { const r = await run("r", () => api.patch(`/api/doctors/me/appointments/${appointment.id}/reject`, { reason: reason || undefined })); if (r) onDone(appointment.patient?.name ?? "the patient"); }}>Reject request</Button>
    </>}>
      <Notice>The {rs(appointment.consultationFee)} hold is released – the patient is <b>not charged</b> and gets a notification.</Notice>
      <div className="mt-4"><Field label="Reason (shared with the patient, optional)"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. I am on leave that day" /></Field></div>
      {error && <div className="mt-3"><ErrorBox message={error} /></div>}
    </Modal>
  );
}
