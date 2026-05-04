"use client";

import {
  ArrowsClockwise,
  ArrowSquareOut,
  Buildings,
  CalendarBlank,
  CaretDown,
  CaretLeft,
  CaretRight,
  CheckCircle,
  CircleNotch,
  ClockCountdown,
  DotsThreeVertical,
  Eye,
  MagnifyingGlass,
  MapPin,
  PencilSimple,
  Plus,
  Prohibit,
  Star,
  WarningCircle,
  Wrench,
  X,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardPagination } from "@/components/DashboardPagination";
import { TableRowsSkeleton } from "@/components/LoadingSkeleton";
import Select from "@/components/Select";
import { useToast } from "@/features/toast/toast-context";
import {
  banTurf,
  createTurfForVendor,
  deleteTurfReview,
  getTurfReviews,
  listTurfs,
  Turf,
  TurfReview,
  TurfStatus,
  updateTurf,
  updateTurfStatus,
  unbanTurf,
  STATUS_CONFIG,
} from "@/features/turfs";
import {
  AdminSlot,
  generateAdminSlots,
  getAdminSlotConfig,
  getAdminSlots,
  patchAdminSlot,
  SLOT_STATUS_COLORS,
  SlotConfig,
  upsertAdminSlotConfig,
  type AdminSlotPatchPayload,
  type UpsertSlotConfigPayload,
} from "@/features/slots";
import { generateDefaultDailyConfigs } from "@/features/slots/utils";
import { SlotConfigEditor } from "@/features/slots/components/SlotConfigEditor";
import { listVendors, Vendor, SPORT_COLOR, SPORTS_LIST } from "@/features/vendors";
import { listArenas, Arena } from "@/features/arenas";

type SearchBy =
  | "turf_name"
  | "turf_id"
  | "vendor_business_name"
  | "city"
  | "state";

type ConfirmAction =
  | "activate"
  | "deactivate"
  | "maintenance"
  | "suspend"
  | "unsuspend"
  | "ban"
  | "unban";

const SEARCH_OPTIONS: {
  value: SearchBy;
  label: string;
  placeholder: string;
}[] = [
  { value: "turf_name", label: "Turf Name", placeholder: "Search by turf name" },
  { value: "turf_id", label: "Turf ID", placeholder: "Search by turf UUID" },
  {
    value: "vendor_business_name",
    label: "Vendor Business Name",
    placeholder: "Search by vendor business name",
  },
  { value: "city", label: "City", placeholder: "Search by city" },
  { value: "state", label: "State", placeholder: "Search by state" },
];

const STATUS_TABS: Array<"all" | TurfStatus> = [
  "all",
  "active",
  "pending",
  "inactive",
  "maintenance",
  "suspended",
  "banned",
];

const SURFACE_OPTIONS = [
  { label: "Artificial Turf", value: "artificial_turf" },
  { label: "Natural Grass", value: "natural_grass" },
  { label: "Concrete", value: "concrete" },
  { label: "Wooden", value: "wooden" },
  { label: "Synthetic", value: "synthetic" },
];

const SPORT_OPTIONS = SPORTS_LIST.map((sport) => ({
  value: sport,
  label: sport.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
}));

type OnboardForm = {
  vendorId: string;
  arenaId: string;
  name: string;
  sport: string;
  surfaceType: string;
  capacity: string;
  sizeFormat: string;
  standardPrice: string;
  cancellationWindowHrs: string;
  weekdayOpen: string;
  weekdayClose: string;
  weekendOpen: string;
  weekendClose: string;
  slotConfig: UpsertSlotConfigPayload;
};

type EditForm = {
  name: string;
  sport: string;
  surfaceType: string;
  capacity: string;
  sizeFormat: string;
  standardPrice: string;
  cancellationWindowHrs: string;
  weekdayOpen: string;
  weekdayClose: string;
  weekendOpen: string;
  weekendClose: string;
};

const INITIAL_ONBOARD_FORM: OnboardForm = {
  vendorId: "",
  arenaId: "",
  name: "",
  sport: "",
  surfaceType: "artificial_turf",
  capacity: "14",
  sizeFormat: "5-a-side",
  standardPrice: "800",
  cancellationWindowHrs: "24",
  weekdayOpen: "06:00",
  weekdayClose: "23:00",
  weekendOpen: "06:00",
  weekendClose: "23:00",
  slotConfig: {
    slotDurationMins: 60,
    dailyConfigs: [],
  },
};

const TODAY = new Date();

function avatar(name?: string | null) {
  if (!name) return "TF";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatLabel(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatRating(score?: number) {
  if (!score || score <= 0) return "—";
  return score.toFixed(1);
}

function fmtDate(value: Date) {
  return value.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function dateKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function getReviewerName(review: TurfReview) {
  const first = review.user?.firstName?.trim() || "";
  const last = review.user?.lastName?.trim() || "";
  return `${first} ${last}`.trim() || "Anonymous User";
}

function DetailPanel({
  turf,
  onClose,
  onRefresh,
  onEdit,
  onRequestAction,
}: {
  turf: Turf;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onEdit: (turf: Turf) => void;
  onRequestAction: (action: ConfirmAction, turf: Turf) => void;
}) {
  const { showToast } = useToast();
  const [tab, setTab] = useState<
    "overview" | "reviews" | "schedule" | "analytics"
  >("overview");
  const [reviews, setReviews] = useState<TurfReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsLoadedFor, setReviewsLoadedFor] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  const [scheduleDate, setScheduleDate] = useState<Date>(new Date(TODAY));
  const [calOpen, setCalOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(TODAY.getMonth());
  const [calYear, setCalYear] = useState(TODAY.getFullYear());
  const calRef = useRef<HTMLDivElement>(null);

  const [slots, setSlots] = useState<AdminSlot[]>([]);
  const [config, setConfig] = useState<SlotConfig | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [generatingSlots, setGeneratingSlots] = useState(false);
  const [slotToEdit, setSlotToEdit] = useState<AdminSlot | null>(null);
  const [slotPriceInput, setSlotPriceInput] = useState("");
  const [slotBlockReason, setSlotBlockReason] = useState("");
  const [savingSlot, setSavingSlot] = useState(false);
  const statusCfg = STATUS_CONFIG[turf.status] || STATUS_CONFIG.pending;

  const refreshSlots = useCallback(async () => {
    setSlotsLoading(true);
    try {
      setSlots(await getAdminSlots(turf.id, dateKey(scheduleDate)));
    } catch (err: any) {
      showToast({
        title: "Could not load slots",
        description: err.message || "Failed to load slots",
        tone: "error",
      });
    } finally {
      setSlotsLoading(false);
    }
  }, [scheduleDate, showToast, turf.id]);

  const refreshConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      setConfig(await getAdminSlotConfig(turf.id));
    } catch {
      setConfig(null);
    } finally {
      setConfigLoading(false);
    }
  }, [turf.id]);

  const loadReviews = useCallback(
    async (force = false) => {
      if (!force && reviewsLoadedFor === turf.id) return;
      setReviewsLoading(true);
      try {
        setReviews(await getTurfReviews(turf.id));
        setReviewsLoadedFor(turf.id);
      } catch (err: any) {
        showToast({
          title: "Could not load reviews",
          description: err.message || "Failed to load reviews",
          tone: "error",
        });
      } finally {
        setReviewsLoading(false);
      }
    },
    [reviewsLoadedFor, showToast, turf.id],
  );

  useEffect(() => {
    if (tab === "reviews") void loadReviews();
    if (tab === "schedule") {
      void refreshSlots();
      void refreshConfig();
    }
  }, [tab, loadReviews, refreshSlots, refreshConfig]);

  useEffect(() => {
    setTab("overview");
    setReviews([]);
    setReviewsLoadedFor(null);
    setSlots([]);
    setConfig(null);
    setSlotToEdit(null);
  }, [turf.id]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(event.target as Node)) {
        setCalOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const handleDeleteReview = async (review: TurfReview) => {
    setDeletingReviewId(review.id);
    try {
      await deleteTurfReview(turf.id, review.id);
      await Promise.all([loadReviews(true), onRefresh()]);
      showToast({
        title: "Review deleted",
        description: "The review summary has been refreshed.",
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
  };

  const handleSaveSlotConfig = async () => {
    if (!config) return;
    setSavingConfig(true);
    try {
      await upsertAdminSlotConfig(turf.id, {
        slotDurationMins: config.slotDurationMins,
        dailyConfigs: config.dailyConfigs,
      });
      showToast({
        title: "Slot config saved",
        description: "Slot timing and pricing rules updated.",
        tone: "success",
      });
      await refreshConfig();
    } catch (err: any) {
      showToast({
        title: "Save failed",
        description: err.message || "Could not save slot config",
        tone: "error",
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleGenerateSlots = async () => {
    setGeneratingSlots(true);
    try {
      await generateAdminSlots(turf.id);
      showToast({
        title: "Slots generated",
        description: "Upcoming slots were generated successfully.",
        tone: "success",
      });
      await refreshSlots();
    } catch (err: any) {
      showToast({
        title: "Generation failed",
        description: err.message || "Could not generate slots",
        tone: "error",
      });
    } finally {
      setGeneratingSlots(false);
    }
  };

  const openSlotEditor = (slot: AdminSlot) => {
    setSlotToEdit(slot);
    setSlotPriceInput((slot.pricePaise / 100).toString());
    setSlotBlockReason(slot.blockReason || "");
  };

  const handleUpdateSlot = async (payload: AdminSlotPatchPayload) => {
    if (!slotToEdit) return;
    setSavingSlot(true);
    try {
      await patchAdminSlot(slotToEdit.slotId, payload);
      setSlotToEdit(null);
      await refreshSlots();
      showToast({
        title: "Slot updated",
        description: "Slot changes saved successfully.",
        tone: "success",
      });
    } catch (err: any) {
      showToast({
        title: "Update failed",
        description: err.message || "Could not update slot",
        tone: "error",
      });
    } finally {
      setSavingSlot(false);
    }
  };

  const shiftDate = (delta: number) => {
    const next = new Date(scheduleDate);
    next.setDate(next.getDate() + delta);
    setScheduleDate(next);
    setCalMonth(next.getMonth());
    setCalYear(next.getFullYear());
  };

  const bookedCount = slots.filter((slot) => slot.status === "booked").length;
  const maintenanceCount = slots.filter(
    (slot) => slot.status === "maintenance",
  ).length;
  const availableCount = slots.filter((slot) => slot.status === "available").length;
  const heldCount = slots.filter((slot) => slot.status === "held").length;
  const reservedCount = slots.filter((slot) => slot.status === "reserved").length;
  const occupancyPct = slots.length
    ? Math.round((bookedCount / slots.length) * 100)
    : 0;

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
  const calendarDays: (Date | null)[] = [];
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  for (let i = 0; i < firstDay; i += 1) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    calendarDays.push(new Date(calYear, calMonth, day));
  }

  return (
    <div className="fixed right-0 top-0 bottom-0 z-50 flex w-[420px] flex-col overflow-hidden border-l border-gray-100 bg-white shadow-2xl">
      <div
        className="shrink-0 px-5 py-4"
        style={{ background: "linear-gradient(135deg,#8a9e60,#6e8245)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 pr-3">
            <p className="mb-0.5 text-[11px] font-medium text-white/60">{turf.id}</p>
            <h2 className="truncate text-base font-bold leading-tight text-white">
              {turf.name}
            </h2>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/60">
              <MapPin size={10} />
              {turf.address?.city || "—"}, {turf.address?.state || "—"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white">
                <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label.toUpperCase()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-white/60 transition-colors hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex shrink-0 border-b border-gray-100 bg-white">
        {(["overview", "reviews", "schedule", "analytics"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${
              tab === key
                ? "border-b-2 border-[#8a9e60] text-[#8a9e60]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-lg font-bold text-gray-800">
                  ₹{((turf.standardPricePaise || 0) / 100).toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400">per hour</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-lg font-bold text-gray-800">
                  {turf.capacity || "-"}
                </p>
                <p className="text-[10px] text-gray-400">capacity</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <div className="flex items-center justify-center gap-0.5">
                  <p className="text-lg font-bold text-gray-800">
                    {formatRating(turf.rating)}
                  </p>
                  {turf.rating ? (
                    <Star size={11} weight="fill" className="mb-0.5 text-amber-400" />
                  ) : null}
                </div>
                <p className="text-[10px] text-gray-400">
                  {turf.totalReviews ? `${turf.totalReviews} reviews` : "No reviews"}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Turf Details
              </p>
              <div className="space-y-2.5">
                {[
                  ["Sport", formatLabel(turf.sport)],
                  ["Surface", formatLabel(turf.surfaceType)],
                  ["Size / Format", turf.sizeFormat || "-"],
                  ["Capacity", turf.capacity ? `${turf.capacity} players` : "-"],
                  [
                    "Operating Hours",
                    `${turf.weekdayOpen.slice(0, 5)} – ${turf.weekdayClose.slice(0, 5)}`,
                  ],
                  [
                    "Standard Price",
                    `₹${((turf.standardPricePaise || 0) / 100).toLocaleString()} / hr`,
                  ],
                  [
                    "Listed Since",
                    new Date(turf.createdAt || new Date()).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-gray-400">{label}</span>
                    <span className="max-w-[55%] text-right font-medium text-gray-700">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Arena
              </p>
              <div className="rounded-xl bg-gray-50 p-3.5">
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: "#8a9e60" }}
                  >
                    {avatar(turf.arenaName || "Arena")}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {turf.arenaName || "Unknown Arena"}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Arena status: {formatLabel(turf.arenaStatus)}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Arena docs: {formatLabel(turf.arenaKycStatus)}
                    </p>
                  </div>
                </div>
                <a
                  href="/dashboard/arenas"
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Buildings size={13} />
                  Open Arenas
                </a>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Vendor
              </p>
              <div className="rounded-xl bg-gray-50 p-3.5">
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: "#8a9e60" }}
                  >
                    {avatar(turf.vendorBusinessName || turf.vendor?.businessName || "Vendor")}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {turf.vendorBusinessName || turf.vendor?.businessName || "Unknown"}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {turf.vendor?.email || "No email"}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {turf.vendorPhone || turf.vendor?.phone || "No phone"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onEdit(turf)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-100"
              >
                Edit Turf
              </button>
              {turf.status === "active" ? (
                <button
                  onClick={() => onRequestAction("deactivate", turf)}
                  className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100"
                >
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => onRequestAction("activate", turf)}
                  className="rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 transition-colors hover:bg-green-100"
                >
                  Activate
                </button>
              )}
              {turf.status === "maintenance" ? (
                <button
                  onClick={() => onRequestAction("activate", turf)}
                  className="rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 transition-colors hover:bg-green-100"
                >
                  End Maintenance
                </button>
              ) : (
                <button
                  onClick={() => onRequestAction("maintenance", turf)}
                  className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100"
                >
                  Maintenance
                </button>
              )}
              {turf.status === "banned" ? (
                <button
                  onClick={() => onRequestAction("unban", turf)}
                  className="rounded-xl border border-gray-900 bg-gray-900 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-black"
                >
                  Unban
                </button>
              ) : (
                <button
                  onClick={() => onRequestAction("ban", turf)}
                  className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-100"
                >
                  Ban
                </button>
              )}
            </div>
          </div>
        )}

        {tab === "reviews" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Average Rating
                </p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold text-gray-800">
                    {formatRating(turf.rating)}
                  </p>
                  {(turf.rating || 0) > 0 ? (
                    <Star size={16} weight="fill" className="text-amber-400" />
                  ) : null}
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Total Reviews
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {turf.totalReviews || 0}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  User Feedback
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Moderate comments directly from this panel.
                </p>
              </div>
              <button
                onClick={() => void loadReviews(true)}
                disabled={reviewsLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
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
                    <div className="mb-2 h-3 w-24 rounded bg-gray-200" />
                    <div className="mb-3 h-3 w-40 rounded bg-gray-200" />
                    <div className="h-3 w-full rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                <Star size={24} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-semibold text-gray-600">No reviews yet</p>
                <p className="mt-1 text-xs text-gray-400">
                  Ratings will appear here once players start reviewing this turf.
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
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: "#8a9e60" }}
                        >
                          {avatar(getReviewerName(review))}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-800">
                            {getReviewerName(review)}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                              <Star size={11} weight="fill" />
                              {formatRating(review.score)}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => void handleDeleteReview(review)}
                        disabled={deletingReviewId === review.id}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingReviewId === review.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                      {review.comment?.trim() || "No written comment provided."}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "schedule" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2" ref={calRef}>
              <button
                onClick={() => shiftDate(-1)}
                className="shrink-0 rounded-lg bg-gray-100 p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
              >
                <CaretLeft size={14} weight="bold" />
              </button>

              <button
                onClick={() => setCalOpen((open) => !open)}
                className="relative flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <CaretDown size={12} className="text-gray-400" />
                {fmtDate(scheduleDate)}
                {dateKey(scheduleDate) === dateKey(TODAY) ? (
                  <span
                    className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: "#8a9e60" }}
                  >
                    Today
                  </span>
                ) : null}
              </button>

              <button
                onClick={() => shiftDate(1)}
                className="shrink-0 rounded-lg bg-gray-100 p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
              >
                <CaretRight size={14} weight="bold" />
              </button>

              {calOpen ? (
                <div className="absolute left-4 right-4 z-30 mt-1 rounded-2xl border border-gray-100 bg-white p-3 shadow-2xl">
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (calMonth === 0) {
                          setCalMonth(11);
                          setCalYear((value) => value - 1);
                        } else {
                          setCalMonth((value) => value - 1);
                        }
                      }}
                      className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100"
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
                          setCalYear((value) => value + 1);
                        } else {
                          setCalMonth((value) => value + 1);
                        }
                      }}
                      className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100"
                    >
                      <CaretRight size={13} weight="bold" />
                    </button>
                  </div>

                  <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wider text-gray-300">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                      <div key={day}>{day}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                      if (!day) return <div key={index} className="h-8" />;
                      const isToday = dateKey(day) === dateKey(TODAY);
                      const isSelected = dateKey(day) === dateKey(scheduleDate);
                      return (
                        <button
                          key={dateKey(day)}
                          onClick={() => {
                            setScheduleDate(day);
                            setCalOpen(false);
                          }}
                          className={`h-8 rounded-lg text-[11px] font-semibold transition-colors ${
                            isSelected
                              ? "bg-[#8a9e60] text-white"
                              : isToday
                                ? "bg-[#8a9e60]/10 text-[#8a9e60]"
                                : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-lg font-bold text-gray-800">{availableCount}</p>
                <p className="text-[10px] text-gray-400">available</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-lg font-bold text-gray-800">{bookedCount}</p>
                <p className="text-[10px] text-gray-400">booked</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-lg font-bold text-gray-800">{occupancyPct}%</p>
                <p className="text-[10px] text-gray-400">occupancy</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => void handleSaveSlotConfig()}
                disabled={!config || savingConfig}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                {savingConfig ? "Saving..." : "Save Slot Config"}
              </button>
              <button
                onClick={() => void handleGenerateSlots()}
                disabled={generatingSlots}
                className="rounded-xl bg-[#8a9e60] px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {generatingSlots ? "Generating..." : "Generate Slots"}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
                <p className="text-sm font-bold text-gray-800">{heldCount}</p>
                <p className="text-[10px] text-gray-400">held</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
                <p className="text-sm font-bold text-gray-800">{reservedCount}</p>
                <p className="text-[10px] text-gray-400">reserved</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-3 text-center">
                <p className="text-sm font-bold text-gray-800">{maintenanceCount}</p>
                <p className="text-[10px] text-gray-400">maintenance</p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Slot Rules
                </p>
                {configLoading ? (
                  <CircleNotch size={14} className="animate-spin text-gray-300" />
                ) : null}
              </div>
              {config ? (
                <SlotConfigEditor
                  config={config}
                  onChange={(next) => setConfig({ ...config, ...next })}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-400">
                  No slot config found yet.
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Slots
              </p>
              {slotsLoading ? (
                <div className="py-8 text-center">
                  <CircleNotch size={22} className="mx-auto animate-spin text-[#8a9e60]" />
                </div>
              ) : slots.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-xs text-gray-400">
                  No slots generated for this date.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {slots.map((slot) => {
                    const slotStyle =
                      SLOT_STATUS_COLORS[slot.status] || SLOT_STATUS_COLORS.available;
                    return (
                      <button
                        key={slot.slotId}
                        onClick={() => openSlotEditor(slot)}
                        className="rounded-2xl border border-gray-100 bg-white p-3 text-left transition-all hover:border-[#8a9e60] hover:shadow-sm"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-gray-800">
                              {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                            </p>
                            <p className="mt-0.5 text-[11px] text-gray-400">
                              #{slot.slotIndex + 1}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-bold ${slotStyle.bg} ${slotStyle.text}`}
                          >
                            {slotStyle.label}
                          </span>
                        </div>
                        <div className="flex items-end justify-between gap-2">
                          <p className="text-sm font-bold text-gray-700">
                            ₹{(slot.pricePaise / 100).toLocaleString()}
                          </p>
                          {slot.isPriceOverridden ? (
                            <span className="rounded-full bg-[#8a9e60]/10 px-2 py-0.5 text-[10px] font-bold text-[#8a9e60]">
                              OVERRIDDEN
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "analytics" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Today Bookings
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {turf.todayBookings || 0}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Total Bookings
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {turf.totalBookings || 0}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Lifetime Revenue
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  ₹
                  {(
                    ((turf.totalRevenuePaise || 0) || (turf.totalRevenue || 0) * 100) / 100
                  ).toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Review Volume
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {turf.totalReviews || 0}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <CalendarBlank size={22} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-semibold text-gray-600">
                Turf analytics are aligned with the field-era layout.
              </p>
              <p className="mt-1 text-xs text-gray-400">
                As more booking analytics land in the turf APIs, this panel will fill out
                without needing another UI rewrite.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${statusCfg.cls}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
          <a
            href="/dashboard/arenas"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8a9e60]"
          >
            Open Arenas
            <ArrowSquareOut size={12} />
          </a>
        </div>
      </div>

      {slotToEdit ? (
        <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[340px] rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-5 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Slot Controls
                  </p>
                  <h3 className="mt-1 text-base font-bold text-gray-900">
                    {slotToEdit.startTime.slice(0, 5)} - {slotToEdit.endTime.slice(0, 5)}
                  </h3>
                </div>
                <button
                  onClick={() => setSlotToEdit(null)}
                  className="text-gray-400 transition-colors hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["available", "maintenance", "blocked"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() =>
                        void handleUpdateSlot({
                          status,
                          blockReason:
                            status === "available" ? undefined : slotBlockReason || status,
                          pricePaise: Math.round(Number(slotPriceInput || 0) * 100),
                        })
                      }
                      disabled={savingSlot}
                      className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                        status === "available"
                          ? "bg-green-50 text-green-700 hover:bg-green-100"
                          : status === "maintenance"
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "bg-red-50 text-red-700 hover:bg-red-100"
                      }`}
                    >
                      {status === "available"
                        ? "Set Available"
                        : status === "maintenance"
                          ? "Set Maintenance"
                          : "Set Blocked"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Price Override
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={slotPriceInput}
                    onChange={(event) => setSlotPriceInput(event.target.value)}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none transition-colors focus:border-[#8a9e60]"
                    placeholder="Enter price"
                  />
                  <button
                    onClick={() =>
                      void handleUpdateSlot({
                        pricePaise: Math.round(Number(slotPriceInput || 0) * 100),
                      })
                    }
                    disabled={savingSlot}
                    className="rounded-xl bg-[#8a9e60] px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Block Reason
                </p>
                <textarea
                  value={slotBlockReason}
                  onChange={(event) => setSlotBlockReason(event.target.value)}
                  placeholder="Enter maintenance or block reason..."
                  className="h-16 w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#8a9e60]"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function TurfsPage() {
  const { showToast } = useToast();
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [eligibleArenas, setEligibleArenas] = useState<Arena[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<"all" | TurfStatus>("all");
  const [searchBy, setSearchBy] = useState<SearchBy>("turf_name");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [selected, setSelected] = useState<Turf | null>(null);
  const [showOnboard, setShowOnboard] = useState(false);
  const [onboardStep, setOnboardStep] = useState(1);
  const [onboardForm, setOnboardForm] = useState<OnboardForm>(INITIAL_ONBOARD_FORM);
  const [onboardErrors, setOnboardErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [editingTurf, setEditingTurf] = useState<Turf | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    action: ConfirmAction;
    turf: Turf;
  } | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const searchTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    searchTimerRef.current = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => {
      if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    };
  }, [search]);

  useEffect(() => {
    setOnboardForm((prev) => ({
      ...prev,
      slotConfig: {
        ...prev.slotConfig,
        dailyConfigs: generateDefaultDailyConfigs({
          weekdayOpen: prev.weekdayOpen,
          weekdayClose: prev.weekdayClose,
          weekendOpen: prev.weekendOpen,
          weekendClose: prev.weekendClose,
          pricePerHour: Number(prev.standardPrice) || 0,
        }),
      },
    }));
  }, [
    onboardForm.weekdayOpen,
    onboardForm.weekdayClose,
    onboardForm.weekendOpen,
    onboardForm.weekendClose,
    onboardForm.standardPrice,
    onboardForm.slotConfig.slotDurationMins,
  ]);

  const loadArenasForVendor = useCallback(async (vendorId: string) => {
    if (!vendorId) {
      setEligibleArenas([]);
      return;
    }
    const result = await listArenas({
      vendorId,
      eligibleForTurfOnboarding: true,
      limit: 100,
    });
    setEligibleArenas(result.items);
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [turfResult, vendorResult] = await Promise.all([
        listTurfs({
          page,
          limit,
          status: statusTab === "all" ? undefined : statusTab,
          sportType: sportFilter === "all" ? undefined : sportFilter,
          search: debouncedSearch || undefined,
          searchBy: debouncedSearch ? searchBy : undefined,
        }),
        listVendors({ status: "active", limit: 100, page: 1 }),
      ]);

      setTurfs(turfResult.items);
      setTotal(turfResult.total);
      setVendors(vendorResult.items);
      setSelected((current) => {
        if (!current) return current;
        return turfResult.items.find((item) => item.id === current.id) ?? current;
      });
    } catch (err: any) {
      showToast({
        title: "Could not load turfs",
        description: err.message || "Failed to load turf data",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, limit, page, searchBy, showToast, sportFilter, statusTab]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  useEffect(() => {
    setPage(1);
  }, [statusTab, searchBy, debouncedSearch, sportFilter]);

  useEffect(() => {
    void loadArenasForVendor(onboardForm.vendorId);
  }, [loadArenasForVendor, onboardForm.vendorId]);

  const stats = useMemo(
    () => ({
      total,
      active: turfs.filter((turf) => turf.status === "active").length,
      pending: turfs.filter((turf) => turf.status === "pending").length,
      maintenance: turfs.filter((turf) => turf.status === "maintenance").length,
    }),
    [total, turfs],
  );

  const vendorOptions = vendors.map((vendor) => ({
    value: vendor.id,
    label: vendor.businessName,
  }));

  const arenaOptions = eligibleArenas.map((arena) => ({
    value: arena.id,
    label: arena.name,
  }));

  const selectedArena = eligibleArenas.find((arena) => arena.id === onboardForm.arenaId);

  const resetOnboard = () => {
    setShowOnboard(false);
    setOnboardStep(1);
    setOnboardErrors({});
    setEligibleArenas([]);
    setOnboardForm(INITIAL_ONBOARD_FORM);
  };

  const validateOnboardStep = (step: number) => {
    const nextErrors: Record<string, string> = {};

    if (step === 1) {
      if (!onboardForm.vendorId) nextErrors.vendorId = "Vendor is required";
      if (!onboardForm.arenaId) nextErrors.arenaId = "Eligible arena is required";
    }

    if (step === 2) {
      if (!onboardForm.name.trim()) nextErrors.name = "Turf name is required";
      if (!onboardForm.sport) nextErrors.sport = "Sport is required";
      if (!onboardForm.surfaceType) {
        nextErrors.surfaceType = "Surface type is required";
      }
      if (!onboardForm.standardPrice || Number(onboardForm.standardPrice) <= 0) {
        nextErrors.standardPrice = "Valid standard price is required";
      }
    }

    setOnboardErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreateTurf = async () => {
    if (!validateOnboardStep(2)) {
      setOnboardStep(2);
      return;
    }

    setSubmitting(true);
    try {
      const created = await createTurfForVendor(onboardForm.vendorId, {
        arenaId: onboardForm.arenaId,
        name: onboardForm.name.trim(),
        sport: onboardForm.sport as any,
        surfaceType: onboardForm.surfaceType as any,
        standardPricePaise: Math.round(Number(onboardForm.standardPrice) * 100),
        capacity: onboardForm.capacity ? Number(onboardForm.capacity) : undefined,
        sizeFormat: onboardForm.sizeFormat || undefined,
        cancellationWindowHrs: onboardForm.cancellationWindowHrs
          ? Number(onboardForm.cancellationWindowHrs)
          : undefined,
        weekdayOpen: onboardForm.weekdayOpen,
        weekdayClose: onboardForm.weekdayClose,
        weekendOpen: onboardForm.weekendOpen,
        weekendClose: onboardForm.weekendClose,
      });

      await upsertAdminSlotConfig(created.id, onboardForm.slotConfig);

      showToast({
        title: "Turf onboarded",
        description: "New turf created successfully.",
        tone: "success",
      });
      resetOnboard();
      await refreshData();
    } catch (err: any) {
      showToast({
        title: "Onboarding failed",
        description: err.message || "Could not onboard turf",
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (turf: Turf) => {
    setEditingTurf(turf);
    setEditForm({
      name: turf.name,
      sport: turf.sport,
      surfaceType: turf.surfaceType,
      capacity: turf.capacity ? String(turf.capacity) : "",
      sizeFormat: turf.sizeFormat || "",
      standardPrice: String((turf.standardPricePaise || 0) / 100),
      cancellationWindowHrs: turf.cancellationWindowHrs
        ? String(turf.cancellationWindowHrs)
        : "",
      weekdayOpen: turf.weekdayOpen,
      weekdayClose: turf.weekdayClose,
      weekendOpen: turf.weekendOpen,
      weekendClose: turf.weekendClose,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTurf || !editForm) return;
    setSavingEdit(true);
    try {
      await updateTurf(editingTurf.id, {
        name: editForm.name.trim(),
        sport: editForm.sport as any,
        surfaceType: editForm.surfaceType as any,
        capacity: editForm.capacity ? Number(editForm.capacity) : undefined,
        sizeFormat: editForm.sizeFormat || undefined,
        standardPricePaise: Math.round(Number(editForm.standardPrice || 0) * 100),
        cancellationWindowHrs: editForm.cancellationWindowHrs
          ? Number(editForm.cancellationWindowHrs)
          : undefined,
        weekdayOpen: editForm.weekdayOpen,
        weekdayClose: editForm.weekdayClose,
        weekendOpen: editForm.weekendOpen,
        weekendClose: editForm.weekendClose,
      });
      showToast({
        title: "Turf updated",
        description: "Turf details saved successfully.",
        tone: "success",
      });
      setEditingTurf(null);
      setEditForm(null);
      await refreshData();
    } catch (err: any) {
      showToast({
        title: "Update failed",
        description: err.message || "Could not update turf",
        tone: "error",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const executeAction = async (action: ConfirmAction, turf: Turf) => {
    try {
      if (action === "ban") await banTurf(turf.id);
      if (action === "unban") await unbanTurf(turf.id);
      if (action === "activate") await updateTurfStatus(turf.id, "active");
      if (action === "deactivate") await updateTurfStatus(turf.id, "inactive");
      if (action === "maintenance") await updateTurfStatus(turf.id, "maintenance");
      if (action === "suspend") await updateTurfStatus(turf.id, "suspended");
      if (action === "unsuspend") await updateTurfStatus(turf.id, "active");

      showToast({
        title: "Status updated",
        description: `${turf.name} updated successfully.`,
        tone: "success",
      });
      await refreshData();
    } catch (err: any) {
      showToast({
        title: "Action failed",
        description: err.message || "Could not update turf status",
        tone: "error",
      });
    } finally {
      setConfirmAction(null);
      setActionMenuId(null);
    }
  };

  return (
    <div className="relative flex h-[calc(100vh-64px)] overflow-hidden bg-[#f6f7f1]">
      <div
        className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${
          selected ? "mr-[420px]" : ""
        }`}
      >
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-5 grid grid-cols-4 gap-4">
            {[
              {
                label: "Total Turfs",
                value: stats.total,
                sub: "on platform",
                Icon: MapPin,
                color: "#8a9e60",
              },
              {
                label: "Active",
                value: stats.active,
                sub: "bookable now",
                Icon: CheckCircle,
                color: "#22c55e",
              },
              {
                label: "Pending",
                value: stats.pending,
                sub: "awaiting activation",
                Icon: ClockCountdown,
                color: "#f59e0b",
              },
              {
                label: "Maintenance",
                value: stats.maintenance,
                sub: "temporarily closed",
                Icon: Wrench,
                color: "#3b82f6",
              },
            ].map(({ label, value, sub, Icon, color }) => (
              <div
                key={label}
                className="rounded-2xl border border-[#edf0e6] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">{label}</span>
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${color}18` }}
                  >
                    <Icon size={16} weight="fill" style={{ color }} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-gray-800">{loading ? "—" : value}</p>
                  <p className="text-[10px] font-medium text-gray-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 rounded-xl bg-white p-1 shadow-sm ring-1 ring-[#edf0e6]">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusTab(tab)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold capitalize ${
                    statusTab === tab
                      ? "bg-[#f3f6ed] text-[#6e8245]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <MagnifyingGlass
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={
                    SEARCH_OPTIONS.find((option) => option.value === searchBy)?.placeholder
                  }
                  className="w-72 rounded-xl border border-[#e7eadf] bg-white py-2 pl-10 pr-4 text-xs font-medium outline-none transition-colors focus:border-[#8a9e60] focus:ring-1 focus:ring-[#8a9e60]"
                />
              </div>

              <Select
                options={SEARCH_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                value={searchBy}
                onChange={(value) => setSearchBy(value as SearchBy)}
                className="min-w-[190px] rounded-xl border border-[#e7eadf] bg-white px-3 py-2 text-xs font-semibold text-gray-600"
              />

              <Select
                options={[{ value: "all", label: "All Sports" }, ...SPORT_OPTIONS]}
                value={sportFilter}
                onChange={setSportFilter}
                className="min-w-[180px] rounded-xl border border-[#e7eadf] bg-white px-3 py-2 text-xs font-semibold text-gray-600"
              />

              <button
                onClick={() => setShowOnboard(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#8a9e60] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#8a9e60]/15 transition-opacity hover:opacity-90"
              >
                <Plus size={16} />
                Onboard Turf
              </button>
            </div>
          </div>

          <div className="min-h-[420px] overflow-hidden rounded-2xl border border-[#edf0e6] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#f1f4eb]">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Turf
                    </th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Arena
                    </th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Sport
                    </th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Price
                    </th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Rating
                    </th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Status
                    </th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Arena Docs
                    </th>
                    <th className="w-24 px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f6f7f1]">
                  {loading ? (
                    <TableRowsSkeleton rows={5} cols={8} />
                  ) : turfs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-300">
                          <MapPin size={40} />
                          <p className="text-sm font-semibold">No turfs found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    turfs.map((turf) => {
                      const statusCfg = STATUS_CONFIG[turf.status] || STATUS_CONFIG.pending;
                      const arenaDocTone =
                        turf.arenaKycStatus === "verified"
                          ? "bg-green-50 text-green-700"
                          : turf.arenaKycStatus === "rejected"
                            ? "bg-red-50 text-red-600"
                            : "bg-gray-100 text-gray-500";

                      return (
                        <tr
                          key={turf.id}
                          onClick={() => setSelected(turf)}
                          className="cursor-pointer transition-colors hover:bg-[#fafbf7]"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold text-white"
                                style={{ backgroundColor: "#8a9e60" }}
                              >
                                {avatar(turf.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                                  {turf.id.slice(0, 8)}...
                                </p>
                                <p className="truncate text-sm font-bold text-gray-800">
                                  {turf.name}
                                </p>
                                <p className="truncate text-[10px] text-gray-400">
                                  {turf.vendorBusinessName ||
                                    turf.vendor?.businessName ||
                                    "Independent Vendor"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-xs font-semibold text-gray-700">
                            {turf.arenaName || "—"}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                                SPORT_COLOR[turf.sport] || "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {formatLabel(turf.sport)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs font-bold text-gray-800">
                            ₹{((turf.standardPricePaise || 0) / 100).toLocaleString()}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1 text-xs font-bold text-gray-800">
                              <span>{formatRating(turf.rating)}</span>
                              {turf.rating ? (
                                <Star size={12} weight="fill" className="text-amber-400" />
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${statusCfg.cls}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-bold ${arenaDocTone}`}
                            >
                              {formatLabel(turf.arenaKycStatus)}
                            </span>
                          </td>
                          <td
                            className="relative px-4 py-4"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setSelected(turf)}
                                className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => openEdit(turf)}
                                className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                              >
                                <PencilSimple size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  setActionMenuId((current) =>
                                    current === turf.id ? null : turf.id,
                                  )
                                }
                                className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                              >
                                <DotsThreeVertical size={14} />
                              </button>
                            </div>

                            {actionMenuId === turf.id ? (
                              <div className="absolute right-4 z-20 mt-2 w-40 rounded-xl border border-gray-100 bg-white p-1 shadow-xl">
                                <button
                                  onClick={() => openEdit(turf)}
                                  className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    setConfirmAction({
                                      action:
                                        turf.status === "active" ? "deactivate" : "activate",
                                      turf,
                                    })
                                  }
                                  className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                                >
                                  {turf.status === "active" ? "Deactivate" : "Activate"}
                                </button>
                                <button
                                  onClick={() =>
                                    setConfirmAction({
                                      action: turf.status === "banned" ? "unban" : "ban",
                                      turf,
                                    })
                                  }
                                  className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                                >
                                  {turf.status === "banned" ? "Unban" : "Ban"}
                                </button>
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <DashboardPagination
              page={page}
              total={total}
              limit={limit}
              onPageChange={setPage}
              label="turfs"
            />
          </div>
        </div>
      </div>

      {selected ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/10" onClick={() => setSelected(null)} />
          <DetailPanel
            turf={selected}
            onClose={() => setSelected(null)}
            onRefresh={refreshData}
            onEdit={openEdit}
            onRequestAction={(action, turf) => setConfirmAction({ action, turf })}
          />
        </>
      ) : null}

      {showOnboard ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Onboard New Turf</h2>
                  <p className="mt-1 text-xs text-gray-400">Step {onboardStep} of 3</p>
                </div>
                <button
                  onClick={resetOnboard}
                  className="text-gray-400 transition-colors hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {onboardStep === 1 ? (
                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Vendor
                    </label>
                    <Select
                      options={vendorOptions}
                      value={onboardForm.vendorId}
                      onChange={(value) =>
                        setOnboardForm((prev) => ({ ...prev, vendorId: value, arenaId: "" }))
                      }
                      placeholder="Select active vendor"
                      searchable
                      asyncSearch={false}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700"
                    />
                    {onboardErrors.vendorId ? (
                      <p className="mt-1 text-[10px] font-medium text-red-500">
                        {onboardErrors.vendorId}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Arena
                    </label>
                    <Select
                      options={arenaOptions}
                      value={onboardForm.arenaId}
                      onChange={(value) =>
                        setOnboardForm((prev) => ({ ...prev, arenaId: value }))
                      }
                      placeholder={
                        onboardForm.vendorId ? "Select eligible arena" : "Choose vendor first"
                      }
                      searchable
                      asyncSearch={false}
                      disabled={!onboardForm.vendorId}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700"
                    />
                    {onboardErrors.arenaId ? (
                      <p className="mt-1 text-[10px] font-medium text-red-500">
                        {onboardErrors.arenaId}
                      </p>
                    ) : null}
                  </div>

                  {selectedArena ? (
                    <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                      <p className="text-xs font-bold text-green-800">{selectedArena.name}</p>
                      <p className="mt-1 text-[11px] text-green-700">
                        {selectedArena.address.city}, {selectedArena.address.state}
                      </p>
                      <p className="mt-2 text-[11px] text-green-700">
                        Arena status: {formatLabel(selectedArena.status)} · Documents:{" "}
                        {formatLabel(selectedArena.kycStatus)}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {onboardStep === 2 ? (
                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Turf Name
                    </label>
                    <input
                      value={onboardForm.name}
                      onChange={(event) =>
                        setOnboardForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-[#8a9e60]"
                      placeholder="e.g. Arena A - Football Turf 4"
                    />
                    {onboardErrors.name ? (
                      <p className="mt-1 text-[10px] font-medium text-red-500">
                        {onboardErrors.name}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Sport
                      </label>
                      <Select
                        options={SPORT_OPTIONS}
                        value={onboardForm.sport}
                        onChange={(value) =>
                          setOnboardForm((prev) => ({ ...prev, sport: value }))
                        }
                        placeholder="Select one sport"
                        className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700"
                      />
                      {onboardErrors.sport ? (
                        <p className="mt-1 text-[10px] font-medium text-red-500">
                          {onboardErrors.sport}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Surface Type
                      </label>
                      <Select
                        options={SURFACE_OPTIONS}
                        value={onboardForm.surfaceType}
                        onChange={(value) =>
                          setOnboardForm((prev) => ({ ...prev, surfaceType: value }))
                        }
                        className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Capacity
                      </label>
                      <input
                        value={onboardForm.capacity}
                        onChange={(event) =>
                          setOnboardForm((prev) => ({ ...prev, capacity: event.target.value }))
                        }
                        type="number"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-[#8a9e60]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Size / Format
                      </label>
                      <input
                        value={onboardForm.sizeFormat}
                        onChange={(event) =>
                          setOnboardForm((prev) => ({
                            ...prev,
                            sizeFormat: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-[#8a9e60]"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {onboardStep === 3 ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Standard Price (INR)
                      </label>
                      <input
                        value={onboardForm.standardPrice}
                        onChange={(event) =>
                          setOnboardForm((prev) => ({
                            ...prev,
                            standardPrice: event.target.value,
                          }))
                        }
                        type="number"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-[#8a9e60]"
                      />
                      {onboardErrors.standardPrice ? (
                        <p className="mt-1 text-[10px] font-medium text-red-500">
                          {onboardErrors.standardPrice}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Cancellation Window (hrs)
                      </label>
                      <input
                        value={onboardForm.cancellationWindowHrs}
                        onChange={(event) =>
                          setOnboardForm((prev) => ({
                            ...prev,
                            cancellationWindowHrs: event.target.value,
                          }))
                        }
                        type="number"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-[#8a9e60]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Weekday Hours
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={onboardForm.weekdayOpen}
                          onChange={(event) =>
                            setOnboardForm((prev) => ({
                              ...prev,
                              weekdayOpen: event.target.value,
                            }))
                          }
                          type="time"
                          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none transition-colors focus:border-[#8a9e60]"
                        />
                        <input
                          value={onboardForm.weekdayClose}
                          onChange={(event) =>
                            setOnboardForm((prev) => ({
                              ...prev,
                              weekdayClose: event.target.value,
                            }))
                          }
                          type="time"
                          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none transition-colors focus:border-[#8a9e60]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Weekend Hours
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={onboardForm.weekendOpen}
                          onChange={(event) =>
                            setOnboardForm((prev) => ({
                              ...prev,
                              weekendOpen: event.target.value,
                            }))
                          }
                          type="time"
                          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none transition-colors focus:border-[#8a9e60]"
                        />
                        <input
                          value={onboardForm.weekendClose}
                          onChange={(event) =>
                            setOnboardForm((prev) => ({
                              ...prev,
                              weekendClose: event.target.value,
                            }))
                          }
                          type="time"
                          className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none transition-colors focus:border-[#8a9e60]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Slot Rules
                    </p>
                    <SlotConfigEditor
                      config={onboardForm.slotConfig}
                      onChange={(next) =>
                        setOnboardForm((prev) => ({
                          ...prev,
                          slotConfig: {
                            ...prev.slotConfig,
                            ...next,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="border-t border-gray-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    if (onboardStep === 1) resetOnboard();
                    else setOnboardStep((step) => step - 1);
                  }}
                  className="text-xs font-bold text-gray-500 transition-colors hover:text-gray-700"
                >
                  {onboardStep === 1 ? "Cancel" : "Back"}
                </button>

                {onboardStep < 3 ? (
                  <button
                    onClick={() => {
                      if (validateOnboardStep(onboardStep)) {
                        setOnboardStep((step) => step + 1);
                      }
                    }}
                    className="rounded-xl bg-[#8a9e60] px-5 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={() => void handleCreateTurf()}
                    disabled={submitting}
                    className="rounded-xl bg-[#8a9e60] px-5 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? "Creating..." : "Create Turf"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editingTurf && editForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Turf</h2>
                  <p className="mt-1 text-xs text-gray-400">{editingTurf.id}</p>
                </div>
                <button
                  onClick={() => {
                    setEditingTurf(null);
                    setEditForm(null);
                  }}
                  className="text-gray-400 transition-colors hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-5">
              <div className="col-span-2">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Turf Name
                </label>
                <input
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-[#8a9e60]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Sport
                </label>
                <Select
                  options={SPORT_OPTIONS}
                  value={editForm.sport}
                  onChange={(value) =>
                    setEditForm((prev) => (prev ? { ...prev, sport: value } : prev))
                  }
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Surface
                </label>
                <Select
                  options={SURFACE_OPTIONS}
                  value={editForm.surfaceType}
                  onChange={(value) =>
                    setEditForm((prev) => (prev ? { ...prev, surfaceType: value } : prev))
                  }
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Capacity
                </label>
                <input
                  value={editForm.capacity}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, capacity: event.target.value } : prev,
                    )
                  }
                  type="number"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-[#8a9e60]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Size / Format
                </label>
                <input
                  value={editForm.sizeFormat}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, sizeFormat: event.target.value } : prev,
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-[#8a9e60]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Standard Price
                </label>
                <input
                  value={editForm.standardPrice}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, standardPrice: event.target.value } : prev,
                    )
                  }
                  type="number"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-[#8a9e60]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Cancellation Window
                </label>
                <input
                  value={editForm.cancellationWindowHrs}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev
                        ? { ...prev, cancellationWindowHrs: event.target.value }
                        : prev,
                    )
                  }
                  type="number"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-[#8a9e60]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Weekday Hours
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={editForm.weekdayOpen}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, weekdayOpen: event.target.value } : prev,
                      )
                    }
                    type="time"
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none transition-colors focus:border-[#8a9e60]"
                  />
                  <input
                    value={editForm.weekdayClose}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, weekdayClose: event.target.value } : prev,
                      )
                    }
                    type="time"
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none transition-colors focus:border-[#8a9e60]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Weekend Hours
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={editForm.weekendOpen}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, weekendOpen: event.target.value } : prev,
                      )
                    }
                    type="time"
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none transition-colors focus:border-[#8a9e60]"
                  />
                  <input
                    value={editForm.weekendClose}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, weekendClose: event.target.value } : prev,
                      )
                    }
                    type="time"
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none transition-colors focus:border-[#8a9e60]"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setEditingTurf(null);
                    setEditForm(null);
                  }}
                  className="text-xs font-bold text-gray-500 transition-colors hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleSaveEdit()}
                  disabled={savingEdit}
                  className="rounded-xl bg-[#8a9e60] px-5 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {confirmAction ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] bg-white shadow-2xl">
            <div className="px-6 py-6 text-center">
              <div
                className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
                  confirmAction.action === "ban"
                    ? "bg-red-50 text-red-500"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                {confirmAction.action === "ban" ? (
                  <Prohibit size={26} weight="bold" />
                ) : (
                  <WarningCircle size={26} weight="bold" />
                )}
              </div>
              <h3 className="mb-2 text-base font-bold text-gray-900">
                Confirm {formatLabel(confirmAction.action)}
              </h3>
              <p className="text-xs leading-relaxed text-gray-500">
                This will update <span className="font-semibold">{confirmAction.turf.name}</span>.
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-4 text-xs font-bold text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
              >
                CANCEL
              </button>
              <div className="w-px bg-gray-100" />
              <button
                onClick={() => void executeAction(confirmAction.action, confirmAction.turf)}
                className="flex-1 py-4 text-xs font-bold text-[#8a9e60] transition-colors hover:bg-green-50"
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
