"use client";

import { useState } from "react";
import { api } from "@/shared/api";
import { downloadFile } from "@/shared/download";
import { fmtDateTime, rs } from "@/shared/format";
import type { AppointmentStatus, PaymentStatus } from "@/shared/types";
import { Badge, Button, Card, DataTable, EmptyState, ErrorBox, Loading, Notice, PageHeader, StatCard } from "@/shared/ui";
import { useAction, useApi } from "@/shared/use-api";

type Payments = {
  totals: { paid: number; held: number; refunded: number; count: number };
  items: {
    id: number;
    status: AppointmentStatus;
    paymentStatus: PaymentStatus;
    consultationFee: string | number;
    consultationType: "VIDEO" | "IN_PERSON";
    paymentAuthorizedAt?: string | null;
    createdAt: string;
    slot: { startAt: string };
    doctor: { id: number; name: string };
  }[];
};

export default function PatientPayments() {
  const { data, error, loading, reload } = useApi(() => api.get<Payments>("/api/patients/me/payments"));
  const action = useAction();
  const [flash, setFlash] = useState<string | null>(null);

  async function receipt(id: number) {
    setFlash(null);
    const ok = await action.run(`r${id}`, () => downloadFile(`/api/patients/me/payments/${id}/receipt`, `receipt-appointment-${id}.pdf`).then(() => true));
    if (ok) setFlash("Receipt downloaded.");
  }

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader eyebrow="Billing" title="Payments" description="Your card is only held when you book. You are charged after the doctor accepts, and the hold is released if the request is declined or expires." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Charged" value={rs(data.totals.paid)} icon="money" tone="deep" />
        <StatCard label="On hold (awaiting doctor)" value={rs(data.totals.held)} tone="warm" />
        <StatCard label="Refunded" value={rs(data.totals.refunded)} tone="mint" />
        <StatCard label="Payments" value={data.totals.count} icon="file" />
      </div>
      {flash && <div className="mb-4"><Notice tone="success">{flash}</Notice></div>}
      {action.error && <div className="mb-4"><ErrorBox message={action.error} /></div>}
      <Card className="p-0 sm:p-0">
        <DataTable
          rows={data.items}
          rowKey={(r) => r.id}
          empty={<EmptyState icon="money" title="No payments yet" text="Your payments and receipts appear here after you book a consultation." />}
          columns={[
            { header: "Doctor", cell: (r) => <span className="font-semibold">Dr. {r.doctor.name}</span> },
            { header: "Consultation", cell: (r) => <div><p>{fmtDateTime(r.slot.startAt)}</p><p className="text-xs text-copy-muted">{r.consultationType === "VIDEO" ? "Video" : "In-person"}</p></div> },
            { header: "Amount", cell: (r) => <b>{rs(r.consultationFee)}</b> },
            { header: "Payment", cell: (r) => <Badge value={r.paymentStatus} /> },
            { header: "Appointment", cell: (r) => <Badge value={r.status} /> },
            { header: "", className: "text-right", cell: (r) => (r.paymentStatus === "AUTHORIZED" || r.paymentStatus === "PAID" || r.paymentStatus === "REFUNDED") ? <Button variant="secondary" icon="download" className="h-9" loading={action.busy === `r${r.id}`} onClick={() => receipt(r.id)}>Receipt</Button> : null },
          ]}
        />
      </Card>
    </div>
  );
}
