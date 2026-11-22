"use client";

import { AdminAppointments } from "@/shared/appointments-admin";
import { PageHeader } from "@/shared/ui";

export default function HospitalAppointments() {
  return (
    <div>
      <PageHeader eyebrow="Operations" title="Appointments" description="All paid consultations with your hospital's doctors. Cancel on a doctor's behalf if they are unavailable." />
      <AdminAppointments endpoint="/api/hospital/appointments" mode="hospital" />
    </div>
  );
}
