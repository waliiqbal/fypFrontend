import type { Metadata } from "next";
import { VerifyOtpForm } from "@/modules/auth";
import type { UserType } from "@/modules/auth";

export const metadata: Metadata = {
  title: "Verify account | Askare",
  description: "Verify your Askare account with the email OTP.",
};

export default async function VerifyOtpPage({ searchParams }: PageProps<"/verify-otp">) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const role = params.userType === "doctor" ? "doctor" : "patient";
  return <VerifyOtpForm initialEmail={email} initialUserType={role as UserType} />;
}
