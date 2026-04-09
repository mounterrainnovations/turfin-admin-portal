/**
 * User Module Types
 * Based on Turfin Backend Integration Contract
 */

export interface UserProfile {
  id: string;
  identityId: string;
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  displayName: string;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  city: string | null;
  state: string | null;
  country: string;
  preferredSports: string[];
  ownReferralCode: string | null;
  pushNotificationsEnabled: boolean;
  lastActiveAt: string | null;
  status: UserStatus;
  createdAt: string;
}

export type UserStatus = "active" | "inactive" | "banned" | "pending" | "under_review";

export interface UserListParams {
  page?: number;
  limit?: number;
  status?: UserStatus;
  search?: string;
}
