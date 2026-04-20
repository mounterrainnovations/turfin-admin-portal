"use client";

import { useState } from "react";
import { getAdminSession, clearAdminSession } from "./session";
import type { AdminSession } from "./types";
import { useRouter } from "next/navigation";

export function useAuth() {
  const [session, setSession] = useState<AdminSession | null>(() =>
    getAdminSession(),
  );
  const router = useRouter();

  const logout = () => {
    clearAdminSession();
    setSession(null);
    router.replace("/");
  };

  return { session, isLoading: false, logout };
}
