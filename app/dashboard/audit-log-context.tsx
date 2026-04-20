"use client";

import { createContext, useContext, ReactNode } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
export type AuditCategory =
  | "auth"
  | "vendor"
  | "user"
  | "booking"
  | "notification"
  | "app"
  | "settings"
  | "role";

export type AuditSeverity = "info" | "warning" | "critical";

export interface AuditLogInput {
  category: AuditCategory;
  action: string;
  description: string;
  resource?: {
    type: string;
    id: string;
    label: string;
  };
  severity: AuditSeverity;
  changes?: { field: string; before: string; after: string }[];
  status: "success" | "failed";
  meta?: Record<string, string>;
}

interface AuditLogContextValue {
  log: (entry: AuditLogInput) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuditLogContext = createContext<AuditLogContextValue | null>(null);

export function AuditLogProvider({ children }: { children: ReactNode }) {
  function log(_entry: AuditLogInput) {
    // Intentionally a no-op until the backend exposes an audit write endpoint.
    // The audit page itself is backed by the real backend read/export APIs.
  }

  return (
    <AuditLogContext.Provider value={{ log }}>
      {children}
    </AuditLogContext.Provider>
  );
}

export function useAuditLog() {
  const ctx = useContext(AuditLogContext);
  if (!ctx) throw new Error("useAuditLog must be used inside AuditLogProvider");
  return ctx;
}
