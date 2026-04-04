"use client";

import {
  Handshake, MapPin, Envelope, ShieldCheck, CheckCircle, XCircle,
  WarningCircle, ClockCountdown, Plus, MagnifyingGlass,
  DotsThreeVertical, X, UserCircle, Eye, PencilSimple,
  Trash, FileText, ArrowLeft, Percent, CalendarBlank, CaretRight, CaretLeft,
  CurrencyDollar, DownloadSimple
} from "@phosphor-icons/react";
import { useState, useMemo, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { vendorsApi, useVendorsList } from "@/domains/vendors/api";
import { Vendor, KycStatus as DomainKycStatus, VendorStatus } from "@/domains/vendors/types";

// ── Config ─────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

const kycCfg: Record<string, { label: string; cls: string; icon: React.ElementType; dot: string }> = {
  APPROVED:      { label: "Verified",    cls: "bg-green-50 text-green-700",  icon: CheckCircle,     dot: "bg-green-500" },
  PENDING:       { label: "In Review",   cls: "bg-amber-50 text-amber-700",  icon: ClockCountdown,  dot: "bg-amber-400" },
  REJECTED:      { label: "Rejected",    cls: "bg-red-50 text-red-600",      icon: XCircle,         dot: "bg-red-500"   },
  NOT_SUBMITTED: { label: "Not Started", cls: "bg-gray-50 text-gray-400",    icon: FileText,        dot: "bg-gray-300"   },
};

const statusCfg: Record<string, { label: string; cls: string; dot: string }> = {
  ACTIVE:             { label: "Active",    cls: "bg-green-50 text-green-700", dot: "bg-green-500" },
  PENDING_ONBOARDING: { label: "Pending",   cls: "bg-amber-50 text-amber-700", dot: "bg-amber-400" },
  SUSPENDED:          { label: "Suspended", cls: "bg-red-50 text-red-600",     dot: "bg-red-500"   },
  INACTIVE:           { label: "Inactive",  cls: "bg-gray-100 text-gray-500",  dot: "bg-gray-400"  },
};

function avatar(name: string) {
  if (!name || !name.trim()) return "V";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "V";
  return parts.map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

// ── Components ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: color + "15" }}>
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
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [statusTab, setStatusTab] = useState<VendorStatus | "all">("all");
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  // Selected for modals
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [kycReviewVendor, setKycReviewVendor] = useState<Vendor | null>(null);

  const { data, isLoading } = useVendorsList({
    page,
    limit: PAGE_SIZE,
    status: statusTab === "all" ? undefined : statusTab,
    search: search || undefined
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
    }
  });

  const kycReviewMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: DomainKycStatus; reason?: string }) =>
      vendorsApi.reviewVendorKyc(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "vendors"] });
      toast.success("KYC review completed");
      setKycReviewVendor(null);
    }
  });

  return (
    <div className="px-6 py-5 space-y-6 h-full flex flex-col">
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <StatCard label="Total Vendors" value={String(meta?.total || 0)} sub="Across all status" icon={Handshake} color="#8a9e60" />
        <StatCard label="Active Today" value="-" sub="Currently taking bookings" icon={CheckCircle} color="#22c55e" />
        <StatCard label="Pending KYC" value="-" sub="Requires your attention" icon={WarningCircle} color="#f59e0b" />
        <StatCard label="Growth" value="+12%" sub="vs last month" icon={CalendarBlank} color="#3b82f6" />
      </div>

      {/* Constraints & Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 shrink-0 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-80 shadow-inner">
            <MagnifyingGlass size={14} className="text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search business, owner, city..."
              className="bg-transparent text-gray-700 placeholder-gray-400 text-xs flex-1 outline-none"
            />
          </div>

          <div className="flex gap-1.5 ml-auto">
            {(["all", "ACTIVE", "PENDING_ONBOARDING", "SUSPENDED"] as const).map(tab => {
              const active = statusTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => { setStatusTab(tab); setPage(1); }}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm ${active ? "text-white" : "bg-white border border-gray-100 text-gray-500 hover:bg-gray-50"}`}
                  style={active ? { backgroundColor: "#8a9e60" } : {}}
                >
                  {tab === "all" ? "ALL" : tab.replace("_", " ")}
                </button>
              );
            })}
          </div>

          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 shadow-premium shrink-0" style={{ backgroundColor: "#8a9e60" }}>
            <Plus size={16} weight="bold" /> Onboard Vendor
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-premium flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full">
            <thead className="bg-gray-50/80 sticky top-0 z-10">
              <tr className="border-b border-gray-100">
                {["Vendor", "Owner", "Location", "KYC Status", "Operational", "Created", ""].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-4 py-6 border-b border-gray-50"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <Handshake size={32} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No vendors found</p>
                  </td>
                </tr>
              ) : (
                vendors.map(v => {
                  const kyc = kycCfg[v.kyc?.status || "NOT_SUBMITTED"] || kycCfg.NOT_SUBMITTED;
                  const oper = statusCfg[v.status] || statusCfg.PENDING_ONBOARDING;
                  return (
                    <tr key={v.id} onClick={() => setSelectedVendor(v)} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm" style={{ backgroundColor: "#8a9e60" }}>
                            {avatar(v.businessName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate group-hover:text-[#8a9e60] transition-colors">{v.businessName}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">{v.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs font-medium text-gray-700">{v.ownerFullName}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs text-gray-700 flex items-center gap-1">
                           <MapPin size={10} className="text-gray-300" /> {v.address.city}, {v.address.state}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${kyc.cls}`}>
                          <kyc.icon size={11} weight="fill" />
                          {kyc.label.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${oper.cls}`}>
                          <span className={`w-1 h-1 rounded-full ${oper.dot}`} />
                          {oper.label.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-[10px] text-gray-400 font-mono">{new Date(v.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-4 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="relative">
                          <button onClick={() => setActionMenu(actionMenu === v.id ? null : v.id)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <DotsThreeVertical size={16} weight="bold" />
                          </button>
                          {actionMenu === v.id && (
                             <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1.5 min-w-[160px] animate-in fade-in slide-in-from-top-1 duration-200">
                                <button onClick={() => { setKycReviewVendor(v); setActionMenu(null); }} className="w-full text-left px-4 py-2 text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-2.5 font-bold">
                                  <ShieldCheck size={14} /> Review KYC
                                </button>
                                <div className="border-t border-gray-50 my-1.5" />
                                {v.status === "SUSPENDED" ? (
                                  <button onClick={() => updateStatusMutation.mutate({ id: v.id, status: "ACTIVE" })} className="w-full text-left px-4 py-2 text-xs text-green-600 hover:bg-green-50 flex items-center gap-2.5 font-bold">
                                    <CheckCircle size={14} /> Reactivate
                                  </button>
                                ) : (
                                  <button onClick={() => updateStatusMutation.mutate({ id: v.id, status: "SUSPENDED" })} className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 flex items-center gap-2.5 font-bold">
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

        {/* Footer / Pagination */}
        <div className="shrink-0 border-t border-gray-100 px-6 py-3 flex items-center justify-between bg-gray-50/30">
          <p className="text-xs text-gray-400 font-medium">
            Showing <span className="text-gray-700">{vendors.length}</span> of {meta?.total || 0} vendors
          </p>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-white transition-all shadow-sm">
              <CaretLeft size={14} weight="bold" />
            </button>
            <span className="text-[11px] font-bold text-gray-600 px-3">Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-white transition-all shadow-sm">
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals & Drawers */}
      
      {/* Details View */}
      {selectedVendor && (
         <>
           <div className="fixed inset-0 bg-black/10 z-40 backdrop-blur-[1px]" onClick={() => setSelectedVendor(null)} />
           <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-white h-full shadow-2xl z-50 flex flex-col border-l border-gray-100 animate-in slide-in-from-right duration-300">
              <div className="flex items-start justify-between p-6 border-b border-gray-100" style={{ background: "linear-gradient(135deg,#8a9e60,#6e8245)" }}>
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-bold border border-white/30 shadow-lg">
                     {avatar(selectedVendor.businessName)}
                   </div>
                   <div>
                     <h2 className="text-lg font-bold text-white leading-tight">{selectedVendor.businessName}</h2>
                     <p className="text-[11px] text-white/60 font-mono mt-1">{selectedVendor.id}</p>
                   </div>
                </div>
                <button onClick={() => setSelectedVendor(null)} className="text-white/60 hover:text-white"><X size={20} weight="bold" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                 {/* Summary Grid */}
                 <div className="grid grid-cols-2 gap-3">
                   <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Commission</p>
                      <p className="text-lg font-bold text-gray-800">{selectedVendor.commissionPct}%</p>
                   </div>
                   <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Payout Cycle</p>
                      <p className="text-lg font-bold text-gray-800">{selectedVendor.payoutCycle}</p>
                   </div>
                 </div>

                 {/* Business Details */}
                 <section>
                   <div className="flex items-center gap-2 mb-4">
                     <div className="w-1 h-4 bg-[#8a9e60] rounded-full" />
                     <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-widest">Business Info</h3>
                   </div>
                   <div className="space-y-4">
                      {[
                        { label: "Owner", val: selectedVendor.ownerFullName },
                        { label: "Type",  val: selectedVendor.businessType },
                        { label: "Phone", val: "-" },
                        { label: "Address", val: `${selectedVendor.address.addressLineOne}, ${selectedVendor.address.city}` },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between items-start gap-4">
                           <span className="text-xs text-gray-400 font-medium shrink-0 pt-0.5">{row.label}</span>
                           <span className="text-xs text-gray-700 font-semibold text-right">{row.val || "—"}</span>
                        </div>
                      ))}
                   </div>
                 </section>

                 {/* KYC Data */}
                 <section>
                   <div className="flex items-center gap-2 mb-4">
                     <div className="w-1 h-4 bg-blue-500 rounded-full" />
                     <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-widest">KYC Profile</h3>
                   </div>
                   {selectedVendor.kyc ? (
                     <div className="grid grid-cols-1 gap-2.5">
                        <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <span className="text-xs text-gray-500 font-medium">PAN Number</span>
                          <span className="font-mono text-xs font-bold text-gray-700 uppercase">{selectedVendor.kyc.panNumber}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <span className="text-xs text-gray-500 font-medium">GST Number</span>
                          <span className="font-mono text-xs font-bold text-gray-700 uppercase">{selectedVendor.kyc.gstNumber || "—"}</span>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                           <p className="text-[10px] font-bold text-gray-400 uppercase">Bank Details</p>
                           <p className="text-xs font-bold text-gray-700">{selectedVendor.kyc.bankAccountName}</p>
                           <p className="text-xs font-mono text-gray-500">{selectedVendor.kyc.bankAccountNumber}</p>
                           <p className="text-[10px] font-bold text-[#8a9e60]">{selectedVendor.kyc.bankIfscCode}</p>
                        </div>
                     </div>
                   ) : (
                     <div className="bg-gray-50 rounded-xl p-6 text-center border border-dashed border-gray-200">
                        <p className="text-xs text-gray-400">No KYC profile submitted yet.</p>
                     </div>
                   )}
                 </section>
              </div>
           </div>
         </>
      )}

      {/* KYC Review Modal */}
      {kycReviewVendor && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setKycReviewVendor(null)} />
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                   <h2 className="text-xl font-black text-gray-900 tracking-tight">Review KYC Documents</h2>
                   <p className="text-xs text-gray-400 font-medium mt-0.5">{kycReviewVendor.businessName} · {kycReviewVendor.id}</p>
                </div>
                <button onClick={() => setKycReviewVendor(null)} className="p-2 rounded-full hover:bg-gray-50 text-gray-400 transition-colors">
                  <X size={20} weight="bold" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                 {/* Alert */}
                 <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-amber-700">
                    <WarningCircle size={20} weight="fill" className="shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold">Review Guidelines</p>
                      <p className="mt-0.5 opacity-80 leading-relaxed">Ensure all numbers on the documents match the submitted profile data. High resolution images are required for verification.</p>
                    </div>
                 </div>

                 {/* Document Review List */}
                 <div className="space-y-3">
                   {kycReviewVendor.kyc?.documents ? (
                     Object.entries(kycReviewVendor.kyc.documents).map(([key, doc]: [string, any]) => (
                       <div key={key} className="border border-gray-100 rounded-2xl p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-inner">
                              <FileText size={24} />
                            </div>
                            <div>
                               <p className="text-xs font-bold text-gray-800 uppercase tracking-widest">{key}</p>
                               <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1.5 font-medium uppercase">
                                 {doc.status || "PENDING"}
                               </p>
                            </div>
                          </div>
                          <a href={doc.url} target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold text-white bg-gray-900 hover:bg-gray-800 transition-all shadow-md">
                            <Eye size={14} /> VIEW DOC
                          </a>
                       </div>
                     ))
                   ) : (
                     <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                        <FileText size={40} className="text-gray-200 mx-auto mb-2" />
                        <p className="text-sm font-bold text-gray-300">No documents submitted</p>
                     </div>
                   )}
                 </div>
              </div>

              <div className="px-8 py-5 border-t border-gray-100 flex gap-3 bg-gray-50/50 shadow-inner">
                 <button onClick={() => kycReviewMutation.mutate({ id: kycReviewVendor.id, status: "REJECTED", reason: "Documents invalid" })} className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-red-500 border border-red-100 hover:bg-red-50 transition-all">
                    REJECT KYC
                 </button>
                 <button onClick={() => kycReviewMutation.mutate({ id: kycReviewVendor.id, status: "APPROVED" })} className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white shadow-premium hover:opacity-90 transition-all" style={{ backgroundColor: "#8a9e60" }}>
                    APPROVE EVERYTHING
                 </button>
              </div>
           </div>
        </div>
      )}

      {actionMenu && <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />}
    </div>
  );
}
