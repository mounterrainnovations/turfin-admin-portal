"use client";

import {
  CaretLeft,
  Buildings,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Wrench,
  Prohibit,
  ShieldCheck,
  Plus,
  PencilSimple,
  Trash,
  DotsThreeVertical,
  Warning,
  Info,
} from "@phosphor-icons/react";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getArenaById, Arena, ArenaStatus, updateArenaStatus } from "@/features/arenas";
import { listTurfs, Turf } from "@/features/turfs";
import { useToast } from "@/features/toast/toast-context";
import {
  SlotConfig,
  getAdminSlotConfig,
  upsertAdminSlotConfig,
  generateAdminSlots,
  UpsertSlotConfigPayload,
} from "@/features/slots";
import { generateDefaultDailyConfigs } from "@/features/slots/utils";
import { SlotConfigEditor } from "@/features/slots/components/SlotConfigEditor";
import { TableRowsSkeleton } from "@/components/LoadingSkeleton";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  active: { label: "Active", bg: "bg-green-50", text: "text-green-700", icon: CheckCircle },
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700", icon: Clock },
  suspended: { label: "Suspended", bg: "bg-slate-50", text: "text-slate-700", icon: Prohibit },
  maintenance: { label: "Maintenance", bg: "bg-blue-50", text: "text-blue-700", icon: Wrench },
  banned: { label: "Banned", bg: "bg-red-50", text: "text-red-700", icon: XCircle },
};

const KYC_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  verified: { label: "Verified", bg: "bg-green-100", text: "text-green-700" },
  pending: { label: "Pending Review", bg: "bg-amber-100", text: "text-amber-700" },
  rejected: { label: "Rejected", bg: "bg-red-100", text: "text-red-700" },
  not_started: { label: "Not Started", bg: "bg-gray-100", text: "text-gray-700" },
};

export default function ArenaDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const [arena, setArena] = useState<Arena | null>(null);
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "turfs" | "schedule">("overview");

  // Slot Management Modal State
  const [editTurf, setEditTurf] = useState<Turf | null>(null);
  const [editSlotConfig, setEditSlotConfig] = useState<UpsertSlotConfigPayload | null>(null);
  const [editSlotConfigLoading, setEditSlotConfigLoading] = useState(false);
  const [isSavingSlots, setIsSavingSlots] = useState(false);
  const [isGeneratingSlots, setIsGeneratingSlots] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [arenaData, turfsData] = await Promise.all([
        getArenaById(id as string),
        listTurfs({ arenaId: id as string, limit: 100 })
      ]);
      setArena(arenaData);
      setTurfs(turfsData.items);
    } catch (err: any) {
      showToast({
        title: "Error",
        description: "Failed to load arena details.",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEditTurfClick = async (turf: Turf) => {
    setEditTurf(turf);
    setEditSlotConfigLoading(true);
    try {
      const config = await getAdminSlotConfig(turf.id);
      setEditSlotConfig({
        slotDurationMins: config.slotDurationMins,
        dailyConfigs: config.dailyConfigs && config.dailyConfigs.length > 0 
          ? config.dailyConfigs 
          : generateDefaultDailyConfigs({
              weekdayOpen: arena?.weekdayOpen || "06:00",
              weekdayClose: arena?.weekdayClose || "22:00",
              weekendOpen: arena?.weekendOpen || "06:00",
              weekendClose: arena?.weekendClose || "22:00",
              pricePerHour: turf.standardPricePaise
            }),
      });
    } catch (error: any) {
      setEditSlotConfig({
        slotDurationMins: 60,
        dailyConfigs: generateDefaultDailyConfigs({
          weekdayOpen: arena?.weekdayOpen || "06:00",
          weekdayClose: arena?.weekdayClose || "22:00",
          weekendOpen: arena?.weekendOpen || "06:00",
          weekendClose: arena?.weekendClose || "22:00",
          pricePerHour: turf.standardPricePaise
        }),
      });
    } finally {
      setEditSlotConfigLoading(false);
    }
  };

  const handleSaveSlotConfig = async () => {
    if (!editTurf || !editSlotConfig) return;
    setIsSavingSlots(true);
    try {
      await upsertAdminSlotConfig(editTurf.id, editSlotConfig);
      showToast({ title: "Success", description: "Slot configuration updated successfully", tone: "success" });
    } catch (error: any) {
      showToast({ title: "Error", description: error.message || "Failed to update slot configuration", tone: "error" });
    } finally {
      setIsSavingSlots(false);
    }
  };

  const handleGenerateSlots = async () => {
    if (!editTurf) return;
    setIsGeneratingSlots(true);
    try {
      await generateAdminSlots(editTurf.id);
      showToast({ title: "Success", description: "Slots generated successfully for the next 30 days.", tone: "success" });
    } catch (error: any) {
      showToast({ title: "Error", description: error.message || "Failed to generate slots", tone: "error" });
    } finally {
      setIsGeneratingSlots(false);
    }
  };

  if (loading && !arena) {
    return (
      <div className="p-8">
        <TableRowsSkeleton rows={10} />
      </div>
    );
  }

  if (!arena) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Warning size={48} className="text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Arena Not Found</h2>
        <p className="text-gray-500 mt-2">The arena you're looking for doesn't exist or has been deleted.</p>
        <button 
          onClick={() => router.push("/dashboard/arenas")}
          className="mt-6 px-4 py-2 bg-[#8a9e60] text-white rounded-lg font-semibold"
        >
          Back to Arenas
        </button>
      </div>
    );
  }

  const sc = STATUS_CONFIG[arena.status] || STATUS_CONFIG.pending;
  const kycConfig = KYC_STATUS_CONFIG[arena.kycStatus] || KYC_STATUS_CONFIG.not_started;

  return (
    <div className="min-h-screen bg-[#fbfcfa]">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/dashboard/arenas")}
              className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-500"
            >
              <CaretLeft size={20} weight="bold" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-xl font-bold text-gray-900">{arena.name}</h1>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${sc.bg} ${sc.text}`}>
                  {sc.label}
                </span>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Buildings size={12} />
                {arena.vendor?.businessName || "Unknown Vendor"} · {arena.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Edit Arena
            </button>
            <button className="px-4 py-2 bg-[#8a9e60] text-white rounded-lg text-sm font-semibold hover:bg-[#7a8d50] transition-colors shadow-sm">
              Actions
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column: Main Content */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-gray-100">
              {(["overview", "turfs", "schedule"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-6 py-3 text-sm font-bold capitalize transition-all relative ${
                    activeTab === t ? "text-[#8a9e60]" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {t}
                  {activeTab === t && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8a9e60] rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {activeTab === "overview" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Turfs</p>
                    <p className="text-3xl font-black text-gray-900">{arena.turfCount}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">KYC Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${kycConfig.bg}`}>
                        {kycConfig.label}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Average Rating</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <p className="text-3xl font-black text-gray-900">{arena.rating?.avgScore || "0.0"}</p>
                      <p className="text-xs text-gray-400 font-medium">({arena.rating?.totalReviews || 0} reviews)</p>
                    </div>
                  </div>
                </div>

                {/* Details Sections */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <MapPin size={18} className="text-[#8a9e60]" />
                      Location & Address
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Full Address</p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {arena.address.houseNumber}, {arena.address.landmark && `${arena.address.landmark}, `}
                          {arena.address.city}, {arena.address.state} - {arena.address.pinCode}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Clock size={18} className="text-[#8a9e60]" />
                      Operational Hours
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                        <span className="text-sm font-medium text-gray-500">Weekdays</span>
                        <span className="text-sm font-bold text-gray-900">
                          {arena.weekdayOpen.slice(0, 5)} - {arena.weekdayClose.slice(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Weekends</span>
                        <span className="text-sm font-bold text-gray-900">
                          {arena.weekendOpen.slice(0, 5)} - {arena.weekendClose.slice(0, 5)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-6">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {arena.amenities.map((item) => (
                      <span key={item} className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-semibold text-gray-600 border border-gray-100">
                        {item.replace(/_/g, " ")}
                      </span>
                    ))}
                    {arena.amenities.length === 0 && (
                      <p className="text-xs text-gray-400 italic">No amenities listed</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "turfs" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Turfs ({turfs.length})</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#8a9e60] text-white rounded-xl text-xs font-bold hover:bg-[#7a8d50] transition-all shadow-sm">
                    <Plus size={16} weight="bold" />
                    Onboard Turf
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Turf Name</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sport</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type / Capacity</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {turfs.map((turf) => {
                        const tsc = STATUS_CONFIG[turf.status] || STATUS_CONFIG.pending;
                        return (
                          <tr key={turf.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-gray-900">{turf.name}</p>
                              <p className="text-[10px] text-gray-400 font-medium font-mono mt-0.5">{turf.id}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider">
                                {turf.sport.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs font-semibold text-gray-600">{turf.sizeFormat || "N/A"}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{turf.capacity} Max Capacity</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                <tsc.icon size={14} className={tsc.text} />
                                <span className={`text-[11px] font-bold ${tsc.text}`}>{tsc.label}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-900">
                              ₹{(turf.standardPricePaise / 100).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTurfClick(turf);
                                  }}
                                >
                                  <PencilSimple size={16} />
                                </button>
                                <button className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
                                  <Trash size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {turfs.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <Buildings size={32} className="text-gray-200" />
                              <p className="text-sm font-medium text-gray-500">No turfs found for this arena</p>
                              <button className="text-xs font-bold text-[#8a9e60] mt-1">Onboard the first turf</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            {/* KYC Documents */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#8a9e60]" />
                KYC Documents
              </h3>
              <div className="space-y-4">
                {[
                  { id: "propertyDocument", label: "Property Document" },
                  { id: "municipalNoc", label: "Municipal NOC" },
                  { id: "liabilityInsurance", label: "Liability Insurance" },
                ].map((doc) => {
                  const hasDoc = !!arena.documents?.[doc.id];
                  return (
                    <div key={doc.id} className="p-4 rounded-xl border border-gray-50 bg-gray-50/30 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600">{doc.label}</span>
                      {hasDoc ? (
                        <button className="text-[10px] font-bold text-[#8a9e60] hover:underline uppercase tracking-wider">
                          View
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Missing</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <button className="w-full mt-6 py-3 border border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 hover:border-[#8a9e60] hover:text-[#8a9e60] transition-all">
                Update Documents
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-6">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors group">
                  <span className="text-xs font-semibold text-gray-600">Review KYC</span>
                  <CaretLeft size={16} className="text-gray-300 rotate-180" />
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors group">
                  <span className="text-xs font-semibold text-gray-600">View Vendor Profile</span>
                  <CaretLeft size={16} className="text-gray-300 rotate-180" />
                </button>
                <div className="pt-4 border-t border-gray-50">
                  <button className="w-full flex items-center gap-3 p-4 rounded-xl text-red-500 hover:bg-red-50 transition-colors font-bold text-xs uppercase tracking-wider">
                    <Prohibit size={18} />
                    Ban Arena
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Turf Edit Modal */}
      {editTurf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manage Turf Slots</h2>
                <p className="text-xs text-gray-500 mt-1">Configure pricing, overrides, and schedules for {editTurf.name}</p>
              </div>
              <button
                onClick={() => setEditTurf(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={24} weight="fill" className="text-gray-300" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {editSlotConfigLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-[#8a9e60] border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-xs font-medium text-gray-500">Loading slot configuration...</p>
                </div>
              ) : editSlotConfig ? (
                <SlotConfigEditor
                  config={editSlotConfig}
                  onChange={(cfg) => setEditSlotConfig(cfg)}
                />
              ) : (
                <div className="text-center py-20 text-gray-500">Failed to load configuration.</div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-white flex items-center justify-between">
              <button
                onClick={handleGenerateSlots}
                disabled={isGeneratingSlots || editSlotConfigLoading}
                className="px-6 py-3 rounded-xl text-sm font-bold text-[#8a9e60] bg-[#8a9e60]/10 hover:bg-[#8a9e60]/20 transition-all disabled:opacity-50"
              >
                {isGeneratingSlots ? "Generating..." : "Generate Next 30 Days"}
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEditTurf(null)}
                  className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSlotConfig}
                  disabled={isSavingSlots || editSlotConfigLoading}
                  className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#8a9e60] hover:bg-[#7a8d50] transition-all disabled:opacity-50"
                >
                  {isSavingSlots ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
