import { apiRequest } from "@/infrastructure/http/api-client";
import type {
  ReserveAppointmentResponse,
  PatientAppointment,
  DoctorListQuery,
  DoctorListResponse,
  DoctorSlotsResponse,
} from "../types/doctor.types";

export function getDoctors(query: DoctorListQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const suffix = params.size ? `?${params.toString()}` : "";
  return apiRequest<DoctorListResponse>(`/api/doctors${suffix}`);
}

export function getDoctorSlots(doctorId: number, from: string, to: string) {
  const params = new URLSearchParams({ from, to });
  return apiRequest<DoctorSlotsResponse>(`/api/doctors/${doctorId}/slots?${params.toString()}`);
}

export function reserveDoctorAppointment(payload: { slotId: number }) {
  return apiRequest<ReserveAppointmentResponse>("/api/doctors/appointments/reserve", {
    method: "POST",
    authenticated: true,
    body: payload,
  });
}

export function getMyAppointments(signal?: AbortSignal) {
  return apiRequest<{ success: boolean; data: PatientAppointment[] }>("/api/doctors/appointments/mine", {
    authenticated: true, cache: "no-store", signal,
  });
}

export async function openAppointmentCheckout(slotId: number) {
  const response = await reserveDoctorAppointment({ slotId });
  const url = new URL(response.data.checkoutUrl);
  if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") {
    throw new Error("Invalid checkout URL. Please try again.");
  }
  try {
    sessionStorage.setItem("askare.checkout.appointmentId", String(response.data.appointmentId));
  } catch { /* Successful returns can still be matched using Stripe's session ID. */ }
  window.location.assign(url.href);
}