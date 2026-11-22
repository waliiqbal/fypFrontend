"use client";

import { useState } from "react";
import { uploadImage } from "@/shared/extras";
import { api } from "@/shared/api";
import { fmtDate } from "@/shared/format";
import { Icon } from "@/shared/icons";
import type { Consultation, MedicalDocument, MedicalProfile, Prescription } from "@/shared/types";
import { Button, Card, CardHeader, EmptyState, ErrorBox, Field, Input, Loading, Modal, PageHeader, Select, Tabs, Textarea } from "@/shared/ui";
import { useAction, useApi } from "@/shared/use-api";

type Records = {
  profile: MedicalProfile | null;
  consultations: Consultation[];
  prescriptions: Prescription[];
  documents: MedicalDocument[];
  timeline: { type: string; id: number; date: string; title: string; detail: string }[];
};

export default function MedicalRecords() {
  const { data, error, loading, reload } = useApi(() => api.get<Records>("/api/patients/me/medical-records"));
  const [tab, setTab] = useState<"timeline" | "prescriptions" | "consultations" | "documents">("timeline");
  const [uploading, setUploading] = useState(false);

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader eyebrow="Health archive" title="Medical Records" description="Everything from your consultations in one place. Your AI assistant reads these records to answer your questions." actions={<Button icon="plus" onClick={() => setUploading(true)}>Add report</Button>} />
      <div className="mb-5"><Tabs value={tab} onChange={setTab} items={[
        { value: "timeline", label: "Timeline" },
        { value: "prescriptions", label: "Prescriptions", count: data.prescriptions.length },
        { value: "consultations", label: "Consultations", count: data.consultations.length },
        { value: "documents", label: "Reports", count: data.documents.length },
      ]} /></div>

      {tab === "timeline" && (
        <Card>
          {data.timeline.length ? (
            <ol className="relative ml-3 border-l-2 border-[#e3eeec]">
              {data.timeline.map((t) => (
                <li key={`${t.type}-${t.id}`} className="mb-6 ml-6 last:mb-0">
                  <span className="absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full border-4 border-white bg-brand" />
                  <p className="text-xs font-bold uppercase tracking-[.1em] text-copy-muted">{fmtDate(t.date)} · {t.type}</p>
                  <p className="mt-0.5 font-semibold">{t.title}</p>
                  <p className="text-[13px] text-copy-muted">{t.detail}</p>
                </li>
              ))}
            </ol>
          ) : <EmptyState icon="file" title="No records yet" text="After your first consultation, notes and prescriptions appear here." />}
        </Card>
      )}

      {tab === "prescriptions" && (
        <div className="grid gap-4 md:grid-cols-2">
          {data.prescriptions.length ? data.prescriptions.map((p) => (
            <Card key={p.id}>
              <CardHeader title={`Dr. ${p.doctor?.name}`} subtitle={fmtDate(p.createdAt)} />
              <ul className="flex flex-col gap-2.5">
                {p.items.map((i, k) => (
                  <li key={k} className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e3f4f2] text-brand"><Icon name="pill" size={16} /></span>
                    <div className="text-sm"><p className="font-semibold">{i.medicine} {i.dosage}</p><p className="text-xs text-copy-muted">{i.frequency}{i.durationDays ? ` · ${i.durationDays} days` : ""}{i.instructions ? ` · ${i.instructions}` : ""}</p></div>
                  </li>
                ))}
              </ul>
              {p.labTests.length > 0 && <p className="mt-3 text-[13px]"><b>Lab tests:</b> {p.labTests.join(", ")}</p>}
              {p.notes && <p className="mt-2 text-[13px] text-copy">{p.notes}</p>}
            </Card>
          )) : <Card className="md:col-span-2"><EmptyState icon="pill" title="No prescriptions yet" /></Card>}
        </div>
      )}

      {tab === "consultations" && (
        <div className="flex flex-col gap-4">
          {data.consultations.length ? data.consultations.map((c) => (
            <Card key={c.id}>
              <CardHeader title={c.diagnosis || "Consultation"} subtitle={`Dr. ${c.doctor?.name} · ${fmtDate(c.createdAt)}`} />
              <div className="grid gap-3 text-sm leading-6 sm:grid-cols-2">
                {c.symptoms && <p><b>Symptoms:</b> {c.symptoms}</p>}
                {c.advice && <p><b>Advice:</b> {c.advice}</p>}
                {c.notes && <p className="sm:col-span-2"><b>Notes:</b> {c.notes}</p>}
                {c.followUpDate && <p><b>Follow-up:</b> {fmtDate(c.followUpDate)}</p>}
              </div>
            </Card>
          )) : <Card><EmptyState icon="stethoscope" title="No consultation notes yet" /></Card>}
        </div>
      )}

      {tab === "documents" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.documents.length ? data.documents.map((d) => <DocumentCard key={d.id} doc={d} onDeleted={reload} />) : <Card className="md:col-span-2 xl:col-span-3"><EmptyState icon="file" title="No reports uploaded" text="Upload lab reports or scans so doctors and your AI assistant can use them." action={<Button icon="plus" onClick={() => setUploading(true)}>Add report</Button>} /></Card>}
        </div>
      )}

      <UploadModal open={uploading} onClose={() => setUploading(false)} onDone={() => { setUploading(false); setTab("documents"); void reload(); }} />
    </div>
  );
}

function DocumentCard({ doc, onDeleted }: { doc: MedicalDocument; onDeleted: () => void }) {
  const { busy, run } = useAction();
  return (
    <Card className="flex flex-col gap-3">
      <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="block aspect-[4/3] overflow-hidden rounded-2xl bg-[#f0f7f6]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={doc.fileUrl} alt={doc.title} className="h-full w-full object-cover" />
      </a>
      <div className="flex items-start justify-between gap-2">
        <div><p className="font-semibold">{doc.title}</p><p className="text-xs text-copy-muted">{doc.type.replace(/_/g, " ").toLowerCase()} · {fmtDate(doc.recordedAt ?? doc.createdAt)}</p></div>
        <button aria-label="Delete report" disabled={!!busy} onClick={async () => { if (await run("d", () => api.del(`/api/patients/me/documents/${doc.id}`))) onDeleted(); }} className="text-copy-muted hover:text-danger"><Icon name="trash" size={17} /></button>
      </div>
      {doc.notes && <p className="text-[13px] text-copy">{doc.notes}</p>}
    </Card>
  );
}

function UploadModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("LAB_REPORT");
  const [notes, setNotes] = useState("");
  const [recordedAt, setRecordedAt] = useState("");
  const { busy, error, run } = useAction();
  async function save() {
    if (!file || !title.trim()) return;
    const ok = await run("save", async () => {
      const fileUrl = await uploadImage(file);
      return api.post("/api/patients/me/documents", { title: title.trim(), type, fileUrl, notes: notes || undefined, recordedAt: recordedAt || undefined });
    });
    if (ok) { setFile(null); setTitle(""); setNotes(""); onDone(); }
  }
  return (
    <Modal open={open} title="Add a medical report" onClose={onClose} footer={<Button loading={busy === "save"} disabled={!file || !title.trim()} onClick={save}>Upload report</Button>}>
      <div className="flex flex-col gap-4">
        <Field label="Photo or scan of the report" hint="JPG or PNG"><Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="py-2" /></Field>
        <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. HbA1c test" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type"><Select value={type} onChange={(e) => setType(e.target.value)}><option value="LAB_REPORT">Lab report</option><option value="IMAGING">X-ray / scan</option><option value="PRESCRIPTION">Prescription</option><option value="DISCHARGE_SUMMARY">Discharge summary</option><option value="OTHER">Other</option></Select></Field>
          <Field label="Report date"><Input type="date" value={recordedAt} onChange={(e) => setRecordedAt(e.target.value)} /></Field>
        </div>
        <Field label="Key results (optional)" hint="Typing the main values helps your AI assistant, e.g. HbA1c 7.2%"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        {error && <ErrorBox message={error} />}
      </div>
    </Modal>
  );
}
