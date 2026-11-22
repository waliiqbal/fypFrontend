import type { Metadata } from "next";
import { DoctorDashboard } from "@/modules/doctor";

export const metadata: Metadata = {
  title: "Doctor dashboard | Askare",
  description: "Manage consultations, booking requests, and patient activity.",
};

export default function DoctorDashboardPage() {
  return <DoctorDashboard />;
}
