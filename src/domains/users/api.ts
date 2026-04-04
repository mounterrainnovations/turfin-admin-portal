import { api } from "@/lib/api-client";
import { UserProfile } from "./types";
import { useQuery } from "@tanstack/react-query";

interface UserListParams {
  page?: number;
  limit?: number;
}

export const usersApi = {
  fetchUsers: async ({ page = 1, limit = 10 }: UserListParams = {}) => {
    return api.get<UserProfile[]>(`/admin/users?page=${page}&limit=${limit}`);
  },

  /**
   * Placeholder for Ban/Unban functionality.
   * Endpoint will be updated once provided by the user.
   */
  banUser: async (userId: string): Promise<void> => {
    return api.post(`/admin/users/${userId}/ban`, {});
  },

  unbanUser: async (userId: string): Promise<void> => {
    return api.post(`/admin/users/${userId}/unban`, {});
  },
};

export function useUsersList(params?: UserListParams) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => usersApi.fetchUsers(params),
  });
}
