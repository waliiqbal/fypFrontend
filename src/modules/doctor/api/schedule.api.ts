import { apiRequest } from "@/infrastructure/http/api-client";
import type { ApiResponse, AvailabilityInput, AvailabilityRule, ExceptionInput, ScheduleException } from "../types/schedule.types";

export function getMyAvailability() {
  return apiRequest<ApiResponse<AvailabilityRule[]>>("/api/doctors/me/availability", { authenticated: true });
}

export function createAvailability(payload: AvailabilityInput) {
  return apiRequest<ApiResponse<AvailabilityRule>>("/api/doctors/me/availability", { method: "POST", authenticated: true, body: payload });
}

export function deleteAvailability(id: number) {
  return apiRequest<ApiResponse<undefined>>(`/api/doctors/me/availability/${id}`, { method: "DELETE", authenticated: true });
}

export function getMyExceptions() {
  return apiRequest<ApiResponse<ScheduleException[]>>("/api/doctors/me/exceptions", { authenticated: true });
}

export function createScheduleException(payload: ExceptionInput) {
  return apiRequest<ApiResponse<ScheduleException>>("/api/doctors/me/exceptions", { method: "POST", authenticated: true, body: payload });
}

export function deleteScheduleException(id: number) {
  return apiRequest<ApiResponse<undefined>>(`/api/doctors/me/exceptions/${id}`, { method: "DELETE", authenticated: true });
}
