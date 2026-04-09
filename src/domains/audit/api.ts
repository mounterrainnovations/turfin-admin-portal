import { api, getAuthTokens, BASE_URL } from "@/lib/api-client";
import { AuditLogRecord, AuditListParams, AuditCategory } from "./types";
import { useQuery } from "@tanstack/react-query";

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export const auditApi = {
  fetchLogs: async ({
    page = 1,
    limit = 20,
    category,
    actorId,
    search,
  }: AuditListParams = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (category) params.append("category", category);
    if (actorId)  params.append("actorId",  actorId);
    if (search)   params.append("search",   search);

    return api.get<PaginatedResponse<AuditLogRecord>>(`/audit?${params.toString()}`);
  },

  exportCsv: async (params: { category?: AuditCategory; actorId?: string } = {}) => {
    const queryParams = new URLSearchParams();
    if (params.category) queryParams.append("category", params.category);
    if (params.actorId) queryParams.append("actorId", params.actorId);

    const { access } = getAuthTokens() || {};
    
    // We use direct fetch here because our standard api-client helper 
    // is hardcoded to JSON parsing and we need a blob/stream for CSV.
    const response = await fetch(`${BASE_URL}/audit/export/csv?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || "Failed to export CSV");
    }
    
    return response.blob();
  },
};

export function useAuditLogs(params?: AuditListParams) {
  return useQuery({
    // Spreading params so each unique combination of filters produces a unique cache key
    queryKey: ["admin", "audit", params?.page, params?.limit, params?.category, params?.search, params?.actorId],
    queryFn: () => auditApi.fetchLogs(params),
    staleTime: 0,  // Always refetch when filters change
  });
}
