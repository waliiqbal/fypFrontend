"use client";

import { useEffect, useState } from "react";
import { getPatientDashboard } from "../api/patient.api";
import { dashboardFallback } from "../data/dashboard-fallback";
import type { PatientDashboard as DashboardData } from "../types/patient.types";
import { PatientShell } from "./patient-shell";
import { PortalIcon } from "./portal-icon";
import { MedicalRecordsContent } from "./medical-records";

export function PatientDashboard() {
  const [data, setData] = useState<DashboardData>(dashboardFallback);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let active = true;
    getPatientDashboard()
      .then((response) => { if (active) setData(response.data); })
      .catch(() => { if (active) setUsingFallback(true); });
    return () => { active = false; };
  }, []);

  const firstName = data.patient.name.split(" ")[0];

  return (
    <PatientShell patientName={data.patient.name} patientId={data.patient.id}>
      <main className="px-5 py-8 sm:px-9 lg:px-10 lg:py-10">
        {usingFallback && (
          <p className="mb-5 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            Preview data · API unavailable
          </p>
        )}
        <h1 className="text-[2.6rem] font-light tracking-[-0.04em] text-ink">
          Good morning, {firstName}.
        </h1>
        <p className="mt-2 text-sm text-copy-muted sm:text-base">
          Your clinical overview is balanced today. You have one upcoming consultation.
        </p>

        <div className="mt-8 grid gap-5 xl:grid-cols-[1.35fr_.95fr]">
          {/* Appointment Card */}
          <section className="relative min-h-[300px] overflow-hidden rounded-[1.8rem] bg-brand p-7 text-white sm:p-8">
            <div className="absolute -bottom-10 right-3 text-[200px] font-light leading-none text-white/[0.08] select-none">
              ♧
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/75">
              Next appointment
            </p>
            {data.nextAppointment ? (
              <>
                <h2 className="mt-5 text-[1.6rem] font-semibold">{data.nextAppointment.doctorName}</h2>
                <p className="mt-2 text-sm text-white/75">{data.nextAppointment.specialization}</p>
                <div className="mt-6 flex flex-wrap gap-5 text-sm">
                  <span className="flex items-center gap-2">
                    <PortalIcon name="calendar" className="h-5 w-5" />
                    {data.nextAppointment.dateLabel}
                  </span>
                  <span className="flex items-center gap-2">
                    <PortalIcon name="clock" className="h-5 w-5" />
                    {data.nextAppointment.timeLabel}
                  </span>
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  <button className="flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-brand">
                    <PortalIcon name="video" className="h-5 w-5" />
                    Join Video Call
                  </button>
                  <button className="h-11 rounded-xl border border-white/25 bg-white/15 px-5 text-sm font-bold">
                    Reschedule
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-8 text-white/75">No upcoming appointment.</p>
            )}
          </section>

          {/* Info Cards */}
          <div className="flex flex-col gap-5">
            <section className="rounded-[1.4rem] border-l-4 border-brand bg-white p-6 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#94a7ad]">
                Active diagnosis
              </p>
              <h2 className="mt-4 text-xl font-semibold text-ink">
                {data.activeDiagnosis?.name ?? "No active diagnosis"}
              </h2>
              {data.activeDiagnosis && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[#d6f0ed] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1a4a50]">
                    {data.activeDiagnosis.status}
                  </span>
                  <span className="text-xs text-copy-muted">{data.activeDiagnosis.detail}</span>
                </div>
              )}
            </section>

            <section className="rounded-[1.4rem] border-l-4 border-[#985a49] bg-white p-6 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#94a7ad]">
                Next dosage
              </p>
              {data.nextDosage ? (
                <div className="mt-4 flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff0ec] text-[#985a49]">
                    <PortalIcon name="pill" className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-ink">{data.nextDosage.medicine}</h2>
                    <p className="mt-0.5 text-xs text-copy-muted">{data.nextDosage.schedule}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-5 text-copy-muted">No dosage scheduled.</p>
              )}
            </section>
          </div>
        </div>
      </main>

      <MedicalRecordsContent />
    </PatientShell>
  );
}
