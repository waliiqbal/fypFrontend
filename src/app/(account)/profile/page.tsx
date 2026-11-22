import type { Metadata } from "next";
import { ProfileView } from "@/modules/auth";

export const metadata: Metadata = {
  title: "My profile | Askare",
  description: "View your Askare healthcare profile.",
};

export default function ProfilePage() {
  return <ProfileView />;
}
