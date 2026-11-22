export type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type PaymentStatus = "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
export type Urgency = "ROUTINE" | "SOON" | "URGENT" | "EMERGENCY";

export type Specialization = { id: number; name: string };
export type Slot = { id: number; startAt: string; endAt: string; status?: string; holdExpiresAt?: string | null };
export type PersonLite = { id: number; name: string; profileImage?: string | null; gender?: string | null; dateOfBirth?: string | null; phone?: string | null; bloodGroup?: string | null };

export type PrescriptionItem = { id?: number; medicine: string; dosage: string; frequency: string; durationDays?: number | null; instructions?: string | null };
export type Prescription = { id: number; appointmentId: number; notes?: string | null; labTests: string[]; createdAt: string; items: PrescriptionItem[]; doctor?: { id?: number; name: string } };
export type Consultation = { id: number; appointmentId: number; symptoms?: string | null; diagnosis?: string | null; notes?: string | null; advice?: string | null; followUpDate?: string | null; createdAt: string; doctor?: { id?: number; name: string } };
export type Review = { id: number; rating: number; comment?: string | null; createdAt: string; isHidden?: boolean; patient?: { name: string }; doctor?: { name: string } };

export type Appointment = {
  id: number;
  patientId: number;
  doctorId: number;
  hospitalId?: number | null;
  slotId: number;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  consultationType: "VIDEO" | "IN_PERSON";
  consultationFee: string | number;
  platformFee?: string | number | null;
  doctorEarning?: string | number | null;
  reason?: string | null;
  cancellationReason?: string | null;
  stripeCheckoutSessionId?: string | null;
  createdAt: string;
  acceptedAt?: string | null;
  slot: Slot;
  doctor?: PersonLite & { hospital?: { name: string } | null; specializations?: { specialization: { name: string } }[] };
  patient?: PersonLite;
  hospital?: { id: number; name: string } | null;
  consultation?: Consultation | null;
  prescription?: Prescription | null;
  review?: Review | null;
};

export type DoctorCard = {
  id: number;
  name: string;
  profileImage?: string | null;
  experience?: number | null;
  consultationFee?: number | null;
  bio?: string | null;
  qualification?: string | null;
  city?: string | null;
  specializations: Specialization[];
  clinics: { id: number; name: string; address: string; city?: string | null; consultationFee?: number | null }[];
  hospital?: { id: number; name: string; city?: string | null } | null;
  rating?: { average: number | null; count: number };
  reviews?: Review[];
};

export type MedicalProfile = {
  heightCm?: number | null;
  weightKg?: number | null;
  conditions: string[];
  allergies: string[];
  currentMedications: string[];
  pastSurgeries: string[];
  familyHistory?: string | null;
  lifestyleNotes?: string | null;
  emergencyContact?: string | null;
};

export type MedicalDocument = { id: number; title: string; type: string; fileUrl: string; notes?: string | null; aiSummary?: string | null; recordedAt?: string | null; createdAt: string };
