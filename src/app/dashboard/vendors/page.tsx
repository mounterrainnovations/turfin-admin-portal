"use client";

import {
  Handshake,
  MapPin,
  ShieldCheck,
  CheckCircle,
  XCircle,
  WarningCircle,
  ClockCountdown,
  Plus,
  DotsThreeVertical,
  X,
  Eye,
  FileText,
  CaretRight,
  CaretLeft,
  CalendarBlank,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { vendorsApi, useVendorsList } from "@/domains/vendors/api";
import {
  Vendor,
  KycStatus as DomainKycStatus,
  VendorStatus,
} from "@/domains/vendors/types";

// ── Config ─────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

const kycCfg: Record<
  string,
  { label: string; cls: string; icon: React.ElementType; dot: string }
> = {
  verified: {
    label: "Verified",
    cls: "bg-green-50 text-green-700",
    icon: CheckCircle,
    dot: "bg-green-500",
  },
  pending: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-700",
    icon: ClockCountdown,
    dot: "bg-amber-400",
  },
  in_review: {
    label: "In Review",
    cls: "bg-amber-50 text-amber-700",
    icon: ClockCountdown,
    dot: "bg-amber-400",
  },
  rejected: {
    label: "Rejected",
    cls: "bg-red-50 text-red-600",
    icon: XCircle,
    dot: "bg-red-500",
  },
  not_started: {
    label: "Not Started",
    cls: "bg-gray-50 text-gray-400",
    icon: FileText,
    dot: "bg-gray-300",
  },
  not_submitted: {
    label: "Not Started",
    cls: "bg-gray-50 text-gray-400",
    icon: FileText,
    dot: "bg-gray-300",
  },
};

const statusCfg: Record<string, { label: string; cls: string; dot: string }> = {
  active: {
    label: "Active",
    cls: "bg-green-50 text-green-700",
    dot: "bg-green-500",
  },
  pending: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-700",
    dot: "bg-amber-400",
  },
  suspended: {
    label: "Suspended",
    cls: "bg-red-50 text-red-600",
    dot: "bg-red-500",
  },
  inactive: {
    label: "Inactive",
    cls: "bg-gray-100 text-gray-500",
    dot: "bg-gray-400",
  },
};

function avatar(name: string) {
  if (!name || !name.trim()) return "V";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "V";
  return parts
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ── Components ─────────────────────────────────────────────────────────────────
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

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function VendorsPage() {
  const queryClient = useQueryClient();
  const [search] = useState("");
  const [page, setPage] = useState(1);
  const [statusTab, setStatusTab] = useState<VendorStatus | "all">("all");
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [onboardSuccessData, setOnboardSuccessData] = useState<{
    email: string;
    pass: string;
  } | null>(null);

  // Modals
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [kycReviewVendor, setKycReviewVendor] = useState<Vendor | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const { data, isLoading } = useVendorsList({
    page,
    limit: PAGE_SIZE,
    status: statusTab === "all" ? undefined : statusTab,
    search: search || undefined,
  });

  const vendors = data?.data || [];
  const meta = data?.meta;
  const totalPages = Math.ceil((meta?.total || 0) / PAGE_SIZE) || 1;

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: VendorStatus }) =>
      vendorsApi.updateVendorStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vendors"] });
      toast.success("Vendor status updated");
      setActionMenu(null);
    },
  });

  const kycReviewMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: DomainKycStatus;
      reason?: string;
    }) => vendorsApi.reviewVendorKyc(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vendors"] });
      toast.success("KYC review submitted");
      setKycReviewVendor(null);
      setReviewNote("");
    },
    onError: () => toast.error("Failed to submit KYC review"),
  });

  function closeKycModal() {
    setKycReviewVendor(null);
    setReviewNote("");
  }

  return (
    <div className="px-6 py-5 space-y-6 h-full flex flex-col">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <StatCard
          label="Total Vendors"
          value={String(meta?.total || 0)}
          sub="Across all status"
          icon={Handshake}
          color="#8a9e60"
        />
        <StatCard
          label="Active Today"
          value="-"
          sub="Currently taking bookings"
          icon={CheckCircle}
          color="#22c55e"
        />
        <StatCard
          label="Pending KYC"
          value={String(
            vendors.filter(
              (v) => v.kyc?.status && !["verified"].includes(v.kyc.status),
            ).length,
          )}
          sub="Requires your attention"
          icon={WarningCircle}
          color="#f59e0b"
        />
        <StatCard
          label="Growth"
          value="-"
          sub="vs last month"
          icon={CalendarBlank}
          color="#3b82f6"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 shrink-0 space-y-4">
        <div className="flex items-center gap-4">
          {/* Search hidden for now */}


          <div className="flex gap-1.5 ml-auto">
            {(["all", "active", "pending", "suspended"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setStatusTab(tab);
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm ${statusTab === tab ? "text-white" : "bg-white border border-gray-100 text-gray-500 hover:bg-gray-50"}`}
                style={statusTab === tab ? { backgroundColor: "#8a9e60" } : {}}
              >
                {tab === "all" ? "ALL" : tab.replace("_", " ").toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => setOnboardModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 shadow-sm shrink-0"
            style={{ backgroundColor: "#8a9e60" }}
          >
            <Plus size={16} weight="bold" /> Onboard Vendor
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full">
            <thead className="bg-gray-50/80 sticky top-0 z-10">
              <tr className="border-b border-gray-100">
                {[
                  "Vendor",
                  "Owner",
                  "Location",
                  "KYC Status",
                  "Operational",
                  "Created",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-3.5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td
                      colSpan={7}
                      className="px-4 py-6 border-b border-gray-50"
                    >
                      <div className="h-4 bg-gray-100 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <Handshake
                      size={32}
                      className="text-gray-200 mx-auto mb-3"
                    />
                    <p className="text-sm text-gray-400">No vendors found</p>
                  </td>
                </tr>
              ) : (
                vendors.map((v) => {
                  const kyc =
                    kycCfg[v.kyc?.status || "not_submitted"] ||
                    kycCfg.not_submitted;
                  const oper = statusCfg[v.status] || statusCfg.pending;
                  return (
                    <tr
                      key={v.id}
                      onClick={() => setSelectedVendor(v)}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                            style={{ backgroundColor: "#8a9e60" }}
                          >
                            {avatar(v.businessName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate group-hover:text-[#8a9e60] transition-colors">
                              {v.businessName}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                              {v.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs font-medium text-gray-700">
                          {v.ownerFullName}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs text-gray-700 flex items-center gap-1">
                          <MapPin size={10} className="text-gray-300" />{" "}
                          {v.address.city}, {v.address.state}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${kyc.cls}`}
                        >
                          <kyc.icon size={11} weight="fill" />
                          {kyc.label.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${oper.cls}`}
                        >
                          <span
                            className={`w-1 h-1 rounded-full ${oper.dot}`}
                          />
                          {oper.label.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-[10px] text-gray-400 font-mono">
                          {new Date(v.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td
                        className="px-4 py-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActionMenu(actionMenu === v.id ? null : v.id)
                            }
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <DotsThreeVertical size={16} weight="bold" />
                          </button>
                          {actionMenu === v.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1.5 min-w-[180px] animate-in fade-in slide-in-from-top-1 duration-200">
                              <button
                                onClick={() => {
                                  setKycReviewVendor(v);
                                  setActionMenu(null);
                                }}
                                className="w-full text-left px-4 py-2 text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-2.5 font-bold"
                              >
                                <ShieldCheck size={14} /> Review KYC
                              </button>
                              <div className="border-t border-gray-50 my-1.5" />
                              {v.status === "suspended" ? (
                                <button
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: v.id,
                                      status: "active",
                                    })
                                  }
                                  className="w-full text-left px-4 py-2 text-xs text-green-600 hover:bg-green-50 flex items-center gap-2.5 font-bold"
                                >
                                  <CheckCircle size={14} /> Reactivate
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: v.id,
                                      status: "suspended",
                                    })
                                  }
                                  className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 flex items-center gap-2.5 font-bold"
                                >
                                  <XCircle size={14} /> Suspend
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="shrink-0 border-t border-gray-100 px-6 py-3 flex items-center justify-between bg-gray-50/30">
          <p className="text-xs text-gray-400 font-medium">
            Showing <span className="text-gray-700">{vendors.length}</span> of{" "}
            {meta?.total || 0} vendors
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
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

      {/* ── Vendor Details Drawer ── */}
      {selectedVendor && (
        <>
          <div
            className="fixed inset-0 bg-black/10 z-40 backdrop-blur-[1px]"
            onClick={() => setSelectedVendor(null)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-white h-full shadow-2xl z-50 flex flex-col border-l border-gray-100 animate-in slide-in-from-right duration-300">
            <div
              className="flex items-start justify-between p-6 border-b border-gray-100"
              style={{ background: "linear-gradient(135deg,#8a9e60,#6e8245)" }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-bold border border-white/30 shadow-lg">
                  {avatar(selectedVendor.businessName)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">
                    {selectedVendor.businessName}
                  </h2>
                  <p className="text-[11px] text-white/60 font-mono mt-1">
                    {selectedVendor.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVendor(null)}
                className="text-white/60 hover:text-white"
              >
                <X size={20} weight="bold" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    Commission
                  </p>
                  <p className="text-lg font-bold text-gray-800">
                    {selectedVendor.commissionPct}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    Payout Cycle
                  </p>
                  <p className="text-lg font-bold text-gray-800">
                    {selectedVendor.payoutCycle}
                  </p>
                </div>
              </div>

              {/* Business Details */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-[#8a9e60] rounded-full" />
                  <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-widest">
                    Business Info
                  </h3>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Owner", val: selectedVendor.ownerFullName },
                    { label: "Type", val: selectedVendor.businessType },
                    {
                      label: "Address",
                      val: `${selectedVendor.address.addressLineOne}, ${selectedVendor.address.city}`,
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between items-start gap-4"
                    >
                      <span className="text-xs text-gray-400 font-medium shrink-0 pt-0.5">
                        {row.label}
                      </span>
                      <span className="text-xs text-gray-700 font-semibold text-right">
                        {row.val || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* KYC Documents */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-500 rounded-full" />
                    <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-widest">
                      KYC Documents
                    </h3>
                  </div>
                  {(() => {
                    const kycStatus =
                      selectedVendor.kyc?.status || "not_submitted";
                    const cfg = kycCfg[kycStatus] || kycCfg.not_submitted;
                    return (
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.cls}`}
                      >
                        {cfg.label.toUpperCase()}
                      </span>
                    );
                  })()}
                </div>
                {selectedVendor.kyc?.documents &&
                Object.keys(selectedVendor.kyc.documents).length > 0 ? (
                  <div className="grid grid-cols-1 gap-2.5">
                    {Object.entries(selectedVendor.kyc.documents).map(
                      ([key, url]) => (
                        <div
                          key={key}
                          className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 items-center"
                        >
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              className="text-[10px] font-bold text-[#8a9e60] hover:underline flex items-center gap-1"
                            >
                              <Eye size={12} /> VIEW
                            </a>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-medium">
                              NOT PROVIDED
                            </span>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-6 text-center border border-dashed border-gray-200">
                    <p className="text-xs text-gray-400">
                      No KYC profile submitted yet.
                    </p>
                  </div>
                )}
                {selectedVendor.kyc?.reviewerNotes && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">
                      Reviewer Notes
                    </p>
                    <p className="text-xs text-amber-700">
                      {selectedVendor.kyc.reviewerNotes}
                    </p>
                  </div>
                )}
              </section>
            </div>
            {/* Quick Review Button */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => {
                  setSelectedVendor(null);
                  setKycReviewVendor(selectedVendor);
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                style={{ backgroundColor: "#8a9e60" }}
              >
                <ShieldCheck size={14} /> Review KYC Documents
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── KYC Review Modal ── */}
      {kycReviewVendor && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={closeKycModal}
          />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">
                  Review KYC Documents
                </h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  {kycReviewVendor.businessName} · {kycReviewVendor.id}
                </p>
              </div>
              <button
                onClick={closeKycModal}
                className="p-2 rounded-full hover:bg-gray-50 text-gray-400 transition-colors"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              {/* Current status badge */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 font-medium">
                  Current KYC Status:
                </span>
                {(() => {
                  const kycStatus =
                    kycReviewVendor.kyc?.status || "not_submitted";
                  const cfg = kycCfg[kycStatus] || kycCfg.not_submitted;
                  return (
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.cls}`}
                    >
                      {cfg.label.toUpperCase()}
                    </span>
                  );
                })()}
              </div>

              {/* Guideline alert */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-amber-700">
                <WarningCircle size={20} weight="fill" className="shrink-0" />
                <div className="text-xs">
                  <p className="font-bold">Review Guidelines</p>
                  <p className="mt-0.5 opacity-80 leading-relaxed">
                    <strong>Approve</strong> → Vendor becomes Active and can
                    start accepting bookings.
                    <br />
                    <strong>Request Changes</strong> → KYC stays In Review,
                    vendor is notified with your notes.
                    <br />
                    <strong>Reject</strong> → Vendor returns to Pending, must
                    resubmit. Always include a reason.
                  </p>
                </div>
              </div>

              {/* Document list */}
              <div className="space-y-3">
                {kycReviewVendor.kyc?.documents &&
                Object.keys(kycReviewVendor.kyc.documents).length > 0 ? (
                  Object.entries(kycReviewVendor.kyc.documents).map(
                    ([key, url]) => (
                      <div
                        key={key}
                        className="border border-gray-100 rounded-2xl p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                            <FileText size={24} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800 uppercase tracking-widest">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 font-medium uppercase">
                              {url ? "READY FOR REVIEW" : "MISSING"}
                            </p>
                          </div>
                        </div>
                        {url && (
                          <a
                            href={url as string}
                            target="_blank"
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold text-white bg-gray-900 hover:bg-gray-800 transition-all shadow-md"
                          >
                            <Eye size={14} /> VIEW DOC
                          </a>
                        )}
                      </div>
                    ),
                  )
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                    <FileText
                      size={40}
                      className="text-gray-200 mx-auto mb-2"
                    />
                    <p className="text-sm font-bold text-gray-300">
                      No documents submitted
                    </p>
                  </div>
                )}
              </div>

              {/* Reviewer Notes textarea */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Reviewer Notes{" "}
                  <span className="text-red-400 normal-case">
                    (required for Reject / Request Changes)
                  </span>
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={3}
                  placeholder='e.g. "All documents are clear and verified. KYC approved." or "Identity proof is blurred. Please re-upload a clear copy of your Aadhaar/PAN."'
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] resize-none placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-8 py-5 border-t border-gray-100 flex gap-3 bg-gray-50/50">
              <button
                onClick={() =>
                  kycReviewMutation.mutate({
                    id: kycReviewVendor.id,
                    status: "rejected",
                    reason: reviewNote,
                  })
                }
                disabled={!reviewNote.trim() || kycReviewMutation.isPending}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-red-600 border border-red-100 bg-white hover:bg-red-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ✕ REJECT
              </button>
              <button
                onClick={() =>
                  kycReviewMutation.mutate({
                    id: kycReviewVendor.id,
                    status: "in_review",
                    reason: reviewNote,
                  })
                }
                disabled={!reviewNote.trim() || kycReviewMutation.isPending}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-amber-700 border border-amber-100 bg-white hover:bg-amber-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ↩ REQUEST CHANGES
              </button>
              <button
                onClick={() =>
                  kycReviewMutation.mutate({
                    id: kycReviewVendor.id,
                    status: "verified",
                    reason: reviewNote,
                  })
                }
                disabled={kycReviewMutation.isPending}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all disabled:opacity-60"
                style={{ backgroundColor: "#8a9e60" }}
              >
                ✓ APPROVE KYC
              </button>
            </div>
          </div>
        </div>
      )}

      {actionMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setActionMenu(null)}
        />
      )}

      {/* ── Onboard Vendor Modal ── */}
      {onboardModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => !onboardSuccessData && setOnboardModalOpen(false)}
          />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-in zoom-in-95 duration-200">
            {onboardSuccessData ? (
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={40} weight="fill" className="text-green-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Onboarding Successful!</h2>
                  <p className="text-sm text-gray-400 font-medium mt-1">Vendor account created successfully.</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-left space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Login Email</p>
                    <p className="text-sm font-bold text-gray-800">{onboardSuccessData.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Temporary Password</p>
                    <div className="flex items-center justify-between bg-white border border-gray-100 px-3 py-2 rounded-xl mt-1">
                      <code className="text-sm font-black text-[#8a9e60] tracking-wider">{onboardSuccessData.pass}</code>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(onboardSuccessData.pass);
                          toast.success("Password copied");
                        }}
                        className="text-[10px] font-bold text-gray-400 hover:text-gray-600"
                      >
                        COPY
                      </button>
                    </div>
                    <p className="text-[10px] text-amber-600 font-medium mt-2">
                       Please share these credentials with the vendor safely.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setOnboardModalOpen(false);
                    setOnboardSuccessData(null);
                  }}
                  className="w-full py-3 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: "#8a9e60" }}
                >
                  DONE
                </button>
              </div>
            ) : (
              <OnboardVendorForm
                onClose={() => setOnboardModalOpen(false)}
                onSuccess={(email, pass) => setOnboardSuccessData({ email, pass })}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OnboardVendorForm({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void;
  onSuccess: (email: string, pass: string) => void;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: "",
    businessName: "",
    ownerFullName: "",
    businessType: "individual",
    commissionPct: 15,
    payoutCycle: "weekly",
  });

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => vendorsApi.onboardVendor(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vendors"] });
      onSuccess(formData.email, res.credentials.tempPassword);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to onboard vendor");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Onboard New Vendor</h2>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Create a new vendor profile and identity</p>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-50 text-gray-400">
          <X size={20} weight="bold" />
        </button>
      </div>

      <div className="p-8 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Business Name</label>
            <input
              required
              value={formData.businessName}
              onChange={e => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 outline-none focus:border-[#8a9e60] transition-colors"
              placeholder="e.g. Smash & Score Arena"
            />
          </div>
          <div className="space-y-1.5 col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Owner Full Name</label>
            <input
              required
              value={formData.ownerFullName}
              onChange={e => setFormData({ ...formData, ownerFullName: e.target.value })}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 outline-none focus:border-[#8a9e60] transition-colors"
              placeholder="e.g. Rajesh Kumar"
            />
          </div>
          <div className="space-y-1.5 col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Login Email Address</label>
            <input
              required
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 outline-none focus:border-[#8a9e60] transition-colors"
              placeholder="vendor@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Business Type</label>
            <select
              value={formData.businessType}
              onChange={e => setFormData({ ...formData, businessType: e.target.value })}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#8a9e60] transition-colors appearance-none"
            >
              <option value="individual">Individual</option>
              <option value="company">Company / LLP</option>
              <option value="partnership">Partnership</option>
            </select>
          </div>
          <div className="space-y-1.5 text-right">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pr-1">Commission %</label>
            <input
              type="number"
              required
              min="0"
              max="100"
              value={formData.commissionPct}
              onChange={e => setFormData({ ...formData, commissionPct: Number(e.target.value) })}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-800 text-right outline-none focus:border-[#8a9e60] transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="px-8 py-5 border-t border-gray-50 bg-gray-50/30 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
        >
          CANCEL
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex-1 py-3 text-xs font-bold text-white rounded-xl shadow-lg shadow-[#8a9e60]/20 hover:opacity-90 disabled:opacity-50 transition-all uppercase tracking-widest"
          style={{ backgroundColor: "#8a9e60" }}
        >
          {mutation.isPending ? "Onboarding..." : "Onboard Vendor"}
        </button>
      </div>
    </form>
  );
}
