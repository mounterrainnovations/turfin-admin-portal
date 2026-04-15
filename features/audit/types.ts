export type BackendAuditCategory =
  | "auth"
  | "kyc"
  | "booking"
  | "payment"
  | "slot"
  | "admin"
  | "vendor"
  | "turf"
  | "user";

export type AuditSeverity = "info" | "warning" | "critical" | "-";

export interface AuditEntry {
  id: string;
  ts: string;
  category: BackendAuditCategory;
  action: string;
  description: string;
  actor: {
    name: string;
    email: string;
    role: string;
    ip: string;
    session: string;
  };
  resource?: {
    type: string;
    id: string;
    label: string;
  };
  severity: AuditSeverity;
  status: string;
  eventType: string;
}

export interface AuditListResult {
  entries: AuditEntry[];
  total?: number;
}
