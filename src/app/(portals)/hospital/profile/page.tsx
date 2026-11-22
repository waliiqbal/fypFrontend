"use client";

import { useState } from "react";
import { uploadImage } from "@/shared/extras";
import { api } from "@/shared/api";
import { Avatar, Button, Card, ErrorBox, Field, Input, Loading, Notice, PageHeader, Textarea } from "@/shared/ui";
import { useAction, useApi, useFormFrom } from "@/shared/use-api";

type Hospital = { name: string; address?: string | null; city?: string | null; phone?: string | null; email?: string | null; description?: string | null; logo?: string | null };

export default function HospitalProfile() {
  const { data, loading, error } = useApi(() => api.get<Hospital>("/api/hospital/profile"));
  const [form, setForm] = useFormFrom<Hospital, Hospital | null>(data, (d) => d, null);
  const [saved, setSaved] = useState(false);
  const action = useAction();
  if (loading || !form) return error ? <ErrorBox message={error} /> : <Loading />;
  const set = (k: keyof Hospital, v: string) => { setSaved(false); setForm((f) => (f ? { ...f, [k]: v } : f)); };
  async function save() {
    if (!form) return;
    const r = await action.run("s", () => api.patch("/api/hospital/profile", { name: form.name, address: form.address || undefined, city: form.city || undefined, phone: form.phone || undefined, email: form.email || undefined, description: form.description || undefined, logo: form.logo || undefined }));
    if (r) setSaved(true);
  }
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Settings" title="Hospital Profile" description="Patients see this information on doctor profiles and the hospital page." />
      <Card className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <Avatar name={form.name} src={form.logo} size={72} />
          <label className="cursor-pointer text-sm font-semibold text-brand">Upload logo
            <input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const url = await action.run("up", () => uploadImage(f)); if (url) set("logo", url); } }} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hospital name"><Input value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="City"><Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} /></Field>
          <Field label="Phone"><Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Email"><Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} /></Field>
        </div>
        <Field label="Address"><Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} /></Field>
        <Field label="About the hospital"><Textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Departments, timings, facilities…" /></Field>
        {action.error && <ErrorBox message={action.error} />}
        {saved && <Notice tone="success">Hospital profile saved.</Notice>}
        <div><Button loading={action.busy === "s"} onClick={save}>Save changes</Button></div>
      </Card>
    </div>
  );
}
