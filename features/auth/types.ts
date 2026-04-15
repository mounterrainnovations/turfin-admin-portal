export type AdminRole = "super_admin" | "sub_admin";

export interface AdminSession {
  accessToken: string;
  refreshToken?: string;
  role: AdminRole;
  email?: string;
  displayName?: string;
  raw?: unknown;
}

export interface SignInInput {
  email: string;
  password: string;
}
