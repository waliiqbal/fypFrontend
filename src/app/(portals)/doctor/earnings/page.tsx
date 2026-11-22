"use client";

import { useState } from "react";
import { api } from "@/shared/api";
import { fmtDate, rs } from "@/shared/format";
import { Badge, Button, Card, CardHeader, DataTable, EmptyState, ErrorBox, Field, Input, Loading, Modal, Notice, PageHeader, StatCard } from "@/shared/ui";
import { useAction, useApi } from "@/shared/use-api";

type Earnings = {
  totals: { gross: number; commission: number; net: number; count: number };
  items: { id: number; consultationFee: string; platformFee: string | null; doctorEarning: string | null; acceptedAt: string; status: string; patient: { name: string }; slot: { startAt: string } }[];
};

export default function DoctorEarnings() {
  const { data, error, loading } = useApi(() => api.get<Earnings>("/api/doctors/me/earnings"));
  if (loading) return <Loading />;
  if (error || !data) return <ErrorBox message={error ?? "Failed"} />;
  return (
    <div>
      <PageHeader eyebrow="Finance" title="Earnings" description="Fees are collected when you accept a request. AskCare keeps a small platform commission." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Consultations" value={data.totals.count} icon="calendar" />
        <StatCard label="Collected from patients" value={rs(data.totals.gross)} icon="money" />
        <StatCard label="Platform commission" value={rs(data.totals.commission)} tone="warm" />
        <StatCard label="Your earnings" value={rs(data.totals.net)} tone="deep" />
      </div>
      <Payouts />
      <Card className="p-0 sm:p-0">
        <DataTable rows={data.items} rowKey={(r) => r.id} empty={<EmptyState icon="money" title="No earnings yet" />} columns={[
          { header: "Patient", cell: (r) => <span className="font-semibold">{r.patient.name}</span> },
          { header: "Consultation", cell: (r) => fmtDate(r.slot.startAt) },
          { header: "Status", cell: (r) => <Badge value={r.status} /> },
          { header: "Fee", cell: (r) => rs(r.consultationFee) },
          { header: "Commission", cell: (r) => rs(r.platformFee) },
          { header: "You earn", cell: (r) => <b>{rs(r.doctorEarning)}</b> },
        ]} />
      </Card>
    </div>
  );
}

type PayoutSummary = {
  totalEarned: number;
  paidOut: number;
  pending: number;
  available: number;
  minimum: number;
  payouts: { id: number; amount: string | number; status: "REQUESTED" | "PAID" | "REJECTED"; method?: string | null; note?: string | null; requestedAt: string; processedAt?: string | null }[];
};

function Payouts() {
  const { data, error, loading, reload } = useApi(() => api.get<PayoutSummary>("/api/doctors/me/payouts"));
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const action = useAction();
  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;
  const value = Number(amount);
  const valid = value >= data.minimum && value <= data.available;

  async function request() {
    const r = await action.run("p", () => api.post("/api/doctors/me/payouts", { amount: value, method: method.trim() || undefined }));
    if (r) {
      setOpen(false);
      setAmount("");
      setMethod("");
      setFlash(`Payout of ${rs(value)} requested. AskCare will confirm once it is sent.`);
      void reload();
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader
        title="Payouts"
        subtitle="Withdraw your earnings. Requests are reviewed and paid by AskCare."
        action={<Button icon="money" disabled={data.available < data.minimum} onClick={() => { setAmount(String(data.available)); setOpen(true); }}>Request payout</Button>}
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <StatCard label="Available to withdraw" value={rs(data.available)} tone="mint" />
        <StatCard label="Requested (pending)" value={rs(data.pending)} tone="warm" />
        <StatCard label="Paid out" value={rs(data.paidOut)} />
        <StatCard label="Minimum payout" value={rs(data.minimum)} />
      </div>
      {flash && <div className="mb-3"><Notice tone="success">{flash}</Notice></div>}
      <DataTable
        rows={data.payouts}
        rowKey={(r) => r.id}
        empty={<EmptyState icon="money" title="No payouts yet" text={data.available >= data.minimum ? "You can request your first payout now." : `You can request a payout once you have at least ${rs(data.minimum)} available.`} />}
        columns={[
          { header: "Requested", cell: (r) => fmtDate(r.requestedAt) },
          { header: "Amount", cell: (r) => <b>{rs(r.amount)}</b> },
          { header: "Method", cell: (r) => r.method || "—" },
          { header: "Status", cell: (r) => <Badge value={r.status === "REQUESTED" ? "PENDING" : r.status === "PAID" ? "PAID" : "FAILED"} label={r.status === "REQUESTED" ? "Pending" : r.status === "PAID" ? "Paid" : "Rejected"} /> },
          { header: "Note", cell: (r) => r.note || (r.processedAt ? `Processed ${fmtDate(r.processedAt)}` : "—") },
        ]}
      />
      <Modal open={open} title="Request a payout" onClose={() => setOpen(false)} footer={<Button loading={action.busy === "p"} disabled={!valid} onClick={request}>Request {valid ? rs(value) : "payout"}</Button>}>
        <div className="flex flex-col gap-4">
          <Field label="Amount (Rs)" hint={`Between ${rs(data.minimum)} and ${rs(data.available)}.`}><Input type="number" min={data.minimum} max={data.available} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label="Where should we send it?" hint="e.g. bank name and account number, or JazzCash / Easypaisa number"><Input value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Bank / wallet details" /></Field>
          {action.error && <ErrorBox message={action.error} />}
        </div>
      </Modal>
    </Card>
  );
}
