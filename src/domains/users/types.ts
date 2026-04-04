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
  city: string;
  state: string;
  country: string;
  preferredSports: string[];
  ownReferralCode: string | null;
  pushNotificationsEnabled: boolean;
  lastActiveAt: string | null;
  status: UserStatus;
  createdAt: string;
}

export type UserStatus = "active" | "inactive" | "banned";

// We'll extend the backend profile for the FE requirements if needed, 
// but for now let's stick to the official DTO.
