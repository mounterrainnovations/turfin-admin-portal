import { authenticatedFetch } from "@/features/auth/request";
import type { AudienceKey, NotifStatus } from "./types";

function getApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) throw new Error("Missing NEXT_PUBLIC_API_URL.");
  return apiUrl.replace(/\/$/, "");
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    let msg = "An unexpected error occurred";
    if (typeof payload === "object" && payload !== null) {
      msg =
        (payload as any).error?.message ||
        (payload as any).message ||
        JSON.stringify(payload);
    } else if (typeof payload === "string" && payload.trim()) {
      msg = payload;
    }
    throw new Error(msg);
  }
  // Backend wraps all responses as { success: true, data: T }
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return (payload as any).data as T;
  }
  return payload as T;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SendNotificationPayload {
  title: string;
  message: string;
  audience: AudienceKey;
  cities?: string[];
  sports?: string[];
  scheduleAt?: string;
}

export interface Campaign {
  id: string;
  title: string;
  message: string;
  audienceKey: AudienceKey;
  audienceLabel: string;
  estimatedReach: number;
  status: NotifStatus;
  onesignalNotificationId: string | null;
  failureReason: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface CampaignListResponse {
  items: Campaign[];
  total: number;
  page: number;
  limit: number;
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function sendNotification(
  payload: SendNotificationPayload,
): Promise<Campaign> {
  const base = getApiUrl();
  const res = await authenticatedFetch(`${base}/admin/notifications/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  return handleResponse<Campaign>(res);
}

export async function fetchNotifications(filter?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<CampaignListResponse> {
  const base = getApiUrl();
  const params = new URLSearchParams();
  if (filter?.status) params.set("status", filter.status);
  if (filter?.page) params.set("page", String(filter.page));
  if (filter?.limit) params.set("limit", String(filter.limit));
  const qs = params.toString();
  const res = await authenticatedFetch(
    `${base}/admin/notifications${qs ? `?${qs}` : ""}`,
    { cache: "no-store" },
  );
  return handleResponse<CampaignListResponse>(res);
}

export async function cancelNotification(id: string): Promise<Campaign> {
  const base = getApiUrl();
  const res = await authenticatedFetch(`${base}/admin/notifications/${id}`, {
    method: "DELETE",
    cache: "no-store",
  });
  return handleResponse<Campaign>(res);
}
