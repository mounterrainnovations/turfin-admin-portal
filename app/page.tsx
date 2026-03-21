"use client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

type Step = "login" | "forgot" | "otp" | "newpass" | "contact";
const STEP_ORDER: Step[] = ["login", "forgot", "otp", "newpass"];

function slideX(current: Step, panel: Step): string {
  if (panel === "contact") return "translateX(100%)"; // handled separately
  const ci = STEP_ORDER.indexOf(current);
  const pi = STEP_ORDER.indexOf(panel);
  if (pi < ci) return "translateX(-100%)";
  if (pi > ci) return "translateX(100%)";
  return "translateX(0)";
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("login");
  const [showContact, setShowContact] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleOtpChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  }

  const transition = "transition-transform duration-500 ease-in-out";

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ background: "linear-gradient(135deg, #a8b87e 0%, #8a9e60 40%, #6e8245 100%)" }}
    >
      {/* TURFIN watermark */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center pointer-events-none select-none" style={{ width: "12vw" }}>
        <span
          className="font-black tracking-widest uppercase"
          style={{ fontSize: "10vw", color: "rgba(255,255,255,0.12)", lineHeight: 1, transform: "rotate(90deg)", whiteSpace: "nowrap" }}
        >
          TURFIN
        </span>
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center px-8 py-4">
        <span className="text-white text-xl font-semibold tracking-widest uppercase">Turfin</span>
      </nav>

      {/* Card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden relative" style={{ minHeight: 520 }}>

          {/* ── LOGIN PANEL ── */}
          <div
            className={`absolute inset-0 p-8 ${transition}`}
            style={{ transform: slideX(step, "login") }}
          >
            <h1 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              Log in to your Turfin account.
            </h1>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</label>
              <input type="email" className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Password</label>
              <input type="password" className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <input type="checkbox" id="remember" className="w-4 h-4 accent-[#8a9e60]" />
              <label htmlFor="remember" className="text-sm text-gray-600">Remember me</label>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-2.5 text-sm font-semibold text-white uppercase tracking-widest rounded transition-opacity hover:opacity-90 mb-3"
              style={{ backgroundColor: "#8a9e60" }}
            >
              LOGIN
            </button>
            <div className="text-center mb-5">
              <button
                onClick={() => setStep("forgot")}
                className="text-xs text-gray-500 hover:text-gray-700 underline bg-transparent border-none p-0 cursor-pointer"
              >
                Forgot your password?
              </button>
            </div>
            <div className="flex items-center mb-4">
              <div className="flex-1 border-t border-gray-200" />
              <span className="mx-3 text-xs text-gray-400">or continue with</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>
            <button className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Login with Google
            </button>
            <div className="text-center mt-5 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Don&apos;t have a Turfin account?{" "}
                <button
                  onClick={() => setShowContact(true)}
                  className="font-bold text-gray-800 hover:underline bg-transparent border-none p-0 cursor-pointer"
                >
                  Create one now.
                </button>
              </p>
            </div>
          </div>

          {/* ── FORGOT PASSWORD PANEL ── */}
          <div
            className={`absolute inset-0 p-8 flex flex-col justify-center ${transition}`}
            style={{ transform: slideX(step, "forgot") }}
          >
            <button onClick={() => setStep("login")} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-6 self-start">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              Back
            </button>
            <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">Forgot Password</h2>
            <p className="text-xs text-gray-500 text-center mb-6">Enter your email and we&apos;ll send you an OTP to reset your password.</p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</label>
              <input type="email" className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" />
            </div>
            <button
              onClick={() => setStep("otp")}
              className="w-full py-2.5 text-sm font-semibold text-white uppercase tracking-widest rounded transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#8a9e60" }}
            >
              Send OTP
            </button>
          </div>

          {/* ── OTP PANEL ── */}
          <div
            className={`absolute inset-0 p-8 flex flex-col justify-center ${transition}`}
            style={{ transform: slideX(step, "otp") }}
          >
            <button onClick={() => setStep("forgot")} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-6 self-start">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              Back
            </button>
            <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">Enter OTP</h2>
            <p className="text-xs text-gray-500 text-center mb-6">We&apos;ve sent a 6-digit code to your email.</p>
            <div className="flex justify-center gap-2 mb-6">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-10 h-12 border border-gray-200 rounded text-center text-lg font-semibold text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                />
              ))}
            </div>
            <button
              onClick={() => setStep("newpass")}
              className="w-full py-2.5 text-sm font-semibold text-white uppercase tracking-widest rounded transition-opacity hover:opacity-90 mb-3"
              style={{ backgroundColor: "#8a9e60" }}
            >
              Verify OTP
            </button>
            <p className="text-xs text-gray-400 text-center">
              Didn&apos;t receive it?{" "}
              <button className="text-[#8a9e60] underline bg-transparent border-none p-0 cursor-pointer">Resend</button>
            </p>
          </div>

          {/* ── NEW PASSWORD PANEL ── */}
          <div
            className={`absolute inset-0 p-8 flex flex-col justify-center ${transition}`}
            style={{ transform: slideX(step, "newpass") }}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">Set New Password</h2>
            <p className="text-xs text-gray-500 text-center mb-6">Choose a strong password for your account.</p>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">New Password</label>
              <input type="password" className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" />
            </div>
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Confirm Password</label>
              <input type="password" className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" />
            </div>
            <button
              onClick={() => { setOtp(["", "", "", "", "", ""]); setStep("login"); }}
              className="w-full py-2.5 text-sm font-semibold text-white uppercase tracking-widest rounded transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#8a9e60" }}
            >
              Reset Password
            </button>
          </div>

          {/* ── CONTACT / CREATE ACCOUNT PANEL ── */}
          <div
            className={`absolute inset-0 bg-white p-8 flex flex-col items-center justify-center ${transition}`}
            style={{ transform: showContact ? "translateX(0)" : "translateX(100%)" }}
          >
            <p className="text-sm text-gray-500 text-center mb-1">To create a new account,</p>
            <p className="text-sm text-gray-500 text-center mb-4">contact admin at</p>
            <a href="mailto:admin@turfinapp.in" className="text-base font-semibold text-[#8a9e60] hover:underline">
              admin@turfinapp.in
            </a>
            <button
              onClick={() => setShowContact(false)}
              className="mt-8 text-xs text-gray-400 hover:text-gray-600 underline bg-transparent border-none p-0 cursor-pointer"
            >
              Back to login
            </button>
          </div>

        </div>
      </main>

      {/* Bottom-left contact link */}
      <div className="relative z-10 px-8 py-4">
        <a href="#" className="text-white/80 hover:text-white text-xs">
          Have an issue? <span className="underline font-medium">Contact Us</span>
        </a>
      </div>
    </div>
  );
}
