"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSessionUser } from "@/infrastructure/auth/session-storage";
import { api } from "@/shared/api";
import { fmtDateTime, rs } from "@/shared/format";
import { Icon } from "@/shared/icons";
import type { Appointment, PrescriptionItem } from "@/shared/types";
import { Avatar, Badge, Card, CardHeader, EmptyState, ErrorBox, LinkButton, Loading, Notice, Textarea } from "@/shared/ui";
import { useApi, useNow } from "@/shared/use-api";

type Dashboard = {
  patient: { id: number; name: string };
  nextAppointment: Appointment | null;
  pendingRequests: Appointment[];
  activeMedicines: PrescriptionItem[];
  latestPrescription: { doctor: { name: string }; createdAt: string } | null;
  healthProfile: { conditions: string[]; allergies: string[]; currentMedications: string[]; completed: boolean };
  stats: { upcoming: number; pending: number; completed: number; cancelled: number };
};

const QUICK = ["Headache", "Fever", "Cough", "Skin rash", "Stomach pain", "Back pain"];

export default function PatientDashboard() {
  const router = useRouter();
  const { data, error, loading, reload } = useApi(() => api.get<Dashboard>("/api/patients/me/dashboard"));
  const [symptoms, setSymptoms] = useState("");
  const now = useNow();
  const firstName = (data?.patient.name ?? getSessionUser()?.name ?? "").split(" ")[0];
  const hour = new Date(now).getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  function analyze(text = symptoms) {
    router.push(`/patient/symptom-checker?q=${encodeURIComponent(text)}`);
  }

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;
  const next = data.nextAppointment;
  const startsIn = next ? Math.round((new Date(next.slot.startAt).getTime() - now) / 60000) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-copy-muted">{new Intl.DateTimeFormat("en-PK", { weekday: "long", day: "numeric", month: "long" }).format(new Date(now))}</p>
        <h1 className="font-display mt-1 text-[30px] font-extrabold tracking-[-0.03em]">{greeting}, {firstName}</h1>
      </div>

      {!data.healthProfile.completed && (
        <Notice tone="warn">
          <b>Complete your health profile</b> so your AI assistant and doctors know your conditions and allergies.{" "}
          <Link href="/patient/health-profile" className="font-semibold text-brand underline">Add details</Link>
        </Notice>
      )}

      <section className="grid gap-5 lg:grid-cols-2">
        {next ? (
          <div className="relative flex flex-col gap-5 overflow-hidden rounded-[26px] bg-[#00646b] p-7 text-white">
            <span className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#0a7f86]" aria-hidden />
            <span className="absolute -bottom-24 right-10 h-40 w-40 rounded-full bg-[#0a7f86]" aria-hidden />
            <div className="relative flex items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#00646b]">Next appointment</span>
              <span className="text-[13px] text-[#cdeeea]">{startsIn > 0 ? (startsIn < 120 ? `Starts in ${startsIn} min` : `In ${Math.round(startsIn / 60)} hours`) : "Now"}</span>
            </div>
            <div className="relative flex items-center gap-4">
              <Avatar name={next.doctor?.name} src={next.doctor?.profileImage} size={60} />
              <div>
                <h2 className="text-[22px] font-bold">Dr. {next.doctor?.name}</h2>
                <p className="mt-0.5 text-sm text-[#cdeeea]">{next.doctor?.specializations?.map((s) => s.specialization.name).join(", ")}{next.doctor?.hospital ? ` · ${next.doctor.hospital.name}` : ""}</p>
              </div>
            </div>
            <div className="relative flex flex-wrap gap-2 text-[13px]">
              <span className="flex items-center gap-2 rounded-xl bg-[#0f747b] px-3.5 py-2"><Icon name="clock" size={16} />{fmtDateTime(next.slot.startAt)}</span>
              <span className="flex items-center gap-2 rounded-xl bg-[#0f747b] px-3.5 py-2"><Icon name={next.consultationType === "VIDEO" ? "video" : "building"} size={16} />{next.consultationType === "VIDEO" ? "Video consultation" : "In-person visit"}</span>
            </div>
            <div className="relative flex gap-2">
              {next.consultationType === "VIDEO" ? (
                <Link href={`/patient/call/${next.id}`} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[14px] bg-white font-bold text-[#00545a]"><Icon name="video" size={18} />Join video call</Link>
              ) : (
                <Link href="/patient/appointments" className="flex h-12 flex-1 items-center justify-center rounded-[14px] bg-white font-bold text-[#00545a]">View details</Link>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-between gap-5 rounded-[26px] bg-[#00646b] p-7 text-white">
            <div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#00646b]">No upcoming visits</span>
              <h2 className="mt-4 text-[22px] font-bold">Feeling unwell? Let&apos;s find the right doctor.</h2>
              <p className="mt-2 text-sm text-[#cdeeea]">Describe your symptoms to the AI checker or browse verified doctors.</p>
            </div>
            <Link href="/patient/doctors" className="flex h-12 items-center justify-center rounded-[14px] bg-white font-bold text-[#00545a]">Find a doctor</Link>
          </div>
        )}

        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#e3f4f2] text-brand"><Icon name="spark" size={22} /></span>
            <div>
              <h2 className="text-[19px] font-bold">How are you feeling today?</h2>
              <p className="text-[13px] text-copy-muted">Describe your symptoms – AI finds the right specialist</p>
            </div>
          </div>
          <Textarea aria-label="Describe your symptoms" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="e.g. I have had a headache and mild fever for 2 days…" className="min-h-20 bg-[#f3f8f7]" />
          <div className="flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button key={q} onClick={() => setSymptoms((s) => (s ? `${s}, ${q.toLowerCase()}` : q))} className="rounded-full border border-[#dcebe8] bg-white px-3.5 py-1.5 text-[13px] hover:border-brand hover:text-brand">{q}</button>
            ))}
          </div>
          <button disabled={symptoms.trim().length < 3} onClick={() => analyze()} className="mt-auto flex h-12 items-center justify-center gap-2 rounded-[14px] bg-brand font-bold text-white hover:bg-brand-hover disabled:opacity-50">Analyze symptoms <Icon name="arrow" size={18} /></button>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Upcoming" value={data.stats.upcoming} />
        <MiniStat label="Awaiting doctor" value={data.stats.pending} />
        <MiniStat label="Completed visits" value={data.stats.completed} />
        <div className="rounded-[22px] border border-[#e3eeec] bg-white p-5">
          <p className="text-[13px] font-medium text-copy-muted">Known conditions</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {data.healthProfile.conditions.slice(0, 3).map((c) => <span key={c} className="rounded-[10px] bg-[#e3f4f2] px-2.5 py-1 text-xs font-semibold text-[#00545a]">{c}</span>)}
            {data.healthProfile.allergies.slice(0, 2).map((a) => <span key={a} className="rounded-[10px] bg-[#fff0ec] px-2.5 py-1 text-xs font-semibold text-[#8a3b24]">Allergy: {a}</span>)}
            {!data.healthProfile.conditions.length && !data.healthProfile.allergies.length && <span className="text-sm text-copy-muted">None recorded</span>}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          {data.pendingRequests.map((a) => (
            <div key={a.id} className="flex flex-col gap-3.5 rounded-[22px] border border-[#f6e3c2] bg-[#fffaf2] p-5">
              <div className="flex items-center gap-3">
                <Avatar name={a.doctor?.name} src={a.doctor?.profileImage} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">Dr. {a.doctor?.name}</p>
                  <p className="text-[13px] text-[#6b5a40]">{fmtDateTime(a.slot.startAt)}</p>
                </div>
                <Badge value="PENDING" />
              </div>
              <div className="flex items-start gap-2.5 rounded-[14px] bg-white px-3.5 py-3 text-[13px] leading-5 text-[#3d4f52]">
                <Icon name="shield" size={18} className="mt-0.5 shrink-0 text-[#00646b]" />
                <p>{rs(a.consultationFee)} is on hold – <b>you are charged only if the doctor accepts</b>. If declined, the hold is released.</p>
              </div>
            </div>
          ))}
          <Card>
            <CardHeader title="Current medicines" action={<Link href="/patient/medical-records" className="text-[13px] font-semibold text-brand">View all</Link>} />
            {data.activeMedicines.length ? (
              <ul className="flex flex-col gap-3">
                {data.activeMedicines.map((m, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e3f4f2] text-brand"><Icon name="pill" size={18} /></span>
                    <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{m.medicine} {m.dosage}</p><p className="text-xs text-copy-muted">{m.frequency}{m.instructions ? ` · ${m.instructions}` : ""}</p></div>
                    {m.durationDays ? <span className="text-xs text-copy-muted">{m.durationDays} days</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon="pill" title="No active prescription" text="Prescriptions from your doctors show up here." />
            )}
          </Card>
        </div>
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white"><Icon name="chat" size={20} /></span>
            <div><h2 className="text-base font-bold">My AI Health Assistant</h2><p className="text-xs font-semibold text-[#00646b]">Knows your history · Private to you</p></div>
          </div>
          <div className="self-end rounded-[18px_18px_4px_18px] bg-brand px-4 py-3 text-sm text-white">What should I eat with my condition?</div>
          <div className="max-w-[90%] rounded-[18px_18px_18px_4px] bg-[#f0f7f6] px-4 py-3 text-sm leading-6">Ask anything about your health, medicines or reports – I answer using your own AskCare records and tell you where the answer came from.</div>
          <LinkButton href="/patient/assistant" icon="chat" className="mt-auto">Open assistant</LinkButton>
          <p className="text-[11px] text-copy-muted">AI guidance only – not a medical diagnosis.</p>
        </Card>
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[22px] border border-[#e3eeec] bg-white p-5">
      <p className="text-[13px] font-medium text-copy-muted">{label}</p>
      <p className="font-display mt-2 text-[28px] font-extrabold">{value}</p>
    </div>
  );
}
