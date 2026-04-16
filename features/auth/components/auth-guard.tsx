"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAdminSession } from "../session";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const session = getAdminSession();
    if (!session) {
      router.replace("/");
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (!isAuthorized) {
    return null; // Or a loading spinner that matches the UI
  }

  return <>{children}</>;
}
