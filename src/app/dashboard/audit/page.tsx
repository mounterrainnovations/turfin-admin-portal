"use client";

import {
  DownloadSimple,
  Scroll,
  X,
  SignIn,
  Handshake,
  Buildings,
  Gear,
  CaretLeft,
  CaretRight,
  WarningCircle,
  CheckCircle,
  Eye,
  IdentificationCard,
  UserCircle,
  CalendarCheck,
  CreditCard,
  Clock,
  Storefront,
} from "@phosphor-icons/react";
import { useState, useMemo } from "react";
import { auditApi, useAuditLogs } from "@/domains/audit/api";
import { AuditCategory, AuditLogRecord } from "@/domains/audit/types";

// ── Config ────────────────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<
  AuditCategory,
  { label: string; color: string; bg: string; Icon: React.ElementType }
> = {
  auth: { label: "Auth", color: "#3b82f6", bg: "#eff6ff", Icon: SignIn },
  admin: { label: "Admin", color: "#8a9e60", bg: "#f0f4e8", Icon: Gear },
  kyc: { label: "KYC", color: "#f97316", bg: "#fff7ed", Icon: Handshake },
  turf: { label: "Turf", color: "#14b8a6", bg: "#f0fdfa", Icon: Buildings },
  booking: { label: "Booking", color: "#6366f1", bg: "#eef2ff", Icon: CalendarCheck },
  payment: { label: "Payment", color: "#ec4899", bg: "#fdf2f8", Icon: CreditCard },
  slot: { label: "Slot", color: "#8b5cf6", bg: "#f5f3ff", Icon: Clock },
  vendor: { label: "Vendor", color: "#10b981", bg: "#ecfdf5", Icon: Storefront },
};

const ALL_CATEGORIES: AuditCategory[] = ["auth", "admin", "kyc", "turf", "booking", "payment", "slot", "vendor"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
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
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (sameDay(d, now)) return "Today";
    if (sameDay(d, yesterday)) return "Yesterday";
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
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
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

// ── Components ──
function JsonViewer({ data, label }: { data: any; label: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 overflow-x-auto">
        <pre className="text-[10px] font-mono text-gray-600 leading-relaxed">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// ── CSV Export Utility ────────────────────────────────────────────────────────
export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [catFilter, setCatFilter] = useState<AuditCategory | "all">("all");
  const [selected, setSelected] = useState<AuditLogRecord | null>(null);

  async function handleExportCSV(category?: AuditCategory, actorId?: string) {
    try {
      const blob = await auditApi.exportCsv({ category, actorId });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `audit_log_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  }

  // Smart search: if it looks like a UUID, send as actorId
  const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(search.trim().replace(/^user_/, ''));

  const queryParams = {
    page,
    limit: 20,
    category: catFilter === "all" ? undefined : (catFilter as AuditCategory),
    search: isUUID ? undefined : (search.trim() || undefined),
    actorId: isUUID ? search.trim() : undefined,
  };

  console.log("[Audit] Fetching logs with params:", queryParams);

  const { data, isLoading } = useAuditLogs(queryParams);

  const entries = useMemo(() => (data as any)?.data || [], [data]);
  const meta = (data as any)?.meta;

  const grouped = useMemo(() => groupByDate(entries), [entries]);

  const totalLoaded = entries.length;
  const totalPages = meta?.total ? Math.ceil(meta.total / 20) : 1;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 65px)" }}>
      {/* ── Header ── */}
      <div className="px-6 pt-5 pb-3 shrink-0 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#8a9e6015" }}
            >
              <Scroll size={16} weight="fill" style={{ color: "#8a9e60" }} />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                Audit Log
              </h1>
              <p className="text-[10px] text-gray-400">
                Super Admin only · All platform activities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 ml-auto mr-4">
            <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
              {meta?.total || 0} total events
            </span>
          </div>

          <button 
            onClick={() => handleExportCSV(catFilter === "all" ? undefined : catFilter, isUUID ? search.trim() : undefined)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DownloadSimple size={14} />
            Export CSV
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search hidden for now */}

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                setCatFilter("all");
                setPage(1);
              }}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${catFilter === "all" ? "text-white border-transparent" : "text-gray-500 border-gray-200 hover:border-gray-300"}`}
              style={catFilter === "all" ? { backgroundColor: "#8a9e60" } : {}}
            >
              All
            </button>
            {ALL_CATEGORIES.map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              const active = catFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setCatFilter(active ? "all" : cat);
                    setPage(1);
                  }}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${active ? "text-white border-transparent" : "border-gray-200 hover:border-gray-300"}`}
                  style={
                    active
                      ? { backgroundColor: cfg.color }
                      : { color: cfg.color }
                  }
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-[10px] text-gray-400 font-medium">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-md border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 bg-white group transition-all"
              >
                <CaretLeft size={12} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
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
        <div className="grid grid-cols-[160px_1fr_220px_100px_40px] gap-4 px-6 py-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Time
          </span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Event
          </span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Actor info
          </span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">
            Status
          </span>
          <span />
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
          </div>
        ) : (
          grouped.map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <div className="px-6 py-1.5 bg-gray-50/60 border-b border-gray-100 uppercase tracking-widest text-[9px] font-black text-gray-400">
                {dateLabel} · {items.length} event
                {items.length !== 1 ? "s" : ""}
              </div>
              {items.map((entry) => {
                const cat =
                  CATEGORY_CONFIG[entry.category] || CATEGORY_CONFIG.auth;
                const CatIcon = cat.Icon;
                const isSuccess = entry.status === "success";

                return (
                  <div
                    key={entry.id}
                    onClick={() => setSelected(entry)}
                    className="grid grid-cols-[160px_1fr_220px_100px_40px] gap-4 items-center px-6 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: cat.bg }}
                      >
                        <CatIcon size={14} style={{ color: cat.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-800">
                          {formatTime(entry.createdAt)}
                        </p>
                        <p
                          className="text-[8px] font-black uppercase tracking-wider truncate"
                          style={{ color: cat.color }}
                        >
                          {cat.label}
                        </p>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {formatEventType(entry.eventType)}
                      </p>
                      {entry.targetType && (
                        <p className="text-[10px] text-gray-400 truncate mt-0.5 font-medium">
                          {entry.targetType.toUpperCase()} ·{" "}
                          <span className="font-mono text-[9px]">
                            {entry.targetId || "-"}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-gray-700 truncate">
                        {entry.actorRole?.toUpperCase() || "SYSTEM"}
                      </p>
                      <p className="text-[9px] font-mono text-gray-400 truncate mt-0.5">
                        {entry.actorId || entry.ipAddress || "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${isSuccess ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
                      >
                        {entry.status}
                      </span>
                    </div>
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye size={14} className="text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: CATEGORY_CONFIG[selected.category].bg,
                  }}
                >
                  {(() => {
                    const Icon = CATEGORY_CONFIG[selected.category].Icon;
                    return (
                      <Icon
                        size={20}
                        style={{
                          color: CATEGORY_CONFIG[selected.category].color,
                        }}
                      />
                    );
                  })()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    {formatEventType(selected.eventType)}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-mono">
                    {selected.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <UserCircle size={18} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                        Actor Info
                      </p>
                      <p className="text-xs font-bold text-gray-700">
                        {selected.actorRole?.toUpperCase() || "SYSTEM"}
                      </p>
                      <p className="text-[10px] font-mono text-gray-500 mt-1">
                        {selected.actorId || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IdentificationCard
                      size={18}
                      className="text-gray-400 mt-0.5"
                    />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                        Context
                      </p>
                      <p className="text-[10px] text-gray-600 bg-gray-50 px-2 py-1 rounded inline-block font-mono">
                        IP: {selected.ipAddress || "Unknown"}
                      </p>
                      <p className="text-[9px] text-gray-400 mt-2 leading-relaxed italic">
                        {selected.userAgent || "No user agent info"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Buildings size={18} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                        Target
                      </p>
                      <p className="text-xs font-bold text-gray-700 uppercase">
                        {selected.targetType || "N/A"}
                      </p>
                      <p className="text-[10px] font-mono text-gray-500 mt-1">
                        {selected.targetId || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    {selected.status === "success" ? (
                      <CheckCircle
                        size={18}
                        className="text-green-500 mt-0.5"
                      />
                    ) : (
                      <WarningCircle
                        size={18}
                        className="text-red-500 mt-0.5"
                      />
                    )}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                        Execution Status
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${selected.status === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
                      >
                        {selected.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <JsonViewer label="Event Payload" data={selected.payload} />
                <JsonViewer label="Event Metadata" data={selected.metadata} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
