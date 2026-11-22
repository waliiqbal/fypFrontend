"use client";

import { useEffect, useState } from "react";
import { api } from "@/shared/api";
import { addDaysIso, todayIso } from "@/shared/format";
import { Button, Card, PageHeader } from "@/shared/ui";
import {
  createAvailability,
  createScheduleException,
  deleteAvailability,
  deleteScheduleException,
  getMyAvailability,
  getMyExceptions,
} from "../api/schedule.api";
import type { AvailabilityInput, AvailabilityRule, ExceptionInput, ScheduleException } from "../types/schedule.types";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const times = Array.from({ length: 25 }, (_, index) => `${String(Math.floor(index / 2) + 8).padStart(2, "0")}:${index % 2 ? "30" : "00"}`).filter((time) => time <= "20:00");

const emptyAvailability: AvailabilityInput = { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", slotDuration: 30 };
const today = new Date().toISOString().slice(0, 10);

export function DoctorSchedule() {
  const [availability, setAvailability] = useState<AvailabilityRule[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [availabilityForm, setAvailabilityForm] = useState<AvailabilityInput>(emptyAvailability);
  const [exceptionForm, setExceptionForm] = useState<ExceptionInput>({ date: today, type: "UNAVAILABLE", reason: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<"availability" | "exception" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshSchedule() {
    setLoading(true);
    setError(null);
    try {
      const [availabilityResponse, exceptionResponse] = await Promise.all([getMyAvailability(), getMyExceptions()]);
      setAvailability(availabilityResponse.data);
      setExceptions(exceptionResponse.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Your schedule could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const loadTimer = window.setTimeout(() => { void refreshSchedule(); }, 0);
    return () => window.clearTimeout(loadTimer);
  }, []);

  async function addAvailability(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting("availability"); setError(null); setNotice(null);
    try {
      await createAvailability(availabilityForm);
      setAvailabilityForm(emptyAvailability);
      setNotice("Your weekly availability has been saved.");
      await refreshSchedule();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Availability could not be saved.");
    } finally { setSubmitting(null); }
  }

  async function addException(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isExtra = exceptionForm.type === "EXTRA_AVAILABILITY";
    if (isExtra && (!exceptionForm.startTime || !exceptionForm.endTime)) {
      setError("Please choose both a start and end time for extra availability."); return;
    }
    setSubmitting("exception"); setError(null); setNotice(null);
    try {
      await createScheduleException(exceptionForm);
      setExceptionForm({ date: today, type: "UNAVAILABLE", reason: "" });
      setNotice("Your schedule exception has been added.");
      await refreshSchedule();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Schedule exception could not be saved.");
    } finally { setSubmitting(null); }
  }

  async function removeAvailability(id: number) {
    setError(null); setNotice(null);
    try { await deleteAvailability(id); setNotice("Availability rule removed."); await refreshSchedule(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Availability could not be removed."); }
  }

  async function removeException(id: number) {
    setError(null); setNotice(null);
    try { await deleteScheduleException(id); setNotice("Schedule exception removed."); await refreshSchedule(); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Schedule exception could not be removed."); }
  }

  return (
    <>
          <PageHeader eyebrow="Practice management" title="My Schedule" description="Set your weekly hours, add time off, then publish bookable slots for patients." actions={<span className="rounded-2xl bg-brand-surface px-4 py-2.5 text-sm font-semibold text-brand">Pakistan Standard Time</span>} />
          <PublishSlots onDone={(msg) => { setError(null); setNotice(msg); }} onError={setError} />
          {(notice || error) && <p className={`mb-6 rounded-2xl px-5 py-4 text-sm font-medium ${error ? "bg-danger-soft text-danger" : "bg-brand-surface text-brand"}`}>{error ?? notice}</p>}

          <section className="grid gap-7 xl:grid-cols-[minmax(0,1.45fr)_380px]">
            <div className="rounded-[1.5rem] bg-white p-5 shadow-[0_18px_45px_rgba(32,65,70,.07)] sm:p-7">
              <div className="flex items-center justify-between gap-4"><div><h2 className="text-2xl font-semibold">Weekly availability</h2><p className="mt-1 text-sm text-copy-muted">Your recurring consultation hours.</p></div><span className="text-sm font-semibold text-brand">{availability.filter((rule) => rule.isActive).length} time blocks</span></div>
              {loading ? <ScheduleSkeleton /> : <div className="mt-7 space-y-3">{days.map((day, dayOfWeek) => <DayRow key={day} day={day} rules={availability.filter((rule) => rule.dayOfWeek === dayOfWeek)} onRemove={removeAvailability} />)}</div>}
            </div>

            <form onSubmit={addAvailability} className="rounded-[1.5rem] bg-surface-muted p-6 sm:p-7"><h2 className="text-2xl font-semibold">Add working hours</h2><p className="mt-2 text-sm leading-6 text-copy-muted">Add another consultation window to a day.</p><label className="mt-6 block text-sm font-semibold">Day<select value={availabilityForm.dayOfWeek} onChange={(event) => setAvailabilityForm((form) => ({ ...form, dayOfWeek: Number(event.target.value) }))} className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-3 outline-none focus:border-brand">{days.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label><div className="mt-4 grid grid-cols-2 gap-3"><TimeField label="Start time" value={availabilityForm.startTime} onChange={(startTime) => setAvailabilityForm((form) => ({ ...form, startTime }))} /><TimeField label="End time" value={availabilityForm.endTime} onChange={(endTime) => setAvailabilityForm((form) => ({ ...form, endTime }))} /></div><label className="mt-4 block text-sm font-semibold">Appointment length<select value={availabilityForm.slotDuration} onChange={(event) => setAvailabilityForm((form) => ({ ...form, slotDuration: Number(event.target.value) }))} className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-3 outline-none focus:border-brand"><option value={15}>15 minutes</option><option value={20}>20 minutes</option><option value={30}>30 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option></select></label><button disabled={submitting !== null} className="mt-7 h-12 w-full rounded-xl bg-brand font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60">{submitting === "availability" ? "Saving…" : "Add working hours"}</button></form>
          </section>

          <section className="mt-8 grid gap-7 xl:grid-cols-[380px_minmax(0,1.45fr)]">
            <form onSubmit={addException} className="rounded-[1.5rem] border border-border bg-white p-6 sm:p-7"><h2 className="text-2xl font-semibold">Time off or extra hours</h2><p className="mt-2 text-sm leading-6 text-copy-muted">Override your weekly schedule for a specific date.</p><label className="mt-6 block text-sm font-semibold">Date<input min={today} type="date" value={exceptionForm.date} onChange={(event) => setExceptionForm((form) => ({ ...form, date: event.target.value }))} className="mt-2 h-12 w-full rounded-xl border border-border px-3 outline-none focus:border-brand" required /></label><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => setExceptionForm((form) => ({ ...form, type: "UNAVAILABLE", startTime: undefined, endTime: undefined }))} className={`rounded-xl px-3 py-3 text-sm font-semibold ${exceptionForm.type === "UNAVAILABLE" ? "bg-brand text-white" : "bg-surface-muted text-copy"}`}>Unavailable</button><button type="button" onClick={() => setExceptionForm((form) => ({ ...form, type: "EXTRA_AVAILABILITY", startTime: form.startTime ?? "09:00", endTime: form.endTime ?? "12:00" }))} className={`rounded-xl px-3 py-3 text-sm font-semibold ${exceptionForm.type === "EXTRA_AVAILABILITY" ? "bg-brand text-white" : "bg-surface-muted text-copy"}`}>Extra hours</button></div>{exceptionForm.type === "EXTRA_AVAILABILITY" && <div className="mt-4 grid grid-cols-2 gap-3"><TimeField label="Start" value={exceptionForm.startTime ?? "09:00"} onChange={(startTime) => setExceptionForm((form) => ({ ...form, startTime }))} /><TimeField label="End" value={exceptionForm.endTime ?? "12:00"} onChange={(endTime) => setExceptionForm((form) => ({ ...form, endTime }))} /></div>}<label className="mt-4 block text-sm font-semibold">Note <span className="font-normal text-copy-muted">(optional)</span><input value={exceptionForm.reason ?? ""} onChange={(event) => setExceptionForm((form) => ({ ...form, reason: event.target.value }))} placeholder="e.g. Medical conference" className="mt-2 h-12 w-full rounded-xl border border-border px-3 outline-none focus:border-brand" /></label><button disabled={submitting !== null} className="mt-6 h-12 w-full rounded-xl border border-brand/30 font-semibold text-brand hover:bg-brand-surface disabled:cursor-not-allowed disabled:opacity-60">{submitting === "exception" ? "Saving…" : "Save schedule change"}</button></form>
            <div className="rounded-[1.5rem] bg-surface-muted p-6 sm:p-7"><div className="flex items-center justify-between gap-4"><div><h2 className="text-2xl font-semibold">Upcoming changes</h2><p className="mt-1 text-sm text-copy-muted">Your planned time away and extra sessions.</p></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand">{exceptions.length} planned</span></div>{loading ? <div className="mt-7 h-32 animate-pulse rounded-2xl bg-white/80" /> : exceptions.length ? <div className="mt-7 space-y-3">{exceptions.map((exception) => <ExceptionRow key={exception.id} exception={exception} onRemove={removeException} />)}</div> : <div className="mt-7 rounded-2xl border border-dashed border-border bg-white/70 p-8 text-center"><p className="font-semibold">No upcoming schedule changes</p><p className="mt-1 text-sm text-copy-muted">Use the form to add time off or extra availability.</p></div>}</div>
          </section>
    </>
  );
}

function PublishSlots({ onDone, onError }: { onDone: (msg: string) => void; onError: (msg: string) => void }) {
  const [days, setDays] = useState(14);
  const [busy, setBusy] = useState(false);
  async function publish() {
    setBusy(true);
    try {
      const res = await api.post<{ generated?: number }>("/api/doctors/me/slots/generate", { from: todayIso(), to: addDaysIso(days) });
      const n = res.data?.generated;
      onDone(`${n !== undefined ? `${n} slots` : "Slots"} published for the next ${days} days. Patients can now book you.`);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not publish slots");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card className="mb-6 flex flex-wrap items-center gap-4 border-[#bfe0dc] bg-[#f3fbfa]">
      <div className="min-w-[220px] flex-1">
        <h2 className="text-[17px] font-bold">Publish bookable slots</h2>
        <p className="mt-1 text-[13px] text-copy-muted">After changing your hours, publish slots so patients can book. Already booked slots are never changed.</p>
      </div>
      <label className="text-[13px] font-semibold text-copy">Next
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="ml-2 h-11 rounded-xl border border-border bg-white px-3">
          <option value={7}>7 days</option><option value={14}>14 days</option><option value={30}>30 days</option><option value={60}>60 days</option>
        </select>
      </label>
      <Button icon="calendar" loading={busy} onClick={publish}>Publish slots</Button>
    </Card>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-sm font-semibold">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-2 outline-none focus:border-brand">{times.map((time) => <option key={time} value={time}>{formatTime(time)}</option>)}</select></label>; }
function DayRow({ day, rules, onRemove }: { day: string; rules: AvailabilityRule[]; onRemove: (id: number) => void }) { return <article className="flex flex-col gap-3 rounded-2xl border border-border px-4 py-4 sm:flex-row sm:items-center"><div className="w-28 shrink-0 font-semibold">{day}</div>{rules.length ? <div className="flex flex-1 flex-wrap gap-2">{rules.map((rule) => <span key={rule.id} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${rule.isActive ? "bg-brand-surface text-brand" : "bg-slate-100 text-copy-muted"}`}>{formatTime(rule.startTime)} – {formatTime(rule.endTime)} <small className="text-xs opacity-75">{rule.slotDuration}m</small><button aria-label={`Remove ${day} availability`} type="button" onClick={() => onRemove(rule.id)} className="ml-1 font-bold leading-none opacity-60 hover:opacity-100">×</button></span>)}</div> : <p className="flex-1 text-sm text-copy-muted">Not available</p>}<span className={`h-2.5 w-2.5 rounded-full ${rules.some((rule) => rule.isActive) ? "bg-emerald-500" : "bg-slate-300"}`} /></article>; }
function ExceptionRow({ exception, onRemove }: { exception: ScheduleException; onRemove: (id: number) => void }) { const extra = exception.type === "EXTRA_AVAILABILITY"; return <article className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4"><span className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg ${extra ? "bg-brand-surface text-brand" : "bg-danger-soft text-danger"}`}>{extra ? "+" : "–"}</span><div className="min-w-[150px] flex-1"><p className="font-semibold">{new Date(`${exception.date.slice(0, 10)}T00:00:00`).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</p><p className="mt-0.5 text-sm text-copy-muted">{extra ? `${formatTime(exception.startTime ?? "")} – ${formatTime(exception.endTime ?? "")}` : "Unavailable all day"}{exception.reason ? ` · ${exception.reason}` : ""}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${extra ? "bg-brand-surface text-brand" : "bg-danger-soft text-danger"}`}>{extra ? "Extra hours" : "Time off"}</span><button type="button" onClick={() => onRemove(exception.id)} className="text-sm font-semibold text-copy-muted hover:text-danger">Remove</button></article>; }
function ScheduleSkeleton() { return <div className="mt-7 space-y-3">{days.map((day) => <div key={day} className="h-[67px] animate-pulse rounded-2xl bg-surface-muted" />)}</div>; }
function formatTime(time: string) { if (!time) return ""; const [hour, minute] = time.split(":").map(Number); return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`; }
