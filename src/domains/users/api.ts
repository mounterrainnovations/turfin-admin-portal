import { api } from "@/lib/api-client";
import { UserProfile } from "./types";
import { useQuery } from "@tanstack/react-query";

interface UserListParams {
  page?: number;
  limit?: number;
}

export async function fetchUsers({ page = 1, limit = 10 }: UserListParams = {}) {
  // Returns { data: UserProfile[], meta: { page, limit, total } }
  return api.get<UserProfile[]>(`/admin/users?page=${page}&limit=${limit}`);
}

export function useUsersList(params?: UserListParams) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => fetchUsers(params),
  });
}
