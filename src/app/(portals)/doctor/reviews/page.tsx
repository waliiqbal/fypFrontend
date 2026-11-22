"use client";

import { api } from "@/shared/api";
import { fmtDate } from "@/shared/format";
import { Stars } from "@/shared/extras";
import type { Review } from "@/shared/types";
import { Card, EmptyState, ErrorBox, Loading, PageHeader, StatCard } from "@/shared/ui";
import { useApi } from "@/shared/use-api";

export default function DoctorReviews() {
  const { data, error, loading, reload } = useApi(() => api.get<Review[]>("/api/doctors/me/reviews"));
  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorBox message={error} onRetry={reload} />;
  const reviews = data ?? [];
  const average = reviews.length ? Math.round((reviews.reduce((t, r) => t + r.rating, 0) / reviews.length) * 10) / 10 : null;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));

  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Feedback" title="Patient Reviews" description="Ratings patients left after completed consultations. Reviews removed by moderators are not shown." />
      <div className="mb-6 grid gap-4 sm:grid-cols-[220px_1fr]">
        <StatCard label="Average rating" value={average ?? "—"} hint={`${reviews.length} review${reviews.length === 1 ? "" : "s"}`} tone="deep" icon="star" />
        <Card className="flex flex-col justify-center gap-2 p-4 sm:p-5">
          {distribution.map((d) => (
            <div key={d.star} className="flex items-center gap-3 text-xs">
              <span className="w-6 font-semibold">{d.star}★</span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#eef4f3]"><span className="block h-full rounded-full bg-[#f5b301]" style={{ width: `${reviews.length ? (d.count / reviews.length) * 100 : 0}%` }} /></span>
              <span className="w-6 text-right text-copy-muted">{d.count}</span>
            </div>
          ))}
        </Card>
      </div>
      {reviews.length ? (
        <div className="flex flex-col gap-3">
          {reviews.map((r) => (
            <Card key={r.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{r.patient?.name ?? "Patient"}</p>
                <span className="text-xs text-copy-muted">{fmtDate(r.createdAt)}</span>
              </div>
              <div className="mt-1"><Stars value={r.rating} size={16} /></div>
              {r.comment && <p className="mt-2 text-sm leading-6 text-copy">{r.comment}</p>}
            </Card>
          ))}
        </div>
      ) : <Card><EmptyState icon="star" title="No reviews yet" text="Patients can rate you after a completed consultation." /></Card>}
    </div>
  );
}
