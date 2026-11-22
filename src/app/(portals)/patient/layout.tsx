import { AppShell } from "@/shared/app-shell";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <AppShell portal="patient">{children}</AppShell>;
}
