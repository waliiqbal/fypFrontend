"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/infrastructure/http/api-client";
import { PatientShell } from "./patient-shell";

type Archive = {
  patient: { id: number; name: string };
  consultations: { date: string; doctor: string; title: string }[];
  prescriptions: { medicine: string; detail: string; tone?: "blue" | "coral" }[];
  journey: { date: string; title: string; detail: string; active?: boolean }[];
};

const fallback: Archive = {
  patient: { id: 88219, name: "Wali Iqbal" },
  consultations: [
    { date: "SEP 12, 2025", doctor: "Dr. Julian Vance", title: "General Wellness Audit" },
    { date: "JUL 04, 2025", doctor: "Dr. Sarah Patel", title: "Ophthalmology Check" },
  ],
  prescriptions: [
    { medicine: "Amoxicillin 500mg", detail: "Course ended Aug 20, 2025", tone: "blue" },
    { medicine: "Prednisone Taper", detail: "Course ended May 12, 2025", tone: "coral" },
  ],
  journey: [
    { date: "PRESENT", title: "Hypertension Mgmt", detail: "Active management of blood pressure.", active: true },
    { date: "JAN 2025", title: "Seasonal Influenza", detail: "Resolved with standard antiviral course." },
    { date: "NOV 2024", title: "Vitamin D Deficiency", detail: "Baseline restored through supplements." },
  ],
};

export function MedicalRecords() {
  return <PatientShell><MedicalRecordsContent /></PatientShell>;
}

export function MedicalRecordsContent() {
  const [data, setData] = useState(fallback);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest<{ data: Archive }>("/api/patient/medical-records", { authenticated: true })
      .then((r) => { if (active) setData(r.data); })
      .catch(() => { if (active) setPreview(true); });
    return () => { active = false; };
  }, []);

  return (
    <section className="border-t border-[#e8edf0] bg-white px-5 py-10 sm:px-9 lg:px-10 lg:py-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Clinical Archive</h1>
          {preview && (
            <p className="mt-1.5 text-[11px] font-medium text-amber-700">
              Preview data · API unavailable
            </p>
          )}
        </div>
        <div className="rounded-full bg-[#f0f4f5] p-1 text-xs">
          <button className="rounded-full bg-surface-muted px-5 py-2 font-semibold text-brand">
            Timeline View
          </button>
          <button className="px-5 py-2 text-copy-muted">List View</button>
        </div>
      </div>

      {/* Columns */}
      <div className="mt-8 grid gap-7 xl:grid-cols-3">
        {/* Consultation History */}
        <ArchiveColumn icon="↶" title="Consultation History">
          {data.consultations.map((item) => (
            <article key={item.date} className="rounded-2xl bg-[#f0f4f5] p-5">
              <p className="text-[11px] font-bold text-copy-muted">{item.date}</p>
              <h2 className="mt-2 text-lg font-semibold text-ink">{item.doctor}</h2>
              <p className="mt-1 text-sm text-copy-muted">{item.title}</p>
              <button className="mt-4 flex items-center gap-1 text-sm font-bold text-brand">
                VIEW SUMMARY <span>→</span>
              </button>
            </article>
          ))}
        </ArchiveColumn>

        {/* Prescription Archive */}
        <ArchiveColumn icon="▣" title="Prescription Archive">
          {data.prescriptions.map((item) => (
            <article
              key={item.medicine}
              className={`rounded-2xl border-l-4 bg-[#f0f4f5] p-5 ${
                item.tone === "coral" ? "border-[#ef9b86]" : "border-[#93c5d6]"
              }`}
            >
              <h2 className="text-lg font-semibold text-ink">{item.medicine}</h2>
              <p className="mt-2 text-sm text-copy-muted">{item.detail}</p>
            </article>
          ))}
        </ArchiveColumn>

        {/* Health Journey */}
        <ArchiveColumn icon="⌁" title="Health Journey">
          <div className="space-y-0">
            {data.journey.map((item) => (
              <article key={item.date} className="relative border-l-2 border-[#d5dfe2] pb-7 pl-6 last:pb-0">
                <span
                  className={`absolute -left-[6px] top-0.5 h-2.5 w-2.5 rounded-full ${
                    item.active ? "bg-brand" : "bg-copy-muted"
                  }`}
                />
                <p className={`text-[11px] font-bold ${item.active ? "text-brand" : "text-copy-muted"}`}>
                  {item.date}
                </p>
                <h2 className="mt-1.5 text-lg font-semibold text-ink">{item.title}</h2>
                <p className="mt-1 text-xs text-copy-muted">{item.detail}</p>
              </article>
            ))}
          </div>
        </ArchiveColumn>
      </div>
    </section>
  );
}

function ArchiveColumn({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.13em] text-[#4a5f66]">
        <span>{icon}</span> {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
