export { RegisterForm } from "./components/register-form";
export { LoginForm } from "./components/login-form";
export { ProfileView } from "./components/profile-view";
export { VerifyOtpForm } from "./components/verify-otp-form";
export {
  getProfile,
  getSpecializations,
  loginUser,
  logoutUser,
  registerUser,
  resendOtp,
  verifyOtp,
} from "./api/auth.api";
export type {
  DoctorRegisterPayload,
  PatientRegisterPayload,
  RegisterPayload,
  RegisterResponse,
  UserType,
  AuthResponse,
  AuthUser,
  LoginPayload,
  ProfileResponse,
  ResendOtpPayload,
  Specialization,
  SpecializationsResponse,
  UserProfile,
  VerifyOtpPayload,
} from "./types/auth.types";
