import { apiRequest } from "@/infrastructure/http/api-client";

export type CallParty = { id: number; name: string; profileImage: string | null };

export type JoinInfo = {
  appointmentId: number;
  roomId: string;
  role: "doctor" | "patient";
  self: CallParty;
  peer: CallParty;
  startAt: string;
  endAt: string;
  opensAt: string;
  closesAt: string;
  canJoin: boolean;
  iceServers: RTCIceServer[];
};

export type DoctorPatientSummary = {
  summary: string;
  keyPoints: string[];
  redFlags: string[];
  aiGenerated: boolean;
};

type ApiResponse<T> = { success: boolean; message: string; data: T };

export async function getJoinInfo(appointmentId: number) {
  const response = await apiRequest<ApiResponse<JoinInfo>>(`/api/video/appointments/${appointmentId}/join-info`, { authenticated: true });
  return response.data;
}

export async function getPatientSummary(appointmentId: number) {
  const response = await apiRequest<ApiResponse<DoctorPatientSummary>>(`/api/ai/doctor/appointments/${appointmentId}/summary`, { authenticated: true });
  return response.data;
}

export async function completeAppointment(appointmentId: number) {
  return apiRequest<ApiResponse<unknown>>(`/api/doctors/me/appointments/${appointmentId}/complete`, { method: "PATCH", authenticated: true });
}

export type ConsultationNotes = { symptoms: string; diagnosis: string; notes: string; advice: string };

export async function getConsultationNotes(appointmentId: number): Promise<ConsultationNotes> {
  const response = await apiRequest<ApiResponse<{ reason?: string | null; consultation?: Partial<ConsultationNotes> | null }>>(`/api/doctors/me/appointments/${appointmentId}`, { authenticated: true });
  const c = response.data.consultation;
  return { symptoms: c?.symptoms ?? response.data.reason ?? "", diagnosis: c?.diagnosis ?? "", notes: c?.notes ?? "", advice: c?.advice ?? "" };
}

export async function saveConsultationNotes(appointmentId: number, notes: ConsultationNotes) {
  return apiRequest<ApiResponse<unknown>>(`/api/doctors/me/appointments/${appointmentId}/consultation`, { method: "PUT", authenticated: true, body: notes });
}
