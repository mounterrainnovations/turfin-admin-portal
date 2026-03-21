"use client";

import {
  Users, UserCircle, Envelope, Phone, MapPin, CalendarBlank,
  CheckCircle, XCircle, WarningCircle, ClockCountdown,
  MagnifyingGlass, DotsThreeVertical, X, Eye,
  PaperPlaneTilt, Prohibit, ArrowCounterClockwise,
  ShieldCheck, CurrencyDollar, SoccerBall, Star,
  Trash, CaretDown, ArrowUpRight, ArrowDownRight,
  ChartLineUp, ArrowLeft,
} from "@phosphor-icons/react";
import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
type UserStatus = "active" | "inactive" | "banned";

interface AppUser {
  id: string; name: string; email: string; phone: string;
  city: string; state: string; status: UserStatus;
  emailVerified: boolean; phoneVerified: boolean;
  joined: string; lastActive: string;
  bookings: number; completed: number; cancelled: number; noShows: number;
  totalSpent: number; favSport: string; favVendor: string; source: string;
  banReason?: string;
}

interface RecentBooking {
  id: string; field: string; vendor: string; date: string; sport: string;
  amount: number; status: "completed" | "cancelled" | "upcoming" | "no-show";
}

// ── Mock Data ──────────────────────────────────────────────────────────────────
const SEED: AppUser[] = [
  { id: "USR-001", name: "Marco Rossi",    email: "marco@example.com",  phone: "+91 98001 11001", city: "Mumbai",    state: "Maharashtra", status: "active",   emailVerified: true,  phoneVerified: true,  joined: "Dec 2024", lastActive: "2h ago",  bookings: 23, completed: 20, cancelled: 2, noShows: 1, totalSpent: 34500, favSport: "Football",  favVendor: "Riaz Sports Complex", source: "Google"   },
  { id: "USR-002", name: "Sara Bianchi",   email: "sara@example.com",   phone: "+91 98002 22002", city: "Pune",      state: "Maharashtra", status: "active",   emailVerified: true,  phoneVerified: true,  joined: "Jan 2025", lastActive: "1d ago",  bookings: 15, completed: 14, cancelled: 1, noShows: 0, totalSpent: 18200, favSport: "Badminton", favVendor: "GreenZone FC",         source: "Organic"  },
  { id: "USR-003", name: "Luca Ferretti",  email: "luca@example.com",   phone: "+91 98003 33003", city: "Bangalore", state: "Karnataka",   status: "inactive", emailVerified: true,  phoneVerified: false, joined: "Nov 2024", lastActive: "45d ago", bookings: 8,  completed: 5,  cancelled: 3, noShows: 0, totalSpent: 9600,  favSport: "Cricket",   favVendor: "Arena Sports Hub",    source: "Referral" },
  { id: "USR-004", name: "Anna Conti",     email: "anna@example.com",   phone: "+91 98004 44004", city: "Delhi",     state: "Delhi",       status: "active",   emailVerified: true,  phoneVerified: true,  joined: "Oct 2024", lastActive: "3h ago",  bookings: 31, completed: 27, cancelled: 3, noShows: 1, totalSpent: 47800, favSport: "Tennis",    favVendor: "Arena Sports Hub",    source: "Google"   },
  { id: "USR-005", name: "Davide Greco",   email: "davide@example.com", phone: "+91 98005 55005", city: "Chennai",   state: "Tamil Nadu",  status: "banned",   emailVerified: true,  phoneVerified: true,  joined: "Feb 2025", lastActive: "15d ago", bookings: 2,  completed: 0,  cancelled: 2, noShows: 2, totalSpent: 2400,  favSport: "Football",  favVendor: "ProFields Co.",        source: "Organic",  banReason: "Repeated no-shows and fraudulent refund claims." },
  { id: "USR-006", name: "Priya Kapoor",   email: "priya@example.com",  phone: "+91 98006 66006", city: "Mumbai",    state: "Maharashtra", status: "active",   emailVerified: true,  phoneVerified: true,  joined: "Jan 2025", lastActive: "5h ago",  bookings: 19, completed: 18, cancelled: 1, noShows: 0, totalSpent: 28700, favSport: "Badminton", favVendor: "ProFields Co.",        source: "Referral" },
  { id: "USR-007", name: "Rahul Sharma",   email: "rahul@example.com",  phone: "+91 98007 77007", city: "Hyderabad", state: "Telangana",   status: "active",   emailVerified: true,  phoneVerified: true,  joined: "Sep 2024", lastActive: "1h ago",  bookings: 45, completed: 42, cancelled: 2, noShows: 1, totalSpent: 68500, favSport: "Cricket",   favVendor: "Sunrise Turfs",       source: "Google"   },
  { id: "USR-008", name: "Meera Nair",     email: "meera@example.com",  phone: "+91 98008 88008", city: "Kolkata",   state: "West Bengal", status: "inactive", emailVerified: false, phoneVerified: true,  joined: "Mar 2025", lastActive: "20d ago", bookings: 3,  completed: 2,  cancelled: 1, noShows: 0, totalSpent: 3200,  favSport: "Volleyball",favVendor: "Elite Sports Arena",  source: "Organic"  },
  { id: "USR-009", name: "Arjun Patel",    email: "arjun@example.com",  phone: "+91 98009 99009", city: "Ahmedabad", state: "Gujarat",     status: "active",   emailVerified: true,  phoneVerified: true,  joined: "Dec 2024", lastActive: "12h ago", bookings: 12, completed: 11, cancelled: 1, noShows: 0, totalSpent: 15600, favSport: "Football",  favVendor: "Premier Grounds",     source: "Referral" },
  { id: "USR-010", name: "Zara Khan",      email: "zara@example.com",   phone: "+91 98010 00010", city: "Delhi",     state: "Delhi",       status: "active",   emailVerified: true,  phoneVerified: true,  joined: "Nov 2024", lastActive: "30m ago", bookings: 27, completed: 25, cancelled: 2, noShows: 0, totalSpent: 41200, favSport: "Tennis",    favVendor: "Arena Sports Hub",    source: "Google"   },
];

const RECENT_BOOKINGS: Record<string, RecentBooking[]> = {
  "USR-001": [
    { id: "#BK-0041", field: "Turf Arena A",  vendor: "Riaz Sports Complex", date: "Mar 20, 2025", sport: "Football",  amount: 1800, status: "completed" },
    { id: "#BK-0031", field: "Green Zone B",  vendor: "GreenZone FC",        date: "Mar 15, 2025", sport: "Football",  amount: 1400, status: "completed" },
    { id: "#BK-0019", field: "Premier Court", vendor: "Arena Sports Hub",    date: "Mar 08, 2025", sport: "Cricket",   amount: 2200, status: "cancelled" },
    { id: "#BK-0008", field: "Turf Arena A",  vendor: "Riaz Sports Complex", date: "Mar 01, 2025", sport: "Football",  amount: 1800, status: "completed" },
  ],
  "USR-007": [
    { id: "#BK-0055", field: "Sunrise Main",  vendor: "Sunrise Turfs",       date: "Mar 21, 2025", sport: "Cricket",   amount: 2000, status: "upcoming"  },
    { id: "#BK-0048", field: "Sunrise Main",  vendor: "Sunrise Turfs",       date: "Mar 18, 2025", sport: "Cricket",   amount: 2000, status: "completed" },
    { id: "#BK-0040", field: "Arena C",       vendor: "Arena Sports Hub",    date: "Mar 12, 2025", sport: "Football",  amount: 1600, status: "completed" },
    { id: "#BK-0033", field: "Sunrise Main",  vendor: "Sunrise Turfs",       date: "Mar 06, 2025", sport: "Cricket",   amount: 2000, status: "no-show"   },
  ],
};

// ── Config ─────────────────────────────────────────────────────────────────────
const statusCfg: Record<UserStatus, { label: string; cls: string; dot: string }> = {
  active:   { label: "Active",   cls: "bg-green-50 text-green-700", dot: "bg-green-500"  },
  inactive: { label: "Inactive", cls: "bg-gray-100 text-gray-500",  dot: "bg-gray-400"   },
  banned:   { label: "Banned",   cls: "bg-red-50 text-red-600",     dot: "bg-red-500"    },
};

const bkStatusCfg: Record<string, { cls: string }> = {
  completed: { cls: "bg-green-50 text-green-700" },
  cancelled:  { cls: "bg-red-50 text-red-500"   },
  upcoming:   { cls: "bg-blue-50 text-blue-600"  },
  "no-show":  { cls: "bg-orange-50 text-orange-600" },
};

const sportColor: Record<string, string> = {
  Football: "bg-blue-50 text-blue-600", Cricket: "bg-orange-50 text-orange-600",
  Tennis: "bg-yellow-50 text-yellow-700", Badminton: "bg-purple-50 text-purple-600",
  Basketball: "bg-red-50 text-red-600", Hockey: "bg-cyan-50 text-cyan-700",
  Volleyball: "bg-pink-50 text-pink-600", Kabaddi: "bg-lime-50 text-lime-700",
};

function avatar(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

function avatarColor(id: string): string {
  const colors = ["#8a9e60", "#6e8245", "#c4953a", "#6b7a96", "#7a6e9e", "#9e6e6e", "#6e9e8a"];
  const i = parseInt(id.replace("USR-", "")) % colors.length;
  return colors[i];
}

function cancellationRate(u: AppUser): number {
  return u.bookings > 0 ? Math.round((u.cancelled + u.noShows) / u.bookings * 100) : 0;
}

function isVip(u: AppUser): boolean {
  return u.bookings >= 25 || u.totalSpent >= 40000;
}

// ── Email Templates ────────────────────────────────────────────────────────────
interface Template { id: number; name: string; category: string; subject: string; body: string }

const USER_EMAIL_TEMPLATES: Template[] = [
  { id: 1,  category: "Account",      name: "Welcome to Turfin",              subject: "Welcome to Turfin, {userName}!",                          body: "Hi {userName},\n\nWelcome to Turfin! We're thrilled to have you on board.\n\nYou can now discover and book turf fields near you in just a few taps. Explore venues, check real-time availability, and secure your slot instantly.\n\nHappy playing!\n\nTeam Turfin" },
  { id: 2,  category: "Account",      name: "Account Suspended",              subject: "Your Turfin account has been suspended",                  body: "Hi {userName},\n\nWe regret to inform you that your Turfin account ({userId}) has been suspended due to a violation of our platform policies.\n\nIf you believe this is an error, please contact our support team at support@turfinapp.in within 7 days.\n\nTeam Turfin" },
  { id: 3,  category: "Account",      name: "Account Restored",               subject: "Your Turfin account has been restored",                   body: "Hi {userName},\n\nGood news! After reviewing your case, your Turfin account ({userId}) has been fully restored.\n\nYou can now log in and resume your bookings as usual.\n\nWe appreciate your patience.\n\nTeam Turfin" },
  { id: 4,  category: "Account",      name: "Account Deletion Notice",        subject: "Your Turfin account has been scheduled for deletion",      body: "Hi {userName},\n\nAs requested, your Turfin account ({userId}) has been scheduled for permanent deletion. This will take effect in 30 days.\n\nTo cancel this request, log in to the app before the deadline.\n\nTeam Turfin" },
  { id: 5,  category: "Verification", name: "Verify Your Email",              subject: "Action Required: Verify your email on Turfin",             body: "Hi {userName},\n\nWe noticed your email address ({userEmail}) has not been verified yet.\n\nPlease open the Turfin app and complete email verification to ensure you receive booking confirmations, receipts, and important updates.\n\nTeam Turfin" },
  { id: 6,  category: "Verification", name: "Verify Your Phone",              subject: "Action Required: Verify your phone number on Turfin",      body: "Hi {userName},\n\nYour phone number linked to account {userId} is pending verification.\n\nPhone verification helps us send timely booking reminders and OTPs securely. Please verify it in the Turfin app at your earliest.\n\nTeam Turfin" },
  { id: 7,  category: "Verification", name: "Account Not Fully Verified",     subject: "Complete your Turfin profile verification",                body: "Hi {userName},\n\nYour Turfin account is not fully verified. This may limit access to certain features such as instant booking and wallet credits.\n\nPlease verify your email and phone in the app to unlock the full experience.\n\nTeam Turfin" },
  { id: 8,  category: "Booking",      name: "Upcoming Session Reminder",      subject: "Reminder: Your Turfin session is coming up soon!",         body: "Hi {userName},\n\nJust a heads-up — you have an upcoming booking on Turfin! Please check the app for your session details, venue address, and slot timing.\n\nRemember to arrive 10 minutes early and carry any necessary gear.\n\nSee you on the field!\n\nTeam Turfin" },
  { id: 9,  category: "Booking",      name: "Cancellation Warning",           subject: "Important: High cancellation rate on your account",        body: "Hi {userName},\n\nWe've noticed a higher-than-usual cancellation rate on your Turfin account ({userId}).\n\nFrequent cancellations affect vendor availability for other players. Continued cancellations may result in booking restrictions.\n\nIf you're facing issues, please reach out at support@turfinapp.in.\n\nTeam Turfin" },
  { id: 10, category: "Booking",      name: "No-Show Warning",                subject: "Warning: No-show recorded for a recent booking",           body: "Hi {userName},\n\nWe recorded a no-show against your recent booking. As per Turfin's policy, repeated no-shows without prior cancellation may lead to a temporary booking suspension.\n\nTo avoid this, please cancel at least 2 hours before your slot if you can't make it.\n\nTeam Turfin" },
  { id: 11, category: "Refund",       name: "Refund Initiated",               subject: "Your refund has been initiated",                           body: "Hi {userName},\n\nWe've initiated a refund for your recent booking. The amount will be credited back to your original payment method within 5–7 business days.\n\nIf you don't receive it within this period, please contact support@turfinapp.in with your booking ID.\n\nTeam Turfin" },
  { id: 12, category: "Refund",       name: "Refund Completed",               subject: "Your refund has been credited!",                           body: "Hi {userName},\n\nYour refund has been successfully credited to your account. Please check your payment method or Turfin wallet for the updated balance.\n\nWe hope to see you on the field again soon!\n\nTeam Turfin" },
  { id: 13, category: "Support",      name: "Support Request Acknowledged",   subject: "We've received your support request",                      body: "Hi {userName},\n\nThank you for reaching out to Turfin Support. We've received your query linked to account {userId} and our team is reviewing it.\n\nExpect a response within 24–48 business hours.\n\nTeam Turfin Support" },
  { id: 14, category: "Support",      name: "Issue Resolved",                 subject: "Your support issue has been resolved",                     body: "Hi {userName},\n\nWe're happy to let you know that the issue raised on your account {userId} has been resolved by our support team.\n\nIf you're still experiencing problems, please don't hesitate to reach out again.\n\nTeam Turfin Support" },
  { id: 15, category: "Promotional",  name: "Exclusive Offer",                subject: "Exclusive deal unlocked for you, {userName}!",             body: "Hi {userName},\n\nAs a valued Turfin user, you've unlocked an exclusive 20% discount on your next booking!\n\nUse code TURFIN20 at checkout. Valid for the next 7 days only.\n\nGet on the field!\n\nTeam Turfin" },
  { id: 16, category: "Promotional",  name: "Referral Reward",                subject: "Your referral reward is waiting!",                         body: "Hi {userName},\n\nCongratulations! Someone you referred has joined Turfin. Your referral reward of ₹100 has been added to your Turfin wallet.\n\nKeep referring friends and earn more credits!\n\nTeam Turfin" },
  { id: 17, category: "General",      name: "Review Request",                 subject: "How was your recent Turfin experience?",                   body: "Hi {userName},\n\nWe hope you had a great time on the field! We'd love to hear your feedback about your recent Turfin booking.\n\nPlease take a moment to rate the venue in the app — your reviews help fellow players make great choices.\n\nTeam Turfin" },
  { id: 18, category: "General",      name: "Platform Update Notice",         subject: "Important updates to the Turfin platform",                 body: "Hi {userName},\n\nWe've made some exciting updates to the Turfin platform to improve your booking experience. Please update the app to the latest version to enjoy the new features.\n\nFor a summary of changes, visit our What's New page in the app.\n\nTeam Turfin" },
];

const USER_CATEGORY_COLORS: Record<string, string> = {
  Account:      "bg-[#8a9e60]/10 text-[#6e8245]",
  Verification: "bg-blue-50 text-blue-700",
  Booking:      "bg-green-50 text-green-700",
  Refund:       "bg-amber-50 text-amber-700",
  Support:      "bg-purple-50 text-purple-700",
  Promotional:  "bg-orange-50 text-orange-600",
  General:      "bg-gray-100 text-gray-600",
};

function interpolateUser(text: string, user: AppUser): string {
  return text
    .replace(/{userName}/g, user.name)
    .replace(/{userEmail}/g, user.email)
    .replace(/{userId}/g, user.id);
}

// ── Email Modal ────────────────────────────────────────────────────────────────
function EmailModal({ user, onClose }: { user: AppUser; onClose: () => void }) {
  const [selected, setSelected] = useState<Template | null>(null);
  const [preview, setPreview]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = [...new Set(USER_EMAIL_TEMPLATES.map(t => t.category))];

  const displayed = activeCategory === "All"
    ? USER_EMAIL_TEMPLATES
    : USER_EMAIL_TEMPLATES.filter(t => t.category === activeCategory);

  if (sent) return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 w-80">
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "#8a9e60" + "20" }}>
          <PaperPlaneTilt size={28} style={{ color: "#8a9e60" }} weight="fill" />
        </div>
        <p className="text-base font-bold text-gray-800">Email Sent!</p>
        <p className="text-xs text-gray-500 text-center">
          <span className="font-semibold">{selected?.name}</span> was sent to{" "}
          <span className="font-semibold">{user.email}</span>
        </p>
        <button onClick={onClose} className="mt-2 px-6 py-2 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: "#8a9e60" }}>
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[780px] max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0"
          style={{ background: "linear-gradient(135deg,#8a9e60,#6e8245)" }}>
          <div className="flex items-center gap-3">
            {preview && (
              <button onClick={() => setPreview(false)} className="text-white/70 hover:text-white">
                <ArrowLeft size={18} />
              </button>
            )}
            <Envelope size={18} className="text-white" weight="fill" />
            <div>
              <p className="text-white font-bold text-sm">{preview ? "Preview & Send" : "Select Email Template"}</p>
              <p className="text-white/60 text-xs">To: {user.name} · {user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>

        {!preview ? (
          <div className="flex flex-1 overflow-hidden">
            {/* Category sidebar */}
            <div className="w-36 border-r border-gray-100 bg-gray-50/50 overflow-y-auto shrink-0 py-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">Category</p>
              {["All", ...categories].map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors rounded-lg mx-1 ${activeCategory === cat ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:bg-white hover:text-gray-900"}`}
                  style={{ width: "calc(100% - 8px)" }}>
                  {cat}
                  <span className="ml-1 text-[10px] text-gray-400">
                    ({cat === "All" ? USER_EMAIL_TEMPLATES.length : USER_EMAIL_TEMPLATES.filter(t => t.category === cat).length})
                  </span>
                </button>
              ))}
            </div>

            {/* Template grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                {displayed.map(t => (
                  <button key={t.id} onClick={() => { setSelected(t); setPreview(true); }}
                    className={`text-left p-4 rounded-xl border transition-all hover:shadow-md
                      ${selected?.id === t.id ? "border-[#8a9e60] bg-[#8a9e60]/5 shadow-sm" : "border-gray-100 hover:border-gray-200 bg-white"}`}>
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${USER_CATEGORY_COLORS[t.category]}`}>
                        {t.category}
                      </span>
                      <Eye size={13} className="text-gray-300 mt-0.5" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 mb-1 leading-snug">{t.name}</p>
                    <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">{t.subject.replace(/{[^}]+}/g, "…")}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : selected && (
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Subject */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Subject</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 font-medium">
                  {interpolateUser(selected.subject, user)}
                </div>
              </div>
              {/* Body */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Body</label>
                <pre className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                  {interpolateUser(selected.body, user)}
                </pre>
              </div>
              {/* Meta */}
              <div className="bg-[#8a9e60]/5 border border-[#8a9e60]/20 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: avatarColor(user.id) }}>
                  {avatar(user.name)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{user.name}</p>
                  <p className="text-[10px] text-gray-400">{user.email} · {user.id}</p>
                </div>
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${USER_CATEGORY_COLORS[selected.category]}`}>
                  {selected.category}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          <p className="text-xs text-gray-400">
            {preview && selected ? `Template: ${selected.name}` : `${USER_EMAIL_TEMPLATES.length} templates available`}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            {preview && selected && (
              <button onClick={() => setSent(true)}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#8a9e60" }}>
                <PaperPlaneTilt size={13} weight="fill" /> Send Email
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers]             = useState<AppUser[]>([...SEED]);
  const [search, setSearch]           = useState("");
  const [activeTab, setActiveTab]     = useState<"all" | UserStatus>("all");
  const [selectedUser, setSelected]   = useState<AppUser | null>(null);
  const [detailTab, setDetailTab]     = useState<"profile" | "bookings">("profile");
  const [actionMenu, setActionMenu]   = useState<string | null>(null);

  // Ban modal
  const [banModal, setBanModal]       = useState<AppUser | null>(null);
  const [banReason, setBanReason]     = useState("");

  // Send message modal
  const [msgModal, setMsgModal]       = useState<AppUser | null>(null);

  // Toast
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const matchTab = activeTab === "all" || u.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      || u.phone.includes(q) || u.city.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const totalRevenue  = users.reduce((s, u) => s + u.totalSpent, 0);
  const activeCount   = users.filter(u => u.status === "active").length;
  const newThisMonth  = users.filter(u => u.joined.includes("Mar 2025")).length;
  const avgSpend      = users.length ? Math.round(totalRevenue / users.length) : 0;

  // ── Helpers ────────────────────────────────────────────────────────────────
  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  function handleBan() {
    if (!banModal) return;
    const isBanned = banModal.status === "banned";
    setUsers(us => us.map(u => u.id === banModal.id
      ? { ...u, status: (isBanned ? "active" : "banned") as UserStatus, banReason: isBanned ? undefined : banReason }
      : u));
    if (selectedUser?.id === banModal.id)
      setSelected(p => p ? { ...p, status: isBanned ? "active" : "banned", banReason: isBanned ? undefined : banReason } : p);
    showToast(isBanned ? `${banModal.name} has been unbanned.` : `${banModal.name} has been banned.`, isBanned);
    setBanModal(null);
    setBanReason("");
  }

  function handleDelete(u: AppUser) {
    setUsers(us => us.filter(x => x.id !== u.id));
    if (selectedUser?.id === u.id) setSelected(null);
    showToast(`${u.name} has been removed.`, false);
    setActionMenu(null);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="px-6 py-5 space-y-5">

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Users",      value: String(users.length),                        sub: "All registered",    icon: Users,         color: "#8a9e60" },
          { label: "Active Users",     value: String(activeCount),                          sub: "Booked recently",   icon: CheckCircle,   color: "#6e8245" },
          { label: "New This Month",   value: String(newThisMonth),                         sub: "Mar 2025",          icon: ArrowUpRight,  color: "#8a9e60" },
          { label: "Avg. User Spend",  value: `₹${avgSpend.toLocaleString("en-IN")}`,       sub: "Per user lifetime", icon: CurrencyDollar,color: "#c4953a" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
                <Icon size={16} weight="fill" style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-[10px] text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
          <MagnifyingGlass size={15} className="text-gray-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, city…"
            className="flex-1 outline-none text-sm text-gray-700 bg-transparent placeholder:text-gray-400" />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />VIP = 25+ bookings or ₹40k+ spent</span>
          <span className="flex items-center gap-1 ml-3"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />High cancellation risk</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-200 gap-1">
        {(["all", "active", "inactive", "banned"] as const).map(tab => {
          const count = tab === "all" ? users.length : users.filter(u => u.status === tab).length;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 ${activeTab === tab ? "border-b-2 text-[#8a9e60]" : "text-gray-400 hover:text-gray-600"}`}
              style={activeTab === tab ? { borderColor: "#8a9e60" } : {}}>
              {tab === "all" ? "All Users" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={activeTab === tab ? { backgroundColor: "#8a9e60", color: "white" } : { backgroundColor: "#f3f4f6", color: "#9ca3af" }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {["User", "Contact", "City", "Bookings", "Spent", "Cancel Rate", "Status", "Verified", "Last Active", ""].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-400">No users found.</td></tr>
            ) : filtered.map((u, i) => {
              const sc = statusCfg[u.status];
              const cr = cancellationRate(u);
              const vip = isVip(u);
              const risky = cr >= 20;
              return (
                <tr key={u.id} className={`hover:bg-gray-50/50 transition-colors ${i < filtered.length - 1 ? "border-b border-gray-50" : ""}`}>
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: avatarColor(u.id) }}>
                          {avatar(u.name)}
                        </div>
                        {vip && (
                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-yellow-400 flex items-center justify-center">
                            <Star size={8} weight="fill" className="text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{u.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{u.id}</p>
                      </div>
                    </div>
                  </td>
                  {/* Contact */}
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-700">{u.email}</p>
                    <p className="text-[10px] text-gray-400">{u.phone}</p>
                  </td>
                  {/* City */}
                  <td className="px-4 py-3">
                    <p className="text-xs text-gray-700">{u.city}</p>
                    <p className="text-[10px] text-gray-400">{u.state}</p>
                  </td>
                  {/* Bookings */}
                  <td className="px-4 py-3 text-xs font-semibold text-gray-700">{u.bookings}</td>
                  {/* Spent */}
                  <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                    {u.totalSpent > 0 ? `₹${u.totalSpent.toLocaleString("en-IN")}` : <span className="text-gray-300">—</span>}
                  </td>
                  {/* Cancel Rate */}
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${risky ? "bg-orange-50 text-orange-600" : cr > 0 ? "bg-gray-100 text-gray-500" : "bg-green-50 text-green-600"}`}>
                      {cr}%
                    </span>
                    {u.noShows > 0 && <span className="ml-1 text-[9px] text-orange-500 font-medium">{u.noShows} no-show{u.noShows > 1 ? "s" : ""}</span>}
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                    </span>
                  </td>
                  {/* Verified */}
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${u.emailVerified ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>Email</span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${u.phoneVerified ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>Phone</span>
                    </div>
                  </td>
                  {/* Last Active */}
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{u.lastActive}</td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setSelected(u); setDetailTab("profile"); }} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="View"><Eye size={14} /></button>
                      <button onClick={() => { setMsgModal(u); setMsgSubject(""); setMsgBody(""); }} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Send Message"><PaperPlaneTilt size={14} /></button>
                      <div className="relative">
                        <button onClick={() => setActionMenu(actionMenu === u.id ? null : u.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"><DotsThreeVertical size={14} /></button>
                        {actionMenu === u.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[148px]">
                            {u.status === "banned" ? (
                              <button onClick={() => { setActionMenu(null); setBanModal(u); }} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <ArrowCounterClockwise size={13} className="text-green-500" />Unban User
                              </button>
                            ) : (
                              <button onClick={() => { setActionMenu(null); setBanModal(u); }} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Prohibit size={13} className="text-red-500" />Ban User
                              </button>
                            )}
                            <button onClick={() => { setActionMenu(null); showToast(`Password reset link sent to ${u.email}.`); }} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                              <ArrowCounterClockwise size={13} className="text-blue-500" />Reset Password
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button onClick={() => handleDelete(u)} className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 flex items-center gap-2">
                              <Trash size={13} />Delete Account
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400">Showing {filtered.length} of {users.length} users</p>
          <div className="flex gap-1">
            {[1, 2, 3].map(p => (
              <button key={p} className="w-7 h-7 text-xs rounded font-medium transition-colors"
                style={p === 1 ? { backgroundColor: "#8a9e60", color: "white" } : { color: "#9ca3af" }}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Click-away */}
      {actionMenu && <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />}

      {/* ═══════════════════════════════════════════════════════════════════════
          USER DETAIL DRAWER
      ═══════════════════════════════════════════════════════════════════════ */}
      {selectedUser && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-[500px] bg-white h-full flex flex-col shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="p-6 border-b border-gray-100 shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-base" style={{ backgroundColor: avatarColor(selectedUser.id) }}>
                      {avatar(selectedUser.name)}
                    </div>
                    {isVip(selectedUser) && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center">
                        <Star size={11} weight="fill" className="text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-gray-900 text-base">{selectedUser.name}</h2>
                      {isVip(selectedUser) && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-50 text-yellow-600">VIP</span>}
                    </div>
                    <p className="text-xs text-gray-400 font-mono">{selectedUser.id}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusCfg[selectedUser.status].cls}`}>{statusCfg[selectedUser.status].label}</span>
                      {selectedUser.emailVerified && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600">Email ✓</span>}
                      {selectedUser.phoneVerified && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600">Phone ✓</span>}
                      {!selectedUser.emailVerified && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Email ✗</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1 shrink-0"><X size={20} /></button>
              </div>

              {/* Booking stat cards */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Bookings",   value: String(selectedUser.bookings),   cls: "text-gray-800"  },
                  { label: "Completed",  value: String(selectedUser.completed),  cls: "text-green-600" },
                  { label: "Cancelled",  value: String(selectedUser.cancelled),  cls: "text-red-500"   },
                  { label: "No-shows",   value: String(selectedUser.noShows),    cls: `${selectedUser.noShows > 0 ? "text-orange-500" : "text-gray-400"}` },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className={`text-lg font-bold ${cls}`}>{value}</p>
                    <p className="text-[9px] text-gray-400 font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 shrink-0">
              {(["profile", "bookings"] as const).map(t => (
                <button key={t} onClick={() => setDetailTab(t)}
                  className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${detailTab === t ? "border-b-2 text-[#8a9e60]" : "text-gray-400 hover:text-gray-600"}`}
                  style={detailTab === t ? { borderColor: "#8a9e60" } : {}}>
                  {t === "profile" ? "Profile & Stats" : "Booking History"}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {detailTab === "profile" && (
                <>
                  {/* Contact */}
                  <section>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Contact</h3>
                    <div className="space-y-2.5">
                      {[{ icon: Envelope, label: "Email", val: selectedUser.email }, { icon: Phone, label: "Phone", val: selectedUser.phone }, { icon: MapPin, label: "Location", val: `${selectedUser.city}, ${selectedUser.state}` }, { icon: CalendarBlank, label: "Joined", val: selectedUser.joined }].map(({ icon: Icon, label, val }) => (
                        <div key={label} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded bg-gray-50 flex items-center justify-center shrink-0"><Icon size={14} className="text-gray-400" /></div>
                          <div><p className="text-[10px] text-gray-400">{label}</p><p className="text-xs text-gray-700 font-medium">{val}</p></div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Activity */}
                  <section>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Activity & Spend</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Total Spent",     val: `₹${selectedUser.totalSpent.toLocaleString("en-IN")}`, highlight: true },
                        { label: "Avg per Booking", val: selectedUser.bookings > 0 ? `₹${Math.round(selectedUser.totalSpent / selectedUser.bookings).toLocaleString("en-IN")}` : "—", highlight: false },
                        { label: "Cancellation Rate", val: `${cancellationRate(selectedUser)}%`, highlight: cancellationRate(selectedUser) >= 20 },
                        { label: "Completion Rate",   val: `${selectedUser.bookings > 0 ? Math.round(selectedUser.completed / selectedUser.bookings * 100) : 0}%`, highlight: false },
                        { label: "Last Active",       val: selectedUser.lastActive, highlight: false },
                        { label: "Source",            val: selectedUser.source, highlight: false },
                      ].map(({ label, val, highlight }) => (
                        <div key={label} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-[10px] text-gray-400 mb-1">{label}</p>
                          <p className={`text-sm font-bold ${highlight ? (label === "Cancellation Rate" ? "text-orange-500" : "text-[#8a9e60]") : "text-gray-800"}`}>{val}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Preferences */}
                  <section>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Preferences</h3>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded bg-gray-50 flex items-center justify-center shrink-0"><SoccerBall size={14} className="text-gray-400" /></div>
                        <div><p className="text-[10px] text-gray-400">Favourite Sport</p><span className={`text-xs font-semibold px-2 py-0.5 rounded mt-0.5 inline-block ${sportColor[selectedUser.favSport] ?? "bg-gray-100 text-gray-600"}`}>{selectedUser.favSport}</span></div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded bg-gray-50 flex items-center justify-center shrink-0"><Star size={14} className="text-gray-400" /></div>
                        <div><p className="text-[10px] text-gray-400">Favourite Venue</p><p className="text-xs text-gray-700 font-medium mt-0.5">{selectedUser.favVendor}</p></div>
                      </div>
                    </div>
                  </section>

                  {/* Ban reason */}
                  {selectedUser.status === "banned" && selectedUser.banReason && (
                    <section className="bg-red-50 border border-red-100 rounded-xl p-4">
                      <div className="flex items-start gap-2">
                        <Prohibit size={14} className="text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-red-600 mb-1">Reason for ban</p>
                          <p className="text-xs text-red-500">{selectedUser.banReason}</p>
                        </div>
                      </div>
                    </section>
                  )}
                </>
              )}

              {detailTab === "bookings" && (
                <section>
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Bookings</h3>
                  {(RECENT_BOOKINGS[selectedUser.id] ?? []).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-400">No booking history available.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(RECENT_BOOKINGS[selectedUser.id] ?? []).map(bk => (
                        <div key={bk.id} className="border border-gray-100 rounded-xl p-3.5">
                          <div className="flex items-start justify-between mb-1.5">
                            <div>
                              <p className="text-xs font-semibold text-gray-800">{bk.field}</p>
                              <p className="text-[10px] text-gray-400">{bk.vendor}</p>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${bkStatusCfg[bk.status]?.cls}`}>{bk.status}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sportColor[bk.sport] ?? "bg-gray-100 text-gray-600"}`}>{bk.sport}</span>
                              <span className="text-[10px] text-gray-400">{bk.date}</span>
                            </div>
                            <span className="text-xs font-semibold text-gray-700">₹{bk.amount.toLocaleString("en-IN")}</span>
                          </div>
                          <p className="text-[9px] text-gray-300 font-mono mt-1.5">{bk.id}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: "Total Bookings", val: selectedUser.bookings, cls: "text-gray-800" },
                      { label: "Total Spent",    val: `₹${selectedUser.totalSpent.toLocaleString("en-IN")}`, cls: "text-[#8a9e60]" },
                      { label: "Cancel Rate",    val: `${cancellationRate(selectedUser)}%`, cls: cancellationRate(selectedUser) >= 20 ? "text-orange-500" : "text-gray-800" },
                    ].map(({ label, val, cls }) => (
                      <div key={label}><p className={`text-sm font-bold ${cls}`}>{val}</p><p className="text-[10px] text-gray-400">{label}</p></div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex gap-2 shrink-0">
              <button onClick={() => setMsgModal(selectedUser)}
                className="flex-1 py-2 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5">
                <PaperPlaneTilt size={13} />Message
              </button>
              <button onClick={() => { showToast(`Password reset link sent to ${selectedUser.email}.`); }}
                className="flex-1 py-2 text-xs font-semibold border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5">
                <ArrowCounterClockwise size={13} />Reset Password
              </button>
              {selectedUser.status === "banned" ? (
                <button onClick={() => setBanModal(selectedUser)}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg text-white flex items-center justify-center gap-1.5" style={{ backgroundColor: "#8a9e60" }}>
                  <ArrowCounterClockwise size={13} />Unban
                </button>
              ) : (
                <button onClick={() => setBanModal(selectedUser)}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg text-white bg-red-500 flex items-center justify-center gap-1.5">
                  <Prohibit size={13} />Ban
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          EMAIL MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {msgModal && <EmailModal user={msgModal} onClose={() => setMsgModal(null)} />}

      {/* ═══════════════════════════════════════════════════════════════════════
          BAN / UNBAN MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${banModal.status === "banned" ? "bg-green-100" : "bg-red-100"}`}>
                {banModal.status === "banned"
                  ? <ArrowCounterClockwise size={22} className="text-green-500" />
                  : <Prohibit size={22} className="text-red-500" />}
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">
                {banModal.status === "banned" ? "Unban User?" : "Ban User?"}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {banModal.status === "banned"
                  ? `${banModal.name} will be restored and can log in and make bookings again.`
                  : `${banModal.name} will be banned from the platform and lose access immediately.`}
              </p>
              {banModal.status !== "banned" && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Reason *</label>
                  <textarea value={banReason} onChange={e => setBanReason(e.target.value)} rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] resize-none"
                    placeholder="e.g. Repeated no-shows, fraudulent refund claims…" />
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => { setBanModal(null); setBanReason(""); }} className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleBan}
                className={`flex-1 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 ${banModal.status === "banned" ? "" : "bg-red-500"}`}
                style={banModal.status === "banned" ? { backgroundColor: "#8a9e60" } : {}}>
                {banModal.status === "banned" ? "Yes, Unban" : "Ban User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TOAST
      ═══════════════════════════════════════════════════════════════════════ */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white"
          style={{ backgroundColor: toast.ok ? "#8a9e60" : "#b05252" }}>
          {toast.ok ? <CheckCircle size={16} weight="fill" /> : <XCircle size={16} weight="fill" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
