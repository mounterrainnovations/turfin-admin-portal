export type UserStatus = "active" | "inactive" | "banned";

export interface UserAddress {
  id: string;
  city: string;
  type: string;
  floor?: string;
  country: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  towerBlock?: string;
  contactName?: string;
  houseNumber?: string;
  pinLocality?: string;
  contactPhone?: string;
}

export interface User {
  id: string;
  identityId: string;
  email: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  displayName: string;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  city?: string | null;
  state?: string | null;
  country: string;
  preferredSports: string[];
  banReason?: string;
  addresses: UserAddress[];
  favouriteTurfs?: any;
  ownReferralCode?: string | null;
  pushNotificationsEnabled: boolean;
  status: UserStatus;
  lastActiveAt?: string | null;
  createdAt: string;
}

export interface UserListResult {
  items: User[];
  total: number;
}
