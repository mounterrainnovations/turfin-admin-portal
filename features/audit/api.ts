import { getAdminSession } from "@/features/auth/session";
import type { AuditEntry, AuditListResult, AuditSeverity, BackendAuditCategory } from "./types";

const AUDIT_CATEGORIES: BackendAuditCategory[] = [
  "auth",
  "kyc",
  "booking",
  "payment",
  "slot",
  "admin",
  "vendor",
  "turf",
  "user",
];

function getApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("Missing NEXT_PUBLIC_API_URL.");
  }

  return apiUrl.replace(/\/$/, "");
}

function getAccessToken() {
  const session = getAdminSession();

  if (!session?.accessToken) {
    throw new Error("Your admin session is missing. Please sign in again.");
  }

  return session.accessToken;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

function findStringDeep(value: unknown, keys: string[]): string | undefined {
  if (!isRecord(value)) return undefined;

  for (const key of keys) {
    const found = readString(value[key]);
    if (found) return found;
  }

  for (const nested of Object.values(value)) {
    const found = findStringDeep(nested, keys);
    if (found) return found;
  }

  return undefined;
}

function normalizeCategory(value: unknown): BackendAuditCategory {
  const raw = readString(value)?.toLowerCase();
  if (raw && AUDIT_CATEGORIES.includes(raw as BackendAuditCategory)) {
    return raw as BackendAuditCategory;
  }

  return "admin";
}

function normalizeSeverity(value: unknown): AuditSeverity {
  const raw = readString(value)?.toLowerCase();

  if (raw === "info" || raw === "warning" || raw === "critical") {
    return raw;
  }

  return "-";
}

function extractItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  const candidates = ["items", "data", "results", "entries", "logs"];

  for (const key of candidates) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (isRecord(value)) {
      for (const nestedKey of candidates) {
        const nestedValue = value[nestedKey];
        if (Array.isArray(nestedValue)) return nestedValue;
      }
    }
  }

  return [];
}

function extractTotal(payload: unknown): number | undefined {
  if (!isRecord(payload)) return undefined;

  const direct = payload.total;
  if (typeof direct === "number") return direct;

  const meta = readRecord(payload.meta) ?? readRecord(payload.pagination);
  if (!meta) return undefined;

  const metaTotal = meta.total;
  return typeof metaTotal === "number" ? metaTotal : undefined;
}

function adaptAuditEntry(item: unknown, index: number): AuditEntry {
  const record = readRecord(item) ?? {};
  const actor =
    readRecord(record.actor) ??
    readRecord(record.performedBy) ??
    readRecord(record.user) ??
    readRecord(record.identity) ??
    {};
  const resource =
    readRecord(record.resource) ??
    readRecord(record.entity) ??
    readRecord(record.target);

  const eventType =
    readString(record.eventType) ??
    readString(record.event_type) ??
    readString(record.type) ??
    "-";
  const action =
    readString(record.action) ??
    readString(record.title) ??
    eventType;
  const description =
    readString(record.description) ??
    readString(record.message) ??
    readString(record.summary) ??
    "-";

  return {
    id:
      readString(record.id) ??
      readString(record.auditId) ??
      readString(record.eventId) ??
      `audit_${index}`,
    ts:
      readString(record.ts) ??
      readString(record.timestamp) ??
      readString(record.createdAt) ??
      readString(record.occurredAt) ??
      new Date(0).toISOString(),
    category: normalizeCategory(record.category),
    action,
    description,
    actor: {
      name:
        readString(actor.name) ??
        readString(actor.displayName) ??
        readString(actor.fullName) ??
        "-",
      email: readString(actor.email) ?? "-",
      role:
        readString(actor.role) ??
        readString(actor.userRole) ??
        "-",
      ip:
        readString(actor.ip) ??
        readString(actor.ipAddress) ??
        "-",
      session:
        readString(actor.session) ??
        readString(actor.sessionId) ??
        "-",
    },
    resource: resource
      ? {
          type:
            readString(resource.type) ??
            readString(resource.resourceType) ??
            "-",
          id:
            readString(resource.id) ??
            readString(resource.resourceId) ??
            "-",
          label:
            readString(resource.label) ??
            readString(resource.name) ??
            readString(resource.title) ??
            "-",
        }
      : undefined,
    severity: normalizeSeverity(record.severity),
    status:
      readString(record.status) ??
      readString(record.result) ??
      readString(record.outcome) ??
      "-",
    eventType,
  };
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
}

function buildAuditUrl(pathname: string, query: Record<string, string | undefined>) {
  const url = new URL(`${getApiUrl()}${pathname}`);

  for (const [key, value] of Object.entries(query)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

export async function listAuditLogs(params: {
  page?: number;
  limit?: number;
  category?: BackendAuditCategory | "all";
  eventType?: string;
  actorId?: string;
} = {}): Promise<AuditListResult> {
  const response = await fetch(
    buildAuditUrl("/audit", {
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 100),
      category: params.category && params.category !== "all" ? params.category : undefined,
      eventType: params.eventType,
      actorId: params.actorId,
    }),
    {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
      cache: "no-store",
    },
  );

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message = findStringDeep(payload, ["message", "error"]) ?? "Unable to load audit logs.";
    throw new Error(message);
  }

  const items = extractItems(payload);

  return {
    entries: items.map(adaptAuditEntry),
    total: extractTotal(payload),
  };
}

export async function exportAuditCsv(params: {
  category?: BackendAuditCategory | "all";
  actorId?: string;
}) {
  const response = await fetch(
    buildAuditUrl("/audit/export/csv", {
      category: params.category && params.category !== "all" ? params.category : undefined,
      actorId: params.actorId,
    }),
    {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    },
  );

  if (!response.ok) {
    const payload = await parseResponse(response);
    const message = findStringDeep(payload, ["message", "error"]) ?? "Unable to export audit logs.";
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") ?? "";
  const fileNameMatch = disposition.match(/filename="?([^"]+)"?/i);

  return {
    blob,
    fileName: fileNameMatch?.[1] ?? "audit-log.csv",
  };
}
