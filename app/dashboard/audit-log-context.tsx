"use client";

import { createContext, useContext, useState, ReactNode } from "react";

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

export interface AuditEntry {
  id: string;
  ts: string; // ISO string
  category: AuditCategory;
  action: string;       // short label, e.g. "Vendor Suspended"
  description: string;  // full sentence
  actor: {
    name: string;
    email: string;
    role: "Super Admin" | "Admin";
    ip: string;
    session: string;
  };
  resource?: {
    type: string;   // "Vendor", "User", "Booking", etc.
    id: string;     // "VND-005"
    label: string;  // "CityTurf Ltd"
  };
  severity: AuditSeverity;
  changes?: { field: string; before: string; after: string }[];
  status: "success" | "failed";
  meta?: Record<string, string>;
}

interface AuditLogContextValue {
  entries: AuditEntry[];
  log: (entry: Omit<AuditEntry, "id" | "ts" | "actor">) => void;
}

// ── Seed Data ─────────────────────────────────────────────────────────────────
function d(dateStr: string, time: string): string {
  return new Date(`${dateStr}T${time}:00.000Z`).toISOString();
}

const SEED: AuditEntry[] = [
  {
    id: "EVT-001", ts: d("2026-03-25", "08:53"),
    category: "auth", action: "Admin Login", severity: "info", status: "success",
    description: "Super Admin logged in successfully.",
    actor: { name: "Super Admin", email: "superadmin@turfin.com", role: "Super Admin", ip: "203.0.113.42", session: "sess_a1b2c3" },
    meta: { browser: "Chrome 122", os: "Windows 11" },
  },
  {
    id: "EVT-002", ts: d("2026-03-25", "09:05"),
    category: "app", action: "Force Update Enabled", severity: "warning", status: "success",
    description: "Force update toggled ON for TurfIn Client app. Users below min version will be blocked.",
    actor: { name: "Super Admin", email: "superadmin@turfin.com", role: "Super Admin", ip: "203.0.113.42", session: "sess_a1b2c3" },
    resource: { type: "App", id: "client", label: "TurfIn Client" },
    changes: [{ field: "forceUpdate", before: "false", after: "true" }],
  },
  {
    id: "EVT-003", ts: d("2026-03-25", "09:15"),
    category: "app", action: "Min Version Updated", severity: "info", status: "success",
    description: "Minimum required version updated for TurfIn Client app.",
    actor: { name: "Super Admin", email: "superadmin@turfin.com", role: "Super Admin", ip: "203.0.113.42", session: "sess_a1b2c3" },
    resource: { type: "App", id: "client", label: "TurfIn Client" },
    changes: [{ field: "minVersion", before: "2.0.0", after: "2.1.0" }],
  },
  {
    id: "EVT-004", ts: d("2026-03-25", "10:15"),
    category: "app", action: "OTA Update Deployed", severity: "info", status: "success",
    description: "OTA bundle v2.3.1-hotfix pushed to production channel for TurfIn Client.",
    actor: { name: "Super Admin", email: "superadmin@turfin.com", role: "Super Admin", ip: "203.0.113.42", session: "sess_a1b2c3" },
    resource: { type: "App", id: "client", label: "TurfIn Client" },
    meta: { channel: "production", version: "2.3.1-hotfix", notes: "Fix booking crash on Android" },
  },
  {
    id: "EVT-005", ts: d("2026-03-25", "11:30"),
    category: "notification", action: "Push Notification Sent", severity: "info", status: "success",
    description: "Push notification \"Weekend Warriors Deal\" broadcast to 1,240 active users.",
    actor: { name: "Super Admin", email: "superadmin@turfin.com", role: "Super Admin", ip: "203.0.113.42", session: "sess_a1b2c3" },
    resource: { type: "Notification", id: "PN-006", label: "Weekend Warriors Deal" },
    meta: { audience: "Active Users", reach: "1240", openRate: "—" },
  },
  {
    id: "EVT-006", ts: d("2026-03-25", "13:40"),
    category: "vendor", action: "KYC Rejected", severity: "warning", status: "success",
    description: "KYC verification rejected for CityTurf Ltd. Reason: incomplete business registration documents.",
    actor: { name: "Super Admin", email: "superadmin@turfin.com", role: "Super Admin", ip: "203.0.113.42", session: "sess_d4e5f6" },
    resource: { type: "Vendor", id: "VND-005", label: "CityTurf Ltd" },
    changes: [{ field: "kyc", before: "in-review", after: "rejected" }],
  },
  {
    id: "EVT-007", ts: d("2026-03-25", "13:45"),
    category: "vendor", action: "Vendor Suspended", severity: "critical", status: "success",
    description: "Vendor CityTurf Ltd suspended following repeated KYC rejection and unresolved payment disputes.",
    actor: { name: "Super Admin", email: "superadmin@turfin.com", role: "Super Admin", ip: "203.0.113.42", session: "sess_d4e5f6" },
    resource: { type: "Vendor", id: "VND-005", label: "CityTurf Ltd" },
    changes: [{ field: "status", before: "active", after: "suspended" }],
  },
  {
    id: "EVT-008", ts: d("2026-03-24", "12:30"),
    category: "booking", action: "Booking Cancelled + Refund", severity: "info", status: "success",
    description: "Admin cancelled booking #BK-0031 and issued full refund to Marco Rossi (₹850).",
    actor: { name: "Admin", email: "admin@turfin.com", role: "Admin", ip: "10.0.0.5", session: "sess_g7h8i9" },
    resource: { type: "Booking", id: "BK-0031", label: "Booking #BK-0031" },
    meta: { refundAmount: "₹850", user: "Marco Rossi", reason: "Field was locked on arrival" },
  },
  {
    id: "EVT-009", ts: d("2026-03-24", "14:00"),
    category: "user", action: "User Account Banned", severity: "critical", status: "success",
    description: "User account for Davide Greco permanently banned due to duplicate charge dispute fraud.",
    actor: { name: "Super Admin", email: "superadmin@turfin.com", role: "Super Admin", ip: "203.0.113.42", session: "sess_g7h8i9" },
    resource: { type: "User", id: "USR-0892", label: "Davide Greco" },
    changes: [{ field: "accountStatus", before: "active", after: "banned" }],
  },
  {
    id: "EVT-010", ts: d("2026-03-24", "15:20"),
    category: "vendor", action: "KYC Approved", severity: "info", status: "success",
    description: "KYC verification approved for GreenZone FC. Vendor is now fully onboarded.",
    actor: { name: "Admin", email: "admin@turfin.com", role: "Admin", ip: "10.0.0.5", session: "sess_j1k2l3" },
    resource: { type: "Vendor", id: "VND-002", label: "GreenZone FC" },
    changes: [{ field: "kyc", before: "in-review", after: "verified" }],
  },
  {
    id: "EVT-011", ts: d("2026-03-24", "18:30"),
    category: "settings", action: "Commission Rate Changed", severity: "warning", status: "success",
    description: "Platform-wide default commission rate updated from 10% to 12%.",
    actor: { name: "Super Admin", email: "superadmin@turfin.com", role: "Super Admin", ip: "203.0.113.42", session: "sess_j1k2l3" },
    resource: { type: "Setting", id: "commissionRate", label: "Commission Rate" },
    changes: [{ field: "commissionRate", before: "10%", after: "12%" }],
  },
  {
    id: "EVT-012", ts: d("2026-03-23", "14:20"),
    category: "vendor", action: "Vendor Commission Updated", severity: "warning", status: "success",
    description: "Individual commission rate for Arena Sports Hub updated from 10% to 12%.",
    actor: { name: "Super Admin", email: "superadmin@turfin.com", role: "Super Admin", ip: "203.0.113.42", session: "sess_m4n5o6" },
    resource: { type: "Vendor", id: "VND-003", label: "Arena Sports Hub" },
    changes: [{ field: "commission", before: "10%", after: "12%" }],
  },
  {
    id: "EVT-013", ts: d("2026-03-23", "17:45"),
    category: "notification", action: "Push Notification Sent", severity: "info", status: "success",
    description: "Push notification \"VIP Early Access\" broadcast to 47 VIP users.",
    actor: { name: "Admin", email: "admin@turfin.com", role: "Admin", ip: "10.0.0.5", session: "sess_m4n5o6" },
    resource: { type: "Notification", id: "PN-004", label: "VIP Early Access: Premium Fields" },
    meta: { audience: "VIP Users", reach: "47" },
  },
  {
    id: "EVT-014", ts: d("2026-03-23", "20:15"),
    category: "role", action: "Role Permissions Modified", severity: "warning", status: "success",
    description: "Admin role permissions updated — added 'Manage Refunds' and removed 'Delete Vendors'.",
    actor: { name: "Super Admin", email: "superadmin@turfin.com", role: "Super Admin", ip: "203.0.113.42", session: "sess_p7q8r9" },
    resource: { type: "Role", id: "ROLE-002", label: "Admin" },
    changes: [
      { field: "permission:manage_refunds", before: "false", after: "true" },
      { field: "permission:delete_vendors", before: "true", after: "false" },
    ],
  },
  {
    id: "EVT-015", ts: d("2026-03-22", "10:00"),
    category: "settings", action: "Maintenance Mode Disabled", severity: "warning", status: "success",
    description: "Platform maintenance mode disabled. App is now live for all users.",
    actor: { name: "Super Admin", email: "superadmin@turfin.com", role: "Super Admin", ip: "203.0.113.42", session: "sess_s1t2u3" },
    resource: { type: "Setting", id: "maintenanceMode", label: "Maintenance Mode" },
    changes: [{ field: "maintenanceMode", before: "true", after: "false" }],
  },
  {
    id: "EVT-016", ts: d("2026-03-22", "11:30"),
    category: "auth", action: "Failed Login Attempts", severity: "critical", status: "failed",
    description: "3 consecutive failed login attempts detected from IP 198.51.100.77. Account temporarily locked.",
    actor: { name: "Unknown", email: "—", role: "Admin", ip: "198.51.100.77", session: "—" },
    meta: { attempts: "3", lockDuration: "15 minutes", targetAccount: "admin@turfin.com" },
  },
  {
    id: "EVT-017", ts: d("2026-03-22", "16:00"),
    category: "vendor", action: "Vendor Onboarded", severity: "info", status: "success",
    description: "New vendor Premier Grounds created and pending KYC verification.",
    actor: { name: "Admin", email: "admin@turfin.com", role: "Admin", ip: "10.0.0.5", session: "sess_v4w5x6" },
    resource: { type: "Vendor", id: "VND-004", label: "Premier Grounds" },
    changes: [{ field: "status", before: "—", after: "pending" }],
  },
  {
    id: "EVT-018", ts: d("2026-03-21", "14:30"),
    category: "notification", action: "Push Notification Sent", severity: "info", status: "success",
    description: "Re-engagement push \"We Miss You!\" broadcast to 312 inactive users.",
    actor: { name: "Admin", email: "admin@turfin.com", role: "Admin", ip: "10.0.0.5", session: "sess_y7z8a9" },
    resource: { type: "Notification", id: "PN-003", label: "We Miss You!" },
    meta: { audience: "Inactive Users", reach: "312" },
  },
  {
    id: "EVT-019", ts: d("2026-03-21", "15:45"),
    category: "vendor", action: "KYC Approved", severity: "info", status: "success",
    description: "KYC verification approved for Riaz Sports Complex. All documents verified.",
    actor: { name: "Admin", email: "admin@turfin.com", role: "Admin", ip: "10.0.0.5", session: "sess_y7z8a9" },
    resource: { type: "Vendor", id: "VND-001", label: "Riaz Sports Complex" },
    changes: [{ field: "kyc", before: "in-review", after: "verified" }],
  },
  {
    id: "EVT-020", ts: d("2026-03-20", "09:11"),
    category: "auth", action: "Admin Login", severity: "info", status: "success",
    description: "Admin logged in.",
    actor: { name: "Admin", email: "admin@turfin.com", role: "Admin", ip: "10.0.0.5", session: "sess_b1c2d3" },
    meta: { browser: "Firefox 124", os: "macOS 14" },
  },
];

// ── Context ───────────────────────────────────────────────────────────────────
const AuditLogContext = createContext<AuditLogContextValue | null>(null);

export function AuditLogProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<AuditEntry[]>(SEED);

  function log(entry: Omit<AuditEntry, "id" | "ts" | "actor">) {
    const newEntry: AuditEntry = {
      ...entry,
      id: `EVT-${Date.now()}`,
      ts: new Date().toISOString(),
      actor: {
        name: "Super Admin",
        email: "superadmin@turfin.com",
        role: "Super Admin",
        ip: "203.0.113.42",
        session: `sess_${Math.random().toString(36).slice(2, 8)}`,
      },
    };
    setEntries(prev => [newEntry, ...prev]);
  }

  return (
    <AuditLogContext.Provider value={{ entries, log }}>
      {children}
    </AuditLogContext.Provider>
  );
}

export function useAuditLog() {
  const ctx = useContext(AuditLogContext);
  if (!ctx) throw new Error("useAuditLog must be used inside AuditLogProvider");
  return ctx;
}
