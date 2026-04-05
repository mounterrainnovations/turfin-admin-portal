import { api } from "@/lib/api-client";
import { AuditLogRecord, AuditListParams } from "./types";
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
};

export function useAuditLogs(params?: AuditListParams) {
  return useQuery({
    // Spreading params so each unique combination of filters produces a unique cache key
    queryKey: ["admin", "audit", params?.page, params?.limit, params?.category, params?.search, params?.actorId],
    queryFn: () => auditApi.fetchLogs(params),
    staleTime: 0,  // Always refetch when filters change
  });
}
