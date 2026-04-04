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

    return api.get<PaginatedResponse<TurfResponse>>(`/admin/turfs?${params.toString()}`);
  },

  updateTurfStatus: async (turfId: string, status: TurfResponse["status"]): Promise<void> => {
    return api.patch(`/admin/turfs/${turfId}/status`, { status });
  },
};

export function useTurfsList(params?: TurfListParams) {
  return useQuery({
    queryKey: ["admin", "turfs", params],
    queryFn: () => turfsApi.fetchTurfs(params),
  });
}
