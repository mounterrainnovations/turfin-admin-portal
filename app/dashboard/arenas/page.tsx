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
  CheckCircle,
  ClockCountdown,
  ShieldCheck,
  UploadSimple,
  Trash,
  PencilSimple,
  Eye,
  Check
} from "@phosphor-icons/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { listArenas, Arena, ArenaStatus, createArena, ArenaTurfGeneration, uploadArenaDocuments } from "@/features/arenas";
import { listVendors, Vendor, KycFileActions } from "@/features/vendors";
import { useToast } from "@/features/toast/toast-context";
import { TableRowsSkeleton } from "@/components/LoadingSkeleton";
import { DashboardPagination } from "@/components/DashboardPagination";
import Select from "@/components/Select";
import { useRouter } from "next/navigation";
import { performSequentialUploads } from "@/features/vendors/utils";

// --- Constants (Mirrored from legacy fields/page.tsx) ---
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
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

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
  const [onboardVendorSearchBy, setOnboardVendorSearchBy] = useState<"business_name" | "vendor_id">("business_name");

  // KYC Files
  const [onboardKycFiles, setOnboardKycFiles] = useState<Record<string, File | File[]>>({});
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);
  const onboardingFileInputRef = useRef<HTMLInputElement>(null);

  const fetchArenas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listArenas({ page, limit: 10, search, status });
      setArenas(res.items);
      setTotal(res.total);
    } catch (err: any) {
      showToast({ title: "Error", description: err.message, tone: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, search, status, showToast]);

  useEffect(() => { fetchArenas(); }, [fetchArenas]);

  useEffect(() => {
    if (showOnboard && onboardStep === 1) {
      (async () => {
        setOnboardVendorsLoading(true);
        try {
          const res = await listVendors({ 
            page: 1, 
            limit: 20, 
            search: onboardVendorSearch, 
            searchBy: onboardVendorSearchBy,
            status: "active" 
          });
          setOnboardVendors(res.items);
        } catch (err) { /* ignore */ }
        finally { setOnboardVendorsLoading(false); }
      })();
    }
  }, [showOnboard, onboardStep, onboardVendorSearch, onboardVendorSearchBy]);

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

  const addTurfGroup = () => {
    setFormData(prev => ({
      ...prev,
      turfs: [...prev.turfs, { 
        sport: "Football", 
        count: 1, 
        surfaceType: "artificial_turf", 
        standardPricePaise: 80000,
        capacity: 14,
        sizeFormat: "5-a-side"
      }]
    }));
  };

  const removeTurfGroup = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      turfs: prev.turfs.filter((_, i) => i !== idx)
    }));
  };

  const updateTurfGroup = (idx: number, updates: Partial<ArenaTurfGeneration>) => {
    setFormData(prev => ({
      ...prev,
      turfs: prev.turfs.map((t, i) => i === idx ? { ...t, ...updates } : t)
    }));
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

  const handleOnboardFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Arenas</h1>
          <p className="text-sm text-gray-500">Manage your venues and their nested turfs</p>
        </div>
        <button 
          onClick={() => { setFormData(INIT_FORM); setOnboardStep(1); setShowOnboard(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#8a9e60] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus weight="bold" /> Onboard New Arena
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-4 items-center">
        <div className="flex-1 relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search arenas by name..." 
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8a9e60]/20 focus:border-[#8a9e60]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select 
            options={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "pending", label: "Pending" },
              { value: "inactive", label: "Inactive" },
            ]}
            value={status}
            onChange={setStatus}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">Arena Info</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Vendor</th>
              <th className="px-6 py-4 text-center">Turfs</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <TableRowsSkeleton cols={6} rows={5} />
            ) : arenas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm italic">No arenas found</td>
              </tr>
            ) : (
              arenas.map((arena) => (
                <tr key={arena.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#8a9e60]/10 flex items-center justify-center text-[#8a9e60] shrink-0 border border-[#8a9e60]/20 shadow-sm">
                        <Buildings size={22} weight="duotone" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{arena.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono tracking-tighter">{arena.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <MapPin size={14} className="text-gray-400 shrink-0" />
                      <p className="text-sm truncate max-w-[200px]">{arena.address.city}, {arena.address.state}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-gray-700">{arena.vendor?.businessName || "N/A"}</p>
                      <p className="text-[10px] text-gray-400 font-mono uppercase">{arena.vendorId.split('-')[0]}...</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 min-w-[70px]">
                      {arena.turfCount || 0} Turfs
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      arena.status === "active" ? "bg-green-50 text-green-700 border-green-200" :
                      arena.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      arena.status === "inactive" ? "bg-gray-50 text-gray-700 border-gray-200" :
                      "bg-red-50 text-red-700 border-red-200"
                    }`}>
                      {arena.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => router.push(`/dashboard/arenas/${arena.id}`)}
                        className="p-2 hover:bg-[#8a9e60]/10 rounded-lg transition-colors text-gray-400 hover:text-[#8a9e60]"
                        title="Manage Arena"
                      >
                        <Eye size={18} weight="bold" />
                      </button>
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
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

      <div className="mt-6 flex justify-center">
        <DashboardPagination 
          page={page} 
          total={total}
          limit={10} 
          onPageChange={setPage} 
          label="arenas"
        />
      </div>

      {/* --- Onboard Modal --- */}
      {showOnboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-8 pt-7 pb-5 border-b border-gray-100 shrink-0">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 leading-none">Onboard Arena</h2>
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
            <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50/30">
              {onboardStep === 1 && (
                <div className="space-y-6">
                  <div className="bg-[#8a9e60]/5 border border-[#8a9e60]/10 rounded-xl p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#8a9e60]/10 flex items-center justify-center text-[#8a9e60] shrink-0">
                      <Buildings size={20} weight="fill" />
                    </div>
                    <p className="text-sm text-[#8a9e60]/80 font-medium leading-relaxed">
                      Select the vendor who owns this venue. A venue (Arena) can contain multiple sports turfs.
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
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Turfs Configuration *</label>
                      <button 
                        onClick={addTurfGroup}
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
                            onClick={addTurfGroup}
                            className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                          >
                            + Click to add your first turf
                          </button>
                        </div>
                      ) : (
                        formData.turfs.map((t, idx) => (
                          <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 relative group/card">
                            <button 
                              onClick={() => removeTurfGroup(idx)}
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
                                  onChange={(v) => updateTurfGroup(idx, { sport: v })}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1.5 block">Surface Type</label>
                                <Select 
                                  options={SURFACE_LIST.map(s => ({ value: s.toLowerCase().replace(/\s+/g, '_'), label: s }))}
                                  value={t.surfaceType}
                                  onChange={(v) => updateTurfGroup(idx, { surfaceType: v })}
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
                                  onChange={(e) => updateTurfGroup(idx, { count: parseInt(e.target.value) || 1 })}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#8a9e60] outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1.5 block">Standard Price (₹)</label>
                                <input 
                                  type="number"
                                  value={t.standardPricePaise / 100}
                                  onChange={(e) => updateTurfGroup(idx, { standardPricePaise: (parseInt(e.target.value) || 0) * 100 })}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#8a9e60] outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1.5 block">Size / Format</label>
                                <input 
                                  value={t.sizeFormat}
                                  onChange={(e) => updateTurfGroup(idx, { sizeFormat: e.target.value })}
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
                  <input type="file" ref={onboardingFileInputRef} onChange={handleOnboardFileSelect} className="hidden" multiple={uploadingDocKey === "arenaPhotos"} accept={uploadingDocKey === "arenaPhotos" ? "image/*" : ".pdf,image/*"} />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
              <button 
                onClick={() => onboardStep > 1 ? setOnboardStep(s => s - 1) : setShowOnboard(false)}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-gray-500 border border-gray-200 rounded-xl hover:bg-white transition-all bg-white disabled:opacity-50 shadow-sm"
              >
                <ArrowLeft size={16} weight="bold" /> {onboardStep === 1 ? "Cancel" : "Previous Step"}
              </button>
              <button 
                disabled={isSubmitting}
                onClick={async () => {
                  if (validateStep(onboardStep)) {
                    if (onboardStep < ONBOARD_STEPS.length) setOnboardStep(s => s + 1);
                    else await onOnboard();
                  }
                }}
                className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-md shadow-[#8a9e60]/20"
                style={{ backgroundColor: "#8a9e60" }}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <CircleNotch size={18} className="animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    <span>{onboardStep === ONBOARD_STEPS.length ? "Finalize & Submit" : "Continue to Next"}</span>
                    {onboardStep < ONBOARD_STEPS.length && <CaretRight size={16} weight="bold" />}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
