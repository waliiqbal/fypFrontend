"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/shared/api";
import { rs } from "@/shared/format";
import { Icon } from "@/shared/icons";
import type { DoctorCard, Specialization } from "@/shared/types";
import { Avatar, Card, EmptyState, ErrorBox, Loading, PageHeader, Input, Pager, SearchBox, Select } from "@/shared/ui";
import { useApi } from "@/shared/use-api";

function DoctorsList() {
  const params = useSearchParams();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [specializationId, setSpecializationId] = useState(params.get("specializationId") ?? "");
  const [availability, setAvailability] = useState("");
  const [type, setType] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [maxFee, setMaxFee] = useState("");
  const [minRating, setMinRating] = useState("");
  const [city, setCity] = useState("");
  const [debouncedCity, setDebouncedCity] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedCity(city.trim()); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [city]);

  const specs = useApi(() => api.public<Specialization[]>("/api/public/specializations"));
  const hospitals = useApi(() => api.public<{ id: number; name: string; city?: string }[]>("/api/public/hospitals"));
  const list = useApi(
    () => api.public<DoctorCard[]>("/api/doctors", { search: debounced, specializationId, availability, type, hospitalId, maxFee, minRating, city: debouncedCity, page, limit: 12 }),
    [debounced, specializationId, availability, type, hospitalId, maxFee, minRating, debouncedCity, page],
  );
  const selectedSpec = specs.data?.find((s) => String(s.id) === specializationId);

  return (
    <div>
      <PageHeader eyebrow="Find a doctor" title={selectedSpec ? `${selectedSpec.name} specialists` : "Verified doctors"} description="Only doctors approved by AskCare or their hospital are listed. You are charged only after the doctor accepts." />
      <Card className="mb-6 flex flex-wrap items-end gap-3 p-4 sm:p-4">
        <SearchBox value={search} onChange={setSearch} placeholder="Search doctor by name" />
        <Select aria-label="Specialization" value={specializationId} onChange={(e) => { setSpecializationId(e.target.value); setPage(1); }} className="mt-0 w-auto min-w-44">
          <option value="">All specialities</option>
          {specs.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Select aria-label="Availability" value={availability} onChange={(e) => { setAvailability(e.target.value); setPage(1); }} className="mt-0 w-auto">
          <option value="">Any day</option><option value="today">Available today</option><option value="tomorrow">Tomorrow</option><option value="week">This week</option>
        </Select>
        <Select aria-label="Practice type" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="mt-0 w-auto">
          <option value="">Hospital & private</option><option value="hospital">Hospital doctors</option><option value="private">Private practice</option>
        </Select>
        <Select aria-label="Hospital" value={hospitalId} onChange={(e) => { setHospitalId(e.target.value); setPage(1); }} className="mt-0 w-auto max-w-52">
          <option value="">Any hospital</option>
          {hospitals.data?.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </Select>
        <Select aria-label="Maximum fee" value={maxFee} onChange={(e) => { setMaxFee(e.target.value); setPage(1); }} className="mt-0 w-auto">
          <option value="">Any fee</option><option value="1500">Up to Rs 1,500</option><option value="2500">Up to Rs 2,500</option><option value="5000">Up to Rs 5,000</option>
        </Select>
        <Select aria-label="Minimum rating" value={minRating} onChange={(e) => { setMinRating(e.target.value); setPage(1); }} className="mt-0 w-auto">
          <option value="">Any rating</option><option value="4.5">4.5 &amp; up</option><option value="4">4 &amp; up</option><option value="3">3 &amp; up</option>
        </Select>
        <Input aria-label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City (e.g. Karachi)" className="mt-0 w-44" />
      </Card>

      {list.error && <ErrorBox message={list.error} onRetry={list.reload} />}
      {list.loading ? <Loading label="Finding doctors…" /> : list.data && list.data.length === 0 ? (
        <Card><EmptyState icon="stethoscope" title="No doctors match these filters" text="Try another speciality or remove a filter." /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.data?.map((d) => {
            const fee = d.clinics?.[0]?.consultationFee ?? d.consultationFee;
            return (
              <Link key={d.id} href={`/patient/doctors/${d.id}`} className="group flex flex-col gap-4 rounded-[24px] border border-[#e3eeec] bg-white p-5 transition hover:border-[#bfe0dc] hover:shadow-[0_14px_40px_rgba(0,84,90,.08)]">
                <div className="flex items-center gap-3.5">
                  <Avatar name={d.name} src={d.profileImage} size={56} />
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold">Dr. {d.name}</p>
                    <p className="truncate text-[13px] text-copy-muted">{d.specializations.map((s) => s.name).join(", ") || "General practice"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                  {d.experience != null && <span className="rounded-[9px] bg-[#f0f7f6] px-2.5 py-1 text-[#00545a]">{d.experience} yrs exp.</span>}
                  <span className="rounded-[9px] bg-[#f0f7f6] px-2.5 py-1 text-[#00545a]">{d.hospital ? d.hospital.name : "Private practice"}</span>
                  {d.city && <span className="rounded-[9px] bg-[#f0f7f6] px-2.5 py-1 text-[#00545a]">{d.city}</span>}
                  <span className="inline-flex items-center gap-1 rounded-[9px] bg-[#fff6dc] px-2.5 py-1 text-[#7a5a00]"><Icon name="star" size={13} className="fill-[#f5b301] text-[#f5b301]" />{d.rating?.average ? `${d.rating.average} (${d.rating.count})` : "New"}</span>
                </div>
                {d.bio && <p className="line-clamp-2 text-[13px] leading-5 text-copy">{d.bio}</p>}
                <div className="mt-auto flex items-center justify-between border-t border-[#eef4f3] pt-3.5">
                  <p className="text-sm"><span className="text-copy-muted">Fee </span><b>{fee ? rs(fee) : "—"}</b></p>
                  <span className="flex items-center gap-1 text-sm font-bold text-brand">Book <Icon name="arrow" size={16} className="transition group-hover:translate-x-0.5" /></span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {list.meta && <Pager page={page} totalPages={list.meta.totalPages} onPage={setPage} />}
    </div>
  );
}

export default function DoctorsPage() {
  return <Suspense><DoctorsList /></Suspense>;
}
