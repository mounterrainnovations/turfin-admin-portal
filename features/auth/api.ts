import type { AdminRole, AdminSession, SignInInput } from "./types";

const ADMIN_ROLES: AdminRole[] = ["super_admin", "sub_admin"];

function getApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("Missing NEXT_PUBLIC_API_URL.");
  }

  return apiUrl.replace(/\/$/, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function findStringDeep(value: unknown, keys: string[]): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findStringDeep(item, keys);
      if (found) return found;
    }
    return undefined;
  }

  if (!isRecord(value)) return undefined;

  for (const key of keys) {
    const found = readString(value[key]);
    if (found) return found;
  }

  for (const nested of Object.values(value)) {
    const found = findStringDeep(nested, keys);
    if (found) return found;
  }

  return undefined;
}

function extractAccessToken(payload: unknown): string | undefined {
  return findStringDeep(payload, [
    "accessToken",
    "access_token",
    "token",
    "jwt",
  ]);
}

function extractRefreshToken(payload: unknown): string | undefined {
  return findStringDeep(payload, ["refreshToken", "refresh_token"]);
}

function normalizeRole(value: string | undefined): AdminRole | null {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  return ADMIN_ROLES.includes(normalized as AdminRole)
    ? (normalized as AdminRole)
    : null;
}

function extractRole(
  payload: unknown,
  tokenPayload: Record<string, unknown> | null,
): AdminRole | null {
  const directRole = normalizeRole(
    findStringDeep(payload, ["role", "userRole"]),
  );
  if (directRole) return directRole;

  const claimRole = normalizeRole(
    findStringDeep(tokenPayload, ["role", "userRole"]),
  );
  if (claimRole) return claimRole;

  const roles = tokenPayload?.roles;
  if (Array.isArray(roles)) {
    for (const role of roles) {
      const normalized = normalizeRole(readString(role));
      if (normalized) return normalized;
    }
  }

  return null;
}

function extractEmail(
  payload: unknown,
  tokenPayload: Record<string, unknown> | null,
): string | undefined {
  return (
    findStringDeep(payload, ["email"]) ??
    findStringDeep(tokenPayload, ["email"])
  );
}

function extractDisplayName(
  payload: unknown,
  tokenPayload: Record<string, unknown> | null,
): string | undefined {
  return (
    findStringDeep(payload, ["displayName", "name", "fullName", "firstName"]) ??
    findStringDeep(tokenPayload, ["displayName", "name"])
  );
}

function buildUnauthorizedRoleMessage(role: string | null) {
  if (!role) {
    return "This portal only allows super admin and sub-admin accounts.";
  }

  return `Role "${role}" is not allowed on this admin portal. Only super admin and sub-admin accounts can sign in here.`;
}

export async function signInAdmin(input: SignInInput): Promise<AdminSession> {
  const response = await fetch(`${getApiUrl()}/auth/signin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      findStringDeep(payload, ["message", "error"]) ?? "Sign in failed.";
    throw new Error(message);
  }

  const accessToken = extractAccessToken(payload);
  if (!accessToken) {
    throw new Error("Sign in succeeded but no access token was returned.");
  }

  const tokenPayload = decodeJwtPayload(accessToken);
  const role = extractRole(payload, tokenPayload);

  if (!role) {
    throw new Error(
      buildUnauthorizedRoleMessage(
        findStringDeep(payload, ["role", "userRole"]) ??
          findStringDeep(tokenPayload, ["role", "userRole"]) ??
          null,
      ),
    );
  }

  return {
    accessToken,
    refreshToken: extractRefreshToken(payload),
    role,
    email: extractEmail(payload, tokenPayload),
    displayName: extractDisplayName(payload, tokenPayload),
    raw: payload,
  };
}

export async function refreshTokenAdmin(
  refreshToken: string,
): Promise<AdminSession> {
  const response = await fetch(`${getApiUrl()}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      findStringDeep(payload, ["message", "error"]) ?? "Refresh failed.";
    throw new Error(message);
  }

  const accessToken = extractAccessToken(payload);
  if (!accessToken) {
    throw new Error("Refresh succeeded but no access token was returned.");
  }

  const tokenPayload = decodeJwtPayload(accessToken);
  const role = extractRole(payload, tokenPayload);

  if (!role) {
    throw new Error("User role not found in refreshed session.");
  }

  return {
    accessToken,
    refreshToken: extractRefreshToken(payload) ?? refreshToken, // Use new one or fallback to old one
    role,
    email: extractEmail(payload, tokenPayload),
    displayName: extractDisplayName(payload, tokenPayload),
    raw: payload,
  };
}
