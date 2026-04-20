"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAdminSession } from "../session";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const session = getAdminSession();
  const isAuthorized = Boolean(session);

  useEffect(() => {
    if (mounted && !isAuthorized) {
      router.replace("/");
    }
  }, [router, isAuthorized, mounted]);

  if (!mounted || !isAuthorized) {
    return null; // Or a loading spinner that matches the UI
  }

  return <>{children}</>;
}
