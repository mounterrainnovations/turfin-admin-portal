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
  ArrowsClockwise,
  XCircle,
  ShieldCheck,
  UploadSimple,
  Trash,
  PencilSimple,
  Eye,
  Check,
  ChartLineUp,
  Ticket,
  CalendarBlank,
  Handshake,
  FileText,
  FileArrowUp,
  CurrencyDollar,
  UserCircle,
  Envelope,
  WarningCircle,
  DotsThreeCircle,
  ArrowRight,
  MinusCircle,
  ArrowsIn,
  IdentificationCard,
  Notebook,
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
  updateArena,
  getArenaById,
  reviewArenaDocuments,
  ArenaKycUpload,
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
  "Football",
  "Cricket",
  "Tennis",
  "Badminton",
  "Basketball",
  "Hockey",
  "Volleyball",
  "Kabaddi",
  "Box Cricket",
  "Futsal",
  "Pickleball",
  "Throwball",
  "Netball",
  "Handball",
  "Dodgeball",
];

const FACILITIES_LIST = [
  "Parking",
  "Flood Lights",
  "Washrooms",
  "Changing Rooms",
  "Showers",
  "Drinking Water",
  "Cafeteria",
  "Equipment Rental",
  "First Aid",
  "WiFi",
  "CCTV",
  "Power Backup",
  "Locker Facility",
  "Seating Area",
  "Practice Nets",
  "Scoreboard",
  "Warm-up Area",
  "Music System",
  "Coaching",
  "Referee",
  "Covered Turf",
  "Indoor Facility",
  "Outdoor Facility",
  "Bibs Available",
  "Prayer Room",
];

const SURFACE_LIST = [
  "Natural Grass",
  "Artificial Turf",
  "Concrete",
  "Wooden",
  "Synthetic",
];

const STATES_LIST = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const ARENA_SEARCH_OPTIONS = [
  {
    value: "name",
    label: "Arena Name",
    placeholder: "Search by arena name",
  },
  {
    value: "city",
    label: "City",
    placeholder: "Search by city",
  },
  {
    value: "id",
    label: "Arena ID",
    placeholder: "Search by arena UUID",
  },
] as const;

const KYC_CONFIG: Record<KycStatus, { label: string; cls: string; icon: any }> =
  {
    not_started: {
      label: "Not Started",
      cls: "bg-gray-50 text-gray-400 border-gray-100 shadow-sm",
      icon: ClockCountdown,
    },
    pending: {
      label: "Pending",
      cls: "bg-amber-50 text-amber-700 border-amber-200 shadow-sm",
      icon: ClockCountdown,
    },
    in_review: {
      label: "In Review",
      cls: "bg-blue-50 text-blue-700 border-blue-200 shadow-sm",
      icon: ShieldCheck,
    },
    verified: {
      label: "Verified",
      cls: "bg-green-50 text-green-700 border-green-200 shadow-sm",
      icon: CheckCircle,
    },
    rejected: {
      label: "Rejected",
      cls: "bg-red-50 text-red-700 border-red-100 shadow-sm",
      icon: XCircle,
    },
  };

const ONBOARD_STEPS = [
  "Vendor Info",
  "Arena Details",
  "Location",

  "Amenities",
  "KYC Documents",
];

const STATUS_CONFIG: Record<
  ArenaStatus,
  { label: string; cls: string; dot: string }
> = {
  active: {
    label: "Active",
    cls: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  pending: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  inactive: {
    label: "Inactive",
    cls: "bg-gray-50 text-gray-500 border-gray-200",
    dot: "bg-gray-400",
  },
  maintenance: {
    label: "Maintenance",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  suspended: {
    label: "Suspended",
    cls: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  banned: {
    label: "Banned",
    cls: "bg-red-50 text-red-700 border-red-100",
    dot: "bg-red-500",
  },
};

const KYC_DOCS_ARENA = [
  {
    key: "propertyDocument",
    label: "Property Document",
    hint: "Ownership or Lease Agreement",
  },
  {
    key: "municipalNoc",
    label: "Municipal NOC",
    hint: "No Objection Certificate",
  },
  {
    key: "liabilityInsurance",
    label: "Liability Insurance",
    hint: "Active public liability insurance",
  },
  {
    key: "arenaPhotos",
    label: "Arena Photos",
    hint: "High-resolution facility images",
  },
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
  const [searchBy, setSearchBy] =
    useState<(typeof ARENA_SEARCH_OPTIONS)[number]["value"]>("name");
  const [timeFilter, setTimeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"all" | ArenaStatus>("all");

  const [actionMenu, setActionMenu] = useState<{
    arena: Arena;
    top: number;
    left: number;
  } | null>(null);

  const [statusOpen, setStatusOpen] = useState(false);

  // Selection & Detail View State
  const [selected, setSelected] = useState<Arena | null>(null);
  const [kycArena, setKycArena] = useState<Arena | null>(null);
  const [detailTab, setDetailTab] = useState<
    "overview" | "turfs" | "kyc" | "analytics"
  >("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingArena, setEditingArena] = useState<Arena | null>(null);
  const [nestedTurfs, setNestedTurfs] = useState<Turf[]>([]);
  const [nestedTurfsLoading, setNestedTurfsLoading] = useState(false);

  // Onboarding State
  const [showOnboard, setShowOnboard] = useState(false);
  const [onboardStep, setOnboardStep] = useState(1);
  const [formData, setFormData] = useState(INIT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<
    "idle" | "creating" | "uploading" | "finalizing" | "success"
  >("idle");

  // Vendors for Step 1
  const [onboardVendors, setOnboardVendors] = useState<Vendor[]>([]);
  const [onboardVendorsLoading, setOnboardVendorsLoading] = useState(false);
  const [onboardVendorSearch, setOnboardVendorSearch] = useState("");

  // KYC Files
  const [onboardKycFiles, setOnboardKycFiles] = useState<
    Record<string, File | File[]>
  >({});
  const [detailKycFiles, setDetailKycFiles] = useState<
    Record<string, File | File[]>
  >({});
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);
  const onboardingFileInputRef = useRef<HTMLInputElement>(null);
  const detailFileInputRef = useRef<HTMLInputElement>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    totalTurfs: 0,
  });

  const openActionMenu = useCallback((arena: Arena, trigger: HTMLElement) => {
    const rect = trigger.getBoundingClientRect();
    const menuWidth = 148;
    const menuItemCount = 3; // Edit, KYC, etc
    const menuHeight = menuItemCount * 34 + 8;
    const gap = 4;
    const viewportPadding = 12;

    const top =
      rect.bottom + gap + menuHeight > window.innerHeight - viewportPadding
        ? Math.max(viewportPadding, rect.top - gap - menuHeight)
        : rect.bottom + gap;
    const left = Math.min(
      Math.max(viewportPadding, rect.right - menuWidth),
      window.innerWidth - menuWidth - viewportPadding,
    );

    setActionMenu((current) =>
      current?.arena.id === arena.id ? null : { arena, top, left },
    );
  }, []);

  const closeActionMenu = () => setActionMenu(null);

  function avatar(name: string) {
    return name
      ? name
          .split(" ")
          .map((w) => w[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "??";
  }

  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchArenas = useCallback(async () => {
    setLoading(true);
    try {
      let startDate: string | undefined;
      let endDate: string | undefined;
      if (timeFilter !== "all") {
        const end = new Date();
        const start = new Date();
        if (timeFilter === "today") start.setHours(0, 0, 0, 0);
        else if (timeFilter === "last7") start.setDate(end.getDate() - 7);
        else if (timeFilter === "last30") start.setDate(end.getDate() - 30);
        startDate = start.toISOString();
        endDate = end.toISOString();
      }

      const res = await listArenas({
        page,
        limit: 10,
        search: debouncedSearch.trim() || undefined,
        searchBy,
        status: activeTab,
        startDate,
        endDate,
      });
      const items = res.items || [];
      setArenas(items);
      setTotal(res.total || 0);

      if (
        page === 1 &&
        debouncedSearch === "" &&
        activeTab === "all" &&
        timeFilter === "all"
      ) {
        setStats({
          total: res.total || 0,
          active: items.filter((a) => a.status === "active").length,
          pending: items.filter((a) => a.status === "pending").length,
          totalTurfs: items.reduce((sum, a) => sum + (a.turfCount || 0), 0),
        });
      }
    } catch (err: any) {
      showToast({ title: "Error", description: err.message, tone: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, searchBy, activeTab, timeFilter, showToast]);

  useEffect(() => {
    fetchArenas();
  }, [fetchArenas]);

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
            status: "active",
          });
          setOnboardVendors(res.items);
        } catch (err) {
          /* ignore */
        } finally {
          setOnboardVendorsLoading(false);
        }
      })();
    }
  }, [showOnboard, onboardStep, onboardVendorSearch]);

  // Handlers
  const setField = (field: string, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field])
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
  };

  const toggleArr = (field: "facilities", val: string) => {
    setFormData((prev) => {
      const arr = [...(prev[field] as string[])];
      const idx = arr.indexOf(val);
      if (idx > -1) arr.splice(idx, 1);
      else arr.push(val);
      return { ...prev, [field]: arr };
    });
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    if (step === 1 && !formData.vendorId)
      newErrors.vendorId = "Vendor is required";
    if (step === 2) {
      if (!formData.name) newErrors.name = "Arena name is required";
      if (formData.turfs.length === 0)
        newErrors.turfs = "Add at least one turf group";
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
        amenities: formData.facilities.map((f) =>
          f.toLowerCase().replace(/\s+/g, "_"),
        ),
        turfs: formData.turfs.map((t) => ({
          ...t,
          sport: t.sport.toLowerCase() as any,
        })),
      };

      const arena = await createArena(payload as any);
      const arenaId = arena.id;

      if (Object.keys(onboardKycFiles).length > 0) {
        setOnboardingStatus("uploading");
        try {
          const s3Paths = await performSequentialUploads(
            arenaId,
            onboardKycFiles,
            "arena",
          );

          setOnboardingStatus("finalizing");
          await uploadArenaDocuments(arenaId, {
            documents: {
              propertyDocument: s3Paths.propertyDocument as string,
              municipalNoc: s3Paths.municipalNoc as string,
              liabilityInsurance: s3Paths.liabilityInsurance as string,
              arenaPhotos: s3Paths.arenaPhotos as string[],
            },
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
      showToast({
        title: "Arena Onboarded",
        description: "Venue created successfully",
        tone: "success",
      });
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
      showToast({
        title: "Status Updated",
        description: `Arena is now ${newStatus}`,
        tone: "success",
      });
      fetchArenas();
      setSelected((prev) => (prev ? { ...prev, status: newStatus } : null));
    } catch (err: any) {
      showToast({
        title: "Update Failed",
        description: err.message,
        tone: "error",
      });
    } finally {
      setStatusOpen(false);
    }
  };

  const STAT_CARDS = [
    {
      label: "Total Arenas",
      value: stats.total,
      sub: "on platform",
      color: "#8a9e60",
      Icon: Buildings,
    },
    {
      label: "Active Today",
      value: stats.active,
      sub: "accepting bookings",
      color: "#22c55e",
      Icon: CheckCircle,
    },
    {
      label: "Inactive",
      value: stats.total - stats.active - stats.pending,
      sub: "not accepting",
      color: "#9ca3af",
      Icon: XCircle,
    },
    {
      label: "Pending Review",
      value: stats.pending,
      sub: "awaiting kyc",
      color: "#f59e0b",
      Icon: ClockCountdown,
    },
    {
      label: "Total Turfs",
      value: stats.totalTurfs,
      sub: "nested units",
      color: "#3b82f6",
      Icon: Ticket,
    },
  ];

  return (
    <div className="p-6 min-h-screen bg-[#fcfcfc]">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Arena Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage physical venues, locations, and verification status.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
          <ClockCountdown size={14} weight="bold" />
          Last synced:{" "}
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Arenas",
            value: String(stats.total),
            sub: "Registered venues",
            icon: Buildings,
            color: "#6366f1", // indigo-500
            bgColor: "#f5f3ff", // indigo-50
          },
          {
            label: "Active Arenas",
            value: String(stats.active),
            sub: `${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% of total`,
            icon: CheckCircle,
            color: "#15803d", // green-700
            bgColor: "#f0fdf4", // green-50
          },
          {
            label: "Pending KYC",
            value: String(stats.pending),
            sub: "Needs attention",
            icon: ShieldCheck,
            color: "#b45309", // amber-700
            bgColor: "#fffbeb", // amber-50
          },
          {
            label: "Total Turfs",
            value: String(stats.totalTurfs),
            sub: "Nested across venues",
            icon: Ticket,
            color: "#8a9e60",
            bgColor: "#f4f7ed",
          },
        ].map(({ label, value, sub, icon: Icon, color, bgColor }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 leading-tight">
                {label}
              </span>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: bgColor || color + "18" }}
              >
                <Icon size={16} weight="fill" style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Filter bar + Tabs ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <Select
              value={searchBy}
              onChange={(val) =>
                setSearchBy(
                  val as (typeof ARENA_SEARCH_OPTIONS)[number]["value"],
                )
              }
              options={[...ARENA_SEARCH_OPTIONS]}
              className="bg-transparent text-gray-700 text-xs font-medium outline-none min-w-[90px]"
              dropdownClassName="w-[180px] -left-2"
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-72">
            <MagnifyingGlass size={14} className="text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                ARENA_SEARCH_OPTIONS.find((option) => option.value === searchBy)
                  ?.placeholder ?? "Search arenas"
              }
              className="bg-transparent text-gray-700 placeholder-gray-400 text-xs flex-1 outline-none"
            />
          </div>

          {/* Time Filter */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <CalendarBlank size={14} className="text-gray-400 shrink-0" />
            <Select
              value={timeFilter}
              onChange={setTimeFilter}
              options={[
                { value: "all", label: "All Time" },
                { value: "today", label: "Today" },
                { value: "last7", label: "Last 7 Days" },
                { value: "last30", label: "Last 30 Days" },
              ]}
              className="bg-transparent text-gray-700 text-xs font-medium outline-none min-w-[80px]"
              dropdownClassName="w-[150px] -left-2"
            />
          </div>

          {/* Pending KYC badge */}
          {stats.pending > 0 && (
            <div className="ml-auto flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs font-semibold text-amber-700">
              <ShieldCheck size={13} weight="fill" />
              {stats.pending} arena{stats.pending > 1 ? "s" : ""} pending KYC
            </div>
          )}

          {/* Onboard Arena Button */}
          <button
            onClick={() => {
              setFormData(INIT_FORM);
              setOnboardStep(1);
              setShowOnboard(true);
            }}
            className={`${stats.pending > 0 ? "" : "ml-auto"} flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 shrink-0`}
            style={{ backgroundColor: "#8a9e60" }}
          >
            <Plus size={16} weight="bold" />
            Onboard Arena
          </button>
        </div>

        {/* Status tabs — pill style */}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {(["all", "active", "pending", "suspended", "banned"] as const).map(
            (tab) => {
              const count =
                tab === "all"
                  ? total
                  : arenas.filter((a) => (a.status as any) === tab).length;

              const isActive = activeTab === tab;
              const sc =
                tab === "all" ? null : STATUS_CONFIG[tab as ArenaStatus];

              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? tab === "all"
                        ? "bg-[#8a9e60] text-white"
                        : `${sc?.cls}`
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {tab === "all"
                    ? "All Arenas"
                    : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {isActive && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold animate-in fade-in zoom-in duration-200 ${
                        tab === "all" ? "bg-white/20 text-white" : "bg-black/5"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            },
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {[
                  "Arena",
                  "Vendor",
                  "Location",
                  "Turfs",
                  "Status",
                  "KYC",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <TableRowsSkeleton rows={10} cols={7} />
              ) : arenas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <Buildings size={48} weight="thin" />
                      <p className="text-sm font-medium italic">
                        No arenas found matching your criteria
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                arenas.map((a, i) => {
                  const kc = KYC_CONFIG[a.kycStatus];
                  const sc = STATUS_CONFIG[a.status];
                  const KycIcon = kc?.icon || WarningCircle;
                  return (
                    <tr
                      key={a.id}
                      onClick={() => {
                        closeActionMenu();
                        setSelected(a);
                      }}
                      className={`hover:bg-gray-50/50 transition-colors cursor-pointer group ${
                        selected?.id === a.id ? "bg-[#8a9e60]/5" : ""
                      }`}
                    >
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                            style={{ backgroundColor: "#8a9e60" }}
                          >
                            {avatar(a.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 group-hover:text-[#8a9e60] transition-colors truncate">
                              {a.name}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono tracking-tighter">
                              {a.id.split("-")[0]}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-gray-700 truncate max-w-[140px]">
                          {a.vendor?.businessName || "Direct Owner"}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate max-w-[140px]">
                          {a.vendor?.ownerFullName || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-700">
                          {a.address?.city || "—"}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {a.address?.state || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex flex-col items-center px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 min-w-[45px]">
                          <span className="text-xs font-bold text-gray-800">
                            {a.turfCount || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg border shadow-sm ${sc.cls}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                          />
                          {sc.label.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-lg border shadow-sm ${kc?.cls || "bg-gray-100"}`}
                        >
                          {KycIcon && <KycIcon size={12} weight="bold" />}
                          {kc?.label.toUpperCase() || a.kycStatus.toUpperCase()}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              closeActionMenu();
                              setSelected(a);
                            }}
                            className="p-1.5 rounded-lg border border-gray-100 bg-white text-gray-400 hover:text-[#8a9e60] hover:border-[#8a9e60]/30 transition-all shadow-sm"
                            title="View Details"
                          >
                            <Eye size={14} weight="bold" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              closeActionMenu();
                              setEditingArena(a);
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-gray-100 bg-white text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                            title="Edit"
                          >
                            <PencilSimple size={14} weight="bold" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openActionMenu(a, e.currentTarget);
                            }}
                            className="p-1.5 rounded-lg border border-gray-100 bg-white text-gray-400 hover:text-gray-900 transition-all shadow-sm"
                          >
                            <DotsThreeVertical size={14} weight="bold" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-50 bg-gray-50/30">
          <DashboardPagination
            page={page}
            total={total}
            limit={10}
            onPageChange={setPage}
            label="arenas"
          />
        </div>
      </div>

      {/* Action Menu Backdrop */}
      {actionMenu && (
        <div className="fixed inset-0 z-30" onClick={closeActionMenu} />
      )}

      {/* Action Menu */}
      {actionMenu && (
        <div
          className="fixed z-40 min-w-[160px] rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150"
          style={{ top: actionMenu.top, left: actionMenu.left }}
          onClick={(e) => e.stopPropagation()}
        >
          {actionMenu.arena.status === "banned" ? (
            <button
              onClick={async () => {
                closeActionMenu();
                try {
                  await updateArenaStatus(actionMenu.arena.id, "active");
                  showToast({
                    title: "Unbanned",
                    description: "Arena has been unbanned",
                    tone: "success",
                  });
                  fetchArenas();
                } catch (e: any) {
                  showToast({
                    title: "Error",
                    description: e.message,
                    tone: "error",
                  });
                }
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-green-600 hover:bg-green-50 transition-colors"
            >
              <CheckCircle size={15} weight="fill" />
              Activate Arena
            </button>
          ) : (
            <button
              onClick={async () => {
                closeActionMenu();
                try {
                  await updateArenaStatus(actionMenu.arena.id, "banned");
                  showToast({
                    title: "Banned",
                    description: "Arena has been banned",
                    tone: "warning",
                  });
                  fetchArenas();
                } catch (e: any) {
                  showToast({
                    title: "Error",
                    description: e.message,
                    tone: "error",
                  });
                }
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <MinusCircle size={15} weight="fill" />
              Ban Arena
            </button>
          )}
          <button
            onClick={() => {
              closeActionMenu();
              setKycArena(actionMenu.arena);
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <ShieldCheck size={15} weight="fill" />
            Review KYC
          </button>
          <div className="my-1 border-t border-gray-100" />
          <button
            onClick={() => {
              closeActionMenu();
              setEditingArena(actionMenu.arena);
              setIsEditModalOpen(true);
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <PencilSimple size={15} weight="bold" />
            Edit Facility
          </button>
        </div>
      )}

      {/* --- Detail Side Panel --- */}
      {selected && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-300"
            onClick={() => setSelected(null)}
          />
          <div className="fixed inset-y-0 right-0 w-[400px] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out border-l border-gray-100">
            {/* Panel Header */}
            <div
              className="px-6 py-8 border-b border-white/10 shrink-0 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #8a9e60, #6e8245)",
              }}
            >
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSelected(null)}
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md"
                    >
                      <ArrowLeft size={20} weight="bold" />
                    </button>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] mb-1">
                        Venue Profile
                      </p>
                      <h2 className="text-xl font-bold text-white truncate pr-4">
                        {selected.name}
                      </h2>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setStatusOpen(!statusOpen)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selected.status]?.dot}`}
                      />
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
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[s as ArenaStatus].dot}`}
                            />
                            {s.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Detail Tabs */}
                <div className="flex items-center gap-1 bg-black/10 p-1 rounded-2xl backdrop-blur-sm">
                  {[
                    { id: "overview", label: "Overview", icon: Buildings },
                    { id: "turfs", label: "Nested Turfs", icon: Ticket },
                    { id: "kyc", label: "KYC Docs", icon: ShieldCheck },
                    { id: "analytics", label: "Analytics", icon: ChartLineUp },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setDetailTab(t.id as any)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                        detailTab === t.id
                          ? "bg-white text-[#8a9e60] shadow-lg shadow-black/5"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <t.icon
                        size={16}
                        weight={detailTab === t.id ? "fill" : "bold"}
                      />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-32 h-32 bg-black/10 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {detailTab === "overview" && (
                <div className="space-y-6">
                  {selected.kycStatus !== "verified" && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-amber-100 flex items-center justify-center text-amber-500 shadow-sm">
                          <ShieldCheck size={20} weight="fill" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-amber-900">
                            Verification Required
                          </p>
                          <p className="text-[10px] text-amber-700 font-medium">
                            Please upload the required documents
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setDetailTab("kyc")}
                        className="px-4 py-2 bg-amber-600 text-white rounded-xl text-[10px] font-black shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-all active:scale-95"
                      >
                        Upload Docs
                      </button>
                    </div>
                  )}
                  {/* Rating & KYC Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-[#8a9e60]/20 transition-colors group">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 group-hover:text-gray-500 transition-colors">
                        Venue Rating
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">
                          {selected.rating?.avgScore || "0.0"}
                        </span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              size={14}
                              weight="fill"
                              className={
                                i <= Math.round(selected.rating?.avgScore || 0)
                                  ? "text-amber-400"
                                  : "text-gray-100"
                              }
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        KYC Status
                      </p>
                      <span
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${KYC_CONFIG[selected.kycStatus || "pending"].cls}`}
                      >
                        {selected.kycStatus || "pending"}
                      </span>
                    </div>
                  </div>

                  {/* Location Card */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Location Details
                      </h4>
                      <MapPin
                        size={18}
                        className="text-[#8a9e60]"
                        weight="duotone"
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                          Address
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed font-medium">
                          {selected.address.houseNumber},{" "}
                          {selected.address.landmark}, {selected.address.city},{" "}
                          {selected.address.state} - {selected.address.pinCode}
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

                  {/* Amenities */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">
                      Amenities
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selected.amenities.map((a) => (
                        <span
                          key={a}
                          className="px-2.5 py-1.5 rounded-xl bg-gray-50 text-gray-600 text-[10px] font-bold border border-gray-100 capitalize"
                        >
                          {a.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {detailTab === "turfs" && (
                <div className="space-y-3">
                  {nestedTurfsLoading ? (
                    <div className="flex flex-col gap-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-24 bg-gray-100/50 animate-pulse rounded-2xl border border-gray-100"
                        />
                      ))}
                    </div>
                  ) : nestedTurfs.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 border-dashed">
                      <Ticket
                        size={48}
                        weight="thin"
                        className="mx-auto text-gray-200 mb-3"
                      />
                      <p className="text-sm text-gray-400 font-medium">
                        No turfs found in this arena
                      </p>
                    </div>
                  ) : (
                    nestedTurfs.map((turf) => (
                      <div
                        key={turf.id}
                        onClick={() =>
                          router.push(`/dashboard/turfs?id=${turf.id}`)
                        }
                        className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-[#8a9e60]/50 hover:shadow-md transition-all group cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#8a9e60]/10 flex items-center justify-center text-[#8a9e60] font-bold text-sm group-hover:scale-110 transition-transform">
                              {turf.name[0]}
                            </div>
                            <div>
                              <h5 className="text-sm font-bold text-gray-900 group-hover:text-[#8a9e60] transition-colors">
                                {turf.name}
                              </h5>
                              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                                {turf.sport.replace(/_/g, " ")}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border uppercase tracking-wider ${
                              turf.status === "active"
                                ? "bg-green-50 text-green-600 border-green-100"
                                : "bg-amber-50 text-amber-600 border-amber-100"
                            }`}
                          >
                            {turf.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                          <div className="flex items-center gap-6">
                            <div>
                              <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 tracking-tighter">
                                Base Price
                              </p>
                              <p className="text-xs font-bold text-gray-900">
                                ₹
                                {(
                                  turf.standardPricePaise / 100
                                ).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 tracking-tighter">
                                Rating
                              </p>
                              <p className="text-xs font-bold text-gray-900 flex items-center gap-1">
                                {turf.rating?.toFixed(1) || "0.0"}
                                <Star
                                  size={10}
                                  weight="fill"
                                  className="text-amber-400"
                                />
                              </p>
                            </div>
                          </div>
                          <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover:text-[#8a9e60] group-hover:bg-[#8a9e60]/10 transition-all">
                            <CaretRight size={16} weight="bold" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {detailTab === "kyc" && selected && (
                <div className="space-y-6">
                  <div>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-widest mb-3 px-2 py-1 rounded-md inline-block ${STATUS_CONFIG[selected.status]?.cls || "bg-gray-50 text-gray-400"}`}
                    >
                      KYC Documents
                    </p>

                    <div className="space-y-2">
                      {KYC_DOCS_ARENA.map((doc) => {
                        const existing = !!selected.documents?.[doc.key];
                        const verification = (selected as any).verification?.[
                          doc.key
                        ];
                        const s =
                          verification === true
                            ? "verified"
                            : verification === false
                              ? "rejected"
                              : "pending";

                        return (
                          <div
                            key={doc.key}
                            className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5"
                          >
                            <div className="flex items-center gap-2">
                              <FileText size={13} className="text-gray-400" />
                              <span className="text-xs text-gray-700 font-medium">
                                {doc.label}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s === "verified" ? "bg-green-50 text-green-700" : s === "rejected" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-400"}`}
                            >
                              {s === "verified"
                                ? "Verified"
                                : s === "rejected"
                                  ? "Rejected"
                                  : existing
                                    ? "Uploaded"
                                    : "Pending"}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setKycArena(selected)}
                      className="w-full mt-4 py-2.5 bg-white border border-blue-200 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <ShieldCheck size={14} weight="bold" />
                      Review & Upload Documents
                    </button>
                  </div>
                </div>
              )}

              {detailTab === "analytics" && (
                <div className="space-y-4">
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center relative overflow-hidden group">
                    <div className="relative z-10">
                      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500">
                        <ChartLineUp
                          size={32}
                          weight="duotone"
                          className="text-[#8a9e60]"
                        />
                      </div>
                      <h5 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-widest">
                        Analytics Dashboard
                      </h5>
                      <p className="text-xs text-gray-400 leading-relaxed max-w-[220px] mx-auto font-medium">
                        Real-time revenue and booking occupancy trends will
                        appear here once live.
                      </p>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#8a9e60]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Bookings", value: "0", sub: "this month" },
                      { label: "Revenue", value: "₹0", sub: "this month" },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm opacity-50"
                      >
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                          {s.label}
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {s.value}
                        </p>
                        <p className="text-[9px] text-gray-400 font-medium">
                          {s.sub}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Panel Footer */}
            <div className="shrink-0 border-t border-gray-100 p-4 bg-gray-50/50">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingArena(selected);
                    setIsEditModalOpen(true);
                  }}
                  className="flex-1 py-2 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <PencilSimple size={13} />
                  Edit
                </button>
                <button
                  onClick={() => setKycArena(selected)}
                  className="flex-1 py-2 text-xs font-semibold border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck size={13} />
                  KYC Review
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                {selected.status === "banned" ? (
                  <button
                    onClick={() => handleStatusChange("active")}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg text-white flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: "#8a9e60" }}
                  >
                    <CheckCircle size={13} />
                    Unban
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange("banned")}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg text-white bg-red-600 flex items-center justify-center gap-1.5"
                  >
                    <XCircle size={13} />
                    Ban
                  </button>
                )}
                {selected.status === "suspended" ? (
                  <button
                    onClick={() => handleStatusChange("active")}
                    className="flex-1 py-2 text-xs font-semibold border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check size={13} />
                    Unsuspend
                  </button>
                ) : (
                  selected.status !== "banned" && (
                    <button
                      onClick={() => handleStatusChange("suspended")}
                      className="flex-1 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash size={13} className="text-slate-500" />
                      Suspend
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- Edit Arena Modal --- */}
      {isEditModalOpen && editingArena && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsEditModalOpen(false)}
          />
          <div className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">
                  Edit Arena
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Update facility information
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-white rounded-xl transition-all text-gray-400 hover:text-gray-900 shadow-sm border border-transparent hover:border-gray-100"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Arena Name
                  </label>
                  <input
                    type="text"
                    value={editingArena.name}
                    onChange={(e) =>
                      setEditingArena({ ...editingArena, name: e.target.value })
                    }
                    className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-[#8a9e60] focus:bg-white transition-all outline-none placeholder:text-gray-300"
                    placeholder="Enter arena name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                      House / Plot No.
                    </label>
                    <input
                      type="text"
                      value={editingArena.address.houseNumber}
                      onChange={(e) =>
                        setEditingArena({
                          ...editingArena,
                          address: {
                            ...editingArena.address,
                            houseNumber: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-[#8a9e60] focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                      Landmark
                    </label>
                    <input
                      type="text"
                      value={editingArena.address.landmark}
                      onChange={(e) =>
                        setEditingArena({
                          ...editingArena,
                          address: {
                            ...editingArena.address,
                            landmark: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-[#8a9e60] focus:bg-white transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={editingArena.address.city}
                      onChange={(e) =>
                        setEditingArena({
                          ...editingArena,
                          address: {
                            ...editingArena.address,
                            city: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-[#8a9e60] focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={editingArena.address.state}
                      onChange={(e) =>
                        setEditingArena({
                          ...editingArena,
                          address: {
                            ...editingArena.address,
                            state: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-[#8a9e60] focus:bg-white transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                      Pin Code
                    </label>
                    <input
                      type="text"
                      value={editingArena.address.pinCode}
                      onChange={(e) =>
                        setEditingArena({
                          ...editingArena,
                          address: {
                            ...editingArena.address,
                            pinCode: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-[#8a9e60] focus:bg-white transition-all outline-none placeholder:text-gray-300"
                      placeholder="6-digit PIN"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={editingArena.address.country}
                      disabled
                      className="w-full px-4 py-3.5 bg-gray-100 border-2 border-gray-100 rounded-2xl text-sm font-bold text-gray-400 outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                    Google Maps Link
                  </label>
                  <input
                    type="text"
                    value={editingArena.address.googleMapsLink}
                    onChange={(e) =>
                      setEditingArena({
                        ...editingArena,
                        address: {
                          ...editingArena.address,
                          googleMapsLink: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-[#8a9e60] focus:bg-white transition-all outline-none placeholder:text-gray-300"
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    await updateArena(editingArena.id, {
                      name: editingArena.name,
                      address: editingArena.address,
                    });
                    showToast({
                      title: "Update Success",
                      description: "Arena updated successfully",
                      tone: "success",
                    });
                    setIsEditModalOpen(false);
                    fetchArenas();
                  } catch (e: any) {
                    showToast({
                      title: "Update Failed",
                      description: e.message,
                      tone: "error",
                    });
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                className="px-8 py-3 bg-[#8a9e60] text-white rounded-2xl text-sm font-black shadow-lg shadow-[#8a9e60]/20 hover:shadow-xl hover:shadow-[#8a9e60]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting && <CircleNotch className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Onboard Modal --- */}
      {showOnboard && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-8 pt-7 pb-5 border-b border-gray-100 shrink-0">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 leading-none">
                    Onboard Venue (Arena)
                  </h2>
                  <p className="text-sm text-gray-400 mt-2 font-medium">
                    Step {onboardStep} of {ONBOARD_STEPS.length} —{" "}
                    {ONBOARD_STEPS[onboardStep - 1]}
                  </p>
                </div>
                <button
                  onClick={() => setShowOnboard(false)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                >
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
                    <div
                      key={n}
                      className="flex items-center flex-1 last:flex-none"
                    >
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all shadow-sm ${
                            done || active
                              ? "bg-[#8a9e60] text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {done ? <Check weight="bold" size={14} /> : n}
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-tight ${active ? "text-[#8a9e60]" : "text-gray-400"}`}
                        >
                          {label.split(" ")[0]}
                        </span>
                      </div>
                      {i < ONBOARD_STEPS.length - 1 && (
                        <div
                          className={`flex-1 h-[2px] mb-6 mx-2 transition-all ${done ? "bg-[#8a9e60]" : "bg-gray-100"}`}
                        />
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
                      Select the vendor who owns this venue. An Arena acts as a
                      container for multiple sports units (Turfs).
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      Select Vendor *
                    </label>
                    <Select
                      value={formData.vendorId}
                      onChange={(val) => setField("vendorId", val)}
                      options={[
                        { value: "", label: "Search and select a vendor..." },
                        ...onboardVendors.map((v) => ({
                          value: v.id,
                          label: v.businessName,
                        })),
                      ]}
                      searchable
                      loading={onboardVendorsLoading}
                      onSearchChange={setOnboardVendorSearch}
                      className={`w-full ${errors.vendorId ? "border-red-400" : "border-gray-200"}`}
                    />
                    {errors.vendorId && (
                      <p className="text-[10px] text-red-500 font-bold mt-1.5 px-1">
                        {errors.vendorId}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {onboardStep === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      Arena Name *
                    </label>
                    <input
                      value={formData.name}
                      onChange={(e) => setField("name", e.target.value)}
                      className={`w-full border ${errors.name ? "border-red-400" : "border-gray-200"} rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#8a9e60]/20 focus:border-[#8a9e60] transition-all outline-none shadow-sm`}
                      placeholder="e.g. Dream Sports Complex, Mumbai"
                    />
                    {errors.name && (
                      <p className="text-[10px] text-red-500 font-bold mt-1.5">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Initial Turfs Config *
                      </label>
                      <button
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            turfs: [
                              ...prev.turfs,
                              {
                                sport: "Football",
                                count: 1,
                                surfaceType: "artificial_turf",
                                standardPricePaise: 80000,
                                capacity: 14,
                                sizeFormat: "5-a-side",
                              },
                            ],
                          }))
                        }
                        className="text-[10px] font-bold text-[#8a9e60] hover:underline flex items-center gap-1"
                      >
                        <Plus size={12} weight="bold" /> ADD SPORT GROUP
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formData.turfs.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-100 rounded-2xl p-8 text-center bg-white/50">
                          <p className="text-sm text-gray-400 font-medium mb-3">
                            No turfs added yet
                          </p>
                          <button
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                turfs: [
                                  ...prev.turfs,
                                  {
                                    sport: "Football",
                                    count: 1,
                                    surfaceType: "artificial_turf",
                                    standardPricePaise: 80000,
                                    capacity: 14,
                                    sizeFormat: "5-a-side",
                                  },
                                ],
                              }))
                            }
                            className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                          >
                            + Click to add your first turf
                          </button>
                        </div>
                      ) : (
                        formData.turfs.map((t, idx) => (
                          <div
                            key={idx}
                            className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 relative group/card"
                          >
                            <button
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  turfs: prev.turfs.filter((_, i) => i !== idx),
                                }))
                              }
                              className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash size={16} />
                            </button>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1.5 block">
                                  Sport
                                </label>
                                <Select
                                  options={SPORTS_LIST.map((s) => ({
                                    value: s,
                                    label: s,
                                  }))}
                                  value={t.sport}
                                  onChange={(v) => {
                                    const next = [...formData.turfs];
                                    next[idx].sport = v;
                                    setFormData((p) => ({ ...p, turfs: next }));
                                  }}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1.5 block">
                                  Surface Type
                                </label>
                                <Select
                                  options={SURFACE_LIST.map((s) => ({
                                    value: s.toLowerCase().replace(/\s+/g, "_"),
                                    label: s,
                                  }))}
                                  value={t.surfaceType}
                                  onChange={(v) => {
                                    const next = [...formData.turfs];
                                    next[idx].surfaceType = v;
                                    setFormData((p) => ({ ...p, turfs: next }));
                                  }}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1.5 block">
                                  Count
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={t.count}
                                  onChange={(e) => {
                                    const next = [...formData.turfs];
                                    next[idx].count =
                                      parseInt(e.target.value) || 1;
                                    setFormData((p) => ({ ...p, turfs: next }));
                                  }}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#8a9e60] outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1.5 block">
                                  Standard Price (₹)
                                </label>
                                <input
                                  type="number"
                                  value={t.standardPricePaise / 100}
                                  onChange={(e) => {
                                    const next = [...formData.turfs];
                                    next[idx].standardPricePaise =
                                      (parseInt(e.target.value) || 0) * 100;
                                    setFormData((p) => ({ ...p, turfs: next }));
                                  }}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#8a9e60] outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1.5 block">
                                  Size / Format
                                </label>
                                <input
                                  value={t.sizeFormat}
                                  onChange={(e) => {
                                    const next = [...formData.turfs];
                                    next[idx].sizeFormat = e.target.value;
                                    setFormData((p) => ({ ...p, turfs: next }));
                                  }}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#8a9e60] outline-none"
                                  placeholder="e.g. 5-a-side"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {errors.turfs && (
                        <p className="text-[10px] text-red-500 font-bold mt-2">
                          {errors.turfs}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 3 && (
                <div className="space-y-4 animate-in slide-in-from-right-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        Street Address / House No *
                      </label>
                      <input
                        value={formData.address.houseNumber}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            address: {
                              ...p.address,
                              houseNumber: e.target.value,
                            },
                          }))
                        }
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#8a9e60] outline-none shadow-sm"
                        placeholder="Suite 402, Building A"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        City *
                      </label>
                      <input
                        value={formData.address.city}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            address: { ...p.address, city: e.target.value },
                          }))
                        }
                        className={`w-full border ${errors.city ? "border-red-400" : "border-gray-200"} rounded-xl px-4 py-3 text-sm focus:border-[#8a9e60] outline-none`}
                        placeholder="Mumbai"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        State *
                      </label>
                      <Select
                        options={STATES_LIST.map((s) => ({
                          value: s,
                          label: s,
                        }))}
                        value={formData.address.state}
                        onChange={(v) =>
                          setFormData((p) => ({
                            ...p,
                            address: { ...p.address, state: v },
                          }))
                        }
                        searchable
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        Pincode *
                      </label>
                      <input
                        value={formData.address.pinCode}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            address: { ...p.address, pinCode: e.target.value },
                          }))
                        }
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#8a9e60] outline-none"
                        maxLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                        Landmark
                      </label>
                      <input
                        value={formData.address.landmark}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            address: { ...p.address, landmark: e.target.value },
                          }))
                        }
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-[#8a9e60] outline-none"
                        placeholder="Near Metro Station"
                      />
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 4 && (
                <div className="space-y-4">
                  <div className="bg-gray-100/50 rounded-2xl p-6 border border-gray-100">
                    <p className="text-sm font-bold text-gray-700 mb-6 flex items-center gap-2">
                      <Star
                        size={18}
                        weight="fill"
                        className="text-amber-400"
                      />
                      Select Amenities available at this Arena
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {FACILITIES_LIST.map((f) => {
                        const sel = formData.facilities.includes(f);
                        return (
                          <button
                            key={f}
                            onClick={() => toggleArr("facilities", f)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm ${
                              sel
                                ? "bg-[#8a9e60] text-white border-transparent scale-105"
                                : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
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

              {onboardStep === 5 && (
                <div className="space-y-6">
                  <div className="bg-[#8a9e60]/5 border border-[#8a9e60]/20 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
                    <ShieldCheck
                      size={28}
                      className="text-[#8a9e60] shrink-0"
                      weight="fill"
                    />
                    <div>
                      <p className="text-sm text-[#8a9e60] font-bold uppercase tracking-wider">
                        Verification Documents
                      </p>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        Arena-level documents for safety, ownership, and
                        facility compliance.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {KYC_DOCS_ARENA.map((doc) => {
                      const files = onboardKycFiles[doc.key];
                      const hasFiles = Array.isArray(files)
                        ? files.length > 0
                        : !!files;
                      const isPhotoField = doc.key === "arenaPhotos";

                      return (
                        <div
                          key={doc.key}
                          className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {doc.label}
                            </label>
                            {isPhotoField && Array.isArray(files) && (
                              <span className="text-[10px] font-bold text-[#8a9e60] bg-[#8a9e60]/10 px-1.5 py-0.5 rounded">
                                {files.length}/5
                              </span>
                            )}
                          </div>

                          {hasFiles && (
                            <div className="space-y-1.5">
                              {(Array.isArray(files) ? files : [files]).map(
                                (f, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100 group/item"
                                  >
                                    <span className="text-[10px] text-gray-600 font-bold truncate max-w-[150px]">
                                      {f.name}
                                    </span>
                                    <KycFileActions
                                      file={f}
                                      showBadge={false}
                                      onRemove={() => {
                                        setOnboardKycFiles((prev) => {
                                          const next = { ...prev };
                                          if (Array.isArray(next[doc.key])) {
                                            const arr = (
                                              next[doc.key] as File[]
                                            ).filter((_, idx) => idx !== i);
                                            if (arr.length === 0)
                                              delete next[doc.key];
                                            else next[doc.key] = arr;
                                          } else delete next[doc.key];
                                          return next;
                                        });
                                      }}
                                    />
                                  </div>
                                ),
                              )}
                            </div>
                          )}

                          {(!hasFiles ||
                            (isPhotoField &&
                              Array.isArray(files) &&
                              files.length < 5)) && (
                            <button
                              onClick={() => {
                                setUploadingDocKey(doc.key);
                                onboardingFileInputRef.current?.click();
                              }}
                              className="w-full py-4 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30 flex flex-col items-center justify-center gap-1 hover:border-[#8a9e60] hover:bg-white transition-all group"
                            >
                              <UploadSimple
                                size={20}
                                className="text-gray-300 group-hover:text-[#8a9e60]"
                              />
                              <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-600">
                                {isPhotoField ? "Add Photo" : "Upload File"}
                              </span>
                            </button>
                          )}
                          <p className="text-[9px] text-gray-400 italic font-medium leading-tight">
                            {doc.hint}
                          </p>
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
                        setOnboardKycFiles((prev) => {
                          const existing =
                            (prev[uploadingDocKey] as File[]) || [];
                          return {
                            ...prev,
                            [uploadingDocKey]: [...existing, ...files].slice(
                              0,
                              5,
                            ),
                          };
                        });
                      } else {
                        setOnboardKycFiles((prev) => ({
                          ...prev,
                          [uploadingDocKey]: files[0],
                        }));
                      }
                      e.target.value = "";
                    }}
                    multiple={uploadingDocKey === "arenaPhotos"}
                  />
                  <input
                    type="file"
                    ref={detailFileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      if (!e.target.files || !uploadingDocKey) return;
                      const files = Array.from(e.target.files);
                      if (uploadingDocKey === "arenaPhotos") {
                        setDetailKycFiles((prev) => {
                          const existing =
                            (prev[uploadingDocKey] as File[]) || [];
                          return {
                            ...prev,
                            [uploadingDocKey]: [...existing, ...files].slice(
                              0,
                              5,
                            ),
                          };
                        });
                      } else {
                        setDetailKycFiles((prev) => ({
                          ...prev,
                          [uploadingDocKey]: files[0],
                        }));
                      }
                      e.target.value = "";
                    }}
                    multiple={uploadingDocKey === "arenaPhotos"}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
              <button
                onClick={() => setOnboardStep((s) => Math.max(1, s - 1))}
                className={`flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors ${onboardStep === 1 ? "invisible" : ""}`}
              >
                <CaretLeft size={16} weight="bold" />
                Previous Step
              </button>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowOnboard(false)}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (onboardStep < ONBOARD_STEPS.length) {
                      if (validateStep(onboardStep))
                        setOnboardStep((s) => s + 1);
                    } else {
                      onOnboard();
                    }
                  }}
                  className="flex items-center gap-2 px-8 py-2.5 bg-[#8a9e60] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#8a9e60]/20 hover:opacity-90 transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <CircleNotch className="animate-spin" size={16} />
                  ) : onboardStep === ONBOARD_STEPS.length ? (
                    "Finish Onboarding"
                  ) : (
                    "Next Step"
                  )}
                  {onboardStep < ONBOARD_STEPS.length && (
                    <CaretRight size={16} weight="bold" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {kycArena && (
        <ArenaKycUpload
          arena={kycArena}
          onClose={() => setKycArena(null)}
          onSuccess={async () => {
            fetchArenas();
            if (selected?.id === kycArena.id) {
              try {
                const updated = await getArenaById(kycArena.id);
                setSelected(updated);
              } catch {}
            }
          }}
        />
      )}
    </div>
  );
}
