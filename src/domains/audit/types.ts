export type AuditCategory = "auth" | "admin" | "kyc" | "turf";

export interface AuditLogRecord {
  id: string;
  actorId: string;
  actorRole: string;
  category: AuditCategory;
  eventType: string;
  targetType: string | null;
  targetId: string | null;
  status: "success" | "failure";
  payload: any;
  metadata: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface AuditListParams {
  page?: number;
  limit?: number;
  category?: AuditCategory;
  actorId?: string;
  search?: string;
}
