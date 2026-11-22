"use client";

import { useState } from "react";
import { updateSessionUser } from "@/infrastructure/auth/session-storage";
import { uploadImage } from "@/shared/extras";
import { api } from "@/shared/api";
import type { Specialization } from "@/shared/types";
import { Avatar, Badge, Button, Card, CardHeader, cx, ErrorBox, Field, Input, Loading, Notice, PageHeader, Select, Textarea } from "@/shared/ui";
import { useAction, useApi, useFormFrom } from "@/shared/use-api";

type Profile = { name: string; email: string; phone?: string | null; address?: string | null; city?: string | null; gender?: string | null; bio?: string | null; qualification?: string | null; experience?: number | null; consultationFee?: number | null; profileImage?: string | null; licenseNumber?: string | null; status: string; rejectionReason?: string | null; specializations: Specialization[]; hospital?: { name: string } | null };

export default function DoctorProfile() {
  const { data, loading, error } = useApi(() => api.get<Profile>("/api/doctors/me/profile"));
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
        {action.error && <ErrorBox message={action.error} />}
        {saved && <Notice tone="success">Profile saved.</Notice>}
        <div><Button loading={action.busy === "save"} onClick={save} className="px-8">Save profile</Button></div>
      </div>
    </div>
  );
}
