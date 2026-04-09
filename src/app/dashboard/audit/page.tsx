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
  Eye,
  UserCircle,
  CalendarCheck,
  CreditCard,
  Clock,
  Storefront,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { useState, useMemo, useEffect } from "react";
import { auditApi, useAuditLogs } from "@/domains/audit/api";
import { AuditCategory, AuditLogRecord } from "@/domains/audit/types";

// ─── Config ───────────────────────────────────────────────────────────────────
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

const PAGE_SIZE = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
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
  } catch {
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

// ─── Components ───────────────────────────────────────────────────────────────
function JsonViewer({ data, label }: { data: Record<string, unknown> | null | undefined; label: string }) {
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

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
          style={{ backgroundColor: color + "15" }}
        >
          <Icon size={16} weight="fill" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-[10px] text-gray-400 mt-1 font-medium">{sub}</p>
    </div>
  );
}

function LogDetailPanel({
  entry,
  onClose,
}: {
  entry: AuditLogRecord;
  onClose: () => void;
}) {
  const cat = CATEGORY_CONFIG[entry.category] || CATEGORY_CONFIG.auth;
  const isSuccess = entry.status === "success";

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden border-l border-gray-100 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div
        className="shrink-0 p-6 flex items-start justify-between border-b border-gray-100"
        style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.color}dd)` }}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white border border-white/30 shadow-lg shrink-0">
            <cat.Icon size={24} weight="bold" />
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-bold text-lg leading-tight truncate">
              {formatEventType(entry.eventType)}
            </h2>
            <p className="text-white/70 text-[11px] font-mono mt-1 truncate">
              {entry.id}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 bg-white/20 text-white border border-white/10`}>
                <span className={`w-1 h-1 rounded-full ${isSuccess ? "bg-green-400" : "bg-red-400"}`} />
                {entry.status.toUpperCase()}
              </span>
              <span className="text-[9px] bg-white/10 text-white/80 px-2 py-0.5 rounded-full uppercase border border-white/5 tracking-wider font-bold">
                {cat.label}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white shrink-0"
        >
          <X size={20} weight="bold" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Timestamp</p>
            <p className="text-xs font-bold text-gray-800">
              {formatDate(entry.createdAt)}, {formatTime(entry.createdAt)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Actor Role</p>
            <p className="text-xs font-bold text-gray-800 uppercase">
              {entry.actorRole || "System"}
            </p>
          </div>
        </div>

        {/* Actor & Target */}
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-gray-100 shrink-0 shadow-sm overflow-hidden">
               <UserCircle size={24} weight="duotone" className="text-gray-400" />
            </div>
            <div className="min-w-0">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actor ID / IP</p>
               <p className="text-xs font-mono font-bold text-gray-700 truncate">{entry.actorId || "System"}</p>
               <p className="text-[10px] text-gray-400 mt-1">IP: {entry.ipAddress || "Unknown"}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-gray-100 shrink-0 shadow-sm overflow-hidden">
               <Buildings size={24} weight="duotone" className="text-gray-400" />
            </div>
            <div className="min-w-0">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target : {entry.targetType || "N/A"}</p>
               <p className="text-xs font-mono font-bold text-gray-700 truncate">{entry.targetId || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Payload & Metadata */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <JsonViewer label="Event Payload" data={entry.payload} />
          <JsonViewer label="Event Metadata" data={entry.metadata} />
          {entry.userAgent && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">User Agent</p>
              <p className="text-[10px] text-gray-500 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100 leading-relaxed italic">
                 {entry.userAgent}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Copy Action */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <button
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(entry, null, 2));
          }}
          className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm"
          style={{ backgroundColor: cat.color }}
        >
          Copy Full Log JSON
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [catFilter, setCatFilter] = useState<AuditCategory | "all">("all");
  const [selected, setSelected] = useState<AuditLogRecord | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

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
  const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(debouncedSearch.trim().replace(/^user_/, ''));

  const queryParams = {
    page,
    limit: PAGE_SIZE,
    category: catFilter === "all" ? undefined : (catFilter as AuditCategory),
    search: isUUID ? undefined : (debouncedSearch.trim() || undefined),
    actorId: isUUID ? debouncedSearch.trim() : undefined,
  };

  const { data, isLoading } = useAuditLogs(queryParams);

  const entries = useMemo(() => (data as { data: AuditLogRecord[] })?.data || [], [data]);
  const meta = (data as { meta: { total: number } })?.meta;
  const totalPages = meta?.total ? Math.ceil(meta.total / PAGE_SIZE) : 1;

  const grouped = useMemo(() => groupByDate(entries), [entries]);

  return (
    <div className="px-6 py-5 space-y-6 h-full flex flex-col">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <StatCard
          label="Total Events"
          value={String(meta?.total || 0)}
          sub="Across all categories"
          icon={Scroll}
          color="#8a9e60"
        />
        <StatCard
          label="Auth Activity"
          value={String(entries.filter((e: AuditLogRecord) => e.category === 'auth').length)}
          sub="Events on this page"
          icon={SignIn}
          color="#3b82f6"
        />
        <StatCard
          label="KYC Updates"
          value={String(entries.filter((e: AuditLogRecord) => e.category === 'kyc').length)}
          sub="Events on this page"
          icon={Handshake}
          color="#f97316"
        />
        <StatCard
          label="Admin Actions"
          value={String(entries.filter((e: AuditLogRecord) => e.category === 'admin').length)}
          sub="Events on this page"
          icon={Gear}
          color="#6366f1"
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 flex-1 max-w-sm shadow-sm opacity-60 cursor-not-allowed">
          <MagnifyingGlass size={15} className="text-gray-400 shrink-0" />
          <input
            disabled
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events, actor ID, or target ID…"
            className="flex-1 outline-none text-sm text-gray-400 bg-transparent placeholder:text-gray-400 cursor-not-allowed"
          />
        </div>

        <button
          onClick={() => handleExportCSV(catFilter === "all" ? undefined : catFilter, isUUID ? debouncedSearch.trim() : undefined)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg transition-all hover:bg-gray-50 shadow-sm shrink-0"
        >
          <DownloadSimple size={16} weight="bold" /> Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1 overflow-x-auto scrollbar-hide shrink-0">
        <button
          onClick={() => {
            setCatFilter("all");
            setPage(1);
          }}
          className={`px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
            catFilter === "all" ? "text-[#8a9e60] border-[#8a9e60]" : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          All Activities
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
              className={`px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
                active ? "text-[#8a9e60] border-[#8a9e60]" : "text-gray-400 border-transparent hover:text-gray-600"
              }`}
            >
              <cfg.Icon size={14} weight={active ? "fill" : "regular"} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto flex-1 scrollbar-thin">
          <table className="w-full">
            <thead className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm">
              <tr className="border-b border-gray-100">
                {[
                  "Time & Category",
                  "Event Details",
                  "Actor Information",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-4 py-4">
                      <div className="h-4 bg-gray-50 rounded-lg w-full"></div>
                    </td>
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Scroll size={32} weight="thin" className="text-gray-200" />
                      <p className="text-sm text-gray-400 font-medium">No activity records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                grouped.map(([dateLabel, items]) => (
                  <Fragment key={dateLabel}>
                    <tr className="bg-gray-50/50">
                      <td colSpan={5} className="px-4 py-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest border-y border-gray-50">
                        {dateLabel} · {items.length} EVENT{items.length !== 1 ? "S" : ""}
                      </td>
                    </tr>
                    {items.map((entry) => {
                      const cat = CATEGORY_CONFIG[entry.category] || CATEGORY_CONFIG.auth;
                      const CatIcon = cat.Icon;
                      const isSuccess = entry.status === "success";

                      return (
                        <tr
                          key={entry.id}
                          onClick={() => setSelected(entry)}
                          className="hover:bg-gray-50/60 transition-colors cursor-pointer group"
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                                style={{ backgroundColor: cat.bg }}
                              >
                                <CatIcon size={16} style={{ color: cat.color }} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-800">
                                  {formatTime(entry.createdAt)}
                                </p>
                                <p
                                  className="text-[9px] font-black uppercase tracking-wider"
                                  style={{ color: cat.color }}
                                >
                                  {cat.label}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 min-w-[300px]">
                            <p className="text-xs font-bold text-gray-800 truncate">
                              {formatEventType(entry.eventType)}
                            </p>
                            {entry.targetType && (
                              <p className="text-[10px] text-gray-400 truncate mt-1 font-medium bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md inline-block">
                                {entry.targetType.toUpperCase()} : <span className="font-mono">{entry.targetId || "-"}</span>
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-xs font-bold text-gray-700">
                              {entry.actorRole?.toUpperCase() || "SYSTEM"}
                            </p>
                            <p className="text-[10px] font-mono text-gray-400 mt-0.5 truncate max-w-[140px]">
                              {entry.actorId || entry.ipAddress || "-"}
                            </p>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                                isSuccess 
                                  ? "bg-green-50 text-green-600 border-green-100" 
                                  : "bg-red-50 text-red-600 border-red-100"
                              }`}
                            >
                              <span className={`w-1 h-1 rounded-full ${isSuccess ? "bg-green-500" : "bg-red-500"}`} />
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                             <Eye size={16} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="shrink-0 border-t border-gray-100 px-6 py-3 flex items-center justify-between bg-gray-50/30">
          <p className="text-xs text-gray-400 font-medium">
            Showing <span className="text-gray-700">{entries.length}</span> of {meta?.total || 0} events
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-white transition-all shadow-sm"
            >
              <CaretLeft size={14} weight="bold" />
            </button>
            <span className="text-[11px] font-bold text-gray-600 px-3">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-white transition-all shadow-sm"
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* Details Panel Overlay */}
      {selected && (
        <>
          <div
            className="fixed inset-0 bg-black/10 z-40 backdrop-blur-[2px]"
            onClick={() => setSelected(null)}
          />
          <LogDetailPanel
            entry={selected}
            onClose={() => setSelected(null)}
          />
        </>
      )}
    </div>
  );
}

// Sub-component for Grouping Table Rows
const Fragment = ({ children }: { children: React.ReactNode }) => <>{children}</>;
