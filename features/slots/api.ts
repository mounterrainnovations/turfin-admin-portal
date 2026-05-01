import { authenticatedFetch } from "@/features/auth/request";
import {
  AdminSlot,
  SlotConfig,
  UpsertSlotConfigPayload,
  AdminSlotPatchPayload,
  SlotGenerateResponse,
} from "./types";

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

function extractObject(payload: any): any {
  if (!isRecord(payload)) return payload;
  const candidates = ["item", "data", "result", "slotConfig", "config"];
  for (const key of candidates) {
    if (isRecord(payload[key])) return payload[key];
  }
  return payload;
}

export async function getAdminSlots(turfId: string, date: string): Promise<AdminSlot[]> {
  const url = new URL(`${getApiUrl()}/admin/turfs/${turfId}/slots`);
  url.searchParams.set("date", date);

  const response = await authenticatedFetch(url.toString(), {
    cache: "no-store",
  });
  const data = await handleResponse(response);
  return Array.isArray(data) ? data : data.slots || [];
}

export async function getAdminSlotConfig(turfId: string): Promise<SlotConfig> {
  const response = await authenticatedFetch(`${getApiUrl()}/vendors/turfs/${turfId}/slot-config`, {
    cache: "no-store",
  });
  const payload = await handleResponse(response);
  const config = extractObject(payload);
  
  // Convert Paise to Rupees for UI
  if (config && config.dailyConfigs) {
    config.dailyConfigs = config.dailyConfigs.map((p: any) => ({
      ...p,
      pricePaise: p.pricePaise / 100
    }));
  }
  
  return config;
}

export async function upsertAdminSlotConfig(
  turfId: string,
  payload: UpsertSlotConfigPayload
): Promise<SlotConfig> {
  // Convert Rupees to Paise for backend
  const payloadWithPaise = {
    ...payload,
    dailyConfigs: payload.dailyConfigs.map(p => ({
      ...p,
      pricePaise: Math.round(p.pricePaise * 100)
    }))
  };

  const response = await authenticatedFetch(
    `${getApiUrl()}/vendors/turfs/${turfId}/slot-config`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payloadWithPaise),
    }
  );
  const data = await handleResponse(response);
  return extractObject(data);
}

export async function generateAdminSlots(turfId: string): Promise<SlotGenerateResponse> {
  const response = await authenticatedFetch(
    `${getApiUrl()}/admin/turfs/${turfId}/slots/generate`,
    {
      method: "POST",
    }
  );
  return handleResponse(response);
}

export async function patchAdminSlot(
  slotId: string,
  payload: AdminSlotPatchPayload
): Promise<AdminSlot> {
  const response = await authenticatedFetch(
    `${getApiUrl()}/admin/slots/${slotId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );
  return handleResponse(response);
}
