"use client";

import {
  MapPin,
  MagnifyingGlass,
  CheckCircle,
  XCircle,
  ClockCountdown,
  Prohibit,
  WarningCircle,
  Plus,
  DotsThreeVertical,
  PencilSimple,
  Trash,
  FileText,
  ArrowLeft,
  ShieldCheck,
  Eye,
  ArrowsClockwise,
  Buildings,
  Phone,
  Envelope,
  CaretDown,
  Star,
  Wrench,
  Funnel,
  CaretLeft,
  CaretRight,
  LockSimple,
  LockSimpleOpen,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import { useState, useRef, useEffect } from "react";
import {
  banTurf,
  unbanTurf,
  listTurfs,
  updateTurf,
  updateTurfStatus,
  reviewTurfDocuments,
  getTurfReviews,
  deleteTurfReview,
  STATUS_CONFIG as TURF_STATUS_CONFIG,
  TurfReviewDto,
  UpdateTurfDto,
  Turf,
  TurfReview,
  FieldStatus,
  createTurfForVendor,
  CreateTurfDto,
  getTurfById,
  uploadTurfDocuments,
} from "@/features/turfs";
import { DashboardPagination } from "@/components/DashboardPagination";
import {
  listVendors,
  Vendor,
  KYC_CFG,
  SPORT_COLOR,
  STATUS_CFG as VENDOR_STATUS_CFG,
  KycFileActions,
} from "@/features/vendors";
import { performSequentialUploads } from "@/features/vendors/utils";
import { useToast } from "@/features/toast/toast-context";
import { TurfKycUpload } from "@/features/turfs/components/TurfKycUpload";

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = TURF_STATUS_CONFIG;

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
  "Changing Room",
  "Cafeteria",
  "Equipment Rental",
  "First Aid",
  "WiFi",
  "CCTV",
  "Drinking Water",
];
const SURFACE_LIST = [
  "Natural Grass",
  "Artificial Turf",
  "Concrete",
  "Wooden",
  "Synthetic",
];
const STATES_LIST = [
  "Maharashtra",
  "Karnataka",
  "Delhi",
  "Gujarat",
  "Tamil Nadu",
  "Telangana",
  "West Bengal",
  "Rajasthan",
  "Uttar Pradesh",
  "Punjab",
  "Kerala",
  "Haryana",
  "Madhya Pradesh",
];

const ONBOARD_STEPS = [
  "Vendor Info",
  "Field Details",
  "Location",
  "Pricing & Hours",
  "Amenities",
  "KYC",
];

const KYC_DOCS_FIELD = [
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
    key: "fieldPhotos",
    label: "Field Photos",
    hint: "High-resolution facility images",
  },
] as const;

const INIT_FORM = {
  vendorId: "",
  name: "",
  sports: [] as string[],
  capacity: "14",
  size: "5-a-side",
  surface: "Artificial Turf",
  address: {
    type: "work" as "home" | "work" | "other",
    houseNumber: "",
    landmark: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",
    googleMapsLink: "",
  },
  pricePerHour: "800",
  cancellationWindowHrs: "",
  weekdayFrom: "06:00",
  weekdayTo: "22:00",
  weekendFrom: "06:00",
  weekendTo: "23:00",
  facilities: [] as string[],
  propertyDocument: "",
  municipalNoc: "",
  liabilityInsurance: "",
  fieldPhotos: "",
};

type FormData = typeof INIT_FORM;
type FieldKycDocKey = (typeof KYC_DOCS_FIELD)[number]["key"];

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

function formatRating(score?: number) {
  if (!score || score <= 0) return "—";
  return score.toFixed(1);
}

function getReviewerName(review: TurfReview) {
  const first = review.user?.firstName?.trim() || "";
  const last = review.user?.lastName?.trim() || "";
  const fullName = `${first} ${last}`.trim();
  return fullName || "Anonymous User";
}

// ... actions menu remains similar but unified ...

// ─── Actions Menu ─────────────────────────────────────────────────────────────

// ─── Detail Panel ─────────────────────────────────────────────────────────────
const TOTAL_SLOTS = 17; // 6 AM – 10 PM (last slot starts at 10 PM)
const TODAY = new Date(2026, 2, 21); // Mar 21, 2026

/** Deterministic mock booked slots for a given field + date */
function getMockBookedSlots(field: Turf, date: Date): Set<number> {
  if (field.status !== "active") return new Set();
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  const popularity = Math.min(Math.floor((field.totalBookings || 0) / 80), 8);
  const base = isWeekend ? popularity + 5 : popularity + 2;
  const count = Math.min(base, 13);
  const seed =
    (field.id.charCodeAt(4) || 3) + date.getDate() * 7 + date.getMonth() * 31;
  const booked = new Set<number>();
  for (let i = 0; booked.size < count; i++) {
    booked.add((seed * (i + 3) * 7 + i * 13) % TOTAL_SLOTS);
    if (i > 200) break;
  }
  return booked;
}

/** Format a Date to display string */
function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format a Date to a key string */
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function FieldDetailPanel({
  field,
  onClose,
  onRefresh,
  onReviewKyc,
  onConfirmAction,
  onEdit,
}: {
  field: Turf;
  onClose: () => void;
  onRefresh: () => void;
  onReviewKyc: (field: Turf) => void;
  onConfirmAction: (type: "ban" | "unban" | "remove", field: Turf) => void;
  onEdit: (field: Turf) => void;
}) {
  const { showToast } = useToast();
  const [tab, setTab] = useState<"overview" | "reviews" | "schedule" | "analytics">(
    "overview",
  );
  const [statusOpen, setStatusOpen] = useState(false);
  const [reviews, setReviews] = useState<TurfReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsLoadedFor, setReviewsLoadedFor] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const sc = STATUS_CONFIG[field.status] || STATUS_CONFIG.pending;

  // Schedule state
  const [scheduleDate, setScheduleDate] = useState<Date>(new Date(TODAY));
  const [calOpen, setCalOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(TODAY.getMonth());
  const [calYear, setCalYear] = useState(TODAY.getFullYear());
  // blocked slots: dateKey -> Set of slot indices blocked by admin
  const [blockedMap, setBlockedMap] = useState<Record<string, Set<number>>>({});

  const calRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setTab("overview");
    setStatusOpen(false);
    setReviews([]);
    setReviewsLoadedFor(null);
    setDeletingReviewId(null);
  }, [field.id]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node))
        setCalOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const dk = dateKey(scheduleDate);
  const bookedSlots = getMockBookedSlots(field, scheduleDate);
  const blocked = blockedMap[dk] ?? new Set<number>();

  function toggleBlock(slotIdx: number) {
    if (bookedSlots.has(slotIdx)) return; // can't block a booked slot
    setBlockedMap((prev) => {
      const next = new Map(Object.entries(prev));
      const cur = new Set(prev[dk] ?? []);
      if (cur.has(slotIdx)) cur.delete(slotIdx);
      else cur.add(slotIdx);
      return { ...prev, [dk]: cur };
    });
  }

  function blockAllAvailable() {
    setBlockedMap((prev) => {
      const cur = new Set(prev[dk] ?? []);
      for (let i = 0; i < TOTAL_SLOTS; i++) {
        if (!bookedSlots.has(i)) cur.add(i);
      }
      return { ...prev, [dk]: cur };
    });
  }

  function unblockAll() {
    setBlockedMap((prev) => ({ ...prev, [dk]: new Set() }));
  }

  function blockPeak() {
    // Peak = slots 11 onwards (5PM+)
    setBlockedMap((prev) => {
      const cur = new Set(prev[dk] ?? []);
      for (let i = 11; i < TOTAL_SLOTS; i++) {
        if (!bookedSlots.has(i)) cur.add(i);
      }
      return { ...prev, [dk]: cur };
    });
  }

  function shiftDate(delta: number) {
    const d = new Date(scheduleDate);
    d.setDate(d.getDate() + delta);
    setScheduleDate(d);
    setCalMonth(d.getMonth());
    setCalYear(d.getFullYear());
  }

  const bookedCount = bookedSlots.size;
  const blockedCount = [...blocked].filter((i) => !bookedSlots.has(i)).length;
  const availableCount = TOTAL_SLOTS - bookedCount - blockedCount;
  const occupancyPct = Math.round((bookedCount / TOTAL_SLOTS) * 100);

  // Mini calendar helpers
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const calDays: (Date | null)[] = [];
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++)
    calDays.push(new Date(calYear, calMonth, d));

  async function loadReviews(force = false) {
    if (!force && reviewsLoadedFor === field.id) return;
    setReviewsLoading(true);
    try {
      const data = await getTurfReviews(field.id);
      setReviews(data);
      setReviewsLoadedFor(field.id);
    } catch (err: any) {
      showToast({
        title: "Could not load reviews",
        description: err.message || "Failed to fetch reviews",
        tone: "error",
      });
    } finally {
      setReviewsLoading(false);
    }
  }

  useEffect(() => {
    if (tab === "reviews") {
      loadReviews();
    }
  }, [tab, field.id]);

  async function handleDeleteReview(review: TurfReview) {
    const ok = window.confirm(
      `Delete the review from ${getReviewerName(review)}? This cannot be undone.`,
    );
    if (!ok) return;

    setDeletingReviewId(review.id);
    try {
      await deleteTurfReview(field.id, review.id);
      setReviews((prev) => prev.filter((item) => item.id !== review.id));
      await Promise.all([loadReviews(true), Promise.resolve(onRefresh())]);
      showToast({
        title: "Review deleted",
        description: "The rating summary has been refreshed.",
        tone: "success",
      });
    } catch (err: any) {
      showToast({
        title: "Delete failed",
        description: err.message || "Could not delete review",
        tone: "error",
      });
    } finally {
      setDeletingReviewId(null);
    }
  }

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[420px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden border-l border-gray-100">
      {/* Header */}
      <div
        className="shrink-0 px-5 py-4 flex items-start justify-between"
        style={{ background: "linear-gradient(135deg,#8a9e60,#6e8245)" }}
      >
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-white/60 text-[11px] font-medium mb-0.5">
            {field.id}
          </p>
          <h2 className="text-white font-bold text-base leading-tight truncate">
            {field.name}
          </h2>
          <p className="text-white/60 text-[11px] mt-0.5 flex items-center gap-1 leading-relaxed">
            <MapPin size={10} /> {field.address?.city}, {field.address?.state}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${sc.cls} bg-white/10 text-white border-white/20`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {sc.label.toUpperCase()}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white shrink-0 mt-0.5"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 shrink-0 bg-white">
        {(["overview", "reviews", "schedule", "analytics"] as const).map((t) => {
          const disabled = t === "schedule" || t === "analytics";
          return (
            <button
              key={t}
              onClick={() => {
                if (!disabled) setTab(t);
              }}
              disabled={disabled}
              className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${
                tab === t
                  ? "border-b-2 border-[#8a9e60] text-[#8a9e60]"
                  : disabled
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {t === "reviews" ? "reviews" : t}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <>
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-gray-800">
                  ₹{((field.standardPricePaise || 0) / 100).toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400">per hour</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-gray-800">
                  {field.capacity || "-"}
                </p>
                <p className="text-[10px] text-gray-400">capacity</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-0.5">
                  <p className="text-lg font-bold text-gray-800">
                    {formatRating(field.rating)}
                  </p>
                  {field.rating
                    ? field.rating > 0 && (
                        <Star
                          size={11}
                          weight="fill"
                          className="text-amber-400 mb-0.5"
                        />
                      )
                    : null}
                </div>
                <p className="text-[10px] text-gray-400">
                  {field.totalReviews
                    ? `${field.totalReviews} reviews`
                    : "No reviews"}
                </p>
              </div>
            </div>

            {/* About */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                About
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                {field.description || "No description provided for this field."}
              </p>
            </div>

            {/* Field Details */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Field Details
              </p>
              <div className="space-y-2.5">
                {[
                  ["Surface", field.surfaceType?.replace(/_/g, " ") || "-"],
                  ["Size / Format", field.sizeFormat || "-"],
                  [
                    "Capacity",
                    field.capacity ? `${field.capacity} players` : "-",
                  ],
                  [
                    "Operating Hours",
                    field.weekdayOpen
                      ? `${field.weekdayOpen.slice(0, 5)} – ${field.weekdayClose?.slice(0, 5)}`
                      : "—",
                  ],
                  [
                    "Standard Price",
                    `₹${((field.standardPricePaise || 0) / 100).toLocaleString()} / hr`,
                  ],
                  [
                    "Listed Since",
                    new Date(field.createdAt || new Date()).toLocaleDateString(
                      "en-IN",
                      { day: "numeric", month: "short", year: "numeric" },
                    ),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between text-xs capitalize"
                  >
                    <span className="text-gray-400 ">{label}</span>
                    <span className="font-medium text-gray-700 text-right max-w-[55%]">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sports */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Supported Sports
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(field.sports || []).length > 0 ? (
                  (field.sports || []).map((s) => (
                    <span
                      key={s}
                      className="text-[11px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium capitalize"
                    >
                      {s.replace(/_/g, " ")}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-gray-300 italic">
                    No sports listed
                  </span>
                )}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Amenities
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(field.amenities || []).length > 0 ? (
                  (field.amenities || []).map((a) => (
                    <span
                      key={a}
                      className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium capitalize"
                    >
                      {a.replace(/_/g, " ")}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-gray-300 italic">
                    No amenities listed
                  </span>
                )}
              </div>
            </div>

            {/* Vendor */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Vendor
              </p>
              <div className="bg-gray-50 rounded-xl p-3.5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                    style={{ backgroundColor: "#8a9e60" }}
                  >
                    {(
                      field.vendorBusinessName ||
                      field.vendor?.businessName ||
                      "U"
                    )
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {field.vendorBusinessName ||
                        field.vendor?.businessName ||
                        "Unknown"}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {field.vendor?.email || "No email"}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {field.vendorPhone || field.vendor?.phone || "No phone"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`tel:${field.vendorPhone || field.vendor?.phone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Phone size={13} /> Call
                  </a>
                  <button
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#8a9e60" }}
                  >
                    <Envelope size={13} /> Email
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "reviews" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Average Rating
                </p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold text-gray-800">
                    {formatRating(field.rating)}
                  </p>
                  {(field.rating || 0) > 0 && (
                    <Star size={16} weight="fill" className="text-amber-400" />
                  )}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Total Reviews
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {field.totalReviews || 0}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  User Feedback
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Moderate comments directly from this panel.
                </p>
              </div>
              <button
                onClick={() => loadReviews(true)}
                disabled={reviewsLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <ArrowsClockwise
                  size={13}
                  className={reviewsLoading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>

            {reviewsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-gray-100 bg-gray-50 p-4 animate-pulse"
                  >
                    <div className="h-3 w-24 rounded bg-gray-200 mb-2" />
                    <div className="h-3 w-40 rounded bg-gray-200 mb-3" />
                    <div className="h-3 w-full rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                <Star size={24} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-600">
                  No reviews yet
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Ratings will appear here once players start reviewing this field.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {review.user?.avatarUrl ? (
                          <img
                            src={review.user.avatarUrl}
                            alt={getReviewerName(review)}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: "#8a9e60" }}
                          >
                            {avatar(getReviewerName(review))}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {getReviewerName(review)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                              <Star size={11} weight="fill" />
                              {formatRating(review.score)}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteReview(review)}
                        disabled={deletingReviewId === review.id}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 disabled:opacity-50"
                      >
                        <Trash size={13} />
                        {deletingReviewId === review.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed mt-3">
                      {review.comment?.trim() || "No written comment provided."}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── SCHEDULE TAB ── */}
        {tab === "schedule" && (
          <>
            {/* ── Date navigation ── */}
            <div className="flex items-center gap-2" ref={calRef}>
              <button
                onClick={() => shiftDate(-1)}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors shrink-0"
              >
                <CaretLeft size={14} weight="bold" />
              </button>

              {/* Date button — opens mini calendar */}
              <button
                onClick={() => setCalOpen((o) => !o)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors relative"
              >
                <CaretDown size={12} className="text-gray-400" />
                {fmtDate(scheduleDate)}
                {dateKey(scheduleDate) === dateKey(TODAY) && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ml-1"
                    style={{ backgroundColor: "#8a9e60" }}
                  >
                    Today
                  </span>
                )}
              </button>

              <button
                onClick={() => shiftDate(1)}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors shrink-0"
              >
                <CaretRight size={14} weight="bold" />
              </button>

              {/* Mini calendar dropdown */}
              {calOpen && (
                <div
                  className="absolute left-4 right-4 top-auto z-30 mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3"
                  style={{ top: "auto" }}
                >
                  {/* Month nav */}
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => {
                        if (calMonth === 0) {
                          setCalMonth(11);
                          setCalYear((y) => y - 1);
                        } else setCalMonth((m) => m - 1);
                      }}
                      className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                      <CaretLeft size={13} weight="bold" />
                    </button>
                    <p className="text-xs font-bold text-gray-700">
                      {monthNames[calMonth]} {calYear}
                    </p>
                    <button
                      onClick={() => {
                        if (calMonth === 11) {
                          setCalMonth(0);
                          setCalYear((y) => y + 1);
                        } else setCalMonth((m) => m + 1);
                      }}
                      className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                      <CaretRight size={13} weight="bold" />
                    </button>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 mb-1">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div
                        key={i}
                        className="text-center text-[10px] font-bold text-gray-300 py-1"
                      >
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {calDays.map((d, i) => {
                      if (!d) return <div key={`e${i}`} />;
                      const isToday = dateKey(d) === dateKey(TODAY);
                      const isSel = dateKey(d) === dateKey(scheduleDate);
                      const isPast =
                        d <
                        new Date(
                          TODAY.getFullYear(),
                          TODAY.getMonth(),
                          TODAY.getDate(),
                        );
                      const hasBooking = getMockBookedSlots(field, d).size > 0;
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            setScheduleDate(new Date(d));
                            setCalOpen(false);
                          }}
                          className={`relative text-center text-[11px] py-1.5 rounded-lg font-medium transition-colors ${
                            isSel
                              ? "text-white font-bold"
                              : isToday
                                ? "font-bold border"
                                : isPast
                                  ? "text-gray-300 hover:bg-gray-50"
                                  : "text-gray-600 hover:bg-gray-100"
                          }`}
                          style={
                            isSel
                              ? { backgroundColor: "#8a9e60" }
                              : isToday
                                ? { borderColor: "#8a9e60", color: "#8a9e60" }
                                : {}
                          }
                        >
                          {d.getDate()}
                          {hasBooking && !isSel && (
                            <span
                              className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                              style={{
                                backgroundColor: isSel ? "white" : "#8a9e60",
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      setScheduleDate(new Date(TODAY));
                      setCalMonth(TODAY.getMonth());
                      setCalYear(TODAY.getFullYear());
                      setCalOpen(false);
                    }}
                    className="mt-2 w-full text-center text-[11px] font-semibold py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    style={{ color: "#8a9e60" }}
                  >
                    Jump to Today
                  </button>
                </div>
              )}
            </div>

            {/* ── Field not bookable ── */}
            {field.status === "maintenance" ? (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-center">
                <Wrench size={26} className="text-blue-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-blue-600">
                  Under Maintenance
                </p>
                <p className="text-xs text-blue-400 mt-1">
                  No slots available on any date
                </p>
              </div>
            ) : field.status !== "active" ? (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 text-center">
                <XCircle size={26} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-500">
                  Field Not Active
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Activate the field to manage slots
                </p>
              </div>
            ) : (
              <>
                {/* ── Legend ── */}
                <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: "#8a9e60" }}
                    />{" "}
                    Booked
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-red-100 border border-red-200" />{" "}
                    Blocked
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />{" "}
                    Available
                  </span>
                  <span className="text-[10px] text-gray-400 ml-auto">
                    Click to block/unblock
                  </span>
                </div>

                {/* ── Slot grid ── */}
                <div className="grid grid-cols-4 gap-1.5">
                  {Array.from({ length: TOTAL_SLOTS }, (_, i) => {
                    const hour = 6 + i;
                    const isBooked = bookedSlots.has(i);
                    const isBlocked = !isBooked && blocked.has(i);
                    const h = hour > 12 ? hour - 12 : hour === 12 ? 12 : hour;
                    const ampm = hour >= 12 ? "PM" : "AM";
                    const isPeak = hour >= 17;

                    return (
                      <button
                        key={i}
                        disabled={isBooked}
                        onClick={() => toggleBlock(i)}
                        className={`rounded-xl py-2.5 text-center flex flex-col items-center gap-0.5 transition-all ${
                          isBooked
                            ? "cursor-default"
                            : isBlocked
                              ? "bg-red-50 border border-red-200 hover:bg-red-100"
                              : "bg-gray-50 border border-gray-100 hover:border-gray-300 hover:bg-white"
                        }`}
                        style={isBooked ? { backgroundColor: "#8a9e60" } : {}}
                      >
                        <span
                          className={`text-[10px] font-bold ${
                            isBooked
                              ? "text-white"
                              : isBlocked
                                ? "text-red-500"
                                : "text-gray-500"
                          }`}
                        >
                          {h}
                          {ampm}
                        </span>
                        {isPeak && !isBooked && (
                          <span
                            className={`text-[8px] font-semibold ${isBlocked ? "text-red-400" : "text-amber-500"}`}
                          >
                            PEAK
                          </span>
                        )}
                        {isBooked && (
                          <CheckCircle
                            size={10}
                            className="text-white/70"
                            weight="fill"
                          />
                        )}
                        {isBlocked && (
                          <LockSimple
                            size={10}
                            className="text-red-400"
                            weight="fill"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* ── Quick actions ── */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={blockAllAvailable}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-[11px] font-semibold hover:bg-red-100 transition-colors"
                  >
                    <LockSimple size={12} weight="fill" /> Block All
                  </button>
                  <button
                    onClick={blockPeak}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-[11px] font-semibold hover:bg-amber-100 transition-colors"
                  >
                    <LockSimple size={12} /> Block Peak (5PM+)
                  </button>
                  {blockedCount > 0 && (
                    <button
                      onClick={unblockAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-[11px] font-semibold hover:bg-green-100 transition-colors"
                    >
                      <LockSimpleOpen size={12} /> Unblock All
                    </button>
                  )}
                </div>

                {/* ── Day summary ── */}
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-xs font-semibold text-gray-700 mb-3">
                    {fmtDate(scheduleDate)} — Summary
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-center mb-3">
                    <div>
                      <p className="text-base font-bold text-gray-800">
                        {bookedCount}
                      </p>
                      <p className="text-[10px] text-gray-400">Booked</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-red-500">
                        {blockedCount}
                      </p>
                      <p className="text-[10px] text-gray-400">Blocked</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-600">
                        {availableCount}
                      </p>
                      <p className="text-[10px] text-gray-400">Available</p>
                    </div>
                    <div>
                      <p
                        className="text-base font-bold"
                        style={{ color: "#8a9e60" }}
                      >
                        {occupancyPct}%
                      </p>
                      <p className="text-[10px] text-gray-400">Booked%</p>
                    </div>
                  </div>
                  {/* Stacked bar */}
                  <div className="flex rounded-full overflow-hidden h-2 bg-gray-200">
                    <div
                      style={{
                        width: `${occupancyPct}%`,
                        backgroundColor: "#8a9e60",
                      }}
                    />
                    <div
                      style={{
                        width: `${Math.round((blockedCount / TOTAL_SLOTS) * 100)}%`,
                        backgroundColor: "#fca5a5",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                    <span>Booked</span>
                    <span>Blocked</span>
                    <span>Available</span>
                  </div>
                </div>

                {/* ── Pricing note ── */}
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <p className="text-[11px] font-bold text-amber-700 mb-1.5">
                    Pricing Tiers
                  </p>
                  <div className="space-y-1 text-xs text-amber-700">
                    <div className="flex justify-between">
                      <span className="text-amber-600">
                        Standard (6AM – 5PM)
                      </span>
                      <span className="font-semibold">
                        ₹{(field as any).pricePerHour}/hr
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-600">Peak (5PM – close)</span>
                      <span className="font-semibold">
                        ₹{(field as any).peakPricePerHour}/hr
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ── ANALYTICS TAB ── */}
        {tab === "analytics" && (
          <>
            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  label: "Total Bookings",
                  value: (field.totalBookings || 0).toLocaleString(),
                  sub: "all time",
                },
                {
                  label: "Total Revenue",
                  value:
                    ((field as any).totalRevenue || 0) > 0
                      ? `₹${(((field as any).totalRevenue || 0) / 1000).toFixed(0)}K`
                      : "—",
                  sub: "all time",
                },
                {
                  label: "Avg. Rating",
                  value:
                    (field.rating || 0) > 0
                      ? `${formatRating(field.rating)} ★`
                      : "—",
                  sub: `${field.totalReviews || 0} reviews`,
                },
                {
                  label: "Avg / Booking",
                  value:
                    (field.totalBookings || 0) > 0
                      ? `₹${Math.round((field.totalRevenue || 0) / (field.totalBookings || 1)).toLocaleString()}`
                      : "—",
                  sub: "revenue per booking",
                },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-[11px] text-gray-400 mb-1">{label}</p>
                  <p className="text-xl font-bold text-gray-800">{value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* Weekly occupancy bar chart */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                Weekly Occupancy
              </p>
              {field.totalBookings === 0 ? (
                <div className="bg-gray-50 rounded-xl p-6 text-center text-xs text-gray-400">
                  No data — field not yet live
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-end gap-2 h-28">
                    {[
                      { day: "Mon", pct: 68 },
                      { day: "Tue", pct: 55 },
                      { day: "Wed", pct: 80 },
                      { day: "Thu", pct: 62 },
                      { day: "Fri", pct: 91 },
                      { day: "Sat", pct: 96 },
                      { day: "Sun", pct: 89 },
                    ].map(({ day, pct }) => (
                      <div
                        key={day}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <p className="text-[9px] text-gray-500 font-medium">
                          {pct}%
                        </p>
                        <div
                          className="w-full rounded-t"
                          style={{
                            height: `${(pct / 100) * 72}px`,
                            backgroundColor: "#8a9e60",
                            opacity: 0.85,
                          }}
                        />
                        <p className="text-[9px] text-gray-400">{day}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Revenue breakdown */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Revenue Breakdown
              </p>
              <div className="space-y-2.5">
                {[
                  [
                    "Est. This Month",
                    (field.totalBookings || 0) > 0
                      ? `₹${(((field.pricePerHour || 0) * (field.todayBookings || 0) * 21) / 1000).toFixed(1)}K`
                      : "—",
                  ],
                  [
                    "Platform Fee (10%)",
                    (field.totalRevenue || 0) > 0
                      ? `₹${(((field.totalRevenue || 0) * 0.1) / 1000).toFixed(1)}K`
                      : "—",
                  ],
                  [
                    "Vendor Payout (90%)",
                    (field.totalRevenue || 0) > 0
                      ? `₹${(((field.totalRevenue || 0) * 0.9) / 1000).toFixed(0)}K`
                      : "—",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-gray-400">{label}</span>
                    <span className="font-semibold text-gray-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance badge */}
            {(field.totalBookings || 0) > 500 && (
              <div
                className="rounded-xl p-3.5 flex items-center gap-3"
                style={{
                  background: "linear-gradient(135deg,#8a9e6015,#6e824510)",
                }}
              >
                <Star
                  size={24}
                  weight="fill"
                  style={{ color: "#8a9e60" }}
                  className="shrink-0"
                />
                <div>
                  <p className="text-xs font-bold text-gray-700">
                    Top Performing Field
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Over 500 bookings — top 20% on the platform
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Footer */}
      <div className="shrink-0 border-t border-gray-100 p-4 bg-gray-50/50">
        <div className="relative">
          {statusOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-10">
              {(Object.entries(STATUS_CONFIG) as [FieldStatus, any][])
                .filter(([s]) => s !== "banned")
                .map(([s, cfg]) => (
                  <button
                    key={s}
                    onClick={() => {
                      handleStatusUpdate(s);
                      setStatusOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                  >
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      {cfg.label}
                    </p>
                  </button>
                ))}
            </div>
          )}
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all hover:shadow-sm"
            >
              <ArrowsClockwise size={18} /> SET STATUS
            </button>
            <button
              onClick={() => onReviewKyc(field)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all hover:shadow-sm shadow-md"
              style={{ backgroundColor: "#8a9e60" }}
            >
              <ShieldCheck size={18} weight="fill" /> REVIEW KYC
            </button>
          </div>

          {/* Management Zone */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">
              Management & Controls
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onEdit(field)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <PencilSimple size={14} /> Edit Field
              </button>

              {field.status === "banned" ? (
                <button
                  onClick={() => onConfirmAction("unban", field)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 text-green-700 border border-green-100 text-xs font-semibold hover:bg-green-100 transition-colors"
                >
                  <CheckCircle size={14} /> Unban Field
                </button>
              ) : (
                <button
                  onClick={() => onConfirmAction("ban", field)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-100 text-xs font-semibold hover:bg-amber-100 transition-colors"
                >
                  <XCircle size={14} /> Ban Field
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  async function handleStatusUpdate(s: FieldStatus) {
    try {
      if (s === "banned") await banTurf(field.id);
      else if (s === "active" && field.status === "banned")
        await unbanTurf(field.id);
      else await updateTurfStatus(field.id, s);

      showToast({
        title: "Status Updated",
        description: `Field status changed to ${s}`,
        tone: "success",
      });
      onRefresh();
    } catch (err: any) {
      showToast({ title: "Error", description: err.message, tone: "error" });
    }
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FieldsPage() {
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [sportFilter, setSportFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [sportOpen, setSportOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [selected, setSelected] = useState<Turf | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState<{
    type: "ban" | "unban" | "remove";
    field: Turf;
  } | null>(null);

  // Edit modal
  const [editTurf, setEditTurf] = useState<Turf | null>(null);
  const [editForm, setEditForm] = useState<UpdateTurfDto | null>(null);
  const [editTab, setEditTab] = useState<"basic" | "pricing" | "sports">(
    "basic",
  );

  // Lists
  const [fields, setFields] = useState<Turf[]>([]);
  const [vendorsList, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Onboard modal state
  const [showOnboard, setShowOnboard] = useState(false);
  const [onboardStep, setOnboardStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({ ...INIT_FORM });
  const [onboardKycFiles, setOnboardKycFiles] = useState<
    Record<string, File | File[]>
  >({});
  const [uploadingDocKey, setUploadingDocKey] = useState<
    FieldKycDocKey | null
  >(null);
  const onboardingFileInputRef = useRef<HTMLInputElement>(null);

  // KYC review modal
  const [kycField, setKycField] = useState<Turf | null>(null);
  const [kycDocs, setKycDocs] = useState<
    Record<string, "pending" | "verified" | "rejected">
  >({});

  const setField = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setFormData((p) => ({ ...p, [key]: val }));
  const toggleArr = (key: "sports" | "facilities", val: string) =>
    setFormData((p) => {
      const arr = p[key] as string[];
      return {
        ...p,
        [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val],
      };
    });
  const closeOnboard = () => {
    setShowOnboard(false);
    setOnboardStep(1);
    setFormData({ ...INIT_FORM });
    setOnboardKycFiles({});
  };

  const handleOnboardFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = uploadingDocKey;
    if (!key) return;

    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (key === "fieldPhotos") {
      setOnboardKycFiles((prev) => {
        const existing = (prev[key] as File[]) || [];
        // Support up to 5 photos
        const combined = [...existing, ...files].slice(0, 5);
        return { ...prev, [key]: combined };
      });
      // Also update formData for the visual checkmark (though we'll use onboardKycFiles mainly)
      setField(key, "selected");
    } else {
      // Single file for other documents
      setOnboardKycFiles((prev) => ({ ...prev, [key]: files[0] }));
      setField(key, files[0].name);
    }

    setUploadingDocKey(null);
    if (onboardingFileInputRef.current) {
      onboardingFileInputRef.current.value = "";
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onOnboard = async () => {
    setIsSubmitting(true);
    try {
      // Convert display values to DTO snake_case enums
      const toSnake = (s: string) => s.toLowerCase().replace(/ /g, "_");

      const payload: CreateTurfDto = {
        name: formData.name,
        standardPricePaise: Math.round(
          parseFloat(formData.pricePerHour || "0") * 100,
        ),
        cancellationWindowHrs: formData.cancellationWindowHrs
          ? parseInt(formData.cancellationWindowHrs)
          : undefined,
        address: {
          type: formData.address.type,
          houseNumber: formData.address.houseNumber || undefined,
          landmark: formData.address.landmark || undefined,
          city: formData.address.city,
          state: formData.address.state,
          pinCode: formData.address.pinCode,
          country: formData.address.country || "India",
          googleMapsLink: formData.address.googleMapsLink || undefined,
        },
        sports: formData.sports.map(toSnake) as any[],
        amenities: formData.facilities.map(toSnake) as any[],
        surfaceType: toSnake(formData.surface) as any,
        sizeFormat: formData.size || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        weekdayOpen: formData.weekdayFrom.slice(0, 5),
        weekdayClose: formData.weekdayTo.slice(0, 5),
        weekendOpen: formData.weekendFrom.slice(0, 5),
        weekendClose: formData.weekendTo.slice(0, 5),
      };

      const turf = await createTurfForVendor(formData.vendorId, payload);

      // 2. Sequential Uploads for KYC (if any)
      if (Object.keys(onboardKycFiles).length > 0) {
        try {
          const s3Paths = await performSequentialUploads(
            turf.id,
            onboardKycFiles,
            "turf",
          );

          // 3. Finalize KYC with backend
          await uploadTurfDocuments(turf.id, {
            documents: {
              propertyDocument: s3Paths.propertyDocument as string,
              municipalNoc: s3Paths.municipalNoc as string,
              liabilityInsurance: s3Paths.liabilityInsurance as string,
              fieldPhotos: s3Paths.fieldPhotos as string[],
            },
          });
        } catch (uploadError: any) {
          console.error("KYC upload error:", uploadError);
          showToast({
            title: "Partial Success",
            description: "Field created but document upload failed. You can upload them later.",
            tone: "warning",
          });
        }
      }

      showToast({
        title: "Field Onboarded",
        description: "New turf field has been successfully created.",
        tone: "success",
      });
      closeOnboard();
      refreshData();
    } catch (err: any) {
      showToast({
        title: "Onboarding Failed",
        description: err.message || "Could not onboard field",
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // KYC Helpers
  function openKycReview(field: Turf) {
    setKycField(field);
    const init: Record<string, "pending" | "verified" | "rejected"> = {};
    const docs = (field as any).kyc?.verification || field.verification || {};
    KYC_DOCS_FIELD.forEach((d) => {
      const vVal = docs[d.key];
      init[d.key] =
        vVal === true ? "verified" : vVal === false ? "rejected" : "pending";
    });
    setKycDocs(init);
  }
  function setDocStatus(key: string, s: "pending" | "verified" | "rejected") {
    setKycDocs((p) => ({ ...p, [key]: s }));
  }
  async function applyKycVerify() {
    if (!kycField) return;
    try {
      const verification: Record<string, boolean> = {};
      Object.entries(kycDocs).forEach(([key, status]) => {
        if (status === "verified") verification[key] = true;
        if (status === "rejected") verification[key] = false;
      });
      await reviewTurfDocuments(kycField.id, {
        status: "verified",
        reviewerNotes: "Approved via Portal.",
        verification,
      });
      showToast({
        title: "KYC Verified",
        description: `${kycField.name} KYC verified.`,
        tone: "success",
      });
      setKycField(null);
      refreshData();
    } catch (err: any) {
      showToast({ title: "Error", description: err.message, tone: "error" });
    }
  }
  async function applyKycReject() {
    if (!kycField) return;
    try {
      const verification: Record<string, boolean> = {};
      Object.entries(kycDocs).forEach(([key, status]) => {
        if (status === "verified") verification[key] = true;
        if (status === "rejected") verification[key] = false;
      });
      await reviewTurfDocuments(kycField.id, {
        status: "rejected",
        reviewerNotes: "Rejected via Portal.",
        verification,
      });
      showToast({
        title: "KYC Rejected",
        description: `${kycField.name} KYC rejected.`,
        tone: "error",
      });
      setKycField(null);
      refreshData();
    } catch (err: any) {
      showToast({ title: "Error", description: err.message, tone: "error" });
    }
  }
  async function applyKycResubmit() {
    if (!kycField) return;
    try {
      const verification: Record<string, boolean> = {};
      Object.entries(kycDocs).forEach(([key, status]) => {
        if (status === "verified") verification[key] = true;
        if (status === "rejected") verification[key] = false;
      });
      await reviewTurfDocuments(kycField.id, {
        status: "in_review",
        reviewerNotes: "Resubmission requested.",
        verification,
      });
      showToast({
        title: "Resubmission Requested",
        description: `Requested resubmission for ${kycField.name}.`,
        tone: "warning",
      });
      setKycField(null);
      refreshData();
    } catch (err: any) {
      showToast({ title: "Error", description: err.message, tone: "error" });
    }
  }
  async function saveKycReview() {
    if (!kycField) return;
    try {
      const verification: Record<string, boolean> = {};
      Object.entries(kycDocs).forEach(([key, status]) => {
        if (status === "verified") verification[key] = true;
        if (status === "rejected") verification[key] = false;
      });
      await reviewTurfDocuments(kycField.id, {
        status: "in_review",
        reviewerNotes: "Review progress saved.",
        verification,
      });
      showToast({
        title: "Progress Saved",
        description: "Verification states updated.",
        tone: "success",
      });
      setKycField(null);
      refreshData();
    } catch (err: any) {
      showToast({ title: "Error", description: err.message, tone: "error" });
    }
  }

  // Edit Helpers
  function onEdit(field: Turf) {
    setEditTurf(field);
    setEditForm({
      name: field.name,
      standardPricePaise: field.standardPricePaise,
      sports: field.sports,
      amenities: field.amenities,
      surfaceType: field.surfaceType,
      capacity: field.capacity,
      sizeFormat: field.sizeFormat,
      weekdayOpen: field.weekdayOpen,
      weekdayClose: field.weekdayClose,
      weekendOpen: field.weekendOpen,
      weekendClose: field.weekendClose,
      address: {
        ...field.address,
        type: field.address?.type || "other",
      },
    });
    setEditTab("basic");
  }

  async function saveEdit() {
    if (!editTurf || !editForm) return;
    try {
      // sanitize and ensure backend contract
      const payload: UpdateTurfDto = {
        ...editForm,
        address: editForm.address
          ? {
              type: editForm.address.type || "other",
              city: editForm.address.city,
              state: editForm.address.state,
              pinCode: editForm.address.pinCode,
              country: editForm.address.country || "India",
              houseNumber:
                editForm.address.houseNumber ||
                (editForm.address as any).plotNumber ||
                undefined,
              landmark: editForm.address.landmark || undefined,
              latitude: editForm.address.latitude
                ? Number(editForm.address.latitude)
                : undefined,
              longitude: editForm.address.longitude
                ? Number(editForm.address.longitude)
                : undefined,
              googleMapsLink: editForm.address.googleMapsLink || undefined,
            }
          : undefined,
      };

      await updateTurf(editTurf.id, payload);
      showToast({
        title: "Success",
        description: `${editTurf.name} updated successfully.`,
        tone: "success",
      });
      setEditTurf(null);
      setEditForm(null);
      refreshData();
    } catch (err: any) {
      showToast({
        title: "Error",
        description: err.message || "Failed to update field",
        tone: "error",
      });
    }
  }

  // Confirm actions
  async function handleConfirm() {
    if (!confirmModal) return;
    const { type, field } = confirmModal;
    try {
      if (type === "remove") {
        // await deleteTurf(field.id); // Assuming delete functionality is not yet available in api
        showToast({
          title: "Action Restricted",
          description: "Removing fields is currently restricted.",
          tone: "warning",
        });
      } else if (type === "ban") {
        await banTurf(field.id);
        showToast({
          title: "Banned",
          description: `${field.name} has been banned.`,
          tone: "error",
        });
      } else if (type === "unban") {
        await unbanTurf(field.id);
        showToast({
          title: "Reactivated",
          description: `${field.name} has been unbanned.`,
          tone: "success",
        });
      }
      setConfirmModal(null);
      refreshData();
    } catch (err: any) {
      showToast({
        title: "Error",
        description: err.message || "Action failed",
        tone: "error",
      });
    }
  }

  const sportRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sportRef.current && !sportRef.current.contains(e.target as Node))
        setSportOpen(false);
      if (cityRef.current && !cityRef.current.contains(e.target as Node))
        setCityOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (selected) {
      const match = fields.find((f) => f.id === selected.id);
      if (match) setSelected(match);
    }
  }, [fields]);

  const { showToast } = useToast();

  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [maintCount, setMaintCount] = useState(0);
  const [suspendedCount, setSuspendedCount] = useState(0);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [res, vRes] = await Promise.all([
        listTurfs({
          page,
          limit,
          status: statusTab === "all" ? undefined : statusTab,
          sportType:
            sportFilter === "All" ? undefined : sportFilter.toLowerCase(),
          city: cityFilter === "All" ? undefined : cityFilter,
          search: search.trim() || undefined,
        }),
        listVendors({ limit: 100 }),
      ]);

      setFields(res.items);
      setVendors(vRes.items);
      setTotal(res.total);

      // Counts from list
      setActiveCount(res.items.filter((f) => f.status === "active").length);
      setInactiveCount(res.items.filter((f) => f.status === "inactive").length);
      setPendingCount(res.items.filter((f) => f.status === "pending").length);
      setMaintCount(res.items.filter((f) => f.status === "maintenance").length);
      setSuspendedCount(
        res.items.filter((f) => f.status === "suspended").length,
      );
    } catch (err: any) {
      const isAuthError =
        err.message === "Unauthorized" ||
        err.message?.toLowerCase().includes("unauthorized") ||
        err.message?.toLowerCase().includes("unauthorised");

      showToast({
        title: isAuthError ? "Field data unavailable" : "Error",
        description: isAuthError
          ? "Unauthorised"
          : err.message || "Failed to load data",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [page, limit, statusTab, sportFilter, cityFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [statusTab, sportFilter, cityFilter, search]);

  const allSports = ["All", ...SPORTS_LIST];
  const allCities = [
    "All",
    "Mumbai",
    "Pune",
    "Bangalore",
    "Delhi",
    "Hyderabad",
    "Chennai",
    "Nashik",
  ];

  const filtered = fields.filter((f) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      f.name.toLowerCase().includes(q) ||
      (f.vendorBusinessName || "").toLowerCase().includes(q) ||
      (f.address?.city || "").toLowerCase().includes(q) ||
      f.id.toLowerCase().includes(q);
    return matchSearch;
  });

  const STATUS_TABS = [
    { key: "all", label: "All", count: total },
    { key: "active", label: "Active", count: activeCount },
    { key: "inactive", label: "Inactive", count: inactiveCount },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "maintenance", label: "Maintenance", count: maintCount },
    { key: "suspended", label: "Suspended", count: suspendedCount },
  ];

  const STAT_CARDS = [
    {
      label: "Total Fields",
      value: total,
      sub: "on platform",
      color: "#8a9e60",
      Icon: MapPin,
    },
    {
      label: "Active Today",
      value: activeCount,
      sub: "accepting bookings",
      color: "#22c55e",
      Icon: CheckCircle,
    },
    {
      label: "Inactive",
      value: inactiveCount,
      sub: "not accepting",
      color: "#9ca3af",
      Icon: XCircle,
    },
    {
      label: "Pending Approval",
      value: pendingCount,
      sub: "awaiting review",
      color: "#f59e0b",
      Icon: ClockCountdown,
    },
    {
      label: "Maintenance",
      value: maintCount,
      sub: "temporarily closed",
      color: "#3b82f6",
      Icon: Wrench,
    },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Stat cards + filters */}
      <div className="p-6 pb-0 shrink-0">
        {/* Stat cards */}
        <div className="grid grid-cols-5 gap-4 mb-5">
          {STAT_CARDS.map(({ label, value, sub, color, Icon }) => (
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
                  style={{ backgroundColor: color + "18" }}
                >
                  <Icon size={16} weight="fill" style={{ color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-64">
              <MagnifyingGlass size={14} className="text-gray-400 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search fields, vendors, cities..."
                className="bg-transparent text-gray-700 placeholder-gray-400 text-xs flex-1 outline-none"
              />
            </div>

            {/* Sport filter */}
            <div className="relative" ref={sportRef}>
              <button
                onClick={() => setSportOpen((o) => !o)}
                className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 bg-white hover:bg-gray-50 transition-colors"
              >
                <Funnel size={13} className="text-gray-400" />
                Sport: <span className="font-medium">{sportFilter}</span>
                <CaretDown size={11} className="text-gray-400" />
              </button>
              {sportOpen && (
                <div className="absolute top-10 left-0 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-10 min-w-[150px]">
                  {allSports.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSportFilter(s);
                        setSportOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                        sportFilter === s ? "font-semibold" : "text-gray-700"
                      }`}
                      style={sportFilter === s ? { color: "#8a9e60" } : {}}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* City filter */}
            <div className="relative" ref={cityRef}>
              <button
                onClick={() => setCityOpen((o) => !o)}
                className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 bg-white hover:bg-gray-50 transition-colors"
              >
                <MapPin size={13} className="text-gray-400" />
                City: <span className="font-medium">{cityFilter}</span>
                <CaretDown size={11} className="text-gray-400" />
              </button>
              {cityOpen && (
                <div className="absolute top-10 left-0 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-10 min-w-[150px]">
                  {allCities.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCityFilter(c);
                        setCityOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                        cityFilter === c ? "font-semibold" : "text-gray-700"
                      }`}
                      style={cityFilter === c ? { color: "#8a9e60" } : {}}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pending badge */}
            {pendingCount > 0 && (
              <div className="ml-auto flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs font-semibold text-amber-700">
                <ClockCountdown size={13} weight="fill" />
                {pendingCount} field{pendingCount > 1 ? "s" : ""} awaiting
                approval
              </div>
            )}

            {/* Onboard Field Button */}
            <button
              onClick={() => setShowOnboard(true)}
              className={`${pendingCount > 0 ? "" : "ml-auto"} flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 shrink-0`}
              style={{ backgroundColor: "#8a9e60" }}
            >
              <Plus size={16} weight="bold" />
              Onboard Field
            </button>
          </div>

          {/* Status tabs */}
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setStatusTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  statusTab === t.key
                    ? "text-white"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
                style={
                  statusTab === t.key ? { backgroundColor: "#8a9e60" } : {}
                }
              >
                {t.label}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    statusTab === t.key
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {[
                    "Field",
                    "Vendor",
                    "Location",
                    "Sports",
                    "Price",
                    "Rating",
                    "Status",
                    "KYC",
                    "Bookings",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {filtered.map((field, i) => {
                  const sc =
                    STATUS_CONFIG[field.status] || STATUS_CONFIG.pending;
                  const kycStatusValue =
                    (field as any).kyc?.status ||
                    field.kycStatus ||
                    "not_started";
                  const kyc =
                    KYC_CFG[kycStatusValue as keyof typeof KYC_CFG] ||
                    KYC_CFG.not_started;
                  const KycIcon = kyc.icon;

                  return (
                    <tr
                      key={field.id}
                      onClick={() => setSelected(field)}
                      className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${
                        selected?.id === field.id ? "bg-[#8a9e60]/5" : ""
                      } ${i < filtered.length - 1 ? "border-b border-gray-50" : ""}`}
                    >
                      {/* Field */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: "#8a9e60" }}
                          >
                            {avatar(field.name)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-800">
                              {field.name}
                            </p>
                            <p className="text-[9px] text-gray-400 font-mono break-all max-w-[120px]">
                              {field.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Vendor */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                            style={{ backgroundColor: "#8a9e60" }}
                          >
                            {(
                              field.vendorBusinessName ||
                              field.vendor?.businessName ||
                              "U"
                            )
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700 whitespace-nowrap">
                              {field.vendorBusinessName ||
                                field.vendor?.businessName ||
                                "Unknown"}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {field.vendorPhone || field.vendor?.phone || "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-700 font-medium">
                          {field.address?.city || "-"}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {field.address?.state || "-"}
                        </p>
                      </td>

                      {/* Sports */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 items-center">
                          {(field.sports || []).slice(0, 2).map((s) => (
                            <span
                              key={s}
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${SPORT_COLOR[s.toLowerCase()] ?? "bg-gray-100 text-gray-600"}`}
                            >
                              {s.replace(/_/g, " ")}
                            </span>
                          ))}
                          {(field.sports || []).length > 2 && (
                            <div className="relative group">
                              <span className="text-[10px] text-gray-400 font-bold bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 cursor-help hover:bg-gray-100 transition-colors">
                                +{(field.sports || []).length - 2}
                              </span>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                <div className="bg-white border border-gray-100 shadow-2xl rounded-xl p-3 min-w-[200px] max-w-[320px]">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                      All Sports Listed
                                    </p>
                                    <span className="text-[10px] font-bold text-[#8a9e60]">
                                      {(field.sports || []).length} Total
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(field.sports || []).map((s) => (
                                      <span
                                        key={s}
                                        className={`text-[10px] font-medium px-2 py-0.5 rounded ${SPORT_COLOR[s.toLowerCase()] ?? "bg-gray-100 text-gray-600"}`}
                                      >
                                        {s.replace(/_/g, " ")}
                                      </span>
                                    ))}
                                  </div>
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45 -mt-1.5" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3">
                        <p className="text-xs font-bold text-gray-800">
                          ₹
                          {(
                            (field.standardPricePaise || 0) / 100
                          ).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-400">per hour</p>
                      </td>

                      {/* Rating */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-gray-800">
                            {formatRating(field.rating)}
                          </span>
                          {(field.rating || 0) > 0 && (
                            <Star
                              size={12}
                              weight="fill"
                              className="text-amber-400"
                            />
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400">
                          {field.totalReviews || 0} review
                          {(field.totalReviews || 0) === 1 ? "" : "s"}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${sc.cls}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${sc.dot}`}
                          />
                          {sc.label}
                        </span>
                      </td>

                      {/* KYC */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${kyc.cls}`}
                        >
                          {KycIcon && <KycIcon size={10} weight="fill" />}
                          {kyc.label}
                        </span>
                      </td>

                      {/* Bookings */}
                      <td className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                        {field.totalBookings || 0}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setSelected(field)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="View">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => onEdit(field)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Edit">
                            <PencilSimple size={14} />
                          </button>
                          <div className="relative">
                            <button onClick={() => setActionMenu(actionMenu === field.id ? null : field.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                              <DotsThreeVertical size={14} />
                            </button>
                            {actionMenu === field.id && (
                              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[148px]">
                                {field.status === "banned" ? (
                                  <button onClick={() => { setActionMenu(null); setConfirmModal({ type: "unban", field }); }} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                    <CheckCircle size={13} className="text-green-500" />Unban
                                  </button>
                                ) : (
                                  <button onClick={() => { setActionMenu(null); setConfirmModal({ type: "ban", field }); }} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                    <XCircle size={13} className="text-amber-500" />Ban
                                  </button>
                                )}
                                <button onClick={() => { setActionMenu(null); openKycReview(field); }} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                  <ShieldCheck size={13} className="text-blue-500" />Review KYC
                                </button>
                                <div className="border-t border-gray-100 my-1" />
                                <button onClick={() => { setActionMenu(null); setConfirmModal({ type: "remove", field }); }} className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 flex items-center gap-2">
                                  <Trash size={13} />Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-20 text-center">
                      <Buildings
                        size={32}
                        className="text-gray-200 mx-auto mb-3"
                      />
                      <p className="text-sm text-gray-400">
                        No fields match your filters
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <DashboardPagination
            page={page}
            total={total}
            limit={limit}
            onPageChange={setPage}
            label="fields"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          ONBOARD FIELD MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {showOnboard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-7 pt-6 pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Onboard New Field
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Step {onboardStep} of {ONBOARD_STEPS.length} —{" "}
                    {ONBOARD_STEPS[onboardStep - 1]}
                  </p>
                </div>
                <button
                  onClick={closeOnboard}
                  className="text-gray-400 hover:text-gray-600 mt-1"
                >
                  <X size={20} />
                </button>
              </div>
              {/* Step indicator */}
              <div className="flex items-center">
                {ONBOARD_STEPS.map((label, i) => {
                  const n = i + 1;
                  const done = n < onboardStep;
                  const active = n === onboardStep;
                  return (
                    <div
                      key={n}
                      className="flex items-center flex-1 last:flex-none"
                    >
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div
                          className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all"
                          style={{
                            backgroundColor:
                              done || active ? "#8a9e60" : "#f3f4f6",
                            color: done || active ? "white" : "#9ca3af",
                          }}
                        >
                          {done ? <CheckCircle size={15} weight="fill" /> : n}
                        </div>
                        <span
                          className="text-[9px] font-semibold whitespace-nowrap"
                          style={{ color: active ? "#8a9e60" : "#9ca3af" }}
                        >
                          {label}
                        </span>
                      </div>
                      {i < ONBOARD_STEPS.length - 1 && (
                        <div
                          className="flex-1 h-px mb-4 mx-1.5 transition-all"
                          style={{
                            backgroundColor: done ? "#8a9e60" : "#e5e7eb",
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto px-7 py-5">
              {onboardStep === 1 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-2">
                    <p className="text-xs text-blue-700 font-medium">
                      A field must be linked to an existing vendor account on
                      the platform.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Select Vendor *
                    </label>
                    <select
                      value={formData.vendorId}
                      onChange={(e) => setField("vendorId", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] bg-white"
                    >
                      <option value="">Select a vendor...</option>
                      {vendorsList.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.businessName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {onboardStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Field Name *
                    </label>
                    <input
                      value={formData.name}
                      onChange={(e) => setField("name", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                      placeholder="e.g. Turf Arena A"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Sports Offered *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SPORTS_LIST.map((s) => {
                        const sel = formData.sports.includes(s);
                        return (
                          <button
                            key={s}
                            onClick={() => toggleArr("sports", s)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                            style={
                              sel
                                ? {
                                    backgroundColor: "#8a9e60",
                                    color: "white",
                                    borderColor: "transparent",
                                  }
                                : { borderColor: "#e5e7eb", color: "#6b7280" }
                            }
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Capacity
                      </label>
                      <input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setField("capacity", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Size / Format
                      </label>
                      <input
                        value={formData.size}
                        onChange={(e) => setField("size", e.target.value)}
                        placeholder="e.g. 5-a-side"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Surface Type
                      </label>
                      <select
                        value={formData.surface}
                        onChange={(e) => setField("surface", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white"
                      >
                        {SURFACE_LIST.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Address Type *
                      </label>
                      <div className="flex gap-3">
                        {["home", "work", "other"].map((t) => (
                          <button
                            key={t}
                            onClick={() =>
                              setFormData((p) => ({
                                ...p,
                                address: { ...p.address, type: t as any },
                              }))
                            }
                            className="flex-1 py-2 rounded-lg border text-xs font-medium capitalize transition-colors"
                            style={
                              formData.address.type === t
                                ? {
                                    backgroundColor: "#8a9e60",
                                    color: "white",
                                    borderColor: "transparent",
                                  }
                                : { borderColor: "#e5e7eb", color: "#6b7280" }
                            }
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        House / Shop Number
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
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                        placeholder="e.g. 402, Building A"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
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
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                        placeholder="e.g. Near City Mall"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
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
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                        placeholder="Mumbai"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        State *
                      </label>
                      <select
                        value={formData.address.state}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            address: { ...p.address, state: e.target.value },
                          }))
                        }
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] bg-white"
                      >
                        <option value="">Select state</option>
                        {STATES_LIST.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
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
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                        placeholder="400001"
                        maxLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Country *
                      </label>
                      <input
                        value={formData.address.country}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            address: { ...p.address, country: e.target.value },
                          }))
                        }
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                        placeholder="India"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Google Maps Link
                      </label>
                      <input
                        value={formData.address.googleMapsLink}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            address: {
                              ...p.address,
                              googleMapsLink: e.target.value,
                            },
                          }))
                        }
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                        placeholder="Paste maps URL"
                      />
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 4 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3 pb-4 border-b border-gray-100">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Standard Price / Hr *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={formData.pricePerHour}
                          onChange={(e) =>
                            setField("pricePerHour", e.target.value)
                          }
                          className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Cancellation Window (hrs)
                      </label>
                      <input
                        type="number"
                        value={formData.cancellationWindowHrs}
                        onChange={(e) =>
                          setField("cancellationWindowHrs", e.target.value)
                        }
                        placeholder="e.g. 2"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Weekday Hours
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="time"
                          value={formData.weekdayFrom}
                          onChange={(e) =>
                            setField("weekdayFrom", e.target.value)
                          }
                          className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-800"
                        />
                        <span className="text-gray-400 text-xs shrink-0">
                          to
                        </span>
                        <input
                          type="time"
                          value={formData.weekdayTo}
                          onChange={(e) =>
                            setField("weekdayTo", e.target.value)
                          }
                          className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-800"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Weekend Hours
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="time"
                          value={formData.weekendFrom}
                          onChange={(e) =>
                            setField("weekendFrom", e.target.value)
                          }
                          className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-800"
                        />
                        <span className="text-gray-400 text-xs shrink-0">
                          to
                        </span>
                        <input
                          type="time"
                          value={formData.weekendTo}
                          onChange={(e) =>
                            setField("weekendTo", e.target.value)
                          }
                          className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 5 && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-700">
                    Select all amenities available at this specific field.
                  </p>
                  <div className="flex flex-wrap gap-2.5 mt-4">
                    {FACILITIES_LIST.map((f) => {
                      const sel = formData.facilities.includes(f);
                      return (
                        <button
                          key={f}
                          onClick={() => toggleArr("facilities", f)}
                          className="px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors"
                          style={
                            sel
                              ? {
                                  backgroundColor: "#8a9e60",
                                  color: "white",
                                  borderColor: "transparent",
                                }
                              : { borderColor: "#e5e7eb", color: "#6b7280" }
                          }
                        >
                          {f}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {onboardStep === 6 && (
                <div className="space-y-4">
                  <div className="bg-[#8a9e60]/5 border border-[#8a9e60]/20 rounded-xl p-3 mb-2 flex items-start gap-3">
                    <ShieldCheck
                      size={20}
                      className="text-[#8a9e60] shrink-0"
                      weight="fill"
                    />
                    <div>
                      <p className="text-[11px] text-[#8a9e60] font-bold uppercase tracking-wider">
                        Field Documents Required
                      </p>
                      <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                        Please upload required legal documentation for this
                        specific field.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {KYC_DOCS_FIELD.map((doc) => {
                      const files = onboardKycFiles[doc.key];
                      const hasFiles =
                        Array.isArray(files) ? files.length > 0 : !!files;
                      const isPhotoField = doc.key === "fieldPhotos";

                      return (
                        <div key={doc.key} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                              {doc.label}
                            </label>
                            {isPhotoField && Array.isArray(files) && (
                              <span className="text-[9px] font-bold text-[#8a9e60]">
                                {files.length}/5
                              </span>
                            )}
                          </div>

                          {/* List of uploaded files */}
                          {hasFiles && (
                            <div className="space-y-1 mb-2">
                              {Array.isArray(files) ? (
                                files.map((f, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 group/item"
                                  >
                                    <span className="text-[10px] text-gray-600 font-medium truncate max-w-[120px]">
                                      {f.name}
                                    </span>
                                    <KycFileActions
                                      file={f}
                                      showBadge={false}
                                      onRemove={() => {
                                        setOnboardKycFiles((prev) => {
                                          const next = { ...prev };
                                          const arr = (next[doc.key] as File[]).filter(
                                            (_, i) => i !== idx
                                          );
                                          if (arr.length === 0) delete next[doc.key];
                                          else next[doc.key] = arr;
                                          return next;
                                        });
                                      }}
                                    />
                                  </div>
                                ))
                              ) : (
                                <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 group/item">
                                  <span className="text-[10px] text-gray-600 font-medium truncate max-w-[120px]">
                                    {(files as File).name}
                                  </span>
                                  <KycFileActions
                                    file={files as File}
                                    showBadge={false}
                                    onRemove={() => {
                                      setOnboardKycFiles((prev) => {
                                        const next = { ...prev };
                                        delete next[doc.key];
                                        return next;
                                      });
                                      setField(doc.key as any, "");
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Upload trigger */}
                          {(!hasFiles || (isPhotoField && Array.isArray(files) && files.length < 5)) && (
                            <div
                              onClick={() => {
                                setUploadingDocKey(doc.key);
                                onboardingFileInputRef.current?.click();
                              }}
                              className="relative group cursor-pointer border-2 border-dashed border-gray-200 rounded-xl p-3 hover:border-[#8a9e60] transition-all bg-gray-50/50"
                            >
                              <div className="flex flex-col items-center justify-center gap-1.5 text-center">
                                <UploadSimple
                                  size={20}
                                  className="text-gray-300 group-hover:text-[#8a9e60]"
                                />
                                <p className="text-[10px] text-gray-400 group-hover:text-gray-600 font-medium">
                                  {isPhotoField ? "Add Photo" : "Click to upload"}
                                </p>
                              </div>
                            </div>
                          )}

                          <p className="text-[9px] text-gray-400 leading-tight italic">
                            {doc.hint}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Hidden Global Input */}
                  <input
                    type="file"
                    ref={onboardingFileInputRef}
                    onChange={handleOnboardFileSelect}
                    className="hidden"
                    multiple={uploadingDocKey === "fieldPhotos"}
                    accept={
                      uploadingDocKey === "fieldPhotos"
                        ? "image/*"
                        : ".pdf,image/*"
                    }
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-7 py-4 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
              <button
                onClick={() =>
                  onboardStep > 1
                    ? setOnboardStep((s) => s - 1)
                    : closeOnboard()
                }
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-white transition-colors bg-white disabled:opacity-50"
              >
                <ArrowLeft size={15} />
                {onboardStep === 1 ? "Cancel" : "Back"}
              </button>
              <button
                disabled={isSubmitting}
                onClick={async () => {
                  if (onboardStep === 1 && !formData.vendorId) {
                    showToast({
                      title: "Selection Required",
                      description: "Please select a vendor first",
                      tone: "error",
                    });
                    return;
                  }
                  if (onboardStep < ONBOARD_STEPS.length) {
                    setOnboardStep((s) => s + 1);
                  } else {
                    await onOnboard();
                  }
                }}
                className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#8a9e60" }}
              >
                {isSubmitting
                  ? "Processing..."
                  : onboardStep === ONBOARD_STEPS.length
                    ? "Submit & Onboard"
                    : "Continue"}
                {!isSubmitting && onboardStep < ONBOARD_STEPS.length && (
                  <CaretRight size={15} />
                )}
                {isSubmitting && (
                  <ClockCountdown size={15} className="animate-spin" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          KYC REVIEW MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {kycField && (
        <TurfKycUpload
          turf={kycField}
          onClose={() => setKycField(null)}
          onSuccess={async () => {
            await refreshData();
            // Also refresh the specific field to avoid stale state in the modal
            try {
              const updated = await getTurfById(kycField.id);
              setKycField(updated);
              if (selected?.id === updated.id) {
                setSelected(updated);
              }
            } catch {}
          }}
        />
      )}

      {/* Detail panel overlay */}
      {selected && (
        <>
          <div
            className="fixed inset-0 bg-black/10 z-40"
            onClick={() => setSelected(null)}
          />
          <FieldDetailPanel
            field={selected}
            onClose={() => setSelected(null)}
            onRefresh={refreshData}
            onReviewKyc={openKycReview}
            onConfirmAction={(type, f) => setConfirmModal({ type, field: f })}
            onEdit={onEdit}
          />
        </>
      )}

      {/* Click-away */}
      {actionMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setActionMenu(null)}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          EDIT FIELD MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {editTurf && editForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-7 pt-6 pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Edit Field Details
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {editTurf.name} · {editTurf.id}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditTurf(null);
                    setEditForm(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex gap-1 border-b border-gray-100 -mb-4">
                {(["basic", "pricing", "sports"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setEditTab(tab)}
                    className={`px-4 py-2 text-xs font-semibold capitalize transition-colors ${editTab === tab ? "border-b-2 text-[#8a9e60]" : "text-gray-400 hover:text-gray-600"}`}
                    style={editTab === tab ? { borderColor: "#8a9e60" } : {}}
                  >
                    {tab === "basic"
                      ? "Basic Info"
                      : tab === "pricing"
                        ? "Pricing & Schedule"
                        : "Sports & Amenities"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-6">
              {editTab === "basic" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Field Name *
                    </label>
                    <input
                      value={editForm.name || ""}
                      onChange={(e) =>
                        setEditForm((p) =>
                          p ? { ...p, name: e.target.value } : p,
                        )
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                      placeholder="Field Name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Size Format
                      </label>
                      <input
                        value={editForm.sizeFormat || ""}
                        onChange={(e) =>
                          setEditForm((p) =>
                            p ? { ...p, sizeFormat: e.target.value } : p,
                          )
                        }
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                        placeholder="e.g. 5v5, 7v7"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Capacity
                      </label>
                      <input
                        type="number"
                        value={editForm.capacity || ""}
                        onChange={(e) =>
                          setEditForm((p) =>
                            p
                              ? { ...p, capacity: parseInt(e.target.value) }
                              : p,
                          )
                        }
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                        placeholder="Max persons"
                      />
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Location / Address
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          Address Type *
                        </label>
                        <select
                          value={editForm.address?.type || "other"}
                          onChange={(e) =>
                            setEditForm((p) =>
                              p
                                ? {
                                    ...p,
                                    address: {
                                      ...p.address!,
                                      type: e.target.value as any,
                                    },
                                  }
                                : p
                            )
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] bg-white"
                        >
                          <option value="home">Home</option>
                          <option value="work">Work</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          House/Plot Number
                        </label>
                        <input
                          value={
                            editForm.address?.houseNumber ||
                            (editForm.address as any).plotNumber ||
                            ""
                          }
                          onChange={(e) =>
                            setEditForm((p) =>
                              p
                                ? {
                                    ...p,
                                    address: {
                                      ...p.address!,
                                      houseNumber: e.target.value,
                                    },
                                  }
                                : p
                            )
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                          placeholder="e.g. Plot 12"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          City *
                        </label>
                        <input
                          value={editForm.address?.city || ""}
                          onChange={(e) =>
                            setEditForm((p) =>
                              p
                                ? {
                                    ...p,
                                    address: {
                                      ...p.address!,
                                      city: e.target.value,
                                    },
                                  }
                                : p
                            )
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                        />
                      </div>
                    </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          State *
                        </label>
                        <select
                          value={editForm.address?.state || ""}
                          onChange={(e) =>
                            setEditForm((p) =>
                              p
                                ? {
                                    ...p,
                                    address: {
                                      ...p.address!,
                                      state: e.target.value,
                                    },
                                  }
                                : p,
                            )
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] bg-white"
                        >
                          <option value="">Select State</option>
                          {STATES_LIST.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          Pincode *
                        </label>
                        <input
                          value={editForm.address?.pinCode || ""}
                          onChange={(e) =>
                            setEditForm((p) =>
                              p
                                ? {
                                    ...p,
                                    address: {
                                      ...p.address!,
                                      pinCode: e.target.value,
                                    },
                                  }
                                : p,
                            )
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                          maxLength={6}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editTab === "pricing" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Price per Hour (₹) *
                    </label>
                    <input
                      type="number"
                      value={(editForm.standardPricePaise || 0) / 100}
                      onChange={(e) =>
                        setEditForm((p) =>
                          p
                            ? {
                                ...p,
                                standardPricePaise: Math.round(
                                  parseFloat(e.target.value) * 100,
                                ),
                              }
                            : p,
                        )
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                    />
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Operating Schedule
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Weekday Open
                        </label>
                        <input
                          type="time"
                          value={editForm.weekdayOpen || ""}
                          onChange={(e) =>
                            setEditForm((p) =>
                              p ? { ...p, weekdayOpen: e.target.value } : p,
                            )
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Weekday Close
                        </label>
                        <input
                          type="time"
                          value={editForm.weekdayClose || ""}
                          onChange={(e) =>
                            setEditForm((p) =>
                              p ? { ...p, weekdayClose: e.target.value } : p,
                            )
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Weekend Open
                        </label>
                        <input
                          type="time"
                          value={editForm.weekendOpen || ""}
                          onChange={(e) =>
                            setEditForm((p) =>
                              p ? { ...p, weekendOpen: e.target.value } : p,
                            )
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Weekend Close
                        </label>
                        <input
                          type="time"
                          value={editForm.weekendClose || ""}
                          onChange={(e) =>
                            setEditForm((p) =>
                              p ? { ...p, weekendClose: e.target.value } : p,
                            )
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editTab === "sports" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Sports *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SPORTS_LIST.map((s) => {
                        const sel = editForm.sports?.includes(
                          s.toLowerCase().replace(/ /g, "_") as any,
                        );
                        return (
                          <button
                            key={s}
                            onClick={() => {
                              const slug = s
                                .toLowerCase()
                                .replace(/ /g, "_") as any;
                              setEditForm((p) => {
                                if (!p) return p;
                                const sports = p.sports || [];
                                return {
                                  ...p,
                                  sports: sports.includes(slug)
                                    ? sports.filter((x) => x !== slug)
                                    : [...sports, slug],
                                };
                              });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${sel ? "bg-[#8a9e60] text-white border-transparent" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Amenities
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {FACILITIES_LIST.map((f) => {
                        const slug = f.toLowerCase().replace(/ /g, "_") as any;
                        const sel = editForm.amenities?.includes(slug);
                        return (
                          <button
                            key={f}
                            onClick={() => {
                              setEditForm((p) => {
                                if (!p) return p;
                                const amenities = p.amenities || [];
                                return {
                                  ...p,
                                  amenities: amenities.includes(slug)
                                    ? amenities.filter((x) => x !== slug)
                                    : [...amenities, slug],
                                };
                              });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${sel ? "bg-[#8a9e60] text-white border-transparent" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                          >
                            {f}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-7 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0 bg-gray-50/50">
              <button
                onClick={() => {
                  setEditTurf(null);
                  setEditForm(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-white transition-colors bg-white"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-6 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#8a9e60" }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${confirmModal.type === "remove" ? "bg-red-50 text-red-600" : confirmModal.type === "ban" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}
              >
                {confirmModal.type === "remove" ? (
                  <Trash size={24} weight="bold" />
                ) : confirmModal.type === "ban" ? (
                  <XCircle size={24} weight="bold" />
                ) : (
                  <CheckCircle size={24} weight="bold" />
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 capitalize">
                {confirmModal.type} Field
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Are you sure you want to {confirmModal.type}{" "}
                <b>{confirmModal.field.name}</b>? This action may have immediate
                impact on field visibility and bookings.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-opacity hover:opacity-90 ${confirmModal.type === "remove" ? "bg-red-500" : confirmModal.type === "ban" ? "bg-amber-500" : "bg-[#8a9e60]"}`}
              >
                Confirm{" "}
                {confirmModal.type.charAt(0).toUpperCase() +
                  confirmModal.type.slice(1)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
