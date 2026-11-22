export type PatientDashboard = {
  patient: { id: number; name: string };
  nextAppointment: {
    id: number;
    doctorName: string;
    specialization: string;
    dateLabel: string;
    timeLabel: string;
  } | null;
  activeDiagnosis: { name: string; status: string; detail: string } | null;
  nextDosage: { medicine: string; schedule: string } | null;
};

export type PatientDashboardResponse = {
  success: boolean;
  data: PatientDashboard;
};

