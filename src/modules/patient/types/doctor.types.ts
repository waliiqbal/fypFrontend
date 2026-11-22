export type DoctorSpecialization = { id: number; name: string };

export type DoctorClinic = {
  id: number;
  name: string;
  address: string;
  city: string | null;
  consultationFee: number | null;
  isPrimary: boolean;
};

export type DoctorListing = {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  licenseNumber: string | null;
  experience: number | null;
  consultationFee: number | null;
  profileImage: string | null;
  specializations: DoctorSpecialization[];
  clinics: DoctorClinic[];
};

export type DoctorSlot = {
  id: number;
  startAt: string;
  endAt: string;
};

export type DoctorListResponse = {
  success: boolean;
  message: string;
  data: DoctorListing[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type DoctorSlotsResponse = {
  success: boolean;
  message: string;
  data: DoctorSlot[];
};

export type ReserveAppointmentResponse = {
  success: boolean;
  message: string;
  data: { appointmentId: number; status: string; checkoutUrl: string; holdExpiresAt: string };
};

export type DoctorListQuery = {
  search?: string;
  specialization?: string;
  availability?: "today" | "tomorrow" | "week";
  minFee?: number;
  maxFee?: number;
  page?: number;
  limit?: number;
};

export type PatientAppointment = {
  id: number;
  slotId: number;
  status: string;
  paymentStatus: "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "CANCELLED";
  stripeCheckoutSessionId: string | null;
  consultationFee: string | number;
  doctor: { id: number; name: string };
  patient: { id: number; name: string };
  slot: { startAt: string; endAt: string; holdExpiresAt: string | null };
};