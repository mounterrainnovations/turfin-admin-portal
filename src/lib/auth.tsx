import { api, setAuthTokens, clearAuthTokens, getAuthTokens } from "./api-client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

export interface Session {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  profileCompleted: boolean;
}

/**
 * Returns true if the user has the required permission OR is a super admin.
 * @param userPermissions The permissions array from the session
 * @param resource The resource being checked (e.g., 'vendor')
 * @param action The action being checked (e.g., 'read')
 */
export const hasPermission = (
  userPermissions: string[] | undefined,
  resource: string,
  action: string
): boolean => {
  if (!userPermissions) return false;
  if (userPermissions.includes("*")) return true; // Super Admin bypass
  return userPermissions.includes(`${resource}:${action}`);
};

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  can: (resource: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Helper for components using context
  const can = (resource: string, action: string) => 
    hasPermission(session?.permissions, resource, action);

  // On mount, check for an existing session
  useEffect(() => {
    const tokens = getAuthTokens();
    const storedSession = localStorage.getItem("turfin_session");

    if (tokens?.access && storedSession) {
      try {
        setSession(JSON.parse(storedSession));
      } catch (err) {
        console.error("Failed to parse session", err);
        clearAuthTokens();
      }
    }
    setIsLoading(false);
  }, []);

  async function signIn(email: string, password: string) {
    try {
      const data = await api.post<{
        accessToken: string;
        refreshToken: string;
        identity: Session;
      }>("/auth/signin", { email, password });

      // Role check: Only super_admin or sub_admin can enter the portal
      const allowedRoles = ["super_admin", "sub_admin"];
      const hasPortalAccess = data.identity.roles.some((role) =>
        allowedRoles.includes(role)
      );

      if (!hasPortalAccess) {
        throw new Error("Unauthorized: Admin portal access required.");
      }

      setAuthTokens(data.accessToken, data.refreshToken);
      localStorage.setItem("turfin_session", JSON.stringify(data.identity));
      setSession(data.identity);

      router.push("/dashboard");
    } catch (err) {
      console.error("Sign-in error", err);
      throw err;
    }
  }

  function signOut() {
    clearAuthTokens();
    localStorage.removeItem("turfin_session");
    setSession(null);
    window.location.href = "/";
  }

  return (
    <AuthContext.Provider value={{ session, isLoading, signIn, signOut, can }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useSession must be used inside AuthProvider");
  return ctx;
}
