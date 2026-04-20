"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getAdminSession } from "../session";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = getAdminSession();
  const isAuthorized = Boolean(session);

  useEffect(() => {
    if (!session) {
      router.replace("/");
    }
  }, [router, session]);

  if (!isAuthorized) {
    return null; // Or a loading spinner that matches the UI
  }

  return <>{children}</>;
}
