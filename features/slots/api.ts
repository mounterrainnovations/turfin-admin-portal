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
  const response = await authenticatedFetch(`${getApiUrl()}/admin/turfs/${turfId}/slot-config`, {
    cache: "no-store",
  });
  const config = await handleResponse(response);
  
  // Convert Paise to Rupees for UI
  if (config.weeklyPricing) {
    config.weeklyPricing = config.weeklyPricing.map((p: any) => ({
      ...p,
      prices: p.prices.map((paise: number) => paise / 100)
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
    weeklyPricing: payload.weeklyPricing.map(p => ({
      ...p,
      prices: p.prices.map(rupees => Math.round(rupees * 100))
    }))
  };

  const response = await authenticatedFetch(
    `${getApiUrl()}/admin/turfs/${turfId}/slot-config`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payloadWithPaise),
    }
  );
  return handleResponse(response);
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
