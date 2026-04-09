/**
 * TurfIn Backend API Client
 *
 * Provides a standardized way to interact with the backend API.
 * Handles:
 * - Base URL injection
 * - Authorization headers
 * - Auto-refreshing tokens on 401
 * - Unified response/error handling
 */

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class ApiError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

/**
 * Persists and retrieves the authentication state from local storage.
 * In a real production app, this would ideally be in a more secure place
 * or handled via HttpOnly cookies, but we'll follow the backend's token-based pattern.
 */
export const getAuthTokens = () => {
  if (typeof window === "undefined") return null;
  const access = localStorage.getItem("turfin_access_token");
  const refresh = localStorage.getItem("turfin_refresh_token");
  return { access, refresh };
};

export const setAuthTokens = (access: string, refresh: string) => {
  localStorage.setItem("turfin_access_token", access);
  localStorage.setItem("turfin_refresh_token", refresh);
};

export const clearAuthTokens = () => {
  localStorage.removeItem("turfin_access_token");
  localStorage.removeItem("turfin_refresh_token");
};

async function refreshAuthTokens(): Promise<boolean> {
  const tokens = getAuthTokens();
  if (!tokens?.refresh) return false;

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tokens.refresh }),
    });

    const body: ApiResponse = await response.json();
    if (body.success && body.data.accessToken) {
      setAuthTokens(body.data.accessToken, body.data.refreshToken);
      return true;
    }
  } catch (err) {
    console.error("Token refresh failed", err);
  }

  clearAuthTokens();
  window.location.href = "/"; // Force logout
  return false;
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;

  const defaultHeaders: Record<string, string> = {};

  if (options.body) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const tokens = getAuthTokens();
  if (tokens?.access) {
    defaultHeaders["Authorization"] = `Bearer ${tokens.access}`;
  }

  const mergedHeaders = { ...defaultHeaders, ...options.headers };

  try {
    let response = await fetch(url, {
      ...options,
      headers: mergedHeaders,
    });

    // Handle 401 Unauthorized - Attempt refresh once
    if (response.status === 401 && tokens?.refresh) {
      const refreshed = await refreshAuthTokens();
      if (refreshed) {
        const newTokens = getAuthTokens();
        const retriedResponse = await fetch(url, {
          ...options,
          headers: {
            ...mergedHeaders,
            Authorization: `Bearer ${newTokens?.access}`,
          },
        });
        response = retriedResponse;
      }
    }

    const result: ApiResponse<T> = await response.json();

    if (!result.success) {
      throw new ApiError(
        result.error?.message || "An unexpected error occurred",
        result.error?.code || "UNKNOWN_ERROR",
        result.error?.details,
      );
    }

    // Handle paginated responses - include 'meta' in the returned data if present
    if (result.meta) {
      return {
        data: result.data,
        meta: result.meta,
      } as any;
    }

    return result.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Network connection failure", "NETWORK_ERROR", error);
  }
}

// Named HTTP methods for convenience
export const api = {
  get: <T>(url: string, opts?: RequestInit) =>
    request<T>(url, { ...opts, method: "GET" }),
  post: <T>(url: string, body?: any, opts?: RequestInit) =>
    request<T>(url, {
      ...opts,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(url: string, body?: any, opts?: RequestInit) =>
    request<T>(url, {
      ...opts,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(url: string, opts?: RequestInit) =>
    request<T>(url, { ...opts, method: "DELETE" }),
};
