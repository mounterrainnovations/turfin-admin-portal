"use client";
import { useState, useRef } from "react";
import { useSession } from "@/lib/auth";
import { toast } from "react-hot-toast";

type Step = "login" | "forgot" | "otp" | "newpass";
const STEP_ORDER: Step[] = ["login", "forgot", "otp", "newpass"];

function slideX(current: Step, panel: Step): string {
  const ci = STEP_ORDER.indexOf(current);
  const pi = STEP_ORDER.indexOf(panel);
  if (pi < ci) return "translateX(-100%)";
  if (pi > ci) return "translateX(100%)";
  return "translateX(0)";
}

export default function LoginPage() {
  const { signIn } = useSession();
  const [step, setStep] = useState<Step>("login");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back, Admin!");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to sign in. Please check your credentials.";
      toast.error(message);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOtpChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  }

  function handleOtpKeyDown(
    i: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace" && !otp[i] && i > 0)
      otpRefs.current[i - 1]?.focus();
  }

  const transition = "transition-transform duration-500 ease-in-out";

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{
        background:
          "linear-gradient(135deg, #a8b87e 0%, #8a9e60 40%, #6e8245 100%)",
      }}
    >
      {/* TURFIN watermark */}
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

      {/* Nav */}
      <nav className="relative z-10 flex items-center px-8 py-4">
        <span className="text-white text-xl font-semibold tracking-widest uppercase">
          Turfin
        </span>
      </nav>

      {/* Card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div
          className="bg-white rounded-2xl shadow-xl w-full max-w-[340px] overflow-hidden relative"
        >
          {/* ── LOGIN PANEL ── */}
          <div
            className={`inset-0 p-8 ${step === "login" ? "relative" : "absolute"} ${transition}`}
            style={{ transform: slideX(step, "login") }}
          >
            <h1 className="text-xl font-bold text-gray-800 mb-6 text-center tracking-tight">
              Admin Login
            </h1>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-0.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] focus:bg-white transition-all shadow-inner"
                  placeholder="admin@turfin.com"
                  disabled={isSubmitting}
                />
              </div>
              <div className="mb-6">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-0.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] focus:bg-white transition-all shadow-inner"
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 text-xs font-bold text-white uppercase tracking-widest rounded-xl transition-all hover:opacity-90 shadow-md active:scale-[0.98] flex items-center justify-center"
                style={{ backgroundColor: "#8a9e60" }}
              >
                {isSubmitting ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
            <div className="text-center mt-5">
              <button
                onClick={() => setStep("forgot")}
                className="text-[11px] font-medium text-gray-400 hover:text-[#8a9e60] transition-colors bg-transparent border-none p-0 cursor-pointer"
              >
                Forgot your password?
              </button>
            </div>
          </div>

          {/* ── FORGOT PASSWORD PANEL ── */}
          <div
            className={`absolute inset-0 p-8 flex flex-col justify-center ${transition}`}
            style={{ transform: slideX(step, "forgot") }}
          >
            <button
              onClick={() => setStep("login")}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-6 self-start"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back
            </button>
            <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">
              Forgot Password
            </h2>
            <p className="text-xs text-gray-500 text-center mb-6">
              Enter your email and we&apos;ll send you an OTP to reset your
              password.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
              />
            </div>
            <button
              onClick={() => {
                toast.success("OTP sent to your email!");
                setStep("otp");
              }}
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
            <button
              onClick={() => setStep("forgot")}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-6 self-start"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back
            </button>
            <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">
              Enter OTP
            </h2>
            <p className="text-xs text-gray-500 text-center mb-6">
              We&apos;ve sent a 6-digit code to your email.
            </p>
            <div className="flex justify-center gap-2 mb-6">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
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
              <button className="text-[#8a9e60] underline bg-transparent border-none p-0 cursor-pointer">
                Resend
              </button>
            </p>
          </div>

          {/* ── NEW PASSWORD PANEL ── */}
          <div
            className={`absolute inset-0 p-8 flex flex-col justify-center ${transition}`}
            style={{ transform: slideX(step, "newpass") }}
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">
              Set New Password
            </h2>
            <p className="text-xs text-gray-500 text-center mb-6">
              Choose a strong password for your account.
            </p>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
              />
            </div>
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
              />
            </div>
            <button
              onClick={() => {
                setOtp(["", "", "", "", "", ""]);
                toast.success("Password reset successfully!");
                setStep("login");
              }}
              className="w-full py-2.5 text-sm font-semibold text-white uppercase tracking-widest rounded transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#8a9e60" }}
            >
              Reset Password
            </button>
          </div>


        </div>
      </main>

      {/* Bottom-left contact link */}
      <div className="relative z-10 px-8 py-4">
        <a href="#" className="text-white/80 hover:text-white text-xs">
          Have an issue?{" "}
          <span className="underline font-medium">Contact Us</span>
        </a>
      </div>
    </div>
  );
}
