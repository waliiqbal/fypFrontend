import { AppShell } from "@/shared/app-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell portal="admin">{children}</AppShell>;
}
