import { authenticatedFetch } from "@/features/auth/request";
import { User, UserListResult } from "./types";

function getApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) throw new Error("Missing NEXT_PUBLIC_API_URL.");
  return apiUrl.replace(/\/$/, "");
}


async function handleResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    let errorMsg = "An unexpected error occurred";
    if (typeof payload === "object" && payload !== null) {
      errorMsg =
        payload.error?.message || payload.message || JSON.stringify(payload);
    } else if (typeof payload === "string" && payload.trim()) {
      errorMsg = payload;
    }
    throw new Error(errorMsg);
  }
  return payload;
}

function isRecord(v: any): v is Record<string, any> {
  return typeof v === "object" && v !== null;
}

function extractItems(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  const candidates = ["items", "data", "results", "users"];
  for (const key of candidates) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  return [];
}

function extractTotal(payload: any, itemsLength: number): number {
  if (!isRecord(payload)) return itemsLength;
  if (typeof payload.total === "number") return payload.total;
  if (typeof payload.totalItems === "number") return payload.totalItems;

  const meta = payload.meta || payload.pagination;
  if (isRecord(meta)) {
    if (typeof meta.total === "number") return meta.total;
    if (typeof meta.totalItems === "number") return meta.totalItems;
    if (typeof meta.count === "number") return meta.count;
  }
  return itemsLength;
}

export async function listUsers(
  params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    searchBy?:
      | "name"
      | "email"
      | "user_id"
      | "identity_id"
      | "city"
      | "state";
  } = {},
): Promise<UserListResult> {
  const url = new URL(`${getApiUrl()}/admin/users`);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.status && params.status !== "all")
    url.searchParams.set("status", params.status);
  if (params.search) url.searchParams.set("search", params.search);
  if (params.searchBy && params.search)
    url.searchParams.set("searchBy", params.searchBy);

  const response = await authenticatedFetch(url.toString(), {
    cache: "no-store",
  });

  const data = await handleResponse(response);
  const rawItems = extractItems(data);
  const items = rawItems.map((u: any) => ({
    ...u,
    status: (u.status || "active").toLowerCase(),
  }));

  return {
    items,
    total: extractTotal(data, items.length),
  };
}

export async function getUserById(userId: string): Promise<User> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/users/${userId}`, {
    cache: "no-store",
  });
  const data = await handleResponse(response);
  return data.data || data;
}

export async function banUser(userId: string, reason?: string): Promise<void> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/users/${userId}/ban`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });
  await handleResponse(response);
}

export async function unbanUser(userId: string): Promise<void> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/users/${userId}/unban`, {
    method: "POST",
  });
  await handleResponse(response);
}
