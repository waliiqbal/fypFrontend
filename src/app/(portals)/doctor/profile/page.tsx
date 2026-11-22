"use client";

import { useState } from "react";
import { updateSessionUser } from "@/infrastructure/auth/session-storage";
import { uploadImage } from "@/shared/extras";
import { api } from "@/shared/api";
import type { Specialization } from "@/shared/types";
import { fmtDate } from "@/shared/format";
import { Avatar, Badge, Button, Card, CardHeader, cx, EmptyState, ErrorBox, Field, Input, Loading, Notice, PageHeader, Select, Textarea } from "@/shared/ui";
import { useAction, useApi, useFormFrom } from "@/shared/use-api";

type Profile = { name: string; email: string; phone?: string | null; address?: string | null; city?: string | null; gender?: string | null; bio?: string | null; qualification?: string | null; experience?: number | null; consultationFee?: number | null; profileImage?: string | null; licenseNumber?: string | null; status: string; rejectionReason?: string | null; specializations: Specialization[]; hospital?: { name: string } | null; clinics?: { id: number; name: string; address: string; city?: string | null; phone?: string | null }[] };

export default function DoctorProfile() {
  const { data, loading, error, reload } = useApi(() => api.get<Profile>("/api/doctors/me/profile"));
  const specs = useApi(() => api.public<Specialization[]>("/api/public/specializations"));
  const [form, setForm] = useFormFrom<Profile, Profile | null>(data, (d) => d, null);
  const [specIds, setSpecIds] = useFormFrom<Profile, number[]>(data, (d) => d.specializations.map((s) => s.id), []);
  const [saved, setSaved] = useState(false);
  const action = useAction();
  if (loading || !form) return error ? <ErrorBox message={error} /> : <Loading />;
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => { setSaved(false); setForm((f) => (f ? { ...f, [k]: v } : f)); };

  async function save() {
    if (!form) return;
    const r = await action.run("save", () => api.patch<Profile>("/api/doctors/me/profile", {
      name: form.name, phone: form.phone || undefined, address: form.address || undefined, city: form.city || undefined, gender: form.gender || undefined,
      bio: form.bio || undefined, qualification: form.qualification || undefined, experience: form.experience != null ? Number(form.experience) : undefined,
      consultationFee: form.consultationFee ? Number(form.consultationFee) : undefined, profileImage: form.profileImage || undefined, specializationIds: specIds,
    }));
    if (r) { setSaved(true); updateSessionUser({ name: r.data.name, profileImage: r.data.profileImage, status: r.data.status }); }
  }

  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Account" title="My Profile" description="This is what patients see on your public profile." actions={<Badge value={form.status} label={form.status === "ACTIVE" ? "Approved" : form.status === "INACTIVE" ? "Pending approval" : undefined} />} />
      {form.status !== "ACTIVE" && <div className="mb-5"><Notice tone="warn">{form.rejectionReason ? `Not approved: ${form.rejectionReason}` : `Waiting for approval by ${form.hospital ? form.hospital.name : "AskCare"}.`}</Notice></div>}
      <div className="flex flex-col gap-5">
        <Card className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar name={form.name} src={form.profileImage} size={76} />
            <label className="cursor-pointer text-sm font-semibold text-brand">Change photo
              <input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const url = await action.run("up", () => uploadImage(f)); if (url) set("profileImage", url); } }} />
            </label>
            <span className="text-sm text-copy-muted">{form.hospital ? form.hospital.name : "Private practice"} · License {form.licenseNumber ?? "—"}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Email"><Input value={form.email} disabled /></Field>
            <Field label="Phone"><Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label="City"><Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} /></Field>
            <Field label="Gender"><Select value={form.gender ?? ""} onChange={(e) => set("gender", e.target.value)}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option></Select></Field>
            <Field label="Experience (years)"><Input type="number" value={form.experience ?? ""} onChange={(e) => set("experience", e.target.value ? Number(e.target.value) : null)} /></Field>
            <Field label="Consultation fee (Rs)" hint={form.hospital ? "Your hospital may also set this." : undefined}><Input type="number" value={form.consultationFee ?? ""} onChange={(e) => set("consultationFee", e.target.value ? Number(e.target.value) : null)} /></Field>
            <Field label="Qualification"><Input value={form.qualification ?? ""} onChange={(e) => set("qualification", e.target.value)} placeholder="MBBS, FCPS (Cardiology)" /></Field>
          </div>
          <Field label="About you"><Textarea value={form.bio ?? ""} onChange={(e) => set("bio", e.target.value)} placeholder="Short introduction for patients" /></Field>
        </Card>
        <Card>
          <CardHeader title="Specializations" subtitle="Used by the AI symptom checker to route patients to you" />
          <div className="flex flex-wrap gap-2">
            {specs.data?.map((s) => {
              const on = specIds.includes(s.id);
              return <button key={s.id} onClick={() => { setSaved(false); setSpecIds(on ? specIds.filter((x) => x !== s.id) : [...specIds, s.id]); }} className={cx("rounded-full border px-3.5 py-1.5 text-[13px] font-semibold", on ? "border-brand bg-[#e3f4f2] text-[#00545a]" : "border-[#dcebe8] text-copy")}>{s.name}</button>;
            })}
          </div>
        </Card>
        <Documents />
        {!form.hospital && <ClinicCard clinic={form.clinics?.[0]} onSaved={reload} />}
        {action.error && <ErrorBox message={action.error} />}
        {saved && <Notice tone="success">Profile saved.</Notice>}
        <div><Button loading={action.busy === "save"} onClick={save} className="px-8">Save profile</Button></div>
      </div>
    </div>
  );
}

type DoctorDocument = { id: number; title: string; type: "LICENSE" | "DEGREE" | "CERTIFICATE" | "OTHER"; fileUrl: string; createdAt: string };
const DOC_LABEL: Record<DoctorDocument["type"], string> = { LICENSE: "Medical licence", DEGREE: "Degree", CERTIFICATE: "Certificate", OTHER: "Other" };

/** Licence / degree uploads that approvers (hospital admin or AskCare) check before approving the doctor. */
function Documents() {
  const { data, error, loading, reload } = useApi(() => api.get<DoctorDocument[]>("/api/doctors/me/documents"));
  const [title, setTitle] = useState("");
  const [type, setType] = useState<DoctorDocument["type"]>("LICENSE");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const action = useAction();

  async function add() {
    if (!file || !title.trim()) return;
    const r = await action.run("add", async () => {
      const fileUrl = await uploadImage(file);
      return api.post("/api/doctors/me/documents", { title: title.trim(), type, fileUrl });
    });
    if (r) { setTitle(""); setFile(null); setFileKey((k) => k + 1); void reload(); }
  }

  return (
    <Card>
      <CardHeader title="Verification documents" subtitle="Upload a photo or scan of your medical licence and degrees. Your approver checks these before activating your account." />
      {loading && !data ? <Loading /> : error ? <ErrorBox message={error} onRetry={reload} /> : data && data.length ? (
        <ul className="mb-5 grid gap-3 sm:grid-cols-2">
          {data.map((d) => (
            <li key={d.id} className="flex items-center gap-3 rounded-[16px] border border-[#eef4f3] p-3">
              <a href={d.fileUrl} target="_blank" rel="noreferrer" className="block h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#f0f7f6]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.fileUrl} alt={d.title} className="h-full w-full object-cover" />
              </a>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{d.title}</p><p className="text-xs text-copy-muted">{DOC_LABEL[d.type]} · {fmtDate(d.createdAt)}</p></div>
              <button aria-label={`Remove ${d.title}`} onClick={async () => { if (await action.run(`d${d.id}`, () => api.del(`/api/doctors/me/documents/${d.id}`))) void reload(); }} className="px-2 text-xs font-semibold text-copy-muted hover:text-danger">Remove</button>
            </li>
          ))}
        </ul>
      ) : <div className="mb-4"><EmptyState icon="file" title="No documents uploaded" text="Add your licence so your profile can be approved faster." /></div>}
      <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr_1.4fr_auto] sm:items-end">
        <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. PMDC licence" /></Field>
        <Field label="Type"><Select value={type} onChange={(e) => setType(e.target.value as DoctorDocument["type"])}><option value="LICENSE">Medical licence</option><option value="DEGREE">Degree</option><option value="CERTIFICATE">Certificate</option><option value="OTHER">Other</option></Select></Field>
        <Field label="Photo / scan (JPG or PNG)"><Input key={fileKey} type="file" accept="image/png,image/jpeg" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="py-2" /></Field>
        <Button icon="plus" loading={action.busy === "add"} disabled={!file || !title.trim()} onClick={add}>Add</Button>
      </div>
      {action.error && <div className="mt-3"><ErrorBox message={action.error} /></div>}
    </Card>
  );
}

type Clinic = { id: number; name: string; address: string; city?: string | null; phone?: string | null };

/** Private doctors add the clinic where they see patients. */
function ClinicCard({ clinic, onSaved }: { clinic?: Clinic; onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", address: "", city: "", phone: "", latitude: "24.8607", longitude: "67.0011" });
  const [done, setDone] = useState(false);
  const action = useAction();
  const set = (k: keyof typeof form, v: string) => { setDone(false); setForm((f) => ({ ...f, [k]: v })); };

  if (clinic)
    return (
      <Card>
        <CardHeader title="Your clinic" subtitle="Shown to patients on your public profile." />
        <p className="font-semibold">{clinic.name}</p>
        <p className="text-sm text-copy-muted">{clinic.address}{clinic.city ? `, ${clinic.city}` : ""}{clinic.phone ? ` · ${clinic.phone}` : ""}</p>
      </Card>
    );

  async function save() {
    const r = await action.run("clinic", () => api.post("/api/doctors/me/clinic", {
      name: form.name.trim(), address: form.address.trim(), city: form.city.trim() || undefined, phone: form.phone.trim() || undefined,
      latitude: Number(form.latitude), longitude: Number(form.longitude),
    }));
    if (r) { setDone(true); onSaved(); }
  }

  return (
    <Card>
      <CardHeader title="Add your clinic" subtitle="Private doctors can add one clinic so patients know where in-person visits happen." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Clinic name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="City"><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
        <div className="sm:col-span-2"><Field label="Address"><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></Field></div>
        <Field label="Clinic phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Latitude"><Input type="number" step="any" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} /></Field><Field label="Longitude"><Input type="number" step="any" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} /></Field></div>
      </div>
      {action.error && <div className="mt-3"><ErrorBox message={action.error} /></div>}
      {done && <div className="mt-3"><Notice tone="success">Clinic added.</Notice></div>}
      <div className="mt-4"><Button loading={action.busy === "clinic"} disabled={!form.name.trim() || !form.address.trim()} onClick={save}>Save clinic</Button></div>
    </Card>
  );
}
