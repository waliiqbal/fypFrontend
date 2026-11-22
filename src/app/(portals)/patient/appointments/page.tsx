"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Stars } from "@/shared/extras";
import { api } from "@/shared/api";
import { fmtDateTime, rs } from "@/shared/format";
import { Icon } from "@/shared/icons";
import type { Appointment } from "@/shared/types";
import { Avatar, Badge, Button, Card, EmptyState, ErrorBox, Field, LinkButton, Loading, Modal, Notice, PageHeader, Tabs, Textarea } from "@/shared/ui";
import { useAction, useApi, useNow } from "@/shared/use-api";

type Tab = "upcoming" | "pending" | "past" | "cancelled";

export default function PatientAppointments() {
  const { data, error, loading, reload } = useApi(() => api.get<Appointment[]>("/api/doctors/appointments/mine"));
  const [tab, setTab] = useState<Tab>("upcoming");
  const [cancelling, setCancelling] = useState<Appointment | null>(null);
  const [reviewing, setReviewing] = useState<Appointment | null>(null);
  const [details, setDetails] = useState<number | null>(null);

  const groups = useMemo(() => {
    const list = (data ?? []).filter((a) => a.paymentStatus !== "PENDING" || a.status !== "CANCELLED");
    return {
      upcoming: list.filter((a) => a.status === "CONFIRMED").sort((a, b) => +new Date(a.slot.startAt) - +new Date(b.slot.startAt)),
      pending: list.filter((a) => a.status === "PENDING"),
      past: list.filter((a) => a.status === "COMPLETED" || a.status === "NO_SHOW"),
      cancelled: list.filter((a) => a.status === "CANCELLED"),
    };
  }, [data]);

  return (
    <div>
      <PageHeader eyebrow="My care" title="Appointments" actions={<LinkButton href="/patient/doctors" icon="plus">Book new</LinkButton>} />
      <div className="mb-5"><Tabs value={tab} onChange={setTab} items={[
        { value: "upcoming", label: "Upcoming", count: groups.upcoming.length },
        { value: "pending", label: "Awaiting doctor", count: groups.pending.length },
        { value: "past", label: "Past", count: groups.past.length },
        { value: "cancelled", label: "Cancelled", count: groups.cancelled.length },
      ]} /></div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading ? <Loading /> : groups[tab].length === 0 ? (
        <Card><EmptyState icon="calendar" title="No appointments here" action={tab !== "cancelled" ? <LinkButton href="/patient/doctors">Find a doctor</LinkButton> : undefined} /></Card>
      ) : (
        <div className="flex flex-col gap-3">
          {groups[tab].map((a) => (
            <Card key={a.id} className="flex flex-wrap items-center gap-4 p-5 sm:p-5">
              <Avatar name={a.doctor?.name} src={a.doctor?.profileImage} size={52} />
              <div className="min-w-[180px] flex-1">
                <p className="font-bold">Dr. {a.doctor?.name}</p>
                <p className="text-[13px] text-copy-muted">{fmtDateTime(a.slot.startAt)} · {a.consultationType === "VIDEO" ? "Video" : "In-person"}</p>
                {a.status === "CANCELLED" && a.cancellationReason && <p className="mt-1 text-xs text-copy-muted">{a.cancellationReason}</p>}
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Badge value={a.status} />
                <span className="text-xs text-copy-muted">{rs(a.consultationFee)} · <Badge value={a.paymentStatus} className="ml-1" /></span>
              </div>
              <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
                {a.status === "CONFIRMED" && a.consultationType === "VIDEO" && <LinkButton href={`/patient/call/${a.id}`} icon="video">Join call</LinkButton>}
                {(a.status === "COMPLETED" || a.status === "CONFIRMED") && <Button variant="secondary" onClick={() => setDetails(a.id)}>Details</Button>}
                {a.status === "COMPLETED" && !a.review && <Button variant="soft" icon="star" onClick={() => setReviewing(a)}>Rate doctor</Button>}
                {(a.status === "PENDING" || a.status === "CONFIRMED") && <Button variant="danger" onClick={() => setCancelling(a)}>Cancel</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
      <CancelModal appointment={cancelling} onClose={() => setCancelling(null)} onDone={() => { setCancelling(null); void reload(); }} />
      <ReviewModal appointment={reviewing} onClose={() => setReviewing(null)} onDone={() => { setReviewing(null); void reload(); }} />
      <DetailsModal id={details} onClose={() => setDetails(null)} />
    </div>
  );
}

function CancelModal({ appointment, onClose, onDone }: { appointment: Appointment | null; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const { busy, error, run } = useAction();
  const now = useNow();
  if (!appointment) return null;
  const confirmed = appointment.status === "CONFIRMED";
  const within24h = new Date(appointment.slot.startAt).getTime() - now < 24 * 3600000;
  return (
    <Modal open title="Cancel appointment" onClose={onClose} footer={<>
      <Button variant="secondary" onClick={onClose}>Keep appointment</Button>
      <Button variant="danger" loading={busy === "c"} disabled={confirmed && within24h} onClick={async () => { const r = await run("c", () => api.patch(`/api/doctors/appointments/${appointment.id}/cancel`, { reason })); if (r) onDone(); }}>Cancel appointment</Button>
    </>}>
      <Notice tone={confirmed && within24h ? "warn" : "info"}>
        {appointment.status === "PENDING" ? "The payment hold will be released – you won't be charged." : within24h ? "Confirmed appointments can only be cancelled up to 24 hours before the start time." : `You will get a full refund of ${rs(appointment.consultationFee)}.`}
      </Notice>
      <Field label="Reason (optional)"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-20" /></Field>
      {error && <div className="mt-3"><ErrorBox message={error} /></div>}
    </Modal>
  );
}

function ReviewModal({ appointment, onClose, onDone }: { appointment: Appointment | null; onClose: () => void; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const { busy, error, run } = useAction();
  if (!appointment) return null;
  return (
    <Modal open title={`Rate Dr. ${appointment.doctor?.name}`} onClose={onClose} footer={<Button loading={busy === "r"} onClick={async () => { const r = await run("r", () => api.post(`/api/patients/me/appointments/${appointment.id}/review`, { rating, comment })); if (r) onDone(); }}>Submit review</Button>}>
      <div className="flex flex-col gap-4">
        <Stars value={rating} onChange={setRating} size={30} />
        <Field label="Your experience (optional)"><Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What went well? What could be better?" /></Field>
        {error && <ErrorBox message={error} />}
      </div>
    </Modal>
  );
}

function DetailsModal({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { data, loading } = useApi(() => (id ? api.get<Appointment>(`/api/patients/me/appointments/${id}`) : Promise.resolve({ success: true, message: "", data: null as unknown as Appointment })), [id]);
  if (!id) return null;
  return (
    <Modal open title="Consultation details" onClose={onClose}>
      {loading || !data ? <Loading /> : (
        <div className="flex flex-col gap-4 text-sm">
          <p className="text-copy-muted">Dr. {data.doctor?.name} · {fmtDateTime(data.slot.startAt)}</p>
          {data.consultation ? (
            <div className="rounded-2xl bg-[#f6faf9] p-4 leading-6">
              {data.consultation.diagnosis && <p><b>Diagnosis:</b> {data.consultation.diagnosis}</p>}
              {data.consultation.advice && <p className="mt-1"><b>Advice:</b> {data.consultation.advice}</p>}
              {data.consultation.followUpDate && <p className="mt-1"><b>Follow-up:</b> {fmtDateTime(data.consultation.followUpDate)}</p>}
            </div>
          ) : <p className="text-copy-muted">No consultation notes yet.</p>}
          {data.prescription ? (
            <div>
              <p className="mb-2 flex items-center gap-2 font-bold"><Icon name="pill" size={16} />Prescription</p>
              <ul className="flex flex-col gap-2">{data.prescription.items.map((i, k) => <li key={k} className="rounded-xl border border-[#e3eeec] px-3 py-2"><b>{i.medicine}</b> {i.dosage} – {i.frequency}{i.durationDays ? `, ${i.durationDays} days` : ""}{i.instructions ? <span className="block text-xs text-copy-muted">{i.instructions}</span> : null}</li>)}</ul>
              {data.prescription.labTests.length > 0 && <p className="mt-2"><b>Lab tests:</b> {data.prescription.labTests.join(", ")}</p>}
            </div>
          ) : null}
          <Link href="/patient/medical-records" className="font-semibold text-brand">Open medical records →</Link>
        </div>
      )}
    </Modal>
  );
}
