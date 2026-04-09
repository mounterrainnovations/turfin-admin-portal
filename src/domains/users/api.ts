import { api } from "@/lib/api-client";
import { UserProfile } from "./types";
import { useQuery } from "@tanstack/react-query";

interface UserListParams {
  page?: number;
  limit?: number;
}

export const usersApi = {
  fetchUsers: async ({ page = 1, limit = 10 }: UserListParams = {}) => {
    return api.get<{ data: UserProfile[]; meta: { page: number; limit: number; total: number } }>(
      `/admin/users?page=${page}&limit=${limit}`,
    );
  },

  /**
   * Fetches a specific user by ID.
   * Aligned with Postman: GET /admin/users/:userId
   */
  fetchUserById: async (userId: string): Promise<UserProfile> => {
    return api.get<UserProfile>(`/admin/users/${userId}`);
  },

  /**
   * Ban a user and cancel all active bookings.
   */
  banUser: async (userId: string): Promise<void> => {
    return api.post(`/admin/users/${userId}/ban`, {});
  },

  /**
   * Unban a user account.
   */
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
