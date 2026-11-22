"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/shared/api";
import { fmtTime } from "@/shared/format";
import { Button, Card, cx, ErrorBox, Loading, Notice, PageHeader } from "@/shared/ui";
import { useAction, useApi, useNow } from "@/shared/use-api";

type CalendarSlot = {
  id: number;
  startAt: string;
  endAt: string;
  status: "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED";
  appointment: { id: number; status: string; consultationType: string; patient: { name: string } } | null;
};

const TZ = "Asia/Karachi";
/** yyyy-mm-dd of an instant, as seen in Pakistan. */
const dayKey = (d: Date | string | number) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(d));
const startOfDayMs = (key: string) => new Date(`${key}T00:00:00+05:00`).getTime();
const addDays = (key: string, n: number) => dayKey(new Date(startOfDayMs(key) + n * 86400000 + 3600000 * 12));
/** Monday of the week containing the given day. */
function weekStart(key: string) {
  const weekday = new Date(`${key}T12:00:00+05:00`).getUTCDay(); // 0 = Sunday
  return addDays(key, -((weekday + 6) % 7));
}
const dayLabel = (key: string) => new Intl.DateTimeFormat("en-PK", { weekday: "short", day: "numeric", month: "short", timeZone: TZ }).format(new Date(`${key}T12:00:00+05:00`));

export default function DoctorCalendar() {
  const now = useNow();
  const todayKey = dayKey(now);
  const [start, setStart] = useState(() => weekStart(todayKey));
  const [flash, setFlash] = useState<string | null>(null);
  const action = useAction();
  const from = new Date(startOfDayMs(start)).toISOString();
  const to = new Date(startOfDayMs(addDays(start, 7))).toISOString();
  const { data, error, loading, reload } = useApi(() => api.get<CalendarSlot[]>("/api/doctors/me/calendar", { from, to }), [from, to]);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  async function toggle(slot: CalendarSlot) {
    setFlash(null);
    const blocking = slot.status === "AVAILABLE";
    const r = await action.run(`s${slot.id}`, () => api.patch(`/api/doctors/me/slots/${slot.id}/${blocking ? "block" : "unblock"}`));
    if (r) {
      setFlash(blocking ? `${fmtTime(slot.startAt)} slot blocked. Patients can no longer book it.` : `${fmtTime(slot.startAt)} slot is open for booking again.`);
      void reload();
    }
  }

  const counts = (data ?? []).reduce<Record<string, number>>((acc, s) => ({ ...acc, [s.status]: (acc[s.status] ?? 0) + 1 }), {});

  return (
    <div>
      <PageHeader
        eyebrow="Practice management"
        title="Calendar"
        description="See your week at a glance. Block a single free slot (for a break or emergency) or open it again. Booked slots link to the appointment."
        actions={
          <>
            <Button variant="secondary" onClick={() => setStart(addDays(start, -7))}>Previous</Button>
            <Button variant="secondary" onClick={() => setStart(weekStart(todayKey))}>This week</Button>
            <Button variant="secondary" onClick={() => setStart(addDays(start, 7))}>Next</Button>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
        <Legend tone="open" label={`Free ${counts.AVAILABLE ?? 0}`} />
        <Legend tone="booked" label={`Booked ${counts.BOOKED ?? 0}`} />
        <Legend tone="held" label={`Awaiting you ${counts.HELD ?? 0}`} />
        <Legend tone="blocked" label={`Blocked ${counts.BLOCKED ?? 0}`} />
        <span className="ml-auto text-copy-muted">{dayLabel(days[0])} – {dayLabel(days[6])} · Pakistan time</span>
      </div>
      {flash && <div className="mb-4"><Notice tone="success">{flash}</Notice></div>}
      {(error || action.error) && <div className="mb-4"><ErrorBox message={(error || action.error)!} onRetry={reload} /></div>}
      {loading && !data ? <Loading /> : (
        <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
          {days.map((day) => {
            const slots = (data ?? []).filter((s) => dayKey(s.startAt) === day);
            return (
              <Card key={day} className={cx("flex min-h-40 flex-col gap-2 p-3 sm:p-3", day === todayKey && "border-brand")}>
                <p className={cx("text-[13px] font-bold", day === todayKey ? "text-brand" : "text-ink")}>{dayLabel(day)}</p>
                {!slots.length && <p className="text-xs text-copy-muted">No slots published</p>}
                {slots.map((slot) => {
                  const past = new Date(slot.startAt).getTime() <= now;
                  const label = `${fmtTime(slot.startAt)}`;
                  if (slot.appointment) {
                    return (
                      <Link key={slot.id} href={`/doctor/appointments/${slot.appointment.id}`} className={cx("rounded-xl px-2.5 py-2 text-left text-xs font-semibold leading-4 transition hover:opacity-90", slot.status === "HELD" ? "bg-[#fff1dc] text-[#8a4b0f]" : "bg-[#e3f4f2] text-[#00545a]")}>
                        {label}
                        <span className="block truncate font-normal">{slot.appointment.patient.name}</span>
                      </Link>
                    );
                  }
                  return (
                    <button
                      key={slot.id}
                      disabled={past || slot.status === "HELD" || slot.status === "BOOKED" || action.busy === `s${slot.id}`}
                      onClick={() => toggle(slot)}
                      title={slot.status === "AVAILABLE" ? "Click to block this slot" : slot.status === "BLOCKED" ? "Click to open this slot again" : undefined}
                      className={cx(
                        "rounded-xl border px-2.5 py-2 text-left text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
                        slot.status === "BLOCKED" ? "border-dashed border-[#c9d5d4] bg-[#f1f4f5] text-[#4d6266] line-through hover:border-brand" : "border-[#dcebe8] bg-white text-ink hover:border-brand hover:text-brand",
                      )}
                    >
                      {label}
                      <span className="block font-normal text-copy-muted">{slot.status === "BLOCKED" ? "Blocked – tap to open" : past ? "Past" : "Free – tap to block"}</span>
                    </button>
                  );
                })}
              </Card>
            );
          })}
        </div>
      )}
      <p className="mt-4 text-xs text-copy-muted">Slots come from your weekly hours. Add or change hours in <Link href="/doctor/schedule" className="font-semibold text-brand">My Schedule</Link> and publish them to see them here.</p>
    </div>
  );
}

function Legend({ tone, label }: { tone: "open" | "booked" | "held" | "blocked"; label: string }) {
  const cls = { open: "bg-white border border-[#dcebe8]", booked: "bg-[#e3f4f2]", held: "bg-[#fff1dc]", blocked: "bg-[#f1f4f5] border border-dashed border-[#c9d5d4]" }[tone];
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5"><span className={cx("h-3 w-3 rounded", cls)} />{label}</span>;
}
