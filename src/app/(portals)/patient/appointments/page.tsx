import type { Metadata } from "next";
import { ConsultationBooking } from "@/modules/patient";

export const metadata: Metadata = { title: "Find a specialist | Askare" };

export default function AppointmentsPage() {
  return <ConsultationBooking />;
}
