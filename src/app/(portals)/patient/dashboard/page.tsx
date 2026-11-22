import type { Metadata } from "next";
import { PatientDashboard } from "@/modules/patient";

export const metadata: Metadata = { title: "Patient overview | Askare" };

export default function PatientDashboardPage() {
  return <PatientDashboard />;
}

