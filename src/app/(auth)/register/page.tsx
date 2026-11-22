import type { Metadata } from "next";
import { RegisterForm } from "@/modules/auth";

export const metadata: Metadata = {
  title: "Create your profile | Askare",
  description: "Register with Askare as a patient or healthcare professional.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
