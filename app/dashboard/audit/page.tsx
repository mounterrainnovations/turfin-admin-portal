"use client";

import {
  MagnifyingGlass, DownloadSimple, Scroll, X,
  SignIn, Handshake, Users, CalendarBlank,
  Key, CurrencyDollar, MapPin,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/features/toast/toast-context";
import { exportAuditCsv, listAuditLogs } from "@/features/audit/api";
import type { AuditEntry, AuditSeverity, BackendAuditCategory } from "@/features/audit/types";

// ── Config ────────────────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<BackendAuditCategory, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  auth:    { label: "Auth",    color: "#3b82f6", bg: "#eff6ff", Icon: SignIn },
  kyc:     { label: "KYC",     color: "#8a9e60", bg: "#f0f4e8", Icon: Handshake },
  booking: { label: "Booking", color: "#14b8a6", bg: "#f0fdfa", Icon: CalendarBlank },
  payment: { label: "Payment", color: "#f97316", bg: "#fff7ed", Icon: CurrencyDollar },
  slot:    { label: "Slot",    color: "#0f766e", bg: "#ecfeff", Icon: CalendarBlank },
  admin:   { label: "Admin",   color: "#ef4444", bg: "#fef2f2", Icon: Key },
  vendor:  { label: "Vendor",  color: "#6e8245", bg: "#f4f7ee", Icon: Handshake },
  turf:    { label: "Turf",    color: "#6366f1", bg: "#eef2ff", Icon: MapPin },
  user:    { label: "User",    color: "#8b5cf6", bg: "#f5f3ff", Icon: Users },
};

const ALL_CATEGORIES: BackendAuditCategory[] = [
  "auth", "kyc", "booking", "payment", "slot", "admin", "vendor", "turf", "user",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";

  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(d, now)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function groupByDate(entries: AuditEntry[]) {
  const map = new Map<string, AuditEntry[]>();
  for (const e of entries) {
    const key = formatDate(e.ts);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries());
}

function truncate(value: string, max = 54) {
  if (!value || value === "-") return "-";
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
}

function StructuredValue({
  value,
  depth = 0,
}: {
  value: unknown;
  depth?: number;
}) {
  if (value === null || typeof value === "undefined") {
    return <span className="text-gray-400">-</span>;
  }

  if (typeof value === "string") {
    return <span className="text-gray-700 break-all">{value}</span>;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return <span className="text-gray-700">{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-400">[]</span>;
    }

    return (
      <div className="space-y-2">
        {value.map((item, index) => (
          <div
            key={`${depth}_${index}`}
            className="rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2"
          >
            <StructuredValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);

    if (entries.length === 0) {
      return <span className="text-gray-400">{"{}"}</span>;
    }

    return (
      <div className="space-y-2">
        {entries.map(([key, nestedValue]) => (
          <div
            key={`${depth}_${key}`}
            className="grid grid-cols-[120px_1fr] gap-3 rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {key}
            </span>
            <div className="min-w-0 text-[11px] leading-relaxed">
              <StructuredValue value={nestedValue} depth={depth + 1} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-gray-700">{String(value)}</span>;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AuditPage() {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<BackendAuditCategory | "all">("all");
  const [sevFilter, setSevFilter] = useState<AuditSeverity | "all">("all");
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAuditLogs() {
      setLoading(true);

      try {
        const result = await listAuditLogs({
          category: catFilter,
          page: 1,
          limit: 100,
        });

        if (!active) return;
        setEntries(result.entries);
        setTotalCount(result.total ?? result.entries.length);
      } catch (error) {
        if (!active) return;

        const message = error instanceof Error ? error.message : "Unable to load audit logs.";
        setEntries([]);
        setTotalCount(0);
        showToast({
          tone: "error",
          title: "Audit log unavailable",
          description: message,
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadAuditLogs();

    return () => {
      active = false;
    };
  }, [catFilter, showToast]);

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (sevFilter !== "all" && e.severity !== sevFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.action.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.eventType.toLowerCase().includes(q) ||
          e.route.toLowerCase().includes(q) ||
          e.method.toLowerCase().includes(q) ||
          e.targetId.toLowerCase().includes(q) ||
          e.targetType.toLowerCase().includes(q) ||
          e.actor.name.toLowerCase().includes(q) ||
          e.actor.email.toLowerCase().includes(q) ||
          e.actor.role.toLowerCase().includes(q) ||
          e.ipAddress.toLowerCase().includes(q) ||
          (e.resource?.label ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [entries, sevFilter, search]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const counts = useMemo(() => ({
    total:    totalCount,
    critical: entries.filter(e => e.severity === "critical").length,
    warning:  entries.filter(e => e.severity === "warning").length,
  }), [entries, totalCount]);

  async function handleExportCsv() {
    if (exporting) return;

    setExporting(true);

    try {
      const result = await exportAuditCsv({ category: catFilter });
      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast({
        tone: "success",
        title: "Audit CSV exported",
        description: "The audit log export has been downloaded.",
        durationMs: 2200,
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "CSV export failed",
        description: error instanceof Error ? error.message : "Unable to export audit logs.",
      });
    } finally {
      setExporting(false);
    }
  }

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

          <button
            onClick={() => void handleExportCsv()}
            disabled={exporting}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <DownloadSimple size={14} />
            {exporting ? "Exporting..." : "Export CSV"}
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
        <div className="grid grid-cols-[130px_1.15fr_0.95fr_0.95fr_110px] gap-4 px-6 py-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Action</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Target</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Done By</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Scroll size={32} weight="thin" />
            <p className="text-sm font-medium">Loading audit log...</p>
          </div>
        ) : filtered.length === 0 ? (
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
                const CatIcon = cat.Icon;

                return (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className={`grid grid-cols-[130px_1.15fr_0.95fr_0.95fr_110px] gap-4 items-start px-6 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer ${i === 0 ? "" : ""}`}
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
                        <p className="text-[9px] text-gray-400 truncate mt-0.5">{entry.method || "-"}</p>
                      </div>
                    </div>

                    {/* Action + route */}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{entry.action || "-"}</p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        {entry.eventType || "-"} · {truncate(entry.route || entry.url || "-")}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{entry.description || "-"}</p>
                    </div>

                    {/* Target */}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">
                        {entry.targetType || entry.resource?.type || "-"}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        {entry.targetId || entry.resource?.id || "-"}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        {entry.resource?.label || "-"}
                      </p>
                    </div>

                    {/* Actor */}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-600 truncate">{entry.actor.email || "-"}</p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        {entry.actor.role || "-"} · {entry.ipAddress || "-"}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="flex flex-col items-center gap-1 text-center">
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${entry.status === "success" ? "bg-green-50 text-green-700" : entry.status === "-" ? "bg-gray-100 text-gray-500" : "bg-red-50 text-red-600"}`}>
                        {entry.status || "-"}
                      </span>
                      <span className="text-[9px] text-gray-400 leading-none">
                        {entry.httpStatus || "-"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {selectedEntry && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 transition-opacity duration-300"
            onClick={() => setSelectedEntry(null)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-1/2 min-w-[540px] bg-white border-l border-gray-100 shadow-[0_18px_60px_rgba(0,0,0,0.10)] overflow-y-auto translate-x-0 transition-transform duration-300 ease-out">
            <div className="sticky top-0 z-10 bg-white/92 backdrop-blur-md border-b border-gray-100 px-6 py-5 flex items-start justify-between">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-gray-900">Audit Event</h2>
                <p className="text-[10px] text-gray-400 mt-0.5 break-all">{selectedEntry.id}</p>
              </div>
              <button onClick={() => setSelectedEntry(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Event</p>
                  <p className="text-xs font-semibold text-gray-800 mt-1">{selectedEntry.eventType || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</p>
                  <p className="text-xs font-semibold text-gray-800 mt-1">{selectedEntry.status || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">HTTP</p>
                  <p className="text-xs font-semibold text-gray-800 mt-1">{selectedEntry.method || "-"} · {selectedEntry.httpStatus || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Duration</p>
                  <p className="text-xs font-semibold text-gray-800 mt-1">{selectedEntry.durationMs || "-"}</p>
                </div>
              </div>

              <section>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Route</p>
                <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-800">{selectedEntry.route || "-"}</p>
                  <p className="text-[10px] text-gray-400 break-all">{selectedEntry.url || "-"}</p>
                </div>
              </section>

              <section>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Actor</p>
                <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-gray-800">{selectedEntry.actor.email || "-"}</p>
                  <p className="text-[10px] text-gray-500">Role: {selectedEntry.actor.role || "-"}</p>
                  <p className="text-[10px] text-gray-500">Actor ID: {selectedEntry.actorId || "-"}</p>
                  <p className="text-[10px] text-gray-500">IP: {selectedEntry.ipAddress || "-"}</p>
                  <p className="text-[10px] text-gray-500 break-all">User Agent: {selectedEntry.userAgent || "-"}</p>
                </div>
              </section>

              <section>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Target</p>
                <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-gray-800">{selectedEntry.targetType || "-"}</p>
                  <p className="text-[10px] text-gray-500">Target ID: {selectedEntry.targetId || "-"}</p>
                  <p className="text-[10px] text-gray-500">Resource: {selectedEntry.resource?.label || "-"}</p>
                </div>
              </section>

              <section>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Payload</p>
                <div className="bg-white rounded-xl border border-gray-100 p-3">
                  <StructuredValue value={selectedEntry.payloadData} />
                </div>
              </section>

              <section>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Response</p>
                <div className="bg-white rounded-xl border border-gray-100 p-3">
                  <StructuredValue value={selectedEntry.responseData} />
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
