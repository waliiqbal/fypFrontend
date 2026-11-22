"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getSessionUser, homeFor } from "@/infrastructure/auth/session-storage";

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    const user = getSessionUser();
    router.replace(user ? homeFor(user) : "/login");
  }, [router]);
  return null;
}
