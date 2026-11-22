"use client";

import { useEffect, useState } from "react";
import { updateSessionUser } from "@/infrastructure/auth/session-storage";
import { getProfile } from "@/modules/auth/api/auth.api";
import { uploadImage } from "@/shared/extras";
import { api } from "@/shared/api";
import { Avatar, Button, Card, ErrorBox, Field, Input, Loading, Notice, PageHeader, Select } from "@/shared/ui";
import { useAction } from "@/shared/use-api";

type Account = { name: string; email: string; phone?: string | null; address?: string | null; gender?: string | null; dateOfBirth?: string | null; bloodGroup?: string | null; profileImage?: string | null };

export default function PatientProfile() {
  const [form, setForm] = useState<Account | null>(null);
  const [saved, setSaved] = useState(false);
  const action = useAction();
  useEffect(() => { getProfile().then((r) => setForm(r.data as unknown as Account)).catch(() => setForm(null)); }, []);
  if (!form) return <Loading />;
  const set = (k: keyof Account, v: string) => { setSaved(false); setForm((f) => (f ? { ...f, [k]: v } : f)); };

  async function save() {
    if (!form) return;
    const res = await action.run("save", () => api.patch<Account>("/api/patients/me/profile", {
      name: form.name, phone: form.phone || undefined, address: form.address || undefined, gender: form.gender || undefined,
      dateOfBirth: form.dateOfBirth ? form.dateOfBirth.slice(0, 10) : undefined, bloodGroup: form.bloodGroup || undefined, profileImage: form.profileImage || undefined,
    }));
    if (res) { setSaved(true); updateSessionUser({ name: res.data.name, profileImage: res.data.profileImage }); }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Account" title="My Profile" />
      <Card className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <Avatar name={form.name} src={form.profileImage} size={72} />
          <label className="cursor-pointer text-sm font-semibold text-brand">Change photo
            <input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const url = await action.run("up", () => uploadImage(f)); if (url) set("profileImage", url); } }} />
          </label>
          {action.busy === "up" && <span className="text-xs text-copy-muted">Uploading…</span>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Email"><Input value={form.email} disabled /></Field>
          <Field label="Phone"><Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Date of birth"><Input type="date" value={form.dateOfBirth?.slice(0, 10) ?? ""} onChange={(e) => set("dateOfBirth", e.target.value)} /></Field>
          <Field label="Gender"><Select value={form.gender ?? ""} onChange={(e) => set("gender", e.target.value)}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></Select></Field>
          <Field label="Blood group"><Select value={form.bloodGroup ?? ""} onChange={(e) => set("bloodGroup", e.target.value)}><option value="">Select</option>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => <option key={g}>{g}</option>)}</Select></Field>
          <Field label="Address"><Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field>
        </div>
        {action.error && <ErrorBox message={action.error} />}
        {saved && <Notice tone="success">Profile updated.</Notice>}
        <div><Button loading={action.busy === "save"} onClick={save}>Save changes</Button></div>
      </Card>
    </div>
  );
}
