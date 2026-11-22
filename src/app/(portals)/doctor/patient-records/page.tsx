import type { Metadata } from "next";
import { DoctorPatientRecords } from "@/modules/doctor";

export const metadata: Metadata = { title: "Patient records | Askare", description: "Review patient visits, consultation notes, prescriptions, and reports." };

export default function DoctorPatientRecordsPage() { return <DoctorPatientRecords />; }
