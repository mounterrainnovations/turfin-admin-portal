import { api } from "@/lib/api-client";
import { TurfResponse, TurfListParams } from "./types";
import { useQuery } from "@tanstack/react-query";

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export const turfsApi = {
  fetchTurfs: async ({
    page = 1,
    limit = 10,
    status,
    search,
  }: TurfListParams = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) params.append("status", status);
    if (search) params.append("search", search);

    return api.get<PaginatedResponse<TurfResponse>>(
      `/admin/turfs?${params.toString()}`,
    );
  },

  /**
   * Fetches a specific turf by ID.
   * Aligned with Postman: GET /admin/turfs/:turfId
   */
  fetchTurfById: async (turfId: string): Promise<TurfResponse> => {
    return api.get<TurfResponse>(`/admin/turfs/${turfId}`);
  },

  /**
   * Uploads/updates turf verification documents via admin override.
   * Aligned with Postman: PATCH /admin/turfs/:turfId/documents
   */
  uploadTurfDocuments: async (
    turfId: string,
    documents: NonNullable<TurfResponse["documents"]>["documents"],
  ): Promise<void> => {
    return api.patch(`/admin/turfs/${turfId}/documents`, { documents });
  },

  /**
   * Retrieves the status and stored URLs of turf documents.
   * Aligned with Postman: GET /admin/turfs/:turfId/documents
   */
  fetchTurfDocuments: async (
    turfId: string,
  ): Promise<TurfResponse["documents"]> => {
    return api.get<TurfResponse["documents"]>(
      `/admin/turfs/${turfId}/documents`,
    );
  },

  updateTurfStatus: async (
    turfId: string,
    status: TurfResponse["status"],
  ): Promise<void> => {
    return api.patch(`/admin/turfs/${turfId}/status`, { status });
  },

  reviewTurfDocuments: async (
    turfId: string,
    status: "verified" | "rejected" | "in_review",
    reviewerNotes?: string,
  ): Promise<void> => {
    return api.patch(`/admin/turfs/${turfId}/documents/review`, {
      status,
      reviewerNotes,
    });
  },

  onboardTurf: async (
    vendorId: string,
    data: Partial<TurfResponse>,
  ): Promise<TurfResponse> => {
    return api.post<TurfResponse>(`/admin/vendors/${vendorId}/turfs`, data);
  },
};

export function useTurfsList(params?: TurfListParams) {
  return useQuery({
    queryKey: ["admin", "turfs", params],
    queryFn: () => turfsApi.fetchTurfs(params),
  });
}
