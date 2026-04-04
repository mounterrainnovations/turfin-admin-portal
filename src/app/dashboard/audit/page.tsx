"use client";

import {
  MagnifyingGlass, DownloadSimple, Scroll, X,
  SignIn, Handshake, Buildings, Gear, 
  CaretLeft, CaretRight, WarningCircle, CheckCircle
} from "@phosphor-icons/react";
import { useState, useMemo } from "react";
import { useAuditLogs } from "@/domains/audit/api";
import { AuditCategory, AuditLogRecord } from "@/domains/audit/types";

// ── Config ────────────────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<AuditCategory, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  auth:  { label: "Auth",   color: "#3b82f6", bg: "#eff6ff", Icon: SignIn    },
  admin: { label: "Admin",  color: "#8a9e60", bg: "#f0f4e8", Icon: Gear      },
  kyc:   { label: "KYC",    color: "#f97316", bg: "#fff7ed", Icon: Handshake },
  turf:  { label: "Turf",   color: "#14b8a6", bg: "#f0fdfa", Icon: Buildings },
};

const ALL_CATEGORIES: AuditCategory[] = ["auth", "admin", "kyc", "turf"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch (e) {
    return "-";
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    if (sameDay(d, now)) return "Today";
    if (sameDay(d, yesterday)) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } catch (e) {
    return "Unknown Date";
  }
}

function groupByDate(entries: AuditLogRecord[]) {
  const map = new Map<string, AuditLogRecord[]>();
  for (const e of entries) {
    const key = formatDate(e.createdAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries());
}

function formatEventType(type?: string): string {
  if (!type) return "-";
  return type
    .split("_")
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [catFilter, setCatFilter] = useState<AuditCategory | "all">("all");

  const { data, isLoading } = useAuditLogs({
    page,
    limit: 20,
    category: catFilter === "all" ? undefined : catFilter,
    search: search || undefined,
  });

  const entries = data?.data || [];
  const meta = data?.meta;

  const grouped = useMemo(() => groupByDate(entries), [entries]);

  const PAGE_SIZE = 20;
  const totalPages = Math.ceil((meta?.total || 0) / PAGE_SIZE) || 1;

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
              <p className="text-[10px] text-gray-400">Super Admin only · All platform activities</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
              {meta?.total || 0} events
            </span>
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
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search event, actor, ID…"
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
              onClick={() => { setCatFilter("all"); setPage(1); }}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${catFilter === "all" ? "text-white border-transparent" : "text-gray-500 border-gray-200 hover:border-gray-300"}`}
              style={catFilter === "all" ? { backgroundColor: "#8a9e60" } : {}}
            >
              All
            </button>
            {ALL_CATEGORIES.map(cat => {
              const cfg = CATEGORY_CONFIG[cat];
              const active = catFilter === cat;
              return (
                <button key={cat} onClick={() => { setCatFilter(active ? "all" : cat); setPage(1); }}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${active ? "text-white border-transparent" : "border-gray-200 hover:border-gray-300"}`}
                  style={active ? { backgroundColor: cfg.color } : { color: cfg.color }}>
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-3 ml-auto">
             <span className="text-[10px] text-gray-400 font-medium">
               Page {page} of {totalPages}
             </span>
             <div className="flex items-center gap-1">
               <button 
                 disabled={page <= 1}
                 onClick={() => setPage(p => Math.max(1, p - 1))}
                 className="p-1.5 rounded-md border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 bg-white group transition-all"
               >
                 <CaretLeft size={12} />
               </button>
               <button 
                 disabled={page >= totalPages}
                 onClick={() => setPage(p => p + 1)}
                 className="p-1.5 rounded-md border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 bg-white group transition-all"
               >
                 <CaretRight size={12} />
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* ── Log Table ── */}
      <div className="flex-1 overflow-y-auto bg-white">

        {/* Column headers */}
        <div className="grid grid-cols-[160px_1fr_220px_100px] gap-4 px-6 py-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Event</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Done By / Actor</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Status</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8a9e60]"></div>
             <p className="text-sm font-medium">Loading activity logs...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Scroll size={32} weight="thin" />
            <p className="text-sm font-medium">No events found</p>
            <button onClick={() => { setSearch(""); setCatFilter("all"); setPage(1); }}
              className="text-xs text-[#8a9e60] hover:underline">Clear search</button>
          </div>
        ) : (
          grouped.map(([dateLabel, items]) => (
            <div key={dateLabel}>

              {/* Date divider */}
              <div className="px-6 py-1.5 bg-gray-50/60 border-b border-gray-100 uppercase tracking-widest text-[9px] font-black text-gray-400">
                {dateLabel} · {items.length} event{items.length !== 1 ? "s" : ""}
              </div>

              {/* Rows */}
              {items.map((entry) => {
                const cat = CATEGORY_CONFIG[entry.category] || CATEGORY_CONFIG.auth;
                const CatIcon = cat.Icon;
                const isSuccess = entry.status === "success";

                return (
                  <div
                    key={entry.id}
                    className="grid grid-cols-[160px_1fr_220px_100px] gap-4 items-center px-6 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Time + category */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: cat.bg }}>
                        <CatIcon size={14} style={{ color: cat.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-800">{formatTime(entry.createdAt)}</p>
                        <p className="text-[8px] font-black uppercase tracking-wider truncate" style={{ color: cat.color }}>
                          {cat.label}
                        </p>
                      </div>
                    </div>

                    {/* Event + Target */}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{formatEventType(entry.eventType)}</p>
                      {entry.targetType && (
                        <p className="text-[10px] text-gray-400 truncate mt-0.5 font-medium">
                          {entry.targetType.toUpperCase()} · <span className="font-mono text-[9px]">{entry.targetId || "-"}</span>
                        </p>
                      )}
                    </div>

                    {/* Actor */}
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-700 truncate">{entry.actorRole?.toUpperCase() || "SYSTEM"}</p>
                      <p className="text-[9px] font-mono text-gray-400 truncate mt-0.5">{entry.actorId || "-"}</p>
                    </div>

                    {/* Status badge */}
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${isSuccess ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                        {isSuccess ? <CheckCircle size={10} weight="fill" /> : <WarningCircle size={10} weight="fill" />}
                        {entry.status}
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
