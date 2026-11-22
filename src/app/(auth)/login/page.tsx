import type { Metadata } from "next";
import { LoginForm } from "@/modules/auth";

export const metadata: Metadata = {
  title: "Login | Askare",
  description: "Login to your Askare healthcare account.",
};

export default function LoginPage() {
  return <LoginForm />;
}
