"use client";

import { useState } from "react";
import { TagInput } from "@/shared/extras";
import { api } from "@/shared/api";
import type { MedicalProfile } from "@/shared/types";
import { Button, Card, CardHeader, ErrorBox, Field, Input, Loading, Notice, PageHeader, Textarea } from "@/shared/ui";
import { useAction, useApi, useFormFrom } from "@/shared/use-api";

const empty: MedicalProfile = { conditions: [], allergies: [], currentMedications: [], pastSurgeries: [] };

export default function HealthProfile() {
  const { data, loading, error } = useApi(() => api.get<MedicalProfile>("/api/patients/me/medical-profile"));
  const [form, setForm] = useFormFrom<MedicalProfile, MedicalProfile>(data, (d) => ({ ...empty, ...d }), empty);
  const [saved, setSaved] = useState(false);
  const action = useAction();
  const set = <K extends keyof MedicalProfile>(k: K, v: MedicalProfile[K]) => { setSaved(false); setForm((f) => ({ ...f, [k]: v })); };

  async function save() {
    const res = await action.run("save", () => api.put("/api/patients/me/medical-profile", {
      ...form,
      heightCm: form.heightCm ? Number(form.heightCm) : undefined,
      weightKg: form.weightKg ? Number(form.weightKg) : undefined,
      familyHistory: form.familyHistory ?? undefined,
      lifestyleNotes: form.lifestyleNotes ?? undefined,
      emergencyContact: form.emergencyContact ?? undefined,
    }));
    if (res) setSaved(true);
  }

  if (loading) return <Loading />;
  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="About you" title="Health Profile" description="Your doctors see this before each consultation, and your AI assistant uses it to personalise answers (e.g. diet tips if you have diabetes)." />
      {error && <ErrorBox message={error} />}
      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader title="Conditions & allergies" />
          <div className="grid gap-5">
            <Field label="Known conditions"><TagInput value={form.conditions} onChange={(v) => set("conditions", v)} placeholder="Type and press Enter" suggestions={["Type 2 Diabetes", "Hypertension", "Asthma", "Thyroid", "Heart disease", "Migraine"]} /></Field>
            <Field label="Allergies"><TagInput value={form.allergies} onChange={(v) => set("allergies", v)} placeholder="e.g. Penicillin" suggestions={["Penicillin", "Sulfa", "Aspirin", "Ibuprofen", "Peanuts", "Dust"]} /></Field>
            <Field label="Medicines you take regularly"><TagInput value={form.currentMedications} onChange={(v) => set("currentMedications", v)} placeholder="e.g. Metformin 500mg" /></Field>
            <Field label="Past surgeries"><TagInput value={form.pastSurgeries} onChange={(v) => set("pastSurgeries", v)} placeholder="e.g. Appendectomy 2019" /></Field>
          </div>
        </Card>
        <Card>
          <CardHeader title="More about you" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Height (cm)"><Input type="number" value={form.heightCm ?? ""} onChange={(e) => set("heightCm", e.target.value ? Number(e.target.value) : null)} /></Field>
            <Field label="Weight (kg)"><Input type="number" value={form.weightKg ?? ""} onChange={(e) => set("weightKg", e.target.value ? Number(e.target.value) : null)} /></Field>
            <Field label="Family history"><Textarea value={form.familyHistory ?? ""} onChange={(e) => set("familyHistory", e.target.value)} placeholder="e.g. Father – diabetes" /></Field>
            <Field label="Lifestyle"><Textarea value={form.lifestyleNotes ?? ""} onChange={(e) => set("lifestyleNotes", e.target.value)} placeholder="Smoking, exercise, diet…" /></Field>
            <Field label="Emergency contact"><Input value={form.emergencyContact ?? ""} onChange={(e) => set("emergencyContact", e.target.value)} placeholder="Name – phone" /></Field>
          </div>
        </Card>
        {action.error && <ErrorBox message={action.error} />}
        {saved && <Notice tone="success">Saved. Your AI assistant is updating its memory with these details.</Notice>}
        <div><Button loading={action.busy === "save"} onClick={save} className="px-8">Save health profile</Button></div>
      </div>
    </div>
  );
}
