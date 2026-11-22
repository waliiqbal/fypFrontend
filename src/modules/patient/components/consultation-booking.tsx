"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { getProfile, getSpecializations } from "@/modules/auth/api/auth.api";
import type { UserProfile } from "@/modules/auth/types/auth.types";
import { openAppointmentCheckout, getDoctors, getDoctorSlots } from "../api/doctor.api";
import { doctorListingFallback } from "../data/doctor-listing-fallback";
import type { DoctorListing, DoctorSlot } from "../types/doctor.types";
import { PatientShell } from "./patient-shell";
import { PortalIcon } from "./portal-icon";

type Availability = "today" | "tomorrow" | "week";
type FilterState = { specialty: string; availability: Availability | null };

const emptyFilters: FilterState = { specialty: "All Specialties", availability: null };
const availabilityOptions: { label: string; value: Availability }[] = [
  { label: "Available Today", value: "today" },
  { label: "Available Tomorrow", value: "tomorrow" },
  { label: "Available this Week", value: "week" },
];

export function ConsultationBooking() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [doctors, setDoctors] = useState<DoctorListing[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [usingMockDoctors, setUsingMockDoctors] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorListing | null>(null);
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [draftFilters, setDraftFilters] = useState<FilterState>(emptyFilters);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([getProfile(), getSpecializations()]).then(([profileResult, specialtiesResult]) => {
      if (!active) return;
      if (profileResult.status === "fulfilled") setProfile(profileResult.value.data);
      if (specialtiesResult.status === "fulfilled") {
        setSpecialties(specialtiesResult.value.data.map((item) => item.name));
      } else {
        setSpecialties([...new Set(doctorListingFallback.flatMap((doctor) => doctor.specializations.map((item) => item.name)))]);
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    getDoctors({
      search: debouncedSearch || undefined,
      specialization: filters.specialty === "All Specialties" ? undefined : filters.specialty,
      availability: filters.availability ?? undefined,
      limit: 50,
    })
      .then((response) => {
        if (!active) return;
        setDoctors(response.data);
        setUsingMockDoctors(false);
      })
      .catch((error) => {
        if (!active) return;
        setDoctors(filterMockDoctors(doctorListingFallback, debouncedSearch, filters));
        setUsingMockDoctors(true);
        setListError(error instanceof Error ? error.message : "Doctor API unavailable.");
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [debouncedSearch, filters]);

  useEffect(() => {
    if (!filterOpen && !selectedDoctor) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setFilterOpen(false);
        setSelectedDoctor(null);
      }
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [filterOpen, selectedDoctor]);

  function openFilters() {
    setDraftFilters(filters);
    setFilterOpen(true);
  }

  function resetFilters() {
    setDraftFilters({ ...emptyFilters });
    setIsLoading(true);
    setListError(null);
    setFilters({ ...emptyFilters });
    setFilterOpen(false);
  }

  return (
    <PatientShell patientName={profile?.name ?? "Patient"} patientId={profile?.id}>
      <main className="min-h-[720px] px-5 py-10 sm:px-9 lg:px-10 lg:py-14">
        <header className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-brand">Book consultation</p>
          <h1 className="mt-4 text-4xl font-light tracking-[-0.04em] text-ink sm:text-5xl">Find your specialist.</h1>
          <p className="mt-4 text-base leading-7 text-copy-muted sm:text-lg">Verified medical professionals available for secure video consultations.</p>
        </header>

        <section className="mt-10 w-full lg:w-1/2" aria-label="Search doctors">
          <label htmlFor="doctor-search" className="text-[11px] font-bold uppercase tracking-[.15em] text-[#53666c]">Doctor name</label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <input id="doctor-search" value={search} onChange={(event) => { setSearch(event.target.value); setIsLoading(true); setListError(null); }} placeholder="Search doctor by name..." className="h-14 w-full rounded-2xl border border-transparent bg-surface-input px-5 pr-12 text-ink outline-none focus:border-brand focus:bg-white" />
              <PortalIcon name="search" className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#71858b]" />
            </div>
            <button type="button" onClick={openFilters} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-surface-input px-6 font-semibold text-ink"><PortalIcon name="filter" className="h-5 w-5" />Filters</button>
          </div>
        </section>

        {usingMockDoctors && <p className="mt-5 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">Preview data · Doctor API unavailable</p>}

        {isLoading ? (
          <StatusCard title="Loading specialists..." detail="Please wait while available doctors are fetched." />
        ) : listError && !usingMockDoctors ? (
          <StatusCard title="Unable to load specialists" detail={listError} tone="error" />
        ) : doctors.length ? (
          <section className="mt-10 grid gap-7 md:grid-cols-2" aria-label="Available doctors">
            {doctors.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} onBook={setSelectedDoctor} />)}
          </section>
        ) : (
          <StatusCard title="No specialists found" detail="Try another doctor name or change your filters." />
        )}
      </main>

      {filterOpen && (
        <FilterDrawer
          specialties={specialties}
          filters={draftFilters}
          onChange={setDraftFilters}
          onApply={() => { setIsLoading(true); setListError(null); setFilters({ ...draftFilters }); setFilterOpen(false); }}
          onReset={resetFilters}
          onClose={() => setFilterOpen(false)}
        />
      )}

      {selectedDoctor && <BookingModal doctor={selectedDoctor} onClose={() => setSelectedDoctor(null)} />}
    </PatientShell>
  );
}

function FilterDrawer({ specialties, filters, onChange, onApply, onReset, onClose }: {
  specialties: string[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="filter-title">
      <button type="button" aria-label="Close filters" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-[#182528]/45 backdrop-blur-sm" />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[500px] flex-col bg-white shadow-2xl">
        <header className="flex h-24 shrink-0 items-center justify-between border-b border-slate-100 px-7 sm:px-10">
          <h2 id="filter-title" className="text-2xl font-semibold text-ink">Filters</h2>
          <button type="button" onClick={onClose} aria-label="Close filters" className="text-4xl font-light leading-none text-[#52656b]">×</button>
        </header>
        <div className="flex-1 overflow-y-auto px-7 py-10 sm:px-10">
          <FilterSection title="Specialty">
            <div className="flex flex-wrap gap-3">
              {["All Specialties", ...specialties].map((specialty) => (
                <button type="button" key={specialty} onClick={() => onChange({ ...filters, specialty })} className={`rounded-2xl border px-5 py-3 text-sm font-medium transition ${filters.specialty === specialty ? "border-2 border-brand bg-brand-surface text-brand" : "border-border text-ink hover:border-brand/50"}`}>{specialty}</button>
              ))}
            </div>
          </FilterSection>
          <FilterSection title="Availability">
            <div className="space-y-5">
              {availabilityOptions.map(({ label, value }) => (
                <label key={value} className="flex cursor-pointer items-center gap-4 text-base text-ink">
                  <input type="checkbox" checked={filters.availability === value} onChange={() => onChange({ ...filters, availability: filters.availability === value ? null : value })} className="h-5 w-5 accent-brand" />
                  {label}
                </label>
              ))}
            </div>
          </FilterSection>
        </div>
        <footer className="flex shrink-0 gap-4 border-t border-border bg-surface-muted p-6 sm:px-9">
          <button type="button" onClick={onApply} className="h-14 flex-1 rounded-2xl bg-brand font-bold text-white hover:bg-brand-hover">Apply Filters</button>
          <button type="button" onClick={onReset} className="h-14 rounded-2xl bg-white px-7 font-bold text-ink">Reset</button>
        </footer>
      </aside>
    </div>
  );
}

function DoctorCard({ doctor, onBook }: { doctor: DoctorListing; onBook: (doctor: DoctorListing) => void }) {
  const primaryClinic = doctor.clinics.find((clinic) => clinic.isPrimary) ?? doctor.clinics[0];
  const location = primaryClinic ? [primaryClinic.address, primaryClinic.city].filter(Boolean).join(", ") : doctor.address ?? "Online consultation";
  const fee = primaryClinic?.consultationFee ?? doctor.consultationFee;
  return (
    <article className="overflow-hidden rounded-[1.6rem] bg-white shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="h-64 bg-[#dcebed]">
        {/* API profile URLs may be local or remote, so native img is intentional here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={doctor.profileImage || "/doctor-placeholder.svg"} alt={`Portrait of ${doctor.name}`} className="h-full w-full object-cover" />
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-xl font-semibold text-ink">{doctor.name}</h2><p className="mt-1 text-sm font-medium text-brand">{specializationLabel(doctor)}</p></div>
          {doctor.experience !== null && <p className="shrink-0 text-sm font-bold text-[#985a49]">{doctor.experience} yrs</p>}
        </div>
        <div className="mt-6 space-y-3 text-sm text-[#61747a]">
          <p className="flex items-center gap-2"><PortalIcon name="location" className="h-5 w-5" />{location}</p>
          <p className="flex items-center gap-2"><PortalIcon name="payment" className="h-5 w-5" />{fee === null ? "Fee not set" : `PKR ${fee.toLocaleString()}`}</p>
        </div>
        <button type="button" onClick={() => onBook(doctor)} className="mt-7 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-brand font-bold text-white transition hover:bg-brand-hover">Book Video Call <PortalIcon name="video" className="h-5 w-5" /></button>
      </div>
    </article>
  );
}

function BookingModal({ doctor, onClose }: { doctor: DoctorListing; onClose: () => void }) {

  const [visibleMonth, setVisibleMonth] = useState(getKarachiMonth());
  const [slots, setSlots] = useState<DoctorSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [slotError, setSlotError] = useState<string | null>(null);
  const checkoutInFlight = useRef(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [usingMockSlots, setUsingMockSlots] = useState(false);
  const calendarCells = buildCalendar(visibleMonth);
  const monthLabel = visibleMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const range = monthRange(visibleMonth);

  useEffect(() => {
    let active = true;
    const request = doctor.id < 0
      ? Promise.reject(new Error("Preview doctor"))
      : getDoctorSlots(doctor.id, range.from, range.to);
    request
      .then((response) => {
        if (!active) return;
        setSlots(response.data);
        setUsingMockSlots(false);
      })
      .catch(() => {
        if (!active) return;
        setSlots(createMockSlots(visibleMonth));
        setUsingMockSlots(true);
      })
      .finally(() => { if (active) setIsLoadingSlots(false); });
    return () => { active = false; };
  }, [doctor.id, range.from, range.to, visibleMonth]);

  const slotsByDate = useMemo(() => {
    const grouped = new Map<string, DoctorSlot[]>();
    slots.forEach((slot) => {
      const key = karachiDateKey(slot.startAt);
      grouped.set(key, [...(grouped.get(key) ?? []), slot]);
    });
    return grouped;
  }, [slots]);
  const selectedSlots = selectedDate ? slotsByDate.get(selectedDate) ?? [] : [];
  const fee = doctor.clinics.find((clinic) => clinic.isPrimary)?.consultationFee ?? doctor.consultationFee;

  function changeMonth(amount: number) {
    setIsLoadingSlots(true);
    setSlotError(null);
    setSelectedDate(null);
    setSelectedSlotId(null);
    setBookingMessage(null);
    setVisibleMonth((date) => new Date(date.getFullYear(), date.getMonth() + amount, 1));
  }

  async function continueToPayment() {
    const slot = slots.find((item) => item.id === selectedSlotId);
    if (!slot || checkoutInFlight.current || isBooking || usingMockSlots || doctor.id < 0) return;
    if (new Date(slot.startAt).getTime() < Date.now() + 35 * 60 * 1000) {
      setBookingMessage("Please select a slot at least 35 minutes from now.");
      return;
    }
    checkoutInFlight.current = true;
    setIsBooking(true);
    setBookingMessage(null);
    try {
      await openAppointmentCheckout(slot.id);
    } catch (error) {
      setBookingMessage(error instanceof Error ? error.message : "Unable to open checkout. Please retry.");
      checkoutInFlight.current = false;
      setIsBooking(false);
    }
  }  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="booking-title">
      <button type="button" aria-label="Close booking" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-[#182528]/45 backdrop-blur-sm" />
      <div className="relative grid h-[82vh] w-full max-w-5xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl md:grid-cols-[34%_66%]">
        <aside className="overflow-y-auto bg-surface-muted p-6 sm:p-8">
          <div className="h-36 w-36 overflow-hidden rounded-[1.5rem] bg-[#dcebed] shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={doctor.profileImage || "/doctor-placeholder.svg"} alt={`Portrait of ${doctor.name}`} className="h-full w-full object-cover" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-ink">{doctor.name}</h2>
          <p className="mt-1 text-sm font-semibold text-brand">{specializationLabel(doctor)}</p>
          <section className="mt-8"><h3 className="text-xs font-bold uppercase tracking-[.15em] text-[#53666c]">Professional profile</h3><p className="mt-3 text-sm leading-6 text-[#53666c]">{doctor.experience ? `${doctor.experience} years of clinical experience.` : "Verified Askare medical professional."}{doctor.licenseNumber ? ` License: ${doctor.licenseNumber}.` : ""}</p></section>
        </aside>

        <section className="relative overflow-y-auto px-6 py-8 sm:px-10 sm:py-10">
          <button type="button" onClick={onClose} aria-label="Close booking" className="absolute right-6 top-5 text-4xl font-light text-ink sm:right-10">×</button>
          <h2 id="booking-title" className="pr-12 text-2xl font-semibold text-ink">Schedule Video Call</h2>
          <div className="mt-9 flex items-center justify-between gap-5">
            <h3 className="text-sm font-bold uppercase tracking-[.12em] text-[#53666c]">{monthLabel}</h3>
            <div className="flex gap-3"><button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" className="h-9 w-9 rounded-full border border-slate-300 text-xl">‹</button><button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className="h-9 w-9 rounded-full border border-slate-300 text-xl">›</button></div>
          </div>

          {slotError && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{slotError}</p>}
          {usingMockSlots && <p className="mt-5 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">Preview slots · Availability API unavailable</p>}
          <div className="mt-6 grid grid-cols-7 gap-2 text-center">
            {weekdays.map((day) => <span key={day} className="py-2 text-[11px] font-bold text-[#75868b]">{day}</span>)}
            {calendarCells.map((day, index) => {
              if (day === null) return <span key={`empty-${index}`} />;
              const date = toDateKey(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
              const available = slotsByDate.has(date);
              return <button type="button" key={date} disabled={!available || isLoadingSlots} onClick={() => { setSelectedDate(date); setSelectedSlotId(null); setBookingMessage(null); }} className={`aspect-square rounded-xl border text-sm transition ${selectedDate === date ? "border-brand bg-brand font-bold text-white shadow-md" : available ? "border-border text-ink hover:border-brand" : "cursor-not-allowed border-transparent text-slate-300"}`}>{day}</button>;
            })}
          </div>

          <section className="mt-9">
            <h3 className="text-xs font-bold uppercase tracking-[.15em] text-[#53666c]">Available time slots</h3>
            {isLoadingSlots ? <p className="mt-5 text-sm text-copy-muted">Loading available slots...</p> : selectedDate ? (
              selectedSlots.length ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{selectedSlots.map((slot) => <button type="button" key={slot.id} onClick={() => { setSelectedSlotId(slot.id); setBookingMessage(null); }} className={`h-13 rounded-xl border text-sm font-medium transition ${selectedSlotId === slot.id ? "border-2 border-brand/40 bg-brand-surface font-bold text-brand" : "border-border text-ink hover:border-brand"}`}>{karachiTimeLabel(slot.startAt)}</button>)}</div> : <p className="mt-5 text-sm text-copy-muted">No slots remain for this date.</p>
            ) : <p className="mt-5 text-sm text-copy-muted">Select an available date to view its time slots.</p>}
          </section>

          {bookingMessage && <p role="status" className="mt-6 rounded-xl bg-brand-surface p-3 text-sm font-medium text-brand">{bookingMessage}</p>}
          <div className="mt-7 rounded-2xl bg-brand-surface p-4 text-sm leading-6 text-brand">
            <p className="font-semibold">Payment before doctor confirmation</p>
            <p className="mt-1">Your payment will be authorized now and collected only after the doctor accepts. Your appointment is not confirmed yet.</p>
            <p className="mt-2 text-xs">Sandbox checkout — use Stripe test payment details. No real money is charged.</p>
          </div>
          {usingMockSlots && <p className="mt-3 text-sm text-amber-700">Preview slots cannot be paid for. Please try again when availability is connected.</p>}
          {fee === null && <p className="mt-3 text-sm text-rose-700">Payment is unavailable until the doctor sets a consultation fee.</p>}
          <footer className="mt-9 flex flex-col gap-5 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-[11px] font-bold uppercase tracking-[.12em] text-copy-muted">Total fee</p><p className="mt-1 text-xl font-bold text-ink">{fee === null ? "Not set" : `PKR ${fee.toLocaleString()}`}</p></div>
            <button type="button" onClick={continueToPayment} disabled={!selectedSlotId || isLoadingSlots || isBooking || fee === null || usingMockSlots || doctor.id < 0} className="h-13 rounded-xl bg-brand px-7 text-base font-bold text-white shadow-lg transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50">{isBooking ? "Redirecting to Stripe..." : "Continue to Payment"} <span className="ml-2">→</span></button>
          </footer>
        </section>
      </div>
    </div>
  );
}

const weekdays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mb-12 last:mb-0"><h3 className="mb-6 text-xs font-bold uppercase tracking-[.15em] text-[#53666c]">{title}</h3>{children}</section>;
}

function StatusCard({ title, detail, tone = "normal" }: { title: string; detail: string; tone?: "normal" | "error" }) {
  return <section className={`mt-10 rounded-[1.5rem] px-6 py-16 text-center shadow-sm ${tone === "error" ? "bg-rose-50" : "bg-white"}`}><h2 className="text-xl font-semibold text-ink">{title}</h2><p className={`mt-2 text-sm ${tone === "error" ? "text-rose-700" : "text-copy-muted"}`}>{detail}</p></section>;
}

function specializationLabel(doctor: DoctorListing) {
  return doctor.specializations.map((item) => item.name).join(" · ") || "Medical Specialist";
}

function filterMockDoctors(doctors: DoctorListing[], search: string, filters: FilterState) {
  const query = search.toLowerCase();
  return doctors.filter((doctor) => {
    const matchesName = !query || doctor.name.toLowerCase().includes(query);
    const matchesSpecialty = filters.specialty === "All Specialties" || doctor.specializations.some((item) => item.name === filters.specialty);
    return matchesName && matchesSpecialty;
  });
}

function createMockSlots(month: Date): DoctorSlot[] {
  const now = new Date();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const candidateDays = [5, 10, 15, 20, 25, daysInMonth].filter((day, index, values) => day <= daysInMonth && values.indexOf(day) === index);
  const times = ["09:00", "10:30", "13:30", "16:00"];
  const slots: DoctorSlot[] = [];

  candidateDays.forEach((day) => {
    const date = toDateKey(month.getFullYear(), month.getMonth(), day);
    times.forEach((time, index) => {
      const start = new Date(`${date}T${time}:00+05:00`);
      if (start <= now) return;
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      slots.push({ id: -(day * 100 + index + 1), startAt: start.toISOString(), endAt: end.toISOString() });
    });
  });
  return slots;
}

function buildCalendar(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const mondayOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return [...Array<null>(mondayOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
}

function getKarachiMonth() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", year: "numeric", month: "numeric" }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return new Date(year, month - 1, 1);
}

function monthRange(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  return { from: toDateKey(year, monthIndex, 1), to: toDateKey(year, monthIndex, new Date(year, monthIndex + 1, 0).getDate()) };
}

function toDateKey(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function karachiDateKey(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function karachiTimeLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Karachi", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
