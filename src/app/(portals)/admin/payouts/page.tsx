"use client";

import { useState } from "react";
import { api } from "@/shared/api";
import { fmtDateTime, rs } from "@/shared/format";
import { Badge, Button, Card, DataTable, EmptyState, ErrorBox, Field, Loading, Modal, Notice, PageHeader, Pager, StatCard, Tabs, Textarea } from "@/shared/ui";
import { useAction, useApi } from "@/shared/use-api";

type Payout = {
  id: number;
  amount: string | number;
  status: "REQUESTED" | "PAID" | "REJECTED";
  method?: string | null;
  note?: string | null;
  requestedAt: string;
  processedAt?: string | null;
  doctor: { id: number; name: string; email: string; hospital?: { name: string } | null };
};
type Filter = "REQUESTED" | "PAID" | "REJECTED" | "";

export default function AdminPayouts() {
  const [status, setStatus] = useState<Filter>("REQUESTED");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<{ payout: Payout; decision: "PAID" | "REJECTED" } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const { data, meta, error, loading, reload } = useApi(() => api.get<Payout[]>("/api/super-admin/payouts", { status, page }), [status, page]);
  const pendingCount = Number(meta?.pendingCount ?? 0);
  const pendingAmount = Number(meta?.pendingAmount ?? 0);

  return (
    <div>
      <PageHeader eyebrow="Money" title="Doctor Payouts" description="Doctors request to withdraw their earnings. Send the money to the account they gave you, then mark the request as paid." />
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <StatCard label="Waiting to be paid" value={pendingCount} icon="inbox" tone="warm" />
        <StatCard label="Total requested" value={rs(pendingAmount)} icon="money" tone="deep" />
      </div>
      <div className="mb-5"><Tabs value={status} onChange={(v) => { setStatus(v); setPage(1); }} items={[{ value: "REQUESTED", label: "Waiting" }, { value: "PAID", label: "Paid" }, { value: "REJECTED", label: "Rejected" }, { value: "", label: "All" }]} /></div>
      {flash && <div className="mb-4"><Notice tone="success">{flash}</Notice></div>}
      {error && <div className="mb-4"><ErrorBox message={error} onRetry={reload} /></div>}
      <Card className="p-0 sm:p-0">
        {loading && !data ? <Loading /> : (
          <DataTable rows={data ?? []} rowKey={(p) => p.id} empty={<EmptyState icon="money" title="No payout requests here" />} columns={[
            { header: "Doctor", cell: (p) => <div><p className="font-semibold">Dr. {p.doctor.name}</p><p className="text-xs text-copy-muted">{p.doctor.email} · {p.doctor.hospital?.name ?? "Private"}</p></div> },
            { header: "Amount", cell: (p) => <b>{rs(p.amount)}</b> },
            { header: "Send to", cell: (p) => p.method || <span className="text-copy-muted">Not given</span> },
            { header: "Requested", cell: (p) => fmtDateTime(p.requestedAt) },
            { header: "Status", cell: (p) => <div className="flex flex-col gap-1"><Badge value={p.status === "REQUESTED" ? "PENDING" : p.status === "PAID" ? "PAID" : "FAILED"} label={p.status === "REQUESTED" ? "Waiting" : p.status === "PAID" ? "Paid" : "Rejected"} className="w-fit" />{p.note && <span className="text-xs text-copy-muted">{p.note}</span>}</div> },
            { header: "", className: "text-right", cell: (p) => p.status === "REQUESTED" ? (
              <div className="flex justify-end gap-1.5">
                <Button className="h-9" icon="check" onClick={() => setTarget({ payout: p, decision: "PAID" })}>Mark paid</Button>
                <Button className="h-9" variant="danger" onClick={() => setTarget({ payout: p, decision: "REJECTED" })}>Reject</Button>
              </div>
            ) : null },
          ]} />
        )}
      </Card>
      {meta && <Pager page={page} totalPages={Number(meta.totalPages)} onPage={setPage} />}
      <DecisionModal target={target} onClose={() => setTarget(null)} onDone={(m) => { setTarget(null); setFlash(m); void reload(); }} />
    </div>
  );
}

function DecisionModal({ target, onClose, onDone }: { target: { payout: Payout; decision: "PAID" | "REJECTED" } | null; onClose: () => void; onDone: (m: string) => void }) {
  const [note, setNote] = useState("");
  const { busy, error, run } = useAction();
  if (!target) return null;
  const { payout, decision } = target;
  const paying = decision === "PAID";

  async function save() {
    const r = await run("d", () => api.patch(`/api/super-admin/payouts/${payout.id}`, { status: decision, note: note.trim() || undefined }));
    if (r) onDone(paying ? `Payout of ${rs(payout.amount)} to Dr. ${payout.doctor.name} marked as paid.` : `Payout request from Dr. ${payout.doctor.name} rejected. The amount returns to their balance.`);
  }
  return (
    <Modal key={payout.id + decision} open title={paying ? "Mark payout as paid" : "Reject payout"} onClose={onClose} footer={<Button variant={paying ? "primary" : "danger"} loading={busy === "d"} onClick={save}>{paying ? `Confirm ${rs(payout.amount)} sent` : "Reject request"}</Button>}>
      <Notice tone={paying ? "info" : "warn"}>{paying ? `Confirm only after you have sent ${rs(payout.amount)} to: ${payout.method || "the account the doctor provided"}. The doctor is notified.` : "The doctor is notified and the amount goes back to their available balance."}</Notice>
      <div className="mt-4"><Field label={paying ? "Reference (optional)" : "Reason (shown to the doctor)"}><Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-20" placeholder={paying ? "e.g. bank transfer ref 123456" : "e.g. Account details are incorrect"} /></Field></div>
      {error && <div className="mt-3"><ErrorBox message={error} /></div>}
    </Modal>
  );
}
