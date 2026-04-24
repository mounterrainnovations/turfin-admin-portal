import { authenticatedFetch } from "@/features/auth/request";
import {
  Turf,
  TurfReview,
  TurfListResult,
  CreateTurfDto,
  UpdateTurfDto,
  TurfReviewDto,
  SubmitTurfDocumentsDto,
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

function extractItems(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  const candidates = ["items", "data", "results", "turfs"];
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

function extractObject(payload: any): any {
  if (!isRecord(payload)) return payload;
  const candidates = ["item", "data", "result", "turf"];
  for (const key of candidates) {
    if (isRecord(payload[key])) return payload[key];
  }
  return payload;
}

function normalizeTurf(t: any): Turf {
  const ratingSummary = isRecord(t.rating)
    ? {
        avgScore:
          typeof t.rating.avgScore === "number" ? t.rating.avgScore : 0,
        totalReviews:
          typeof t.rating.totalReviews === "number"
            ? t.rating.totalReviews
            : 0,
      }
    : undefined;

  const avgScore =
    typeof t.rating === "number"
      ? t.rating
      : ratingSummary?.avgScore || 0;
  const totalReviews =
    typeof t.totalReviews === "number"
      ? t.totalReviews
      : ratingSummary?.totalReviews || 0;

  return {
    ...t,
    status: (t.status || "pending").toLowerCase(),
    kycStatus: (t.kyc?.status || t.kycStatus || "not_started").toLowerCase(),
    verification: t.kyc?.verification || t.verification || {},
    address: t.address || {},
    vendor: t.vendor || {},
    rating: avgScore,
    totalReviews,
    ratingSummary,
    kyc: t.kyc
      ? {
          ...t.kyc,
          status: (t.kyc.status || "not_started").toLowerCase(),
          verification: t.kyc.verification || {},
          documents: t.kyc.documents || {},
        }
      : undefined,
    listedAt: t.createdAt || t.listedAt || new Date().toISOString(),
  };
}

function normalizeReview(review: any): TurfReview {
  return {
    id: String(review?.id || ""),
    userId: String(review?.userId || ""),
    fieldId: String(review?.fieldId || ""),
    bookingId: String(review?.bookingId || ""),
    score:
      typeof review?.score === "number" ? review.score : Number(review?.score || 0),
    comment:
      typeof review?.comment === "string" ? review.comment : undefined,
    user: review?.user
      ? {
          firstName: review.user.firstName || undefined,
          lastName: review.user.lastName || undefined,
          avatarUrl: review.user.avatarUrl ?? null,
        }
      : undefined,
    createdAt: review?.createdAt || new Date().toISOString(),
  };
}

export async function listTurfs(
  params: {
    page?: number;
    limit?: number;
    status?: string;
    sportType?: string;
    city?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  } = {},
): Promise<TurfListResult> {
  const url = new URL(`${getApiUrl()}/admin/turfs`);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.status && params.status !== "all")
    url.searchParams.set("status", params.status);
  if (params.sportType) url.searchParams.set("sportType", params.sportType);
  if (params.city) url.searchParams.set("city", params.city);
  if (params.search) url.searchParams.set("search", params.search);
  if (params.startDate) url.searchParams.set("startDate", params.startDate);
  if (params.endDate) url.searchParams.set("endDate", params.endDate);

  const response = await authenticatedFetch(url.toString(), {
    cache: "no-store",
  });

  const data = await handleResponse(response);
  const rawItems = extractItems(data);
  const items = rawItems.map(normalizeTurf);

  return {
    items,
    total: extractTotal(data, items.length),
  };
}

export async function getTurfById(turfId: string): Promise<Turf> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/turfs/${turfId}`, {
    cache: "no-store",
  });
  const payload = await handleResponse(response);
  return normalizeTurf(extractObject(payload));
}

export async function createTurfForVendor(
  vendorId: string,
  dto: CreateTurfDto,
): Promise<Turf> {
  const response = await authenticatedFetch(
    `${getApiUrl()}/admin/vendors/${vendorId}/turfs`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dto),
    },
  );
  return handleResponse(response);
}

export async function updateTurfStatus(
  turfId: string,
  status: string,
): Promise<Turf> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/turfs/${turfId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
  return handleResponse(response);
}

export async function reviewTurfDocuments(
  turfId: string,
  dto: TurfReviewDto,
): Promise<void> {
  const response = await authenticatedFetch(
    `${getApiUrl()}/admin/turfs/${turfId}/documents/review`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dto),
    },
  );
  await handleResponse(response);
}

export async function banTurf(turfId: string): Promise<void> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/turfs/${turfId}/ban`, {
    method: "POST",
  });
  await handleResponse(response);
}

export async function unbanTurf(turfId: string): Promise<void> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/turfs/${turfId}/unban`, {
    method: "POST",
  });
  await handleResponse(response);
}

export async function updateTurf(
  turfId: string,
  dto: UpdateTurfDto,
): Promise<Turf> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/turfs/${turfId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });
  return handleResponse(response);
}

export async function uploadTurfDocuments(
  turfId: string,
  dto: SubmitTurfDocumentsDto,
): Promise<any> {
  const response = await authenticatedFetch(
    `${getApiUrl()}/admin/turfs/${turfId}/documents`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dto),
    },
  );
  return handleResponse(response);
}

export async function getTurfReviews(turfId: string): Promise<TurfReview[]> {
  const response = await authenticatedFetch(
    `${getApiUrl()}/admin/turfs/${turfId}/reviews`,
    {
      cache: "no-store",
    },
  );
  const payload = await handleResponse(response);
  return extractItems(payload).map(normalizeReview);
}

export async function deleteTurfReview(
  turfId: string,
  reviewId: string,
): Promise<void> {
  let response = await authenticatedFetch(
    `${getApiUrl()}/admin/turfs/${turfId}/reviews/${reviewId}`,
    {
      method: "DELETE",
    },
  );

  if (response.status === 404) {
    response = await authenticatedFetch(`${getApiUrl()}/admin/reviews/${reviewId}`, {
      method: "DELETE",
    });
  }

  await handleResponse(response);
}
