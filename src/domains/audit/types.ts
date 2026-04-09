export type AuditCategory = "auth" | "admin" | "kyc" | "turf" | "booking" | "payment" | "slot" | "vendor";

export interface AuditLogRecord {
  id: string;
  actorId: string | null;
  actorRole: string | null;
  category: AuditCategory;
  eventType: string;
  targetType: string | null;
  targetId: string | null;
  status: "success" | "failure";
  payload: any;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditListParams {
  page?: number;
  limit?: number;
  category?: AuditCategory;
  actorId?: string;
  search?: string;
}
