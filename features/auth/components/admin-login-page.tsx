"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveAdminSession } from "@/features/auth/session";
import { signInAdmin } from "@/features/auth/api";
import { useToast } from "@/features/toast/toast-context";
import { getAdminSignInErrorMessage } from "@/features/auth/error-messages";

export function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const session = await signInAdmin({
        email: email.trim(),
        password,
      });

      saveAdminSession(session);
      showToast({
        tone: "success",
        title: "Signed in successfully",
        description: `Welcome back${session.displayName ? `, ${session.displayName}` : ""}.`,
        durationMs: 2200,
      });
      router.push("/dashboard");
    } catch (error) {
      const toast = getAdminSignInErrorMessage(error);
      showToast({
        tone: "error",
        title: toast.title,
        description: toast.description,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{
        background:
          "linear-gradient(135deg, #a8b87e 0%, #8a9e60 40%, #6e8245 100%)",
      }}
    >
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center pointer-events-none select-none"
        style={{ width: "12vw" }}
      >
        <span
          className="font-black tracking-widest uppercase"
          style={{
            fontSize: "10vw",
            color: "rgba(255,255,255,0.12)",
            lineHeight: 1,
            transform: "rotate(90deg)",
            whiteSpace: "nowrap",
          }}
        >
          TURFIN
        </span>
      </div>

      <nav className="relative z-10 flex items-center px-8 py-4">
        <span className="text-white text-xl font-semibold tracking-widest uppercase">
          Turfin
        </span>
      </nav>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden relative">
          <div className="w-full flex-shrink-0 p-8">
            <h1 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              Log in to your Turfin account.
            </h1>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleLogin();
                  }
                }}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
              />
            </div>
            {/* Remember Me - Not Implemented Yet */}
            {/* <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 accent-[#8a9e60]"
              />
              <label htmlFor="remember" className="text-sm text-gray-600">
                Remember me
              </label>
            </div> */}
            <button
              onClick={() => void handleLogin()}
              disabled={isSubmitting}
              className="w-full py-2.5 text-sm font-semibold text-white uppercase tracking-widest rounded transition-opacity hover:opacity-90 mb-3 disabled:opacity-90"
              style={{ backgroundColor: "#8a9e60" }}
            >
              {isSubmitting ? "SIGNING IN..." : "LOGIN"}
            </button>
          </div>
        </div>
      </main>

      <div className="relative z-10 px-8 py-4">
        <a
          href="mailto:contact@turfinapp.com"
          className="text-white/80 hover:text-white text-xs"
        >
          Have an issue?{" "}
          <span className="underline font-medium">Contact Us</span>
        </a>
      </div>
    </div>
  );
}
