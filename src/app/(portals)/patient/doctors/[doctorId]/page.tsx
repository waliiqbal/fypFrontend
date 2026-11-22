"use client";

import { use, useMemo, useState } from "react";
import { Stars } from "@/shared/extras";
import { api } from "@/shared/api";
import { addDaysIso, fmtDate, fmtDay, fmtTime, rs, todayIso } from "@/shared/format";
import { Icon } from "@/shared/icons";
import type { DoctorCard, Slot } from "@/shared/types";
import { Avatar, Button, Card, CardHeader, cx, EmptyState, ErrorBox, Field, Loading, Notice, Textarea } from "@/shared/ui";
import { useAction, useApi, useNow } from "@/shared/use-api";

const dayKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date(iso));

export default function DoctorProfilePage({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = use(params);
  const doctor = useApi(() => api.public<DoctorCard>(`/api/doctors/${doctorId}`), [doctorId]);
  const slots = useApi(() => api.public<Slot[]>(`/api/doctors/${doctorId}/slots`, { from: todayIso(), to: addDaysIso(13) }), [doctorId]);
  const [day, setDay] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<number | null>(null);
  const [type, setType] = useState<"VIDEO" | "IN_PERSON">("VIDEO");
  const [reason, setReason] = useState("");
  const { busy, error, run } = useAction();
  const now = useNow();

  // Slots must be ≥35 min away so the Stripe checkout can stay open long enough.
  const bookable = useMemo(() => (slots.data ?? []).filter((s) => new Date(s.startAt).getTime() > now + 36 * 60000), [slots.data, now]);
  const days = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of bookable) map.set(dayKey(s.startAt), [...(map.get(dayKey(s.startAt)) ?? []), s]);
    return [...map.entries()];
  }, [bookable]);
  const activeDay = day ?? days[0]?.[0] ?? null;
  const daySlots = days.find(([k]) => k === activeDay)?.[1] ?? [];

  async function book() {
    if (!slotId) return;
    const res = await run("book", () => api.post<{ appointmentId: number; checkoutUrl: string }>("/api/doctors/appointments/reserve", { slotId, consultationType: type, reason: reason.trim() || undefined }));
    if (!res) return;
    try { sessionStorage.setItem("askare.checkout.appointmentId", String(res.data.appointmentId)); } catch { /* optional */ }
    window.location.assign(res.data.checkoutUrl);
  }

  if (doctor.loading) return <Loading />;
  if (doctor.error || !doctor.data) return <ErrorBox message={doctor.error ?? "Doctor not found"} />;
  const d = doctor.data;
  const fee = d.clinics?.[0]?.consultationFee ?? d.consultationFee;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="flex flex-col gap-5">
        <Card className="flex flex-wrap items-center gap-5">
          <Avatar name={d.name} src={d.profileImage} size={88} />
          <div className="min-w-[220px] flex-1">
            <h1 className="font-display text-[26px] font-extrabold tracking-[-0.02em]">Dr. {d.name}</h1>
            <p className="mt-1 text-sm text-copy">{d.specializations.map((s) => s.name).join(" · ")}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              {d.rating?.average ? <span className="flex items-center gap-1 rounded-[9px] bg-[#fff6db] px-2.5 py-1 text-[#7a5a00]"><Icon name="star" size={13} className="fill-[#f5b301] text-[#f5b301]" />{d.rating.average} ({d.rating.count})</span> : null}
              {d.experience != null && <span className="rounded-[9px] bg-[#f0f7f6] px-2.5 py-1 text-[#00545a]">{d.experience} years experience</span>}
              <span className="rounded-[9px] bg-[#f0f7f6] px-2.5 py-1 text-[#00545a]">{d.hospital ? `${d.hospital.name}${d.hospital.city ? `, ${d.hospital.city}` : ""}` : "Private practice"}</span>
            </div>
          </div>
        </Card>
        {(d.bio || d.qualification) && (
          <Card>
            <CardHeader title="About" />
            {d.qualification && <p className="text-sm font-semibold">{d.qualification}</p>}
            {d.bio && <p className="mt-2 text-sm leading-6 text-copy">{d.bio}</p>}
          </Card>
        )}
        {d.clinics?.length > 0 && (
          <Card>
            <CardHeader title="Clinic" />
            {d.clinics.map((c) => <p key={c.id} className="text-sm"><b>{c.name}</b> – {c.address}{c.city ? `, ${c.city}` : ""}</p>)}
          </Card>
        )}
        <Card>
          <CardHeader title="Patient reviews" subtitle={d.rating?.count ? `${d.rating.count} verified reviews after completed consultations` : undefined} />
          {d.reviews?.length ? (
            <ul className="flex flex-col divide-y divide-[#eef4f3]">
              {d.reviews.map((r) => (
                <li key={r.id} className="py-3.5 first:pt-0">
                  <div className="flex items-center justify-between gap-2"><Stars value={r.rating} size={15} /><span className="text-xs text-copy-muted">{fmtDate(r.createdAt)}</span></div>
                  {r.comment && <p className="mt-1.5 text-sm leading-6">{r.comment}</p>}
                  <p className="mt-1 text-xs text-copy-muted">{r.patient?.name?.split(" ")[0]}</p>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-copy-muted">No reviews yet.</p>}
        </Card>
      </div>

      <Card className="flex h-fit flex-col gap-5 lg:sticky lg:top-[90px]">
        <div className="flex items-baseline justify-between"><h2 className="text-lg font-bold">Book a consultation</h2><p className="text-lg font-extrabold">{fee ? rs(fee) : "—"}</p></div>
        <div className="grid grid-cols-2 gap-2">
          {(["VIDEO", "IN_PERSON"] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} className={cx("flex h-12 items-center justify-center gap-2 rounded-[13px] border text-sm font-semibold", type === t ? "border-brand bg-[#e3f4f2] text-[#00545a]" : "border-[#e3eeec] text-copy")}>
              <Icon name={t === "VIDEO" ? "video" : "building"} size={17} />{t === "VIDEO" ? "Video call" : "In-person"}
            </button>
          ))}
        </div>
        {slots.loading ? <Loading label="Loading free slots…" /> : !days.length ? (
          <EmptyState icon="calendar" title="No free slots in the next 2 weeks" text="Please check again later or choose another doctor." />
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {days.map(([k, list]) => (
                <button key={k} onClick={() => { setDay(k); setSlotId(null); }} className={cx("flex min-w-[76px] flex-col items-center rounded-[14px] border px-3 py-2.5 text-xs", activeDay === k ? "border-brand bg-brand text-white" : "border-[#e3eeec] bg-white")}>
                  <span className="font-bold">{fmtDay(list[0].startAt)}</span>
                  <span className={activeDay === k ? "text-[#cdeeea]" : "text-copy-muted"}>{list.length} slots</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {daySlots.map((s) => (
                <button key={s.id} onClick={() => setSlotId(s.id)} className={cx("h-10 rounded-[11px] border text-[13px] font-semibold", slotId === s.id ? "border-brand bg-[#e3f4f2] text-[#00545a]" : "border-[#e3eeec] hover:border-brand/50")}>{fmtTime(s.startAt)}</button>
              ))}
            </div>
          </>
        )}
        <Field label="Reason for visit (optional)"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Briefly describe your problem" className="min-h-20" /></Field>
        {error && <ErrorBox message={error} />}
        <Button icon="shield" disabled={!slotId} loading={busy === "book"} onClick={book} className="h-12">Continue to secure payment</Button>
        <Notice>Your card is only <b>authorised</b> now. You are charged when Dr. {d.name.split(" ")[0]} accepts. If the doctor declines or does not respond, the hold is released automatically.</Notice>
      </Card>
    </div>
  );
}
