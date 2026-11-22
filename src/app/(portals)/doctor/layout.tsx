import { AppShell } from "@/shared/app-shell";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return <AppShell portal="doctor">{children}</AppShell>;
}
