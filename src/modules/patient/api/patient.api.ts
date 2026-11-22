import { apiRequest } from "@/infrastructure/http/api-client";
import type { PatientDashboardResponse } from "../types/patient.types";

export function getPatientDashboard() {
  return apiRequest<PatientDashboardResponse>("/api/patient/dashboard", {
    method: "GET",
    authenticated: true,
  });
}

