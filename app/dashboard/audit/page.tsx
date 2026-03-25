"use client";

import {
  MagnifyingGlass, DownloadSimple, Scroll, X,
  SignIn, Handshake, Users, CalendarBlank, BellRinging,
  DeviceMobile, Gear, Key,
} from "@phosphor-icons/react";
import { useState, useMemo } from "react";
import { useAuditLog, AuditCategory, AuditSeverity } from "../audit-log-context";

// ── Config ────────────────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<AuditCategory, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  auth:         { label: "Auth",          color: "#3b82f6", bg: "#eff6ff", Icon: SignIn        },
  vendor:       { label: "Vendors",       color: "#8a9e60", bg: "#f0f4e8", Icon: Handshake     },
  user:         { label: "Users",         color: "#8b5cf6", bg: "#f5f3ff", Icon: Users         },
  booking:      { label: "Bookings",      color: "#14b8a6", bg: "#f0fdfa", Icon: CalendarBlank },
  notification: { label: "Notifications", color: "#f97316", bg: "#fff7ed", Icon: BellRinging   },
  app:          { label: "App",           color: "#6366f1", bg: "#eef2ff", Icon: DeviceMobile  },
  settings:     { label: "Settings",      color: "#6b7280", bg: "#f9fafb", Icon: Gear          },
  role:         { label: "Roles",         color: "#ef4444", bg: "#fef2f2", Icon: Key           },
};

const SEVERITY_CONFIG: Record<AuditSeverity, { label: string; cls: string }> = {
  info:     { label: "Info",     cls: "bg-blue-50 text-blue-500"   },
  warning:  { label: "Warning",  cls: "bg-amber-50 text-amber-600" },
  critical: { label: "Critical", cls: "bg-red-50 text-red-600"     },
};

const ALL_CATEGORIES: AuditCategory[] = [
  "auth", "vendor", "user", "booking", "notification", "app", "settings", "role",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(d, now)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function groupByDate(entries: ReturnType<typeof useAuditLog>["entries"]) {
  const map = new Map<string, typeof entries>();
  for (const e of entries) {
    const key = formatDate(e.ts);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries());
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AuditPage() {
  const { entries } = useAuditLog();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<AuditCategory | "all">("all");
  const [sevFilter, setSevFilter] = useState<AuditSeverity | "all">("all");

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (catFilter !== "all" && e.category !== catFilter) return false;
      if (sevFilter !== "all" && e.severity !== sevFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.action.toLowerCase().includes(q) ||
          e.actor.name.toLowerCase().includes(q) ||
          e.actor.email.toLowerCase().includes(q) ||
          (e.resource?.label ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [entries, catFilter, sevFilter, search]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const counts = useMemo(() => ({
    total:    entries.length,
    critical: entries.filter(e => e.severity === "critical").length,
    warning:  entries.filter(e => e.severity === "warning").length,
  }), [entries]);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 65px)" }}>

      {/* ── Header ── */}
      <div className="px-6 pt-5 pb-3 shrink-0 border-b border-gray-100 bg-white">

        {/* Title + stats */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#8a9e6015" }}>
              <Scroll size={16} weight="fill" style={{ color: "#8a9e60" }} />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">Audit Log</h1>
              <p className="text-[10px] text-gray-400">Super Admin only · All admin portal activity</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
              {counts.total} events
            </span>
            {counts.critical > 0 && (
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600">
                {counts.critical} critical
              </span>
            )}
            {counts.warning > 0 && (
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">
                {counts.warning} warnings
              </span>
            )}
          </div>

          <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <DownloadSimple size={14} />
            Export CSV
          </button>
        </div>

        {/* Search + filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-64">
            <MagnifyingGlass size={13} className="text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search action, actor, email…"
              className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setCatFilter("all")}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${catFilter === "all" ? "text-white border-transparent" : "text-gray-500 border-gray-200 hover:border-gray-300"}`}
              style={catFilter === "all" ? { backgroundColor: "#8a9e60" } : {}}
            >
              All
            </button>
            {ALL_CATEGORIES.map(cat => {
              const cfg = CATEGORY_CONFIG[cat];
              const active = catFilter === cat;
              return (
                <button key={cat} onClick={() => setCatFilter(active ? "all" : cat)}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${active ? "text-white border-transparent" : "border-gray-200 hover:border-gray-300"}`}
                  style={active ? { backgroundColor: cfg.color } : { color: cfg.color }}>
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Severity filter */}
          <div className="flex items-center gap-1 ml-auto">
            {(["all", "info", "warning", "critical"] as const).map(sev => (
              <button key={sev} onClick={() => setSevFilter(sev)}
                className={`text-[10px] font-semibold px-2 py-1 rounded-lg capitalize transition-colors ${sevFilter === sev ? "bg-gray-800 text-white" : "text-gray-400 hover:text-gray-600"}`}>
                {sev === "all" ? "All levels" : sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Log Table ── */}
      <div className="flex-1 overflow-y-auto bg-white">

        {/* Column headers */}
        <div className="grid grid-cols-[160px_1fr_220px_80px] gap-4 px-6 py-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Action</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Done By</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Severity</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Scroll size={32} weight="thin" />
            <p className="text-sm font-medium">No events match your filters</p>
            <button onClick={() => { setSearch(""); setCatFilter("all"); setSevFilter("all"); }}
              className="text-xs text-[#8a9e60] hover:underline">Clear filters</button>
          </div>
        ) : (
          grouped.map(([dateLabel, items]) => (
            <div key={dateLabel}>

              {/* Date divider */}
              <div className="px-6 py-1.5 bg-gray-50/60 border-b border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {dateLabel} · {items.length} event{items.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Rows */}
              {items.map((entry, i) => {
                const cat = CATEGORY_CONFIG[entry.category];
                const sev = SEVERITY_CONFIG[entry.severity];
                const CatIcon = cat.Icon;

                return (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-[160px_1fr_220px_80px] gap-4 items-center px-6 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${i === 0 ? "" : ""}`}
                  >
                    {/* Time + category */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: cat.bg }}>
                        <CatIcon size={12} style={{ color: cat.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono text-gray-500">{formatTime(entry.ts)}</p>
                        <p className="text-[9px] font-semibold uppercase tracking-wider truncate" style={{ color: cat.color }}>
                          {cat.label}
                        </p>
                      </div>
                    </div>

                    {/* Action + resource */}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{entry.action}</p>
                      {entry.resource && (
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">
                          {entry.resource.type} · {entry.resource.label}
                        </p>
                      )}
                      {!entry.resource && (
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{entry.description}</p>
                      )}
                    </div>

                    {/* Actor: email only */}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-600 truncate">{entry.actor.email}</p>
                    </div>

                    {/* Severity badge */}
                    <div>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${sev.cls}`}>
                        {sev.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
