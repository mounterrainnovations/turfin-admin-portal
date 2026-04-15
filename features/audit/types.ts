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
  actorId: string;
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
  targetType: string;
  targetId: string;
  ipAddress: string;
  userAgent: string;
  route: string;
  url: string;
  method: string;
  httpStatus: string;
  durationMs: string;
  payloadData: unknown;
  responseData: unknown;
}

export interface AuditListResult {
  entries: AuditEntry[];
  total?: number;
}
