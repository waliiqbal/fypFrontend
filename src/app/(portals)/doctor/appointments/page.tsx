"use client";

import { useMemo, useState } from "react";
import { api } from "@/shared/api";
import { fmtDateTime, rs } from "@/shared/format";
import type { Appointment } from "@/shared/types";
import { Avatar, Badge, Card, DataTable, EmptyState, ErrorBox, LinkButton, Loading, PageHeader, SearchBox, Tabs } from "@/shared/ui";
import { useApi } from "@/shared/use-api";

type Tab = "upcoming" | "completed" | "cancelled" | "all";

export default function DoctorAppointments() {
  const { data, error, loading, reload } = useApi(() => api.get<Appointment[]>("/api/doctors/me/appointments"));
  const [tab, setTab] = useState<Tab>("upcoming");
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const list = (data ?? []).filter((a) => a.status !== "PENDING");
    const byTab = tab === "upcoming" ? list.filter((a) => a.status === "CONFIRMED").sort((a, b) => +new Date(a.slot.startAt) - +new Date(b.slot.startAt))
      : tab === "completed" ? list.filter((a) => a.status === "COMPLETED" || a.status === "NO_SHOW")
      : tab === "cancelled" ? list.filter((a) => a.status === "CANCELLED") : list;
    return byTab.filter((a) => `${a.patient?.name} ${a.reason ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  }, [data, tab, q]);

  return (
    <div>
      <PageHeader eyebrow="Patient care" title="Appointments" description="Accepted consultations and history. New requests are under Requests." />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onChange={setTab} items={[{ value: "upcoming", label: "Upcoming" }, { value: "completed", label: "Completed" }, { value: "cancelled", label: "Cancelled" }, { value: "all", label: "All" }]} />
        <SearchBox value={q} onChange={setQ} placeholder="Search patient" />
      </div>
      {error && <ErrorBox message={error} onRetry={reload} />}
      <Card className="p-0 sm:p-0">
        {loading ? <Loading /> : (
          <DataTable rows={rows} rowKey={(a) => a.id} empty={<EmptyState icon="calendar" title="No appointments" />} columns={[
            { header: "Patient", cell: (a) => <div className="flex items-center gap-3"><Avatar name={a.patient?.name} size={38} /><span className="font-semibold">{a.patient?.name}</span></div> },
            { header: "When", cell: (a) => fmtDateTime(a.slot.startAt) },
            { header: "Type", cell: (a) => <Badge value={a.consultationType} /> },
            { header: "Status", cell: (a) => <Badge value={a.status} /> },
            { header: "Fee", cell: (a) => rs(a.consultationFee) },
            { header: "", className: "text-right", cell: (a) => (
              <div className="flex justify-end gap-2">
                {a.status === "CONFIRMED" && a.consultationType === "VIDEO" && <LinkButton href={`/doctor/call/${a.id}`} icon="video" className="h-9">Call</LinkButton>}
                <LinkButton href={`/doctor/appointments/${a.id}`} variant="secondary" className="h-9">Open</LinkButton>
              </div>
            ) },
          ]} />
        )}
      </Card>
    </div>
  );
}
