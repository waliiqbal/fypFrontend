import type { Metadata } from "next";
import { DoctorAppointments } from "@/modules/doctor";

export const metadata: Metadata = { title: "Appointments | Askare", description: "View confirmed doctor appointments and appointment history." };

export default function DoctorAppointmentsPage() { return <DoctorAppointments />; }
