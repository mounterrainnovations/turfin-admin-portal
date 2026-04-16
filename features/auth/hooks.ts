"use client";

import { useEffect, useState } from "react";
import { getAdminSession, clearAdminSession } from "./session";
import type { AdminSession } from "./types";
import { useRouter } from "next/navigation";

export function useAuth() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const s = getAdminSession();
    setSession(s);
    setIsLoading(false);
  }, []);

  const logout = () => {
    clearAdminSession();
    setSession(null);
    router.replace("/");
  };

  return { session, isLoading, logout };
}
