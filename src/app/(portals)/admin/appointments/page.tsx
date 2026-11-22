"use client";

import { AdminAppointments } from "@/shared/appointments-admin";
import { PageHeader } from "@/shared/ui";

export default function AdminAppointmentsPage() {
  return (
    <div>
      <PageHeader eyebrow="Money" title="Appointments & Payments" description="Every paid consultation on AskCare. Issue manual refunds for disputes." />
      <AdminAppointments endpoint="/api/super-admin/appointments" mode="admin" />
    </div>
  );
}
