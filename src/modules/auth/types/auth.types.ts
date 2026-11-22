/** Roles currently supported by the registration API. */
export type UserType = "patient" | "doctor";
export type LoginUserType = UserType | "admin";

type CommonRegisterFields = {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  profileImage?: string;
};

export type PatientRegisterPayload = CommonRegisterFields & {
  userType: "patient";
  gender: string;
  dateOfBirth: string;
  bloodGroup: string;
};

export type DoctorRegisterPayload = CommonRegisterFields & {
  userType: "doctor";
  specializationIds: number[];
  licenseNumber: string;
  experience: number;
  consultationFee: number;
  hospitalId?: number;
};

export type Specialization = {
  id: number;
  name: string;
};

export type SpecializationsResponse = {
  message: string;
  success: boolean;
  data: Specialization[];
};

export type RegisterPayload =
  | PatientRegisterPayload
  | DoctorRegisterPayload;

export type RegisterResponse = {
  message: string;
  success: boolean;
  data?: {
    userId?: number;
    otp?: string;
  };
};

export type LoginPayload = {
  email: string;
  password: string;
  userType: LoginUserType;
};

export type VerifyOtpPayload = {
  email: string;
  userType: UserType;
  otp: string;
};

export type ResendOtpPayload = Omit<VerifyOtpPayload, "otp">;

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserType | "admin";
  type?: "SUPER_ADMIN" | "HOSPITAL_ADMIN" | "PHARMA_ADMIN";
  status?: string;
  profileImage?: string | null;
};

export type AuthResponse = {
  message: string;
  success: boolean;
  data: {
    user: AuthUser;
    token: {
      accessToken: string;
      refreshToken: string;
    };
  };
};

export type ResendOtpResponse = {
  message: string;
  success: boolean;
  data?: { otp?: string };
};

export type UserProfile = AuthUser & {
  phone?: string | null;
  address?: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  specializations?: Specialization[];
  licenseNumber?: string | null;
  experience?: number | null;
  consultationFee?: number | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
};

export type ProfileResponse = {
  message: string;
  success: boolean;
  data: UserProfile;
};

export type MessageResponse = {
  message: string;
  success: boolean;
};
