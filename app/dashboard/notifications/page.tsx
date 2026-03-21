"use client";

import {
  BellRinging, PaperPlaneTilt, Users, Star, MapPin, SoccerBall,
  Lightning, Buildings, ArrowCounterClockwise, Trophy, Cloud,
  ClockCountdown, CalendarBlank, CheckCircle, X, ArrowUpRight,
  Eye, CaretDown, ChartLineUp, Clock, Trash,
} from "@phosphor-icons/react";
import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
type AudienceKey = "all" | "active" | "inactive" | "vip" | "city" | "sport";
type NotifStatus = "sent" | "scheduled" | "failed";

interface SentNotif {
  id: string; title: string; message: string;
  audience: string; reach: number; opened: number;
  openRate: number; sentAt: string; status: NotifStatus;
}

// ── Mock History ───────────────────────────────────────────────────────────────
const INIT_HISTORY: SentNotif[] = [
  { id: "PN-001", title: "Weekend Warriors Deal",            message: "Book this weekend and get 20% off on all turfs! Use code WEEKEND20 at checkout. Valid for 48 hours only.",                         audience: "Active Users",    reach: 834,  opened: 312, openRate: 37, sentAt: "Mar 20, 2026",          status: "sent"      },
  { id: "PN-002", title: "New Venue: Arena Hub Bengaluru",   message: "Exciting news! Arena Hub has just been onboarded. 3 premium turfs now available in Bengaluru — book your slot now.",              audience: "All Users",       reach: 1240, opened: 687, openRate: 55, sentAt: "Mar 18, 2026",          status: "sent"      },
  { id: "PN-003", title: "We Miss You!",                     message: "It's been a while since your last session. Come back and book a turf — your favourite sport is waiting for you!",                 audience: "Inactive Users",  reach: 312,  opened: 89,  openRate: 29, sentAt: "Mar 15, 2026",          status: "sent"      },
  { id: "PN-004", title: "VIP Early Access: Premium Fields", message: "As a Turfin VIP, you get 24-hour early access to new premium slots before they open to everyone else.",                           audience: "VIP Users",       reach: 47,   opened: 38,  openRate: 81, sentAt: "Mar 12, 2026",          status: "sent"      },
  { id: "PN-005", title: "IPL Season — Cricket Offer",       message: "Cricket season is here! Book cricket turfs at special rates all through April. Tap to explore venues near you.",                  audience: "Cricket Players", reach: 380,  opened: 171, openRate: 45, sentAt: "Mar 08, 2026",          status: "sent"      },
  { id: "PN-006", title: "Summer Slots Now Open",            message: "Beat the heat — book early morning slots for the best experience. Full summer schedule is now live on the app.",                  audience: "All Users",       reach: 1240, opened: 0,   openRate: 0,  sentAt: "Mar 25, 2026 10:00 AM", status: "scheduled" },
];

// ── Audience Config ────────────────────────────────────────────────────────────
const AUDIENCE_OPTIONS: {
  key: AudienceKey; label: string; icon: React.ElementType; reach: number; desc: string;
}[] = [
  { key: "all",      label: "All Users",      icon: Users,          reach: 1240, desc: "Every registered user"       },
  { key: "active",   label: "Active Users",   icon: CheckCircle,    reach: 834,  desc: "Booked in last 30 days"      },
  { key: "inactive", label: "Inactive Users", icon: ClockCountdown, reach: 312,  desc: "No activity for 30+ days"    },
  { key: "vip",      label: "VIP Users",      icon: Star,           reach: 47,   desc: "25+ bookings or ₹40k+ spent" },
  { key: "city",     label: "By City",        icon: MapPin,         reach: 0,    desc: "Target specific cities"      },
  { key: "sport",    label: "By Sport",       icon: SoccerBall,     reach: 0,    desc: "Target sport preference"     },
];

const CITIES: { name: string; count: number }[] = [
  { name: "Mumbai",    count: 380 }, { name: "Delhi",     count: 290 },
  { name: "Bangalore", count: 210 }, { name: "Pune",      count: 140 },
  { name: "Chennai",   count: 85  }, { name: "Hyderabad", count: 75  },
  { name: "Kolkata",   count: 60  },
];

const SPORTS: { name: string; count: number }[] = [
  { name: "Football",   count: 445 }, { name: "Cricket",    count: 380 },
  { name: "Badminton",  count: 210 }, { name: "Tennis",     count: 145 },
  { name: "Volleyball", count: 60  }, { name: "Basketball", count: 40  },
];

// ── Quick Templates ────────────────────────────────────────────────────────────
interface NotifTemplate {
  name: string; icon: React.ElementType; color: string;
  title: string; message: string; audience: AudienceKey;
}

const NOTIF_TEMPLATES: NotifTemplate[] = [
  { name: "Flash Sale",    icon: Lightning,            color: "text-amber-500 bg-amber-50",  audience: "all",      title: "Limited Time Offer!",          message: "Book any turf today and get 20% off! Use code TURFIN20 at checkout. Valid for 24 hours only." },
  { name: "New Venue",     icon: Buildings,            color: "text-blue-500 bg-blue-50",    audience: "active",   title: "New Venue Just Launched!",     message: "A new premium turf venue has just been onboarded near you. Check it out and secure your slot before it fills up!" },
  { name: "Re-engage",     icon: ArrowCounterClockwise,color: "text-purple-500 bg-purple-50",audience: "inactive", title: "We Miss You!",                 message: "It's been a while since your last booking. Come back and play — your favourite sport is waiting for you on Turfin!" },
  { name: "Tournament",    icon: Trophy,               color: "text-orange-500 bg-orange-50",audience: "all",      title: "Turfin League — Register Now!",message: "Our city-wide tournament is back! Register your team now and compete for the Turfin Cup. Slots are filling fast." },
  { name: "VIP Perk",      icon: Star,                 color: "text-yellow-500 bg-yellow-50",audience: "vip",      title: "VIP Exclusive: Early Access",  message: "As a Turfin VIP, you get 24-hour early access to new premium field slots before they open to everyone else." },
  { name: "Weather Alert", icon: Cloud,                color: "text-cyan-500 bg-cyan-50",    audience: "all",      title: "Weather Advisory",             message: "Due to forecasted rain, some outdoor fields may be affected today. Check the app for real-time availability updates." },
];

// ── Status Config ──────────────────────────────────────────────────────────────
const statusCfg: Record<NotifStatus, { cls: string; label: string }> = {
  sent:      { cls: "bg-green-50 text-green-700", label: "Sent"      },
  scheduled: { cls: "bg-blue-50 text-blue-600",   label: "Scheduled" },
  failed:    { cls: "bg-red-50 text-red-600",     label: "Failed"    },
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const [history, setHistory]           = useState<SentNotif[]>([...INIT_HISTORY]);

  // Compose form
  const [title, setTitle]               = useState("");
  const [message, setMessage]           = useState("");
  const [audience, setAudience]         = useState<AudienceKey>("all");
  const [cities, setCities]             = useState<string[]>([]);
  const [sports, setSports]             = useState<string[]>([]);
  const [scheduleType, setScheduleType] = useState<"now" | "later">("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // UI state
  const [sending, setSending]           = useState(false);
  const [sentModal, setSentModal]       = useState<SentNotif | null>(null);
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<"all" | "sent" | "scheduled">("all");

  // ── Derived ────────────────────────────────────────────────────────────────
  const estimatedReach = (() => {
    if (audience === "city")  return cities.reduce((s, c) => s + (CITIES.find(x => x.name === c)?.count ?? 0), 0);
    if (audience === "sport") return sports.reduce((s, sp) => s + (SPORTS.find(x => x.name === sp)?.count ?? 0), 0);
    return AUDIENCE_OPTIONS.find(a => a.key === audience)?.reach ?? 0;
  })();

  const sentItems      = history.filter(n => n.status === "sent");
  const totalReach     = sentItems.reduce((s, n) => s + n.reach, 0);
  const avgOpenRate    = sentItems.length
    ? Math.round(sentItems.reduce((s, n) => s + n.openRate, 0) / sentItems.length) : 0;
  const scheduledCount = history.filter(n => n.status === "scheduled").length;

  // ── Handlers ───────────────────────────────────────────────────────────────
  function applyTemplate(t: NotifTemplate) {
    setTitle(t.title);
    setMessage(t.message);
    setAudience(t.audience);
    setCities([]);
    setSports([]);
  }

  function toggleCity(c: string) {
    setCities(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }

  function toggleSport(s: string) {
    setSports(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  function audienceLabel(): string {
    if (audience === "city")  return cities.length  ? cities.join(", ") + " Users"   : "Select cities";
    if (audience === "sport") return sports.length  ? sports.join(", ") + " Players" : "Select sports";
    return AUDIENCE_OPTIONS.find(a => a.key === audience)?.label ?? "All Users";
  }

  function handleSend() {
    if (!canSend) return;
    setSending(true);
    setTimeout(() => {
      const isScheduled = scheduleType === "later" && scheduleDate;
      const notif: SentNotif = {
        id:        `PN-${String(history.length + 1).padStart(3, "0")}`,
        title,
        message,
        audience:  audienceLabel(),
        reach:     estimatedReach,
        opened:    0,
        openRate:  0,
        sentAt:    isScheduled ? `${scheduleDate} ${scheduleTime}` : "Just now",
        status:    isScheduled ? "scheduled" : "sent",
      };
      setHistory(h => [notif, ...h]);
      setSending(false);
      setSentModal(notif);
      setTitle(""); setMessage(""); setAudience("all");
      setCities([]); setSports([]);
      setScheduleType("now"); setScheduleDate(""); setScheduleTime("");
    }, 1200);
  }

  function cancelScheduled(id: string) {
    setHistory(h => h.filter(n => n.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function formatScheduledFor(): string {
    if (!scheduleDate) return "";
    const d = new Date(`${scheduleDate}T${scheduleTime || "00:00"}`);
    return d.toLocaleString("en-IN", {
      weekday: "short", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  const filteredHistory = historyFilter === "all"
    ? history
    : history.filter(n => n.status === historyFilter);

  const canSend =
    title.trim().length > 0 && message.trim().length > 0 &&
    (audience !== "city"  || cities.length > 0) &&
    (audience !== "sport" || sports.length > 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="px-6 py-5 space-y-5">

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Reach",          value: totalReach.toLocaleString(),    sub: "Cumulative push delivers",  icon: PaperPlaneTilt, color: "#8a9e60" },
          { label: "Avg Open Rate",         value: `${avgOpenRate}%`,              sub: "Across all campaigns",      icon: Eye,            color: "#6e8245" },
          { label: "Active Subscribers",    value: "1,240",                        sub: "Push-enabled users",        icon: BellRinging,    color: "#c4953a" },
          { label: "Scheduled",             value: String(scheduledCount),         sub: "Pending notifications",     icon: CalendarBlank,  color: "#6b7a96" },
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

      {/* ── Main body ── */}
      <div className="flex gap-5 items-start">

        {/* ── Compose Panel ── */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3"
              style={{ background: "linear-gradient(135deg,#8a9e60,#6e8245)" }}>
              <BellRinging size={18} className="text-white" weight="fill" />
              <div>
                <p className="text-white font-bold text-sm">Compose Push Notification</p>
                <p className="text-white/60 text-xs">Reach your users directly on their devices</p>
              </div>
            </div>

            <div className="p-5 space-y-5">

              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Title</label>
                  <span className={`text-[10px] font-medium ${title.length > 45 ? "text-red-500" : "text-gray-400"}`}>
                    {title.length}/50
                  </span>
                </div>
                <input
                  value={title}
                  onChange={e => { if (e.target.value.length <= 50) setTitle(e.target.value); }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] transition-colors"
                  placeholder="e.g. Weekend Warriors Deal — 20% Off Today!"
                />
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Message</label>
                  <span className={`text-[10px] font-medium ${message.length > 135 ? "text-red-500" : "text-gray-400"}`}>
                    {message.length}/150
                  </span>
                </div>
                <textarea
                  value={message}
                  onChange={e => { if (e.target.value.length <= 150) setMessage(e.target.value); }}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] transition-colors resize-none"
                  placeholder="Write a short, compelling message that drives action…"
                />
              </div>

              {/* Audience */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Target Audience
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {AUDIENCE_OPTIONS.map(opt => {
                    const Icon   = opt.icon;
                    const active = audience === opt.key;
                    return (
                      <button key={opt.key}
                        onClick={() => { setAudience(opt.key); setCities([]); setSports([]); }}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all
                          ${active ? "border-[#8a9e60] bg-[#8a9e60]/5" : "border-gray-100 hover:border-gray-200 bg-white"}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                          ${active ? "bg-[#8a9e60]" : "bg-gray-100"}`}>
                          <Icon size={14} className={active ? "text-white" : "text-gray-400"}
                            weight={active ? "fill" : "regular"} />
                        </div>
                        <div>
                          <p className={`text-[11px] font-semibold leading-tight ${active ? "text-gray-900" : "text-gray-600"}`}>
                            {opt.label}
                          </p>
                          <p className="text-[9px] text-gray-400 leading-tight">
                            {opt.key !== "city" && opt.key !== "sport"
                              ? `~${opt.reach.toLocaleString()} users`
                              : opt.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* City picker */}
                {audience === "city" && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                    <p className="text-[10px] font-semibold text-gray-500 mb-2.5">Select Cities</p>
                    <div className="flex flex-wrap gap-2">
                      {CITIES.map(c => (
                        <button key={c.name} onClick={() => toggleCity(c.name)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                            ${cities.includes(c.name)
                              ? "bg-[#8a9e60] text-white border-[#8a9e60]"
                              : "bg-white text-gray-600 border-gray-200 hover:border-[#8a9e60]"}`}>
                          {c.name} <span className="opacity-60">({c.count})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sport picker */}
                {audience === "sport" && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                    <p className="text-[10px] font-semibold text-gray-500 mb-2.5">Select Sports</p>
                    <div className="flex flex-wrap gap-2">
                      {SPORTS.map(s => (
                        <button key={s.name} onClick={() => toggleSport(s.name)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                            ${sports.includes(s.name)
                              ? "bg-[#8a9e60] text-white border-[#8a9e60]"
                              : "bg-white text-gray-600 border-gray-200 hover:border-[#8a9e60]"}`}>
                          {s.name} <span className="opacity-60">({s.count})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estimated reach */}
                <div className="mt-3 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5">
                  <Users size={14} className="text-[#8a9e60] shrink-0" weight="fill" />
                  <p className="text-xs text-gray-600">
                    Estimated reach:{" "}
                    <span className="font-bold text-gray-900">{estimatedReach.toLocaleString()} users</span>
                  </p>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Send Time
                </label>

                {/* Toggle */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-3">
                  {(["now", "later"] as const).map(s => (
                    <button key={s} onClick={() => setScheduleType(s)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all
                        ${scheduleType === s
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"}`}>
                      {s === "now"
                        ? <><PaperPlaneTilt size={12} weight="fill" /> Send Now</>
                        : <><Clock size={12} weight="fill" /> Schedule Later</>}
                    </button>
                  ))}
                </div>

                {/* Date/time pickers */}
                {scheduleType === "later" && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                    <div className="flex gap-3">
                      {/* Date */}
                      <div className="flex-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                          Date
                        </label>
                        <div className="relative">
                          <CalendarBlank size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          <input
                            type="date"
                            value={scheduleDate}
                            min={new Date().toISOString().split("T")[0]}
                            onChange={e => setScheduleDate(e.target.value)}
                            className="w-full border border-gray-200 bg-white rounded-lg pl-8 pr-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#8a9e60] transition-colors"
                          />
                        </div>
                      </div>

                      {/* Time */}
                      <div className="flex-1">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                          Time
                        </label>
                        <div className="relative">
                          <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          <input
                            type="time"
                            value={scheduleTime}
                            onChange={e => setScheduleTime(e.target.value)}
                            className="w-full border border-gray-200 bg-white rounded-lg pl-8 pr-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#8a9e60] transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Confirmation line */}
                    {scheduleDate ? (
                      <div className="flex items-center gap-2 bg-[#8a9e60]/8 border border-[#8a9e60]/20 rounded-lg px-3 py-2">
                        <CheckCircle size={13} className="text-[#8a9e60] shrink-0" weight="fill" />
                        <p className="text-xs text-gray-700">
                          Sends on <span className="font-semibold text-gray-900">{formatScheduledFor()}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 text-center">
                        Pick a date and time above to schedule your notification
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Phone Preview */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Device Preview
                </label>
                <div className="bg-gray-50 rounded-xl p-5 flex items-center gap-6">
                  {/* Phone mockup */}
                  <div className="shrink-0">
                    <div className="rounded-[24px] shadow-xl overflow-hidden"
                      style={{ width: 178, background: "#111827", padding: "10px 8px 14px" }}>
                      {/* Status bar */}
                      <div className="flex items-center justify-between px-2 mb-3">
                        <span className="text-white/50 text-[8px] font-semibold">9:41</span>
                        <div className="flex items-center gap-1">
                          <div className="w-2.5 h-1 bg-white/40 rounded-sm" />
                          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                        </div>
                      </div>
                      {/* Notification banner */}
                      <div className="rounded-xl px-3 py-2.5 mx-0.5"
                        style={{ background: "rgba(255,255,255,0.10)", backdropFilter: "blur(12px)" }}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-4 h-4 rounded-md flex items-center justify-center shrink-0"
                            style={{ backgroundColor: "#8a9e60" }}>
                            <BellRinging size={9} className="text-white" weight="fill" />
                          </div>
                          <span className="text-white/60 text-[8px] font-bold uppercase tracking-wider">Turfin</span>
                          <span className="text-white/40 text-[8px] ml-auto">now</span>
                        </div>
                        <p className="text-white text-[9px] font-bold leading-tight mb-0.5 line-clamp-1">
                          {title || "Notification Title"}
                        </p>
                        <p className="text-white/55 text-[8px] leading-relaxed line-clamp-2">
                          {message || "Your notification message will appear here."}
                        </p>
                      </div>
                      {/* Home bar */}
                      <div className="flex justify-center mt-3">
                        <div className="w-12 h-1 rounded-full bg-white/20" />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-semibold text-gray-800">Live Preview</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      This is how your notification will appear on users&apos; lock screens and notification trays.
                    </p>
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      Notifications are delivered via FCM (Firebase Cloud Messaging) to all Turfin users with push permissions enabled.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <span className="text-[9px] font-medium px-2 py-1 rounded bg-gray-100 text-gray-500">iOS</span>
                      <span className="text-[9px] font-medium px-2 py-1 rounded bg-gray-100 text-gray-500">Android</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={!canSend || sending}
                className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
                style={{ backgroundColor: "#8a9e60" }}>
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <PaperPlaneTilt size={15} weight="fill" />
                    {scheduleType === "now"
                      ? `Send to ${estimatedReach.toLocaleString()} Users`
                      : "Schedule Notification"}
                  </>
                )}
              </button>

            </div>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="w-72 shrink-0 space-y-4">

          {/* Quick Templates */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-800">Quick Templates</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Click to pre-fill the compose form</p>
            </div>
            <div className="p-3 space-y-1">
              {NOTIF_TEMPLATES.map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.name} onClick={() => applyTemplate(t)}
                    className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.color}`}>
                      <Icon size={15} weight="fill" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800">{t.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{t.title}</p>
                    </div>
                    <ArrowUpRight size={13} className="text-gray-300 group-hover:text-[#8a9e60] shrink-0 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Send History */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-800">Send History</p>
                <span className="text-[10px] text-gray-400">{filteredHistory.length} shown</span>
              </div>
              {/* Filter tabs */}
              <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg">
                {(["all", "sent", "scheduled"] as const).map(f => {
                  const count = f === "all" ? history.length : history.filter(n => n.status === f).length;
                  return (
                    <button key={f} onClick={() => setHistoryFilter(f)}
                      className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition-all capitalize
                        ${historyFilter === f ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                      {f} {count > 0 && <span className="opacity-60">({count})</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
              {filteredHistory.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs text-gray-400">No {historyFilter} notifications</p>
                </div>
              )}
              {filteredHistory.map(n => (
                <div key={n.id}>
                  <button
                    onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-1 flex-1">
                        {n.title}
                      </p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${statusCfg[n.status].cls}`}>
                        {statusCfg[n.status].label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 flex-wrap">
                      <span>{n.audience}</span>
                      {n.status === "sent" && (
                        <>
                          <span>·</span>
                          <span>{n.reach.toLocaleString()} sent</span>
                          <span>·</span>
                          <span className="font-medium" style={{ color: "#8a9e60" }}>{n.openRate}% opened</span>
                        </>
                      )}
                      {n.status === "scheduled" && (
                        <>
                          <span>·</span>
                          <span className="text-blue-500 font-medium">~{n.reach.toLocaleString()} users</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {n.status === "scheduled" && <Clock size={9} className="text-blue-400" weight="fill" />}
                      <p className="text-[9px] text-gray-300">{n.sentAt}</p>
                    </div>
                  </button>

                  {expandedId === n.id && (
                    <div className="px-4 pb-3 bg-gray-50 border-t border-gray-100">
                      <p className="text-[10px] text-gray-500 pt-2.5 leading-relaxed">{n.message}</p>

                      {n.status === "sent" && (
                        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
                          <div>
                            <p className="text-sm font-bold text-gray-800">{n.reach.toLocaleString()}</p>
                            <p className="text-[9px] text-gray-400">Delivered</p>
                          </div>
                          <div>
                            <p className="text-sm font-bold" style={{ color: "#8a9e60" }}>{n.opened.toLocaleString()}</p>
                            <p className="text-[9px] text-gray-400">Opened</p>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">{n.openRate}%</p>
                            <p className="text-[9px] text-gray-400">Open Rate</p>
                          </div>
                        </div>
                      )}

                      {n.status === "scheduled" && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                          <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                            <Clock size={12} className="text-blue-500 shrink-0" weight="fill" />
                            <p className="text-[10px] text-blue-700 font-medium">
                              Scheduled to send at {n.sentAt}
                            </p>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); cancelScheduled(n.id); }}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-red-200 text-[10px] font-semibold text-red-500 hover:bg-red-50 transition-colors">
                            <Trash size={11} />
                            Cancel Scheduled Notification
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Sent Success Modal ── */}
      {sentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 w-96">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: "#8a9e60" + "20" }}>
              {sentModal.status === "scheduled"
                ? <CalendarBlank size={32} style={{ color: "#8a9e60" }} weight="fill" />
                : <PaperPlaneTilt size={32} style={{ color: "#8a9e60" }} weight="fill" />}
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-gray-900 mb-1">
                {sentModal.status === "scheduled" ? "Notification Scheduled!" : "Notification Sent!"}
              </p>
              <p className="text-sm text-gray-500">
                {sentModal.status === "scheduled"
                  ? `"${sentModal.title}" is scheduled for ${sentModal.sentAt}.`
                  : `"${sentModal.title}" was sent to ${sentModal.reach.toLocaleString()} users.`}
              </p>
            </div>
            <div className="w-full bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Audience</span>
                <span className="font-semibold text-gray-800">{sentModal.audience}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Reach</span>
                <span className="font-semibold text-gray-800">{sentModal.reach.toLocaleString()} users</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Status</span>
                <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${statusCfg[sentModal.status].cls}`}>
                  {statusCfg[sentModal.status].label}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSentModal(null)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#8a9e60" }}>
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
