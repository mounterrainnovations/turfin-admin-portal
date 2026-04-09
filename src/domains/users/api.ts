import { api } from "@/lib/api-client";
import { UserProfile, UserListParams } from "./types";
import { useQuery } from "@tanstack/react-query";

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export const usersApi = {
  /**
   * Fetches the complete list of users for the admin grid.
   * Aligned with Postman: GET /admin/users
   */
  fetchUsers: async (
    params: UserListParams = {},
  ): Promise<PaginatedResponse<UserProfile>> => {
    const searchParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
    });

    if (params.status) searchParams.append("status", params.status);
    if (params.search) searchParams.append("search", params.search);

    return api.get<PaginatedResponse<UserProfile>>(
      `/admin/users?${searchParams.toString()}`,
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
