import {
  getAdminSession,
  saveAdminSession,
  clearAdminSession,
} from "./session";
import { refreshTokenAdmin } from "./api";

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

export async function authenticatedFetch(
  url: string | URL,
  options: RequestInit = {},
): Promise<Response> {
  const session = getAdminSession();
  const accessToken = session?.accessToken;

  if (!accessToken) {
    // Clear session just in case it was partially invalid
    clearAdminSession();
    throw new Error("Your admin session is missing. Please sign in again.");
  }

  const headers = new Headers(options.headers || {});
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const refreshToken = session?.refreshToken;
    if (!refreshToken) {
      clearAdminSession();
      throw new Error("Session expired. Please sign in again.");
    }

    try {
      const newAccessToken = await getNewToken(refreshToken);

      // Retry original request with new token
      headers.set("Authorization", `Bearer ${newAccessToken}`);
      return await fetch(url, { ...options, headers });
    } catch (error) {
      clearAdminSession();
      throw new Error("Session expired. Please sign in again.");
    }
  }

  return response;
}

async function getNewToken(refreshToken: string): Promise<string> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const newSession = await refreshTokenAdmin(refreshToken);
      saveAdminSession(newSession);
      return newSession.accessToken;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
