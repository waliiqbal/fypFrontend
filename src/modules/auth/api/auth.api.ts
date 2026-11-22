import { apiRequest } from "@/infrastructure/http/api-client";
import type {
  RegisterPayload,
  RegisterResponse,
  AuthResponse,
  LoginPayload,
  MessageResponse,
  ProfileResponse,
  ResendOtpPayload,
  ResendOtpResponse,
  SpecializationsResponse,
  VerifyOtpPayload,
} from "@/modules/auth/types/auth.types";

const AUTH_ENDPOINTS = {
  register: "/api/auth/register",
  login: "/api/auth/login",
  verifyOtp: "/api/auth/verify-otp",
  resendOtp: "/api/auth/resend-otp",
  profile: "/api/auth/profile",
  logout: "/api/auth/logout",
  specializations: "/api/auth/specializations",
} as const;

export function registerUser(payload: RegisterPayload) {
  return apiRequest<RegisterResponse>(AUTH_ENDPOINTS.register, {
    method: "POST",
    body: payload,
  });
}

export function getSpecializations() {
  return apiRequest<SpecializationsResponse>(AUTH_ENDPOINTS.specializations, {
    method: "GET",
  });
}

export function loginUser(payload: LoginPayload) {
  return apiRequest<AuthResponse>(AUTH_ENDPOINTS.login, {
    method: "POST",
    body: payload,
  });
}

export function verifyOtp(payload: VerifyOtpPayload) {
  return apiRequest<AuthResponse>(AUTH_ENDPOINTS.verifyOtp, {
    method: "POST",
    body: payload,
  });
}

export function resendOtp(payload: ResendOtpPayload) {
  return apiRequest<ResendOtpResponse>(AUTH_ENDPOINTS.resendOtp, {
    method: "POST",
    body: payload,
  });
}

export function getProfile() {
  return apiRequest<ProfileResponse>(AUTH_ENDPOINTS.profile, {
    method: "GET",
    authenticated: true,
  });
}

export function logoutUser() {
  return apiRequest<MessageResponse>(AUTH_ENDPOINTS.logout, {
    method: "POST",
    authenticated: true,
  });
}
