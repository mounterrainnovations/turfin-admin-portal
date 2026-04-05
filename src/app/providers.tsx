"use client";

import { AuthProvider } from "@/lib/auth";
import { QueryProvider } from "@/lib/query-provider";
import { ReactNode } from "react";

import { Toaster } from "react-hot-toast";

/**
 * Root providers wrapper for the library functions that require client context.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryProvider>
  );
}
