import type { Metadata } from "next";
import { DoctorSchedule } from "@/modules/doctor";

export const metadata: Metadata = {
  title: "My schedule | Askare",
  description: "Manage doctor consultation availability and schedule exceptions.",
};

export default function DoctorSchedulePage() {
  return <DoctorSchedule />;
}
