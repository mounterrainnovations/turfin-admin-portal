"use client";

import {
  Globe, CalendarBlank, CurrencyDollar, Bell, ShieldCheck,
  CheckCircle, XCircle, CaretDown, FloppyDisk, WarningCircle,
  Envelope, Phone,
} from "@phosphor-icons/react";
import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
type Section = "platform" | "bookings" | "payments" | "notifications" | "security";

interface Settings {
  // Platform
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  timezone: string;
  maintenanceMode: boolean;

  // Bookings
  minAdvanceNotice: string;
  maxAdvanceDays: string;
  cancellationWindow: string;
  autoCancelAfter: string;
  slotDurations: string[];
  allowPartialPayments: boolean;

  // Payments
  commissionRate: number;
  payoutCycle: string;
  minPayoutAmount: number;
  autoRefund: boolean;
  refundTime: string;
  paymentMethods: string[];

  // Notifications
  notifyDispute: boolean;
  notifyKyc: boolean;
  notifyNewVendor: boolean;
  dailyRevenueReport: boolean;
  dailyReportTime: string;
  weeklyDigest: boolean;

  // Security
  sessionTimeout: string;
  require2fa: boolean;
  maxLoginAttempts: number;
  auditRetention: string;
}

const DEFAULTS: Settings = {
  platformName: "Turfin",
  supportEmail: "support@turfinapp.in",
  supportPhone: "+91 98765 00000",
  currency: "INR",
  timezone: "Asia/Kolkata",
  maintenanceMode: false,

  minAdvanceNotice: "2hr",
  maxAdvanceDays: "30",
  cancellationWindow: "2hr",
  autoCancelAfter: "30min",
  slotDurations: ["1hr", "1.5hr", "2hr"],
  allowPartialPayments: false,

  commissionRate: 10,
  payoutCycle: "weekly",
  minPayoutAmount: 500,
  autoRefund: true,
  refundTime: "5-7days",
  paymentMethods: ["upi", "card", "wallet", "netbanking"],

  notifyDispute: true,
  notifyKyc: true,
  notifyNewVendor: true,
  dailyRevenueReport: true,
  dailyReportTime: "08:00",
  weeklyDigest: false,

  sessionTimeout: "4hr",
  require2fa: false,
  maxLoginAttempts: 5,
  auditRetention: "90days",
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="relative shrink-0 w-10 h-5.5 rounded-full transition-colors"
      style={{ backgroundColor: on ? "#8a9e60" : "#d1d5db", height: 22, width: 40 }}>
      <span className="absolute top-0.5 rounded-full bg-white shadow-sm transition-all"
        style={{ width: 18, height: 18, left: on ? 20 : 2 }} />
    </button>
  );
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-[#8a9e60] pr-8 transition-colors">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <CaretDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

function Field({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-8 py-4 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {desc && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>}
      </div>
      <div className="shrink-0 w-56">{children}</div>
    </div>
  );
}

// ── Nav config ─────────────────────────────────────────────────────────────────
const SECTIONS: { key: Section; label: string; icon: React.ElementType; desc: string }[] = [
  { key: "platform",      label: "Platform",      icon: Globe,         desc: "Name, contact, locale"    },
  { key: "bookings",      label: "Bookings",      icon: CalendarBlank, desc: "Slots, cancellations"     },
  { key: "payments",      label: "Payments",      icon: CurrencyDollar,desc: "Commission, payouts"      },
  { key: "notifications", label: "Notifications", icon: Bell,          desc: "Admin alert preferences"  },
  { key: "security",      label: "Security",      icon: ShieldCheck,   desc: "Sessions, 2FA, audit logs"},
];

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [section, setSection]   = useState<Section>("platform");
  const [settings, setSettings] = useState<Settings>({ ...DEFAULTS });
  const [saved, setSaved]       = useState<Section | null>(null);
  const [dirty, setDirty]       = useState(false);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings(s => ({ ...s, [key]: value }));
    setDirty(true);
  }

  function toggleArr(key: "slotDurations" | "paymentMethods", val: string) {
    setSettings(s => ({
      ...s,
      [key]: s[key].includes(val) ? s[key].filter(x => x !== val) : [...s[key], val],
    }));
    setDirty(true);
  }

  function handleSave() {
    setSaved(section);
    setDirty(false);
    setTimeout(() => setSaved(null), 2500);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden" style={{ minHeight: "calc(100vh - 73px)" }}>

      {/* Left nav */}
      <aside className="w-56 shrink-0 border-r border-gray-100 bg-gray-50/60 p-3 overflow-y-auto">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Settings</p>
        <nav className="space-y-0.5">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const active = section === s.key;
            return (
              <button key={s.key} onClick={() => setSection(s.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                  ${active ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:bg-white/60 hover:text-gray-700"}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors
                  ${active ? "bg-[#8a9e60]" : "bg-gray-100"}`}>
                  <Icon size={14} className={active ? "text-white" : "text-gray-400"} weight={active ? "fill" : "regular"} />
                </div>
                <div>
                  <p className="text-xs font-semibold leading-tight">{s.label}</p>
                  <p className="text-[9px] text-gray-400 leading-tight">{s.desc}</p>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Content panel */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl p-6 space-y-1">

          {/* Section header */}
          {(() => {
            const s = SECTIONS.find(s => s.key === section)!;
            const Icon = s.icon;
            return (
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#8a9e60" }}>
                  <Icon size={16} className="text-white" weight="fill" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">{s.label}</h2>
                  <p className="text-xs text-gray-400">{s.desc}</p>
                </div>
              </div>
            );
          })()}

          {/* ── Platform ── */}
          {section === "platform" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-1">
              <Field label="Platform Name" desc="Shown across the admin panel and user-facing emails.">
                <input value={settings.platformName} onChange={e => set("platformName", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" />
              </Field>
              <Field label="Support Email" desc="Users and vendors contact this address for help.">
                <div className="relative">
                  <Envelope size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={settings.supportEmail} onChange={e => set("supportEmail", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" />
                </div>
              </Field>
              <Field label="Support Phone" desc="Displayed on booking receipts and cancellation notices.">
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={settings.supportPhone} onChange={e => set("supportPhone", e.target.value)}
                    className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" />
                </div>
              </Field>
              <Field label="Currency" desc="All pricing and payouts use this currency.">
                <Select value={settings.currency} onChange={v => set("currency", v)}
                  options={[{ value: "INR", label: "₹ Indian Rupee (INR)" }]} />
              </Field>
              <Field label="Timezone" desc="Affects booking timestamps, reports, and notifications.">
                <Select value={settings.timezone} onChange={v => set("timezone", v)}
                  options={[
                    { value: "Asia/Kolkata",  label: "IST — Asia/Kolkata (UTC+5:30)" },
                    { value: "Asia/Dubai",    label: "GST — Asia/Dubai (UTC+4)"      },
                    { value: "Asia/Singapore",label: "SGT — Asia/Singapore (UTC+8)"  },
                  ]} />
              </Field>
              <Field label="Maintenance Mode"
                desc="Blocks all new bookings and shows a maintenance notice in the app.">
                <div className="flex items-center gap-3">
                  <Toggle on={settings.maintenanceMode} onChange={v => set("maintenanceMode", v)} />
                  {settings.maintenanceMode && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-orange-500">
                      <WarningCircle size={12} weight="fill" /> Active
                    </span>
                  )}
                </div>
              </Field>
            </div>
          )}

          {/* ── Bookings ── */}
          {section === "bookings" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-1">
              <Field label="Minimum Advance Notice"
                desc="Users must book at least this far ahead of the slot time.">
                <Select value={settings.minAdvanceNotice} onChange={v => set("minAdvanceNotice", v)}
                  options={[
                    { value: "1hr",  label: "1 hour"   }, { value: "2hr",  label: "2 hours"  },
                    { value: "4hr",  label: "4 hours"  }, { value: "12hr", label: "12 hours" },
                    { value: "24hr", label: "24 hours" },
                  ]} />
              </Field>
              <Field label="Maximum Advance Booking"
                desc="How many days ahead users can book a slot.">
                <Select value={settings.maxAdvanceDays} onChange={v => set("maxAdvanceDays", v)}
                  options={[
                    { value: "7",  label: "7 days"  }, { value: "14", label: "14 days" },
                    { value: "30", label: "30 days" }, { value: "60", label: "60 days" },
                    { value: "90", label: "90 days" },
                  ]} />
              </Field>
              <Field label="Free Cancellation Window"
                desc="Users can cancel without penalty within this window before the slot.">
                <Select value={settings.cancellationWindow} onChange={v => set("cancellationWindow", v)}
                  options={[
                    { value: "1hr",  label: "1 hour before"  }, { value: "2hr",  label: "2 hours before" },
                    { value: "4hr",  label: "4 hours before" }, { value: "12hr", label: "12 hours before"},
                    { value: "24hr", label: "24 hours before"},
                  ]} />
              </Field>
              <Field label="Auto-cancel Unpaid Bookings"
                desc="Automatically cancel bookings where payment is not completed.">
                <Select value={settings.autoCancelAfter} onChange={v => set("autoCancelAfter", v)}
                  options={[
                    { value: "15min", label: "After 15 minutes" }, { value: "30min", label: "After 30 minutes" },
                    { value: "1hr",   label: "After 1 hour"     }, { value: "2hr",   label: "After 2 hours"   },
                  ]} />
              </Field>
              <Field label="Allowed Slot Durations"
                desc="The slot lengths vendors can offer when setting up fields.">
                <div className="flex flex-wrap gap-2">
                  {["30min","1hr","1.5hr","2hr","2.5hr","3hr"].map(d => (
                    <button key={d}
                      onClick={() => toggleArr("slotDurations", d)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all
                        ${settings.slotDurations.includes(d)
                          ? "bg-[#8a9e60] text-white border-[#8a9e60]"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Allow Partial Payments"
                desc="Let users pay a deposit at booking time and the balance later.">
                <Toggle on={settings.allowPartialPayments} onChange={v => set("allowPartialPayments", v)} />
              </Field>
            </div>
          )}

          {/* ── Payments ── */}
          {section === "payments" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-1">
              <Field label="Platform Commission Rate"
                desc="Percentage Turfin deducts from each vendor booking before payout.">
                <div className="relative">
                  <input type="number" min={0} max={50} value={settings.commissionRate}
                    onChange={e => set("commissionRate", Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] pr-8" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">%</span>
                </div>
              </Field>
              <Field label="Vendor Payout Cycle"
                desc="How frequently vendor earnings are transferred to their accounts.">
                <div className="flex gap-2">
                  {["weekly","biweekly","monthly"].map(c => (
                    <button key={c} onClick={() => set("payoutCycle", c)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-all
                        ${settings.payoutCycle === c
                          ? "bg-[#8a9e60] text-white border-[#8a9e60]"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                      {c === "biweekly" ? "Bi-weekly" : c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Minimum Payout Amount"
                desc="Vendors must earn at least this amount before a payout is triggered.">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">₹</span>
                  <input type="number" min={0} value={settings.minPayoutAmount}
                    onChange={e => set("minPayoutAmount", Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" />
                </div>
              </Field>
              <Field label="Auto-refund on Cancellation"
                desc="Automatically initiate refunds when a booking is cancelled within policy.">
                <Toggle on={settings.autoRefund} onChange={v => set("autoRefund", v)} />
              </Field>
              <Field label="Refund Processing Time"
                desc="Expected time for refunds to reflect in the user's payment source.">
                <Select value={settings.refundTime} onChange={v => set("refundTime", v)}
                  options={[
                    { value: "instant",   label: "Instant (Wallet)"     },
                    { value: "3-5days",   label: "3–5 business days"    },
                    { value: "5-7days",   label: "5–7 business days"    },
                    { value: "7-10days",  label: "7–10 business days"   },
                  ]} />
              </Field>
              <Field label="Accepted Payment Methods"
                desc="Payment options displayed at checkout in the Turfin app.">
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "upi",        label: "UPI"          },
                    { value: "card",       label: "Card"         },
                    { value: "wallet",     label: "Wallet"       },
                    { value: "netbanking", label: "Net Banking"  },
                  ].map(m => (
                    <button key={m.value} onClick={() => toggleArr("paymentMethods", m.value)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all
                        ${settings.paymentMethods.includes(m.value)
                          ? "bg-[#8a9e60] text-white border-[#8a9e60]"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* ── Notifications ── */}
          {section === "notifications" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-1">
              <Field label="New Dispute Filed"
                desc="Send an email to admin when a user raises a booking dispute.">
                <Toggle on={settings.notifyDispute} onChange={v => set("notifyDispute", v)} />
              </Field>
              <Field label="Vendor KYC Submitted"
                desc="Alert admin when a vendor submits documents for KYC review.">
                <Toggle on={settings.notifyKyc} onChange={v => set("notifyKyc", v)} />
              </Field>
              <Field label="New Vendor Onboarded"
                desc="Notify admin when a new vendor completes onboarding and goes live.">
                <Toggle on={settings.notifyNewVendor} onChange={v => set("notifyNewVendor", v)} />
              </Field>
              <Field label="Daily Revenue Report"
                desc="Email a daily summary of bookings, revenue, and platform activity.">
                <div className="space-y-2">
                  <Toggle on={settings.dailyRevenueReport} onChange={v => set("dailyRevenueReport", v)} />
                  {settings.dailyRevenueReport && (
                    <div>
                      <p className="text-[9px] text-gray-400 mb-1">Send at</p>
                      <input type="time" value={settings.dailyReportTime}
                        onChange={e => set("dailyReportTime", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-[#8a9e60]" />
                    </div>
                  )}
                </div>
              </Field>
              <Field label="Weekly Analytics Digest"
                desc="Receive a weekly performance summary every Monday morning.">
                <Toggle on={settings.weeklyDigest} onChange={v => set("weeklyDigest", v)} />
              </Field>
              <div className="py-3">
                <p className="text-[10px] text-gray-400">All alerts are sent to <span className="font-semibold text-gray-600">{settings.supportEmail}</span></p>
              </div>
            </div>
          )}

          {/* ── Security ── */}
          {section === "security" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-1">
              <Field label="Admin Session Timeout"
                desc="Automatically log out inactive admin sessions after this duration.">
                <Select value={settings.sessionTimeout} onChange={v => set("sessionTimeout", v)}
                  options={[
                    { value: "15min", label: "15 minutes" }, { value: "30min", label: "30 minutes" },
                    { value: "1hr",   label: "1 hour"     }, { value: "4hr",   label: "4 hours"    },
                    { value: "8hr",   label: "8 hours"    },
                  ]} />
              </Field>
              <Field label="Require 2FA for All Admins"
                desc="All admin accounts must set up two-factor authentication to log in.">
                <div className="flex items-center gap-3">
                  <Toggle on={settings.require2fa} onChange={v => set("require2fa", v)} />
                  {settings.require2fa && (
                    <span className="text-[10px] font-semibold text-[#8a9e60] flex items-center gap-1">
                      <CheckCircle size={12} weight="fill" /> Enforced
                    </span>
                  )}
                </div>
              </Field>
              <Field label="Max Login Attempts"
                desc="Lock an account temporarily after this many consecutive failed logins.">
                <div className="flex items-center gap-2">
                  {[3, 5, 10].map(n => (
                    <button key={n} onClick={() => set("maxLoginAttempts", n)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all
                        ${settings.maxLoginAttempts === n
                          ? "bg-[#8a9e60] text-white border-[#8a9e60]"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Audit Log Retention"
                desc="How long admin action logs are stored before being purged.">
                <Select value={settings.auditRetention} onChange={v => set("auditRetention", v)}
                  options={[
                    { value: "30days",  label: "30 days"  }, { value: "60days",  label: "60 days"  },
                    { value: "90days",  label: "90 days"  }, { value: "180days", label: "180 days" },
                    { value: "365days", label: "1 year"   },
                  ]} />
              </Field>
              <div className="py-3 flex items-start gap-2">
                <WarningCircle size={14} className="text-amber-500 mt-0.5 shrink-0" weight="fill" />
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Security settings affect all admins platform-wide. Changes take effect immediately on the next login.
                </p>
              </div>
            </div>
          )}

          {/* ── Save bar ── */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-xs text-gray-400">
              {saved === section
                ? <span className="flex items-center gap-1.5 text-[#8a9e60] font-medium"><CheckCircle size={13} weight="fill" /> Changes saved</span>
                : dirty ? "You have unsaved changes." : "No changes since last save."}
            </p>
            <button onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#8a9e60" }}>
              <FloppyDisk size={14} weight="fill" />
              Save Changes
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
