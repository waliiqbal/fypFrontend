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
