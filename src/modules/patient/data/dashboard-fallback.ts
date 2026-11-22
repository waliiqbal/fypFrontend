import type { PatientDashboard } from "../types/patient.types";

export const dashboardFallback: PatientDashboard = {
  patient: { id: 88219, name: "Wali Iqbal" },
  nextAppointment: {
    id: 1,
    doctorName: "Dr. Aris Thorne",
    specialization: "Senior Cardiologist · Clinical Lead",
    dateLabel: "Today, Oct 14",
    timeLabel: "02:30 PM",
  },
  activeDiagnosis: {
    name: "Mild Hypertension",
    status: "Stabilizing",
    detail: "BP Trend: 128/84 mmHg",
  },
  nextDosage: {
    medicine: "Lisinopril 10mg",
    schedule: "Scheduled for 18:00 (Evening)",
  },
};

