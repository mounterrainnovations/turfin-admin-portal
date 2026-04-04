import { api, setAuthTokens, clearAuthTokens, getAuthTokens } from "./api-client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

export interface Session {
  id: string;
  email: string;
  roles: string[];
  profileCompleted: boolean;
}

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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

      // Role check: Only super_admin can enter the portal
      if (!data.identity.roles.includes("super_admin")) {
        throw new Error("Unauthorized: Super Admin access required.");
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
    <AuthContext.Provider value={{ session, isLoading, signIn, signOut }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useSession must be used inside AuthProvider");
  return ctx;
}
