"use client";

import { useState } from "react";
import { Stars } from "@/shared/extras";
import { api } from "@/shared/api";
import { fmtDate } from "@/shared/format";
import type { Review } from "@/shared/types";
import { Badge, Button, Card, DataTable, EmptyState, ErrorBox, Loading, PageHeader, Pager } from "@/shared/ui";
import { useAction, useApi } from "@/shared/use-api";

export default function AdminReviews() {
  const [page, setPage] = useState(1);
  const { data, meta, error, loading, reload } = useApi(() => api.get<Review[]>("/api/super-admin/reviews", { page }), [page]);
  const action = useAction();
  return (
    <div>
      <PageHeader eyebrow="Moderation" title="Reviews" description="Hide abusive or fake reviews. Hidden reviews don't count towards a doctor's rating." />
      {(error || action.error) && <div className="mb-4"><ErrorBox message={(error || action.error)!} /></div>}
      <Card className="p-0 sm:p-0">
        {loading ? <Loading /> : (
          <DataTable rows={data ?? []} rowKey={(r) => r.id} empty={<EmptyState icon="star" title="No reviews yet" />} columns={[
            { header: "Rating", cell: (r) => <Stars value={r.rating} size={15} /> },
            { header: "Comment", className: "max-w-md", cell: (r) => r.comment || <span className="text-copy-muted">No comment</span> },
            { header: "Patient → Doctor", cell: (r) => <span className="text-sm">{r.patient?.name} → Dr. {r.doctor?.name}</span> },
            { header: "Date", cell: (r) => fmtDate(r.createdAt) },
            { header: "Visibility", cell: (r) => <Badge value={r.isHidden ? "INACTIVE" : "ACTIVE"} label={r.isHidden ? "Hidden" : "Visible"} /> },
            { header: "", className: "text-right", cell: (r) => <Button variant={r.isHidden ? "soft" : "secondary"} className="h-9" loading={action.busy === `v${r.id}`} onClick={async () => { if (await action.run(`v${r.id}`, () => api.patch(`/api/super-admin/reviews/${r.id}/visibility`, { isHidden: !r.isHidden }))) void reload(); }}>{r.isHidden ? "Show" : "Hide"}</Button> },
          ]} />
        )}
      </Card>
      {meta && <Pager page={page} totalPages={meta.totalPages} onPage={setPage} />}
    </div>
  );
}
