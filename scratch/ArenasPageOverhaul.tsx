"use client";

import { 
  MapPin, 
  MagnifyingGlass, 
  Plus, 
  DotsThreeVertical, 
  Buildings,
  Star,
  CaretDown,
  X,
  CircleNotch,
  ArrowLeft,
  CaretRight,
  CaretLeft,
  CheckCircle,
  ClockCountdown,
  ShieldCheck,
  UploadSimple,
  Trash,
  PencilSimple,
  Eye,
  Check,
  XCircle,
  Prohibit,
  WarningCircle,
  ChartLineUp,
  Ticket,
  CalendarBlank,
  Handshake,
  Info
} from "@phosphor-icons/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { 
  listArenas, 
  Arena, 
  ArenaStatus, 
  KycStatus,
  createArena, 
  ArenaTurfGeneration, 
  uploadArenaDocuments,
  updateArenaStatus,
  banArena,
  unbanArena,
  reviewArenaDocuments
} from "@/features/arenas";
import { listTurfs, Turf } from "@/features/turfs";
import { listVendors, Vendor, KycFileActions } from "@/features/vendors";
import { useToast } from "@/features/toast/toast-context";
import { TableRowsSkeleton } from "@/components/LoadingSkeleton";
import { DashboardPagination } from "@/components/DashboardPagination";
import Select from "@/components/Select";
import { useRouter } from "next/navigation";
import { performSequentialUploads } from "@/features/vendors/utils";

// --- Constants ---
const SPORTS_LIST = [
  "Football", "Cricket", "Tennis", "Badminton", "Basketball", "Hockey", "Volleyball",
  "Kabaddi", "Box Cricket", "Futsal", "Pickleball", "Throwball", "Netball", "Handball", "Dodgeball"
];

const FACILITIES_LIST = [
  "Parking", "Flood Lights", "Washrooms", "Changing Rooms", "Showers", "Drinking Water",
  "Cafeteria", "Equipment Rental", "First Aid", "WiFi", "CCTV", "Power Backup",
  "Locker Facility", "Seating Area", "Practice Nets", "Scoreboard", "Warm-up Area",
  "Music System", "Coaching", "Referee", "Covered Turf", "Indoor Facility",
  "Outdoor Facility", "Bibs Available", "Prayer Room"
];

const SURFACE_LIST = [
  "Natural Grass", "Artificial Turf", "Concrete", "Wooden", "Synthetic"
];

const STATES_LIST = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const ONBOARD_STEPS = [
  "Vendor Info",
  "Arena Details",
  "Location",
  "Hours & Config",
  "Amenities",
  "KYC Documents"
];

const STATUS_CONFIG: Record<ArenaStatus, { label: string; cls: string; dot: string }> = {
  active: { label: "Active", cls: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  inactive: { label: "Inactive", cls: "bg-gray-50 text-gray-500 border-gray-200", dot: "bg-gray-400" },
  maintenance: { label: "Maintenance", cls: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  suspended: { label: "Suspended", cls: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  banned: { label: "Banned", cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
};

const KYC_CONFIG: Record<KycStatus, { label: string; cls: string }> = {
  verified: { label: "Verified", cls: "text-green-600 bg-green-50" },
  pending: { label: "Pending", cls: "text-amber-600 bg-amber-50" },
  in_review: { label: "In Review", cls: "text-blue-600 bg-blue-50" },
  rejected: { label: "Rejected", cls: "text-red-600 bg-red-50" },
  not_started: { label: "Not Started", cls: "text-gray-400 bg-gray-50" },
};

const KYC_DOCS_ARENA = [
  { key: "propertyDocument", label: "Property Document", hint: "Ownership or Lease Agreement" },
  { key: "municipalNoc", label: "Municipal NOC", hint: "No Objection Certificate" },
  { key: "liabilityInsurance", label: "Liability Insurance", hint: "Active public liability insurance" },
  { key: "arenaPhotos", label: "Arena Photos", hint: "High-resolution facility images" },
] as const;

const INIT_FORM = {
  vendorId: "",
  name: "",
  turfs: [] as ArenaTurfGeneration[],
  address: {
    houseNumber: "",
    landmark: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",
    googleMapsLink: "",
  },
  cancellationWindowHrs: "24",
  weekdayFrom: "06:00",
  weekdayTo: "22:00",
  weekendFrom: "06:00",
  weekendTo: "23:00",
  facilities: [] as string[],
};

export default function ArenasPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  // Table & Filter State
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  
  // Selection & Detail View State
  const [selected, setSelected] = useState<Arena | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "turfs" | "analytics">("overview");
  const [nestedTurfs, setNestedTurfs] = useState<Turf[]>([]);
  const [nestedTurfsLoading, setNestedTurfsLoading] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  // Onboarding State
  const [showOnboard, setShowOnboard] = useState(false);
  const [onboardStep, setOnboardStep] = useState(1);
  const [formData, setFormData] = useState(INIT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<"idle" | "creating" | "uploading" | "finalizing" | "success">("idle");
  
  // Vendors for Step 1
  const [onboardVendors, setOnboardVendors] = useState<Vendor[]>([]);
  const [onboardVendorsLoading, setOnboardVendorsLoading] = useState(false);
  const [onboardVendorSearch, setOnboardVendorSearch] = useState("");

  // KYC Files
  const [onboardKycFiles, setOnboardKycFiles] = useState<Record<string, File | File[]>>({});
  const onboardingFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    totalTurfs: 0
  });

  const fetchArenas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listArenas({ page, limit: 10, search, status });
      const items = res.items || [];
      setArenas(items);
      setTotal(res.total || 0);

      // Simple stats from current list (ideally backend would provide overall stats)
      // But for now we just use what we have or do a separate call if needed.
      // Let's assume we want real stats, so we might need a stats endpoint later.
      if (page === 1 && search === "" && status === "all") {
        setStats({
          total: res.total || 0,
          active: items.filter(a => a.status === 'active').length, // This is just local, not accurate for overall
          pending: items.filter(a => a.status === 'pending').length,
          totalTurfs: items.reduce((sum, a) => sum + (a.turfCount || 0), 0)
        });
      }
    } catch (err: any) {
      showToast({ title: "Error", description: err.message, tone: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, search, status, showToast]);

  useEffect(() => { fetchArenas(); }, [fetchArenas]);

  // Load nested turfs when arena is selected
  useEffect(() => {
    if (selected && detailTab === "turfs") {
      (async () => {
        setNestedTurfsLoading(true);
        try {
          const res = await listTurfs({ arenaId: selected.id, limit: 50 });
          setNestedTurfs(res.items || []);
        } catch (err) {
          console.error("Failed to load nested turfs", err);
        } finally {
          setNestedTurfsLoading(false);
        }
      })();
    }
  }, [selected, detailTab]);

  useEffect(() => {
    if (showOnboard && onboardStep === 1) {
      (async () => {
        setOnboardVendorsLoading(true);
        try {
          const res = await listVendors({ 
            page: 1, 
            limit: 20, 
            search: onboardVendorSearch, 
            status: "active" 
          });
          setOnboardVendors(res.items);
        } catch (err) { /* ignore */ }
        finally { setOnboardVendorsLoading(false); }
      })();
    }
  }, [showOnboard, onboardStep, onboardVendorSearch]);

  // Handlers
  const setField = (field: string, val: any) => {
    setFormData(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => {
      const n = { ...prev };
      delete n[field];
      return n;
    });
  };

  const toggleArr = (field: "facilities", val: string) => {
    setFormData(prev => {
      const arr = [...(prev[field] as string[])];
      const idx = arr.indexOf(val);
      if (idx > -1) arr.splice(idx, 1);
      else arr.push(val);
      return { ...prev, [field]: arr };
    });
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    if (step === 1 && !formData.vendorId) newErrors.vendorId = "Vendor is required";
    if (step === 2) {
      if (!formData.name) newErrors.name = "Arena name is required";
      if (formData.turfs.length === 0) newErrors.turfs = "Add at least one turf group";
    }
    if (step === 3) {
      if (!formData.address.city) newErrors.city = "City is required";
      if (!formData.address.state) newErrors.state = "State is required";
      if (!formData.address.pinCode) newErrors.pinCode = "Pincode is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onOnboard = async () => {
    setIsSubmitting(true);
    setOnboardingStatus("creating");
    try {
      const payload = {
        vendorId: formData.vendorId,
        name: formData.name,
        address: formData.address,
        amenities: formData.facilities.map(f => f.toLowerCase().replace(/\s+/g, '_')),
        weekdayOpen: formData.weekdayFrom,
        weekdayClose: formData.weekdayTo,
        weekendOpen: formData.weekendFrom,
        weekendClose: formData.weekendTo,
        cancellationWindowHrs: parseInt(formData.cancellationWindowHrs),
        turfs: formData.turfs
      };

      const arena = await createArena(payload as any);
      const arenaId = arena.id;

      if (Object.keys(onboardKycFiles).length > 0) {
        setOnboardingStatus("uploading");
        try {
          const s3Paths = await performSequentialUploads(
            arenaId,
            onboardKycFiles,
            "arena"
          );

          setOnboardingStatus("finalizing");
          await uploadArenaDocuments(arenaId, {
            documents: {
              propertyDocument: s3Paths.propertyDocument as string,
              municipalNoc: s3Paths.municipalNoc as string,
              liabilityInsurance: s3Paths.liabilityInsurance as string,
              arenaPhotos: s3Paths.arenaPhotos as string[],
            }
          });
        } catch (uploadError) {
          console.error("KYC upload error:", uploadError);
          showToast({
            title: "Partial Success",
            description: "Arena created but document upload failed.",
            tone: "warning",
          });
        }
      }

      setOnboardingStatus("success");
      showToast({ title: "Arena Onboarded", description: "Venue created successfully", tone: "success" });
      setTimeout(() => {
        setShowOnboard(false);
        fetchArenas();
        setOnboardingStatus("idle");
      }, 1500);
    } catch (err: any) {
      showToast({ title: "Failed", description: err.message, tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: ArenaStatus) => {
    if (!selected) return;
    try {
      await updateArenaStatus(selected.id, newStatus);
      showToast({ title: "Status Updated", description: `Arena is now ${newStatus}`, tone: "success" });
      fetchArenas();
      setSelected(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (err: any) {
      showToast({ title: "Update Failed", description: err.message, tone: "error" });
    } finally {
      setStatusOpen(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Arenas Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage venues, nested turfs, and operational configurations</p>
        </div>
        <button 
          onClick={() => { setFormData(INIT_FORM); setOnboardStep(1); setShowOnboard(true); }}
          className="flex items-center gap-2.5 px-5 py-2.5 bg-[#8a9e60] text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-[#8a9e60]/20"
        >
          <Plus weight="bold" size={18} />
          <span>Onboard New Arena</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Arenas", value: stats.total, icon: Buildings, color: "text-[#8a9e60]", bg: "bg-[#8a9e60]/10" },
          { label: "Active Venues", value: stats.active, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
          { label: "Pending KYC", value: stats.pending, icon: ClockCountdown, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Nested Turfs", value: stats.totalTurfs, icon: Ticket, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
              <stat.icon size={24} weight="duotone" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{stat.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 relative min-w-[300px]">
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search venues by name or vendor..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8a9e60]/20 focus:border-[#8a9e60] transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select 
            options={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active Only" },
              { value: "pending", label: "Pending KYC" },
              { value: "inactive", label: "Inactive" },
              { value: "banned", label: "Banned" },
            ]}
            value={status}
            onChange={setStatus}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-5">Venue Info</th>
                <th className="px-6 py-5">Location</th>
                <th className="px-6 py-5">Owner / Vendor</th>
                <th className="px-6 py-5 text-center">Turfs</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <TableRowsSkeleton cols={6} rows={5} />
              ) : (arenas || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <Buildings size={48} weight="thin" />
                      <p className="text-sm font-medium italic">No arenas found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                (arenas || []).map((arena) => (
                  <tr 
                    key={arena.id} 
                    onClick={() => setSelected(arena)}
                    className="hover:bg-gray-50/80 transition-all cursor-pointer group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#8a9e60]/10 flex items-center justify-center text-[#8a9e60] shrink-0 border border-[#8a9e60]/20 shadow-sm group-hover:scale-105 transition-transform">
                          <Buildings size={24} weight="duotone" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 group-hover:text-[#8a9e60] transition-colors">{arena.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase tracking-tighter">ID: {arena.id.split('-')[0]}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={16} className="text-gray-300 shrink-0" />
                        <p className="text-xs font-medium truncate max-w-[180px]">{arena.address.city}, {arena.address.state}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-bold text-gray-700">{arena.vendor?.businessName || "Direct Owner"}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          <p className="text-[10px] text-gray-400 font-medium uppercase">Premium Vendor</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-sm font-bold text-gray-900">{arena.turfCount || 0}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Sports Units</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border shadow-sm ${STATUS_CONFIG[arena.status]?.cls || ""}`}>
                        {arena.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelected(arena); }}
                          className="p-2.5 bg-white border border-gray-100 rounded-xl hover:bg-[#8a9e60]/10 hover:text-[#8a9e60] transition-all text-gray-400 shadow-sm"
                        >
                          <Eye size={18} weight="bold" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); }}
                          className="p-2.5 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-gray-400 shadow-sm"
                        >
                          <DotsThreeVertical size={18} weight="bold" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <DashboardPagination 
          page={page} 
          total={total}
          limit={10} 
          onPageChange={setPage} 
          label="arenas"
        />
      </div>

      {/* --- Detail Side Panel --- */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-300" onClick={() => setSelected(null)} />
          <div className="fixed inset-y-0 right-0 w-[450px] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out border-l border-gray-100">
            {/* Panel Header */}
            <div className="px-6 py-6 border-b border-gray-50 bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelected(null)} className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-all">
                    <ArrowLeft size={20} weight="bold" />
                  </button>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Venue Profile</p>
                    <h2 className="text-lg font-bold text-gray-900 truncate pr-4">{selected.name}</h2>
                  </div>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setStatusOpen(!statusOpen)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-2 ${STATUS_CONFIG[selected.status]?.cls}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selected.status]?.dot}`} />
                    {selected.status.toUpperCase()}
                    <CaretDown size={10} weight="bold" />
                  </button>
                  {statusOpen && (
                    <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                      {Object.keys(STATUS_CONFIG).map((s) => (
                        <button 
                          key={s}
                          onClick={() => handleStatusChange(s as ArenaStatus)}
                          className="w-full px-4 py-2 text-left text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2.5"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[s as ArenaStatus].dot}`} />
                          {s.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Detail Tabs */}
              <div className="flex items-center gap-1">
                {[
                  { id: "overview", label: "Overview", icon: Buildings },
                  { id: "turfs", label: "Nested Turfs", icon: Ticket },
                  { id: "analytics", label: "Analytics", icon: ChartLineUp },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setDetailTab(t.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      detailTab === t.id ? "bg-[#8a9e60] text-white shadow-lg shadow-[#8a9e60]/20" : "text-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    <t.icon size={16} weight={detailTab === t.id ? "fill" : "bold"} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
              {detailTab === "overview" && (
                <div className="space-y-6">
                  {/* Rating & KYC Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Venue Rating</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">{selected.rating?.avgScore || "0.0"}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} size={14} weight="fill" className={i <= Math.round(selected.rating?.avgScore || 0) ? "text-amber-400" : "text-gray-100"} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">KYC Status</p>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${KYC_CONFIG[selected.kycStatus || 'pending'].cls}`}>
                        {selected.kycStatus || 'pending'}
                      </span>
                    </div>
                  </div>

                  {/* Location Card */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Location Details</h4>
                      <MapPin size={18} className="text-[#8a9e60]" weight="duotone" />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Address</p>
                        <p className="text-sm text-gray-700 leading-relaxed font-medium">
                          {selected.address.houseNumber}, {selected.address.landmark}, {selected.address.city}, {selected.address.state} - {selected.address.pinCode}
                        </p>
                      </div>
                      {selected.address.googleMapsLink && (
                        <a 
                          href={selected.address.googleMapsLink} 
                          target="_blank" 
                          className="flex items-center gap-2 text-[#8a9e60] text-xs font-bold hover:underline bg-[#8a9e60]/5 p-2.5 rounded-xl border border-[#8a9e60]/10"
                        >
                          <MapPin weight="fill" />
                          View on Google Maps
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Operational Hours */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">Operational Hours</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <CalendarBlank size={18} className="text-gray-400" />
                          <span className="text-xs font-bold text-gray-600">Weekdays</span>
                        </div>
                        <span className="text-xs font-bold text-gray-900">{selected.weekdayOpen} - {selected.weekdayClose}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <CalendarBlank size={18} className="text-gray-400" />
                          <span className="text-xs font-bold text-gray-600">Weekends</span>
                        </div>
                        <span className="text-xs font-bold text-gray-900">{selected.weekendOpen} - {selected.weekendClose}</span>
                      </div>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {selected.amenities.map(a => (
                        <span key={a} className="px-2.5 py-1.5 rounded-xl bg-gray-50 text-gray-600 text-[10px] font-bold border border-gray-100 capitalize">
                          {a.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {detailTab === "turfs" && (
                <div className="space-y-4">
                  {nestedTurfsLoading ? (
                    <div className="flex flex-col gap-3">
                      {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl" />)}
                    </div>
                  ) : nestedTurfs.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                      <Ticket size={40} weight="thin" className="mx-auto text-gray-200 mb-2" />
                      <p className="text-sm text-gray-400 font-medium italic">No turfs found in this arena</p>
                    </div>
                  ) : (
                    nestedTurfs.map(turf => (
                      <div 
                        key={turf.id}
                        className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-[#8a9e60]/30 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#8a9e60]/10 flex items-center justify-center text-[#8a9e60] font-bold text-sm">
                              {turf.name[0]}
                            </div>
                            <div>
                              <h5 className="text-sm font-bold text-gray-900 group-hover:text-[#8a9e60] transition-colors">{turf.name}</h5>
                              <p className="text-[10px] text-gray-400 uppercase font-bold">{turf.sport.replace(/_/g, ' ')}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${
                            turf.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {turf.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Base Price</p>
                              <p className="text-xs font-bold text-gray-900">₹{(turf.standardPricePaise/100).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Rating</p>
                              <p className="text-xs font-bold text-gray-900 flex items-center gap-1">
                                {turf.rating?.toFixed(1) || "0.0"}
                                <Star size={10} weight="fill" className="text-amber-400" />
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => router.push(`/dashboard/turfs?id=${turf.id}`)}
                            className="text-[10px] font-bold text-[#8a9e60] hover:underline"
                          >
                            GO TO TURF
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {detailTab === "analytics" && (
                <div className="space-y-6">
                  <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center">
                    <ChartLineUp size={48} weight="thin" className="mx-auto text-gray-200 mb-4" />
                    <h5 className="text-sm font-bold text-gray-800 mb-2">Analytics Coming Soon</h5>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-[200px] mx-auto">
                      We're currently aggregating booking and revenue data for this venue.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Panel Footer */}
            <div className="p-6 border-t border-gray-100 bg-white">
              <div className="flex gap-3">
                <button 
                  className="flex-1 py-3 bg-[#8a9e60] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#8a9e60]/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <PencilSimple size={16} weight="bold" />
                  Edit Arena Info
                </button>
                <button 
                  onClick={() => setSelected(null)}
                  className="px-6 py-3 bg-gray-50 text-gray-500 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all border border-gray-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- Onboard Modal --- */}
      {showOnboard && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-8 pt-7 pb-5 border-b border-gray-100 shrink-0">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 leading-none">Onboard Venue (Arena)</h2>
                  <p className="text-sm text-gray-400 mt-2 font-medium">
                    Step {onboardStep} of {ONBOARD_STEPS.length} — {ONBOARD_STEPS[onboardStep - 1]}
                  </p>
                </div>
                <button onClick={() => setShowOnboard(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                  <X size={24} />
                </button>
              </div>
              {/* Stepper */}
              <div className="flex items-center gap-1">
                {ONBOARD_STEPS.map((label, i) => {
                  const n = i + 1;
                  const done = n < onboardStep;
                  const active = n === onboardStep;
                  return (
                    <div key={n} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <div 
                          className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all shadow-sm ${
                            done || active ? "bg-[#8a9e60] text-white" : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {done ? <Check weight="bold" size={14} /> : n}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-tight ${active ? "text-[#8a9e60]" : "text-gray-400"}`}>
                          {label.split(' ')[0]}
                        </span>
                      </div>
                      {i < ONBOARD_STEPS.length - 1 && (
                        <div className={`flex-1 h-[2px] mb-6 mx-2 transition-all ${done ? "bg-[#8a9e60]" : "bg-gray-100"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50/30 custom-scrollbar">
              {onboardStep === 1 && (
                <div className="space-y-6">
                  <div className="bg-[#8a9e60]/5 border border-[#8a9e60]/10 rounded-xl p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#8a9e60]/10 flex items-center justify-center text-[#8a9e60] shrink-0">
                      <Handshake size={20} weight="fill" />
                    </div>
                    <p className="text-sm text-[#8a9e60]/80 font-medium leading-relaxed">
                      Select the vendor who owns this venue. An Arena acts as a container for multiple sports units (Turfs).
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Select Vendor *</label>
                    <Select
                      value={formData.vendorId}
                      onChange={(val) => setField("vendorId", val)}
                      options={[
                        { value: "", label: "Search and select a vendor..." },
                        ...onboardVendors.map(v => ({ value: v.id, label: v.businessName }))
                      ]}
                      searchable
                      loading={onboardVendorsLoading}
                      onSearchChange={setOnboardVendorSearch}
                      className={`w-full ${errors.vendorId ? "border-red-400" : "border-gray-200"}`}
                    />
                    {errors.vendorId && <p className="text-[10px] text-red-500 font-bold mt-1.5 px-1">{errors.vendorId}</p>}
                  </div>
                </div>
              )}

              {onboardStep === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Arena Name *</label>
                    <input 
                      value={formData.name}
                      onChange={(e) => setField("name", e.target.value)}
                      className={`w-full border ${errors.name ? "border-red-400" : "border-gray-200"} rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8a9e60]/20 focus:border-[#8a9e60] transition-all outline-none shadow-sm`}
                      placeholder="e.g. Dream Sports Complex, Mumbai"
                    />
                    {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1.5">{errors.name}</p>}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Initial Turfs Config *</label>
                      <button 
                        onClick={() => setFormData(prev => ({ ...prev, turfs: [...prev.turfs, { sport: "Football", count: 1, surfaceType: "artificial_turf", standardPricePaise: 80000, capacity: 14, sizeFormat: "5-a-side" }] }))}
                        className="text-[10px] font-bold text-[#8a9e60] hover:underline flex items-center gap-1"
                      >
                        <Plus size={12} weight="bold" /> ADD SPORT GROUP
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {formData.turfs.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-100 rounded-2xl p-8 text-center bg-white/50">
                          <p className="text-sm text-gray-400 font-medium mb-3">No turfs added yet</p>
                          <button 
                            onClick={() => setFormData(prev => ({ ...prev, turfs: [...prev.turfs, { sport: "Football", count: 1, surfaceType: "artificial_turf", standardPricePaise: 80000, capacity: 14, sizeFormat: "5-a-side" }] }))}
                            className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                          >
                            + Click to add your first turf
                          </button>
                        </div>
                      ) : (
                        formData.turfs.map((t, idx) => (
                          <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 relative group/card">
                            <button 
                              onClick={() => setFormData(prev => ({ ...prev, turfs: prev.turfs.filter((_, i) => i !== idx) }))}
                              className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash size={16} />
                            </button>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1.5 block">Sport</label>
                                <Select 
                                  options={SPORTS_LIST.map(s => ({ value: s, label: s }))}
                                  value={t.sport}
                                  onChange={(v) => {
                                    const next = [...formData.turfs];
                                    next[idx].sport = v;
                                    setFormData(p => ({ ...p, turfs: next }));
                                  }}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1.5 block">Surface Type</label>
                                <Select 
                                  options={SURFACE_LIST.map(s => ({ value: s.toLowerCase().replace(/\s+/g, '_'), label: s }))}
                                  value={t.surfaceType}
                                  onChange={(v) => {
                                    const next = [...formData.turfs];
                                    next[idx].surfaceType = v;
                                    setFormData(p => ({ ...p, turfs: next }));
                                  }}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1.5 block">Count</label>
                                <input 
                                  type="number"
                                  min="1"
                                  value={t.count}
                                  onChange={(e) => {
                                    const next = [...formData.turfs];
                                    next[idx].count = parseInt(e.target.value) || 1;
                                    setFormData(p => ({ ...p, turfs: next }));
                                  }}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#8a9e60] outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1.5 block">Standard Price (₹)</label>
                                <input 
                                  type="number"
                                  value={t.standardPricePaise / 100}
                                  onChange={(e) => {
                                    const next = [...formData.turfs];
                                    next[idx].standardPricePaise = (parseInt(e.target.value) || 0) * 100;
                                    setFormData(p => ({ ...p, turfs: next }));
                                  }}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#8a9e60] outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1.5 block">Size / Format</label>
                                <input 
                                  value={t.sizeFormat}
                                  onChange={(e) => {
                                    const next = [...formData.turfs];
                                    next[idx].sizeFormat = e.target.value;
                                    setFormData(p => ({ ...p, turfs: next }));
                                  }}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#8a9e60] outline-none"
                                  placeholder="e.g. 5-a-side"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {errors.turfs && <p className="text-[10px] text-red-500 font-bold mt-2">{errors.turfs}</p>}
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 3 && (
                <div className="space-y-4 animate-in slide-in-from-right-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Street Address / House No *</label>
                      <input 
                        value={formData.address.houseNumber}
                        onChange={(e) => setFormData(p => ({ ...p, address: { ...p.address, houseNumber: e.target.value }}))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#8a9e60] outline-none shadow-sm"
                        placeholder="Suite 402, Building A"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">City *</label>
                      <input 
                        value={formData.address.city}
                        onChange={(e) => setFormData(p => ({ ...p, address: { ...p.address, city: e.target.value }}))}
                        className={`w-full border ${errors.city ? "border-red-400" : "border-gray-200"} rounded-xl px-4 py-3 text-sm focus:border-[#8a9e60] outline-none`}
                        placeholder="Mumbai"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">State *</label>
                      <Select 
                        options={STATES_LIST.map(s => ({ value: s, label: s }))}
                        value={formData.address.state}
                        onChange={(v) => setFormData(p => ({ ...p, address: { ...p.address, state: v }}))}
                        searchable
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Pincode *</label>
                      <input 
                        value={formData.address.pinCode}
                        onChange={(e) => setFormData(p => ({ ...p, address: { ...p.address, pinCode: e.target.value }}))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#8a9e60] outline-none"
                        maxLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Landmark</label>
                      <input 
                        value={formData.address.landmark}
                        onChange={(e) => setFormData(p => ({ ...p, address: { ...p.address, landmark: e.target.value }}))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#8a9e60] outline-none"
                        placeholder="Near Metro Station"
                      />
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 4 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Operational Hours</label>
                      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Weekdays</p>
                          <div className="flex items-center gap-2">
                            <input type="time" value={formData.weekdayFrom} onChange={e => setField("weekdayFrom", e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#8a9e60] outline-none" />
                            <span className="text-gray-400 text-xs">to</span>
                            <input type="time" value={formData.weekdayTo} onChange={e => setField("weekdayTo", e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#8a9e60] outline-none" />
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Weekends</p>
                          <div className="flex items-center gap-2">
                            <input type="time" value={formData.weekendFrom} onChange={e => setField("weekendFrom", e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#8a9e60] outline-none" />
                            <span className="text-gray-400 text-xs">to</span>
                            <input type="time" value={formData.weekendTo} onChange={e => setField("weekendTo", e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#8a9e60] outline-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Policies</label>
                      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Cancellation Window (Hrs)</label>
                        <input 
                          type="number"
                          value={formData.cancellationWindowHrs}
                          onChange={e => setField("cancellationWindowHrs", e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-[#8a9e60] outline-none"
                        />
                        <p className="text-[9px] text-gray-400 mt-2 italic font-medium">Refunds allowed only if cancelled before this window.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 5 && (
                <div className="space-y-4">
                  <div className="bg-gray-100/50 rounded-2xl p-6 border border-gray-100">
                    <p className="text-sm font-bold text-gray-700 mb-6 flex items-center gap-2">
                      <Star size={18} weight="fill" className="text-amber-400" />
                      Select Amenities available at this Arena
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {FACILITIES_LIST.map(f => {
                        const sel = formData.facilities.includes(f);
                        return (
                          <button 
                            key={f}
                            onClick={() => toggleArr("facilities", f)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm ${
                              sel ? "bg-[#8a9e60] text-white border-transparent scale-105" : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
                            }`}
                          >
                            {f}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 6 && (
                <div className="space-y-6">
                  <div className="bg-[#8a9e60]/5 border border-[#8a9e60]/20 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                    <ShieldCheck size={28} className="text-[#8a9e60] shrink-0" weight="fill" />
                    <div>
                      <p className="text-sm text-[#8a9e60] font-bold uppercase tracking-wider">Verification Documents</p>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        Arena-level documents for safety, ownership, and facility compliance.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {KYC_DOCS_ARENA.map((doc) => {
                      const files = onboardKycFiles[doc.key];
                      const hasFiles = Array.isArray(files) ? files.length > 0 : !!files;
                      const isPhotoField = doc.key === "arenaPhotos";

                      return (
                        <div key={doc.key} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{doc.label}</label>
                            {isPhotoField && Array.isArray(files) && (
                              <span className="text-[10px] font-bold text-[#8a9e60] bg-[#8a9e60]/10 px-1.5 py-0.5 rounded">{files.length}/5</span>
                            )}
                          </div>

                          {hasFiles && (
                            <div className="space-y-1.5">
                              {(Array.isArray(files) ? files : [files]).map((f, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100 group/item">
                                  <span className="text-[10px] text-gray-600 font-bold truncate max-w-[150px]">{f.name}</span>
                                  <KycFileActions 
                                    file={f} 
                                    showBadge={false} 
                                    onRemove={() => {
                                      setOnboardKycFiles(prev => {
                                        const next = { ...prev };
                                        if (Array.isArray(next[doc.key])) {
                                          const arr = (next[doc.key] as File[]).filter((_, idx) => idx !== i);
                                          if (arr.length === 0) delete next[doc.key]; else next[doc.key] = arr;
                                        } else delete next[doc.key];
                                        return next;
                                      });
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {(!hasFiles || (isPhotoField && Array.isArray(files) && files.length < 5)) && (
                            <button 
                              onClick={() => { setUploadingDocKey(doc.key); onboardingFileInputRef.current?.click(); }}
                              className="w-full py-4 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30 flex flex-col items-center justify-center gap-1 hover:border-[#8a9e60] hover:bg-white transition-all group"
                            >
                              <UploadSimple size={20} className="text-gray-300 group-hover:text-[#8a9e60]" />
                              <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-600">
                                {isPhotoField ? "Add Photo" : "Upload File"}
                              </span>
                            </button>
                          )}
                          <p className="text-[9px] text-gray-400 italic font-medium leading-tight">{doc.hint}</p>
                        </div>
                      );
                    })}
                  </div>
                  <input 
                    type="file"
                    ref={onboardingFileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      if (!e.target.files || !uploadingDocKey) return;
                      const files = Array.from(e.target.files);
                      if (uploadingDocKey === "arenaPhotos") {
                        setOnboardKycFiles(prev => {
                          const existing = (prev[uploadingDocKey] as File[]) || [];
                          return { ...prev, [uploadingDocKey]: [...existing, ...files].slice(0, 5) };
                        });
                      } else {
                        setOnboardKycFiles(prev => ({ ...prev, [uploadingDocKey]: files[0] }));
                      }
                      setUploadingDocKey(null);
                    }}
                    multiple={uploadingDocKey === "arenaPhotos"}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <button 
                onClick={() => setOnboardStep(s => Math.max(1, s - 1))}
                className={`flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors ${onboardStep === 1 ? "invisible" : ""}`}
              >
                <CaretLeft size={16} weight="bold" />
                Previous Step
              </button>
              <div className="flex items-center gap-4">
                <button onClick={() => setShowOnboard(false)} className="text-xs font-bold text-gray-400 hover:text-gray-600">Cancel</button>
                <button 
                  onClick={() => {
                    if (onboardStep < 6) {
                      if (validateStep(onboardStep)) setOnboardStep(s => s + 1);
                    } else {
                      onOnboard();
                    }
                  }}
                  className="flex items-center gap-2 px-8 py-2.5 bg-[#8a9e60] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#8a9e60]/20 hover:opacity-90 transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircleNotch className="animate-spin" size={16} /> : (onboardStep === 6 ? "Finish Onboarding" : "Next Step")}
                  {onboardStep < 6 && <CaretRight size={16} weight="bold" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
