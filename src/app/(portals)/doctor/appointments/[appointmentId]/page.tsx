"use client";

import Link from "next/link";
import { use, useState } from "react";
import { api } from "@/shared/api";
import { ageFrom, fmtDateTime, rs } from "@/shared/format";
import { Icon } from "@/shared/icons";
import type { Appointment, PrescriptionItem } from "@/shared/types";
import { Avatar, Badge, Button, Card, CardHeader, ErrorBox, Field, Input, LinkButton, Loading, Notice, Textarea } from "@/shared/ui";
import { useAction, useApi, useFormFrom, useNow } from "@/shared/use-api";

type Check = { allergyWarnings: { medicine: string; allergy: string; message: string }[]; aiWarnings: { medicine: string; severity: string; message: string }[]; aiAvailable: boolean; safe: boolean };
const blankItem: PrescriptionItem = { medicine: "", dosage: "", frequency: "", durationDays: null, instructions: "" };

export default function DoctorAppointmentDetail({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = use(params);
  const id = Number(appointmentId);
  const { data: a, error, loading, reload } = useApi(() => api.get<Appointment>(`/api/doctors/me/appointments/${id}`), [id]);
  const action = useAction();
  const [notes, setNotes] = useFormFrom(a, (x) => ({ symptoms: x.consultation?.symptoms ?? x.reason ?? "", diagnosis: x.consultation?.diagnosis ?? "", notes: x.consultation?.notes ?? "", advice: x.consultation?.advice ?? "", followUpDate: x.consultation?.followUpDate?.slice(0, 10) ?? "" }), { symptoms: "", diagnosis: "", notes: "", advice: "", followUpDate: "" });
  const [items, setItems] = useFormFrom<Appointment, PrescriptionItem[]>(a, (x) => (x.prescription ? x.prescription.items.map((i) => ({ ...i })) : [{ ...blankItem }]), [{ ...blankItem }]);
  const [labTests, setLabTests] = useFormFrom(a, (x) => x.prescription?.labTests.join(", ") ?? "", "");
  const [rxNotes, setRxNotes] = useFormFrom(a, (x) => x.prescription?.notes ?? "", "");
  const [check, setCheck] = useState<Check | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const now = useNow();

  if (loading && !a) return <Loading />;
  if (error || !a) return <ErrorBox message={error ?? "Not found"} />;
  const editable = a.status === "CONFIRMED" || a.status === "COMPLETED";
  const validItems = items.filter((i) => i.medicine.trim() && i.dosage.trim() && i.frequency.trim());

  async function saveNotes() {
    const r = await action.run("notes", () => api.put(`/api/doctors/me/appointments/${id}/consultation`, { ...notes, followUpDate: notes.followUpDate || undefined }));
    if (r) setFlash("Consultation notes saved.");
  }
  async function runCheck() {
    const r = await action.run("check", () => api.post<Check>("/api/ai/doctor/prescription-check", { appointmentId: id, items: validItems.map((i) => ({ medicine: i.medicine, dosage: i.dosage, frequency: i.frequency })) }));
    if (r) setCheck(r.data);
  }
  async function savePrescription() {
    const r = await action.run("rx", () => api.put(`/api/doctors/me/appointments/${id}/prescription`, {
      items: validItems.map((i) => ({ medicine: i.medicine.trim(), dosage: i.dosage.trim(), frequency: i.frequency.trim(), durationDays: i.durationDays ? Number(i.durationDays) : undefined, instructions: i.instructions?.trim() || undefined })),
      notes: rxNotes || undefined,
      labTests: labTests.split(",").map((t) => t.trim()).filter(Boolean),
    }));
    if (r) { setFlash("Prescription saved and shared with the patient."); void reload(); }
  }
  async function complete() {
    const r = await action.run("done", () => api.patch(`/api/doctors/me/appointments/${id}/complete`));
    if (r) { setFlash("Consultation marked as completed."); void reload(); }
  }
  async function noShow() {
    const r = await action.run("ns", () => api.patch(`/api/doctors/me/appointments/${id}/no-show`));
    if (r) void reload();
  }

  return (
    <div className="flex flex-col gap-5">
      <Link href="/doctor/appointments" className="flex w-fit items-center gap-1 text-sm font-semibold text-brand"><Icon name="back" size={16} />Appointments</Link>
      <Card className="flex flex-wrap items-center gap-4">
        <Avatar name={a.patient?.name} size={64} />
        <div className="min-w-[200px] flex-1">
          <h1 className="font-display text-2xl font-extrabold">{a.patient?.name}</h1>
          <p className="text-sm text-copy-muted">{[ageFrom(a.patient?.dateOfBirth) != null && `${ageFrom(a.patient?.dateOfBirth)} yrs`, a.patient?.gender, a.patient?.bloodGroup && `Blood ${a.patient.bloodGroup}`].filter(Boolean).join(" · ")}</p>
          <p className="mt-1 text-sm">{fmtDateTime(a.slot.startAt)} · {a.consultationType === "VIDEO" ? "Video" : "In-person"} · {rs(a.consultationFee)}</p>
        </div>
        <Badge value={a.status} />
        <div className="flex flex-wrap gap-2">
          {a.status === "CONFIRMED" && a.consultationType === "VIDEO" && <LinkButton href={`/doctor/call/${a.id}`} icon="video">Start call</LinkButton>}
          <LinkButton href={`/doctor/patients/${a.patientId}`} variant="secondary" icon="file">Full history</LinkButton>
          {a.status === "CONFIRMED" && <Button variant="soft" icon="check" loading={action.busy === "done"} onClick={complete}>Mark completed</Button>}
          {a.status === "CONFIRMED" && new Date(a.slot.startAt).getTime() < now && <Button variant="ghost" loading={action.busy === "ns"} onClick={noShow}>No-show</Button>}
        </div>
      </Card>
      {flash && <Notice tone="success">{flash}</Notice>}
      {action.error && <ErrorBox message={action.error} />}
      {!editable && <Notice>Notes and prescriptions can be added once the appointment is confirmed.</Notice>}

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Consultation notes" subtitle="Visible to the patient in Medical Records" />
          <div className="grid gap-4">
            <Field label="Symptoms / complaint"><Textarea disabled={!editable} value={notes.symptoms} onChange={(e) => setNotes({ ...notes, symptoms: e.target.value })} /></Field>
            <Field label="Diagnosis"><Input disabled={!editable} value={notes.diagnosis} onChange={(e) => setNotes({ ...notes, diagnosis: e.target.value })} /></Field>
            <Field label="Clinical notes"><Textarea disabled={!editable} value={notes.notes} onChange={(e) => setNotes({ ...notes, notes: e.target.value })} /></Field>
            <Field label="Advice for the patient"><Textarea disabled={!editable} value={notes.advice} onChange={(e) => setNotes({ ...notes, advice: e.target.value })} /></Field>
            <Field label="Follow-up date"><Input disabled={!editable} type="date" value={notes.followUpDate} onChange={(e) => setNotes({ ...notes, followUpDate: e.target.value })} /></Field>
            <div><Button disabled={!editable} loading={action.busy === "notes"} onClick={saveNotes}>Save notes</Button></div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Prescription" subtitle="Run the safety check before saving" />
          <div className="flex flex-col gap-3">
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 rounded-[16px] border border-[#eef4f3] p-3 sm:grid-cols-[1.4fr_1fr_1fr_.7fr_auto]">
                <Input aria-label="Medicine" disabled={!editable} placeholder="Medicine" value={it.medicine} onChange={(e) => setItems(items.map((x, k) => (k === i ? { ...x, medicine: e.target.value } : x)))} className="mt-0" />
                <Input aria-label="Dosage" disabled={!editable} placeholder="Dose e.g. 500mg" value={it.dosage} onChange={(e) => setItems(items.map((x, k) => (k === i ? { ...x, dosage: e.target.value } : x)))} className="mt-0" />
                <Input aria-label="Frequency" disabled={!editable} placeholder="e.g. 1+0+1" value={it.frequency} onChange={(e) => setItems(items.map((x, k) => (k === i ? { ...x, frequency: e.target.value } : x)))} className="mt-0" />
                <Input aria-label="Days" disabled={!editable} type="number" placeholder="Days" value={it.durationDays ?? ""} onChange={(e) => setItems(items.map((x, k) => (k === i ? { ...x, durationDays: e.target.value ? Number(e.target.value) : null } : x)))} className="mt-0" />
                <button aria-label="Remove medicine" disabled={!editable || items.length === 1} onClick={() => setItems(items.filter((_, k) => k !== i))} className="flex h-11 w-11 items-center justify-center rounded-xl text-copy-muted hover:text-danger disabled:opacity-30"><Icon name="trash" size={17} /></button>
                <Input aria-label="Instructions" disabled={!editable} placeholder="Instructions (e.g. after meal)" value={it.instructions ?? ""} onChange={(e) => setItems(items.map((x, k) => (k === i ? { ...x, instructions: e.target.value } : x)))} className="col-span-2 mt-0 sm:col-span-5" />
              </div>
            ))}
            {editable && <Button variant="ghost" icon="plus" className="w-fit" onClick={() => setItems([...items, { ...blankItem }])}>Add medicine</Button>}
            <Field label="Lab tests (comma separated)"><Input disabled={!editable} value={labTests} onChange={(e) => setLabTests(e.target.value)} placeholder="CBC, HbA1c" /></Field>
            <Field label="Notes"><Textarea disabled={!editable} value={rxNotes} onChange={(e) => setRxNotes(e.target.value)} className="min-h-16" /></Field>
            {check && (
              <div className={`rounded-[16px] p-4 text-sm ${check.safe ? "bg-[#e3f4f2] text-[#00545a]" : "bg-[#fff0ec] text-[#7a2a20]"}`}>
                <p className="flex items-center gap-2 font-bold"><Icon name={check.safe ? "shield" : "alert"} size={17} />{check.safe ? "No major issues found" : "Please review these warnings"}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {check.allergyWarnings.map((w, k) => <li key={`a${k}`}><b>Allergy:</b> {w.message}</li>)}
                  {check.aiWarnings.map((w, k) => <li key={`w${k}`}><b>{w.severity}:</b> {w.medicine} – {w.message}</li>)}
                </ul>
                {!check.aiAvailable && <p className="mt-2 text-xs">AI check unavailable right now – allergy rules were still checked.</p>}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="soft" icon="spark" disabled={!editable || !validItems.length} loading={action.busy === "check"} onClick={runCheck}>AI safety check</Button>
              <Button disabled={!editable || !validItems.length} loading={action.busy === "rx"} onClick={savePrescription}>Save prescription</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
