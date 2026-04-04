"use client";

import {
  MapPin, MagnifyingGlass, CheckCircle, XCircle, ClockCountdown,
  Prohibit, DotsThree, X, Phone, Envelope, CaretDown, Eye,
  ArrowsClockwise, Buildings, Star, Wrench, Funnel,
  Trash, FileText, ArrowLeft, Percent, CalendarBlank, CaretRight, CaretLeft,
  CurrencyDollar, DownloadSimple, Clock, Plus
} from "@phosphor-icons/react";
import { useState, useRef, useEffect } from "react";
import { useTurfsList, turfsApi } from "@/domains/turfs/api";
import { TurfResponse, TurfStatus } from "@/domains/turfs/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<TurfStatus, { label: string; color: string; dot: string }> = {
  active:      { label: "Active",      color: "bg-green-100 text-green-700", dot: "bg-green-500"  },
  pending:     { label: "Pending",     color: "bg-amber-100 text-amber-700", dot: "bg-amber-500"  },
  suspended:   { label: "Suspended",   color: "bg-red-100 text-red-600",     dot: "bg-red-500"    },
};

const PAGE_SIZE = 10;

// ─── Actions Menu ─────────────────────────────────────────────────────────────
function ActionsMenu({ turf, onView }: { turf: TurfResponse; onView: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TurfStatus }) => 
      turfsApi.updateTurfStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "turfs"] });
      toast.success("Status updated successfully");
      setOpen(false);
    },
    onError: () => toast.error("Failed to update status")
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <DotsThree size={18} weight="bold" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-20">
          <button
            onClick={() => { onView(); setOpen(false); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Eye size={13} className="text-gray-400" /> View Details
          </button>
          
          <div className="border-t border-gray-100 my-1" />

          {turf.status === "pending" && (
            <button 
              onClick={() => statusMutation.mutate({ id: turf.id, status: "active" })}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-green-600 hover:bg-green-50 transition-colors font-medium">
              <CheckCircle size={13} /> Approve Field
            </button>
          )}
          {turf.status === "active" && (
            <button 
              onClick={() => statusMutation.mutate({ id: turf.id, status: "suspended" })}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors">
              <Prohibit size={13} /> Suspend Field
            </button>
          )}
          {turf.status === "suspended" && (
            <button 
              onClick={() => statusMutation.mutate({ id: turf.id, status: "active" })}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-green-600 hover:bg-green-50 transition-colors">
              <CheckCircle size={13} /> Reinstate
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function FieldDetailPanel({ turf, onClose }: { turf: TurfResponse; onClose: () => void }) {
  const sc = STATUS_CONFIG[turf.status] || STATUS_CONFIG.pending;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[420px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden border-l border-gray-100">
      {/* Header */}
      <div className="shrink-0 px-5 py-4 flex items-start justify-between" style={{ background: "linear-gradient(135deg,#8a9e60,#6e8245)" }}>
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-white/60 text-[11px] font-medium mb-0.5">{turf.id}</p>
          <h2 className="text-white font-bold text-base leading-tight truncate">{turf.name}</h2>
          <p className="text-white/60 text-[11px] mt-0.5 flex items-center gap-1">
            <MapPin size={10} /> {turf.address.city}, {turf.address.state}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${sc.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">{turf.type}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white shrink-0 mt-0.5">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Images */}
        {turf.images && turf.images.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {turf.images.map((img, idx) => (
              <img key={idx} src={img} alt={`Field ${idx}`} className="w-full h-24 object-cover rounded-lg border border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="aspect-video rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-100">
            <div className="text-gray-300 flex flex-col items-center gap-2">
              <MapPin size={32} />
              <span className="text-[10px] font-bold uppercase tracking-wider">No Preview Image</span>
            </div>
          </div>
        )}

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-2">
           <div className="bg-gray-50 rounded-xl p-3">
             <p className="text-[10px] text-gray-400 uppercase">Price</p>
             <p className="text-base font-bold text-gray-800">₹{turf.standardPricePaise / 100}/hr</p>
           </div>
           <div className="bg-gray-50 rounded-xl p-3">
             <p className="text-[10px] text-gray-400 uppercase">Surface</p>
             <p className="text-base font-bold text-gray-800 capitalize">{turf.surfaceType}</p>
           </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description</p>
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
             {turf.surfaceType} turf supporting {(turf.sports || []).join(", ")}. Located in {turf.address.city}.
          </p>
        </div>

        {/* Amenities */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Amenities</p>
          <div className="flex flex-wrap gap-1.5">
            {turf.amenities?.map(a => (
              <span key={a} className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">{a}</span>
            ))}
            {(!turf.amenities || turf.amenities.length === 0) && <span className="text-[11px] text-gray-400 italic">No amenities listed</span>}
          </div>
        </div>

        {/* KYC Documents */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">KYC Documents</p>
          {turf.documents ? (
            <div className="bg-gray-50 rounded-xl p-3 space-y-3">
               <div className="flex items-center justify-between">
                 <span className="text-xs font-semibold text-gray-700">Registration/Lease</span>
                 <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${turf.documents.status === "verified" ? "bg-green-100 text-green-700" : turf.documents.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                   {turf.documents.status}
                 </span>
               </div>
               <a href={turf.documents.documentUrl} target="_blank" className="flex items-center gap-2 text-[11px] text-[#8a9e60] font-medium hover:underline">
                 <FileText size={14} /> View Document
               </a>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No documents uploaded</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FieldsPage() {
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [statusTab, setStatusTab] = useState<TurfStatus | "all">("all");
  const [selected, setSelected]   = useState<TurfResponse | null>(null);

  const { data, isLoading } = useTurfsList({
    page,
    limit: PAGE_SIZE,
    status: statusTab === "all" ? undefined : statusTab,
    search: search || undefined
  });

  const turfs = data?.data || [];
  const meta = data?.meta;
  const totalPages = Math.ceil((meta?.total || 0) / PAGE_SIZE) || 1;

  const STATUS_TABS = [
    { key: "all",       label: "All"      },
    { key: "active",    label: "Active"   },
    { key: "pending",   label: "Pending"  },
    { key: "suspended", label: "Suspended"},
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      
      {/* Header & Filters */}
      <div className="p-6 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Field Management</h1>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90" style={{ backgroundColor: "#8a9e60" }}>
            <Plus size={16} weight="bold" /> Onboard Field
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-80">
              <MagnifyingGlass size={14} className="text-gray-400 shrink-0" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search turf name, location, ID..."
                className="bg-transparent text-gray-700 placeholder-gray-400 text-xs flex-1 outline-none"
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-1.5 ml-auto">
              {STATUS_TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setStatusTab(t.key as any); setPage(1); }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    statusTab === t.key ? "text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}
                  style={statusTab === t.key ? { backgroundColor: "#8a9e60" } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full">
              <thead className="bg-gray-50/80 sticky top-0 z-10">
                <tr>
                  {["Turf Detail", "Category", "Status", "Price", "KYC Status", "Created", ""].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-3/4"></div></td>
                    </tr>
                  ))
                ) : turfs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <Buildings size={32} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">No fields found</p>
                    </td>
                  </tr>
                ) : (
                  turfs.map(turf => {
                    const sc = STATUS_CONFIG[turf.status] || STATUS_CONFIG.pending;
                    const kycStatus = turf.documents?.status || "missing";
                    
                    return (
                      <tr 
                        key={turf.id} 
                        onClick={() => setSelected(turf)}
                        className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-100">
                               {turf.surfaceType ? <div className="w-full h-full bg-green-50 flex items-center justify-center text-[10px] font-bold text-green-700">TURF</div> : <MapPin size={20} className="text-gray-300 m-2.5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-800 text-sm truncate">{turf.name}</p>
                              <p className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                                <MapPin size={9} /> {turf.address.city}, {turf.address.state}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs font-medium text-gray-600 capitalize">{turf.surfaceType}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.color}`}>
                            <span className={`w-1 h-1 rounded-full ${sc.dot}`} />
                            {sc.label.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-gray-800">₹{turf.standardPricePaise / 100}</p>
                        </td>
                        <td className="px-4 py-4">
                           <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${kycStatus === "verified" ? "bg-green-50 text-green-600" : kycStatus === "rejected" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
                             {kycStatus.toUpperCase()}
                           </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-[10px] text-gray-500 font-mono">{new Date(turf.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-4 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <ActionsMenu turf={turf} onView={() => setSelected(turf)} />
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
              Showing <span className="text-gray-700">{turfs.length}</span> of {meta?.total || 0} fields
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-white transition-all shadow-sm"
              >
                <CaretLeft size={14} weight="bold" />
              </button>
              <span className="text-[11px] font-bold text-gray-600 px-3">Page {page} of {totalPages}</span>
              <button 
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-white transition-all shadow-sm"
              >
                <CaretRight size={14} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Panel Overlay */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/10 z-40 backdrop-blur-[2px]" onClick={() => setSelected(null)} />
          <FieldDetailPanel turf={selected} onClose={() => setSelected(null)} />
        </>
      )}
    </div>
  );
}
