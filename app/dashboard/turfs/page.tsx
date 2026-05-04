"use client";

import {
  ArrowSquareOut,
  Buildings,
  CalendarBlank,
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
  Wrench,
  X,
  XCircle,
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
import { listVendors, Vendor, SPORT_COLOR, SPORTS_LIST } from "@/features/vendors";
import { listArenas, Arena } from "@/features/arenas";
import {
  AdminSlot,
  getAdminSlotConfig,
  getAdminSlots,
  patchAdminSlot,
  SlotConfig,
  SLOT_STATUS_COLORS,
  upsertAdminSlotConfig,
  type AdminSlotPatchPayload,
  type UpsertSlotConfigPayload,
} from "@/features/slots";
import { generateDefaultDailyConfigs } from "@/features/slots/utils";
import { SlotConfigEditor } from "@/features/slots/components/SlotConfigEditor";

type SearchBy = "turf_name" | "vendor_business_name" | "city";
type ConfirmAction =
  | "activate"
  | "deactivate"
  | "maintenance"
  | "suspend"
  | "unsuspend"
  | "ban"
  | "unban";

const SEARCH_OPTIONS: { value: SearchBy; label: string; placeholder: string }[] = [
  { value: "turf_name", label: "Turf Name", placeholder: "Search by turf name" },
  {
    value: "vendor_business_name",
    label: "Vendor Business Name",
    placeholder: "Search by vendor business name",
  },
  { value: "city", label: "City", placeholder: "Search by city" },
];

const STATUS_TABS: Array<"all" | TurfStatus> = [
  "all",
  "active",
  "inactive",
  "pending",
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
] as const;

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

const INITIAL_ONBOARD_FORM: OnboardForm = {
  vendorId: "",
  arenaId: "",
  name: "",
  sport: "",
  surfaceType: "artificial_turf",
  capacity: "",
  sizeFormat: "",
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

function formatLabel(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function avatar(name?: string | null) {
  if (!name) return "TF";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function dateKey(d: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
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
  const [tab, setTab] = useState<"overview" | "reviews" | "slots">("overview");
  const [reviews, setReviews] = useState<TurfReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [slots, setSlots] = useState<AdminSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [config, setConfig] = useState<SlotConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [slotToEdit, setSlotToEdit] = useState<AdminSlot | null>(null);
  const [slotPrice, setSlotPrice] = useState("");
  const [slotReason, setSlotReason] = useState("");
  const [savingSlot, setSavingSlot] = useState(false);
  const statusCfg = STATUS_CONFIG[turf.status] || STATUS_CONFIG.pending;

  const loadReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      setReviews(await getTurfReviews(turf.id));
    } catch (err: any) {
      showToast({
        title: "Could not load reviews",
        description: err.message || "Failed to load reviews",
        tone: "error",
      });
    } finally {
      setReviewsLoading(false);
    }
  }, [showToast, turf.id]);

  const loadSlots = useCallback(async () => {
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

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      setConfig(await getAdminSlotConfig(turf.id));
    } catch {
      setConfig(null);
    } finally {
      setConfigLoading(false);
    }
  }, [turf.id]);

  useEffect(() => {
    if (tab === "reviews") void loadReviews();
    if (tab === "slots") {
      void loadSlots();
      void loadConfig();
    }
  }, [tab, loadReviews, loadSlots, loadConfig]);

  useEffect(() => {
    setTab("overview");
    setReviews([]);
    setSlots([]);
    setConfig(null);
    setSlotToEdit(null);
  }, [turf.id]);

  const handleDeleteReview = async (review: TurfReview) => {
    setDeletingReviewId(review.id);
    try {
      await deleteTurfReview(turf.id, review.id);
      await loadReviews();
      await onRefresh();
      showToast({
        title: "Review Deleted",
        description: "Review removed successfully.",
        tone: "success",
      });
    } catch (err: any) {
      showToast({
        title: "Delete Failed",
        description: err.message || "Could not delete review",
        tone: "error",
      });
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleSlotUpdate = async (payload: AdminSlotPatchPayload) => {
    if (!slotToEdit) return;
    setSavingSlot(true);
    try {
      await patchAdminSlot(slotToEdit.slotId, payload);
      await loadSlots();
      setSlotToEdit(null);
      showToast({
        title: "Slot Updated",
        description: "Slot changes saved successfully.",
        tone: "success",
      });
    } catch (err: any) {
      showToast({
        title: "Slot Update Failed",
        description: err.message || "Could not update slot",
        tone: "error",
      });
    } finally {
      setSavingSlot(false);
    }
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 z-[60] w-[420px] border-l border-gray-100 bg-white shadow-2xl">
      <div
        className="px-5 py-4"
        style={{ background: "linear-gradient(135deg,#8a9e60,#6e8245)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-white/70">{turf.id}</p>
            <h2 className="truncate text-lg font-bold text-white">{turf.name}</h2>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-white/70">
              <Buildings size={11} />
              {turf.arenaName || "Arena"} · {formatLabel(turf.sport)}
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-100">
        {(["overview", "reviews", "slots"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-3 text-xs font-semibold capitalize ${
              tab === key
                ? "border-b-2 border-[#8a9e60] text-[#8a9e60]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="h-[calc(100%-120px)] overflow-y-auto p-4">
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
                <p className="text-lg font-bold text-gray-800">{turf.capacity || "—"}</p>
                <p className="text-[10px] text-gray-400">capacity</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 text-center">
                <p className="text-lg font-bold text-gray-800">
                  {turf.rating && turf.rating > 0 ? turf.rating.toFixed(1) : "—"}
                </p>
                <p className="text-[10px] text-gray-400">rating</p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Turf Details
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Sport</span>
                  <span className="font-semibold text-gray-700">{formatLabel(turf.sport)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Surface</span>
                  <span className="font-semibold text-gray-700">{formatLabel(turf.surfaceType)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Arena</span>
                  <span className="font-semibold text-gray-700">{turf.arenaName || "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Arena Status</span>
                  <span className="font-semibold text-gray-700">{formatLabel(turf.arenaStatus)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Arena Documents</span>
                  <span className="font-semibold text-gray-700">{formatLabel(turf.arenaKycStatus)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Operating Hours</span>
                  <span className="font-semibold text-gray-700">
                    {turf.weekdayOpen.slice(0, 5)} - {turf.weekdayClose.slice(0, 5)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Vendor
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold text-white"
                  style={{ backgroundColor: "#8a9e60" }}
                >
                  {avatar(turf.vendorBusinessName || turf.vendor?.businessName)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {turf.vendorBusinessName || turf.vendor?.businessName || "—"}
                  </p>
                  <p className="truncate text-[11px] text-gray-400">
                    {turf.vendor?.email || turf.vendorPhone || "No contact info"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onEdit(turf)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
              >
                Edit Turf
              </button>
              {turf.status === "active" ? (
                <button
                  onClick={() => onRequestAction("deactivate", turf)}
                  className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100"
                >
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => onRequestAction("activate", turf)}
                  className="rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-100"
                >
                  Activate
                </button>
              )}
              {turf.status === "maintenance" ? (
                <button
                  onClick={() => onRequestAction("activate", turf)}
                  className="rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-100"
                >
                  End Maintenance
                </button>
              ) : (
                <button
                  onClick={() => onRequestAction("maintenance", turf)}
                  className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                >
                  Maintenance
                </button>
              )}
              {turf.status === "banned" ? (
                <button
                  onClick={() => onRequestAction("unban", turf)}
                  className="rounded-xl border border-gray-200 bg-gray-900 px-3 py-2 text-xs font-bold text-white hover:bg-black"
                >
                  Unban
                </button>
              ) : (
                <button
                  onClick={() => onRequestAction("ban", turf)}
                  className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                >
                  Ban
                </button>
              )}
            </div>
          </div>
        )}

        {tab === "reviews" && (
          <div className="space-y-3">
            {reviewsLoading ? (
              <div className="py-10 text-center">
                <CircleNotch size={24} className="mx-auto animate-spin text-[#8a9e60]" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">No reviews found.</div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="rounded-xl bg-gray-50 p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {review.user?.firstName || review.user?.lastName
                          ? `${review.user?.firstName || ""} ${review.user?.lastName || ""}`.trim()
                          : "Anonymous User"}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <button
                      onClick={() => void handleDeleteReview(review)}
                      disabled={deletingReviewId === review.id}
                      className="text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">{review.score.toFixed(1)} / 5</p>
                  <p className="mt-1 text-xs text-gray-600">{review.comment || "No comment."}</p>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "slots" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
              <button
                onClick={() => setScheduleDate((prev) => new Date(prev.getTime() - 86400000))}
                className="text-gray-500 hover:text-gray-700"
              >
                <CaretLeft size={18} />
              </button>
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-800">
                  {scheduleDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p className="text-[10px] text-gray-400">slot date</p>
              </div>
              <button
                onClick={() => setScheduleDate((prev) => new Date(prev.getTime() + 86400000))}
                className="text-gray-500 hover:text-gray-700"
              >
                <CaretRight size={18} />
              </button>
            </div>

            {configLoading ? (
              <div className="py-4 text-center text-xs text-gray-400">Loading slot config...</div>
            ) : config ? (
              <SlotConfigEditor
                config={config}
                onChange={(next) => setConfig({ ...config, ...next })}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 p-4 text-xs text-gray-400">
                No slot config found yet.
              </div>
            )}

            {config && (
              <button
                onClick={async () => {
                  try {
                    await upsertAdminSlotConfig(turf.id, {
                      slotDurationMins: config.slotDurationMins,
                      dailyConfigs: config.dailyConfigs,
                    });
                    showToast({
                      title: "Slot Config Saved",
                      description: "Turf slot configuration updated.",
                      tone: "success",
                    });
                  } catch (err: any) {
                    showToast({
                      title: "Save Failed",
                      description: err.message || "Could not save slot config",
                      tone: "error",
                    });
                  }
                }}
                className="w-full rounded-xl bg-[#8a9e60] px-3 py-2 text-xs font-bold text-white hover:opacity-90"
              >
                Save Slot Config
              </button>
            )}

            <div className="space-y-2">
              {slotsLoading ? (
                <div className="py-8 text-center">
                  <CircleNotch size={22} className="mx-auto animate-spin text-[#8a9e60]" />
                </div>
              ) : slots.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-4 text-xs text-gray-400">
                  No slots generated for this date.
                </div>
              ) : (
                slots.map((slot) => {
                  const slotStyle =
                    SLOT_STATUS_COLORS[slot.status] || SLOT_STATUS_COLORS.available;
                  return (
                    <button
                      key={slot.slotId}
                      onClick={() => {
                        setSlotToEdit(slot);
                        setSlotPrice((slot.pricePaise / 100).toString());
                        setSlotReason(slot.blockReason || "");
                      }}
                      className="flex w-full items-center justify-between rounded-xl border border-gray-100 bg-white p-3 text-left hover:border-[#8a9e60]"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                        </p>
                        <p className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${slotStyle.bg} ${slotStyle.text}`}>
                          {slotStyle.label}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-gray-700">
                        ₹{(slot.pricePaise / 100).toLocaleString()}
                      </p>
                    </button>
                  );
                })
              )}
            </div>

            {slotToEdit && (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-800">Edit Slot</p>
                  <button onClick={() => setSlotToEdit(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    value={slotPrice}
                    onChange={(e) => setSlotPrice(e.target.value)}
                    type="number"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
                    placeholder="Price in INR"
                  />
                  <input
                    value={slotReason}
                    onChange={(e) => setSlotReason(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
                    placeholder="Block reason"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        void handleSlotUpdate({
                          status: "available",
                          pricePaise: Math.round(Number(slotPrice || 0) * 100),
                        })
                      }
                      disabled={savingSlot}
                      className="rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-xs font-bold text-green-700"
                    >
                      Set Available
                    </button>
                    <button
                      onClick={() =>
                        void handleSlotUpdate({
                          status: "maintenance",
                          blockReason: slotReason || "maintenance",
                          pricePaise: Math.round(Number(slotPrice || 0) * 100),
                        })
                      }
                      disabled={savingSlot}
                      className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700"
                    >
                      Set Maintenance
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${statusCfg.cls}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
          {turf.arenaId && (
            <a
              href={`/dashboard/arenas`}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8a9e60]"
            >
              Open Arenas <ArrowSquareOut size={12} />
            </a>
          )}
        </div>
      </div>
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

  const loadVendors = useCallback(async () => {
    const result = await listVendors({ status: "active", limit: 100, page: 1 });
    setVendors(result.items);
  }, []);

  const loadArenasForVendor = useCallback(
    async (vendorId: string) => {
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
    },
    [],
  );

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
    void loadVendors();
  }, [loadVendors]);

  useEffect(() => {
    void loadArenasForVendor(onboardForm.vendorId);
  }, [loadArenasForVendor, onboardForm.vendorId]);

  const stats = useMemo(() => {
    return {
      total,
      active: turfs.filter((t) => t.status === "active").length,
      pending: turfs.filter((t) => t.status === "pending").length,
      maintenance: turfs.filter((t) => t.status === "maintenance").length,
    };
  }, [total, turfs]);

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
      if (!onboardForm.surfaceType) nextErrors.surfaceType = "Surface type is required";
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
        title: "Turf Onboarded",
        description: "New turf created successfully.",
        tone: "success",
      });
      resetOnboard();
      await refreshData();
    } catch (err: any) {
      showToast({
        title: "Onboarding Failed",
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
        title: "Turf Updated",
        description: "Turf details saved successfully.",
        tone: "success",
      });
      setEditingTurf(null);
      setEditForm(null);
      await refreshData();
    } catch (err: any) {
      showToast({
        title: "Update Failed",
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
        title: "Status Updated",
        description: `${turf.name} updated successfully.`,
        tone: "success",
      });
      await refreshData();
    } catch (err: any) {
      showToast({
        title: "Action Failed",
        description: err.message || "Could not update turf status",
        tone: "error",
      });
    } finally {
      setConfirmAction(null);
      setActionMenuId(null);
    }
  };

  return (
    <div className="relative flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50/30">
      <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${selected ? "mr-[420px]" : ""}`}>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-5 grid grid-cols-4 gap-4">
            {[
              { label: "Total Turfs", value: stats.total, sub: "on platform", Icon: MapPin, color: "#8a9e60" },
              { label: "Active", value: stats.active, sub: "bookable now", Icon: CheckCircle, color: "#22c55e" },
              { label: "Pending", value: stats.pending, sub: "awaiting activation", Icon: ClockCountdown, color: "#f59e0b" },
              { label: "Maintenance", value: stats.maintenance, sub: "temporarily closed", Icon: Wrench, color: "#3b82f6" },
            ].map(({ label, value, sub, Icon, color }) => (
              <div key={label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
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
            <div className="flex items-center gap-1.5 rounded-xl bg-gray-100 p-1">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusTab(tab)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold capitalize ${
                    statusTab === tab
                      ? "bg-white text-gray-800 shadow-sm"
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
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={SEARCH_OPTIONS.find((option) => option.value === searchBy)?.placeholder}
                  className="w-72 rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-xs font-medium outline-none focus:border-[#8a9e60] focus:ring-1 focus:ring-[#8a9e60]"
                />
              </div>

              <Select
                options={SEARCH_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                value={searchBy}
                onChange={(value) => setSearchBy(value as SearchBy)}
                className="min-w-[190px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600"
              />

              <Select
                options={[
                  { value: "all", label: "All Sports" },
                  ...SPORT_OPTIONS,
                ]}
                value={sportFilter}
                onChange={setSportFilter}
                className="min-w-[180px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600"
              />

              <button
                onClick={() => setShowOnboard(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#8a9e60] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#8a9e60]/20 hover:opacity-90"
              >
                <Plus size={16} />
                Onboard Turf
              </button>
            </div>
          </div>

          <div className="min-h-[420px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-50">
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
                <tbody className="divide-y divide-gray-50/50">
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
                          className="cursor-pointer transition-colors hover:bg-gray-50/50"
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
                                <p className="truncate text-sm font-bold text-gray-800">{turf.name}</p>
                                <p className="truncate text-[10px] text-gray-400">
                                  {turf.vendorBusinessName || turf.vendor?.businessName || "Independent Vendor"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-xs font-semibold text-gray-700">
                            {turf.arenaName || "—"}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-bold ${SPORT_COLOR[turf.sport] || "bg-gray-100 text-gray-600"}`}
                            >
                              {formatLabel(turf.sport)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs font-bold text-gray-800">
                            ₹{((turf.standardPricePaise || 0) / 100).toLocaleString()}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1 text-xs font-bold text-gray-800">
                              <span>{turf.rating && turf.rating > 0 ? turf.rating.toFixed(1) : "—"}</span>
                              {turf.rating && turf.rating > 0 && (
                                <Star size={12} weight="fill" className="text-amber-400" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${statusCfg.cls}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${arenaDocTone}`}>
                              {formatLabel(turf.arenaKycStatus)}
                            </span>
                          </td>
                          <td
                            className="px-4 py-4"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setSelected(turf)}
                                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => openEdit(turf)}
                                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                              >
                                <PencilSimple size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  setActionMenuId((current) => (current === turf.id ? null : turf.id))
                                }
                                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                              >
                                <DotsThreeVertical size={14} />
                              </button>
                            </div>
                            {actionMenuId === turf.id && (
                              <div className="absolute right-6 z-20 mt-2 w-40 rounded-xl border border-gray-100 bg-white p-1 shadow-xl">
                                <button
                                  onClick={() => openEdit(turf)}
                                  className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    setConfirmAction({
                                      action: turf.status === "active" ? "deactivate" : "activate",
                                      turf,
                                    })
                                  }
                                  className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-gray-600 hover:bg-gray-50"
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
                                  className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  {turf.status === "banned" ? "Unban" : "Ban"}
                                </button>
                              </div>
                            )}
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

      {selected && (
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
      )}

      {showOnboard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        >
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Onboard New Turf</h2>
                  <p className="mt-1 text-xs text-gray-400">
                    Step {onboardStep} of 3
                  </p>
                </div>
                <button onClick={resetOnboard} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {onboardStep === 1 && (
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
                    {onboardErrors.vendorId && (
                      <p className="mt-1 text-[10px] font-medium text-red-500">{onboardErrors.vendorId}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Arena
                    </label>
                    <Select
                      options={arenaOptions}
                      value={onboardForm.arenaId}
                      onChange={(value) => setOnboardForm((prev) => ({ ...prev, arenaId: value }))}
                      placeholder={
                        onboardForm.vendorId
                          ? "Select eligible arena"
                          : "Choose vendor first"
                      }
                      searchable
                      asyncSearch={false}
                      disabled={!onboardForm.vendorId}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700"
                    />
                    {onboardErrors.arenaId && (
                      <p className="mt-1 text-[10px] font-medium text-red-500">{onboardErrors.arenaId}</p>
                    )}
                  </div>

                  {selectedArena && (
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
                  )}
                </div>
              )}

              {onboardStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Turf Name
                    </label>
                    <input
                      value={onboardForm.name}
                      onChange={(e) =>
                        setOnboardForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#8a9e60]"
                      placeholder="e.g. Arena A - Football Turf 4"
                    />
                    {onboardErrors.name && (
                      <p className="mt-1 text-[10px] font-medium text-red-500">{onboardErrors.name}</p>
                    )}
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
                      {onboardErrors.sport && (
                        <p className="mt-1 text-[10px] font-medium text-red-500">{onboardErrors.sport}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Surface Type
                      </label>
                      <Select
                        options={SURFACE_OPTIONS.map((option) => ({
                          value: option.value,
                          label: option.label,
                        }))}
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
                        onChange={(e) =>
                          setOnboardForm((prev) => ({ ...prev, capacity: e.target.value }))
                        }
                        type="number"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#8a9e60]"
                        placeholder="e.g. 14"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Size / Format
                      </label>
                      <input
                        value={onboardForm.sizeFormat}
                        onChange={(e) =>
                          setOnboardForm((prev) => ({ ...prev, sizeFormat: e.target.value }))
                        }
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#8a9e60]"
                        placeholder="e.g. 5-a-side"
                      />
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 3 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Standard Price (INR)
                      </label>
                      <input
                        value={onboardForm.standardPrice}
                        onChange={(e) =>
                          setOnboardForm((prev) => ({ ...prev, standardPrice: e.target.value }))
                        }
                        type="number"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#8a9e60]"
                      />
                      {onboardErrors.standardPrice && (
                        <p className="mt-1 text-[10px] font-medium text-red-500">
                          {onboardErrors.standardPrice}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Cancellation Window (hrs)
                      </label>
                      <input
                        value={onboardForm.cancellationWindowHrs}
                        onChange={(e) =>
                          setOnboardForm((prev) => ({
                            ...prev,
                            cancellationWindowHrs: e.target.value,
                          }))
                        }
                        type="number"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#8a9e60]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Weekday Open
                      </label>
                      <input
                        type="time"
                        value={onboardForm.weekdayOpen}
                        onChange={(e) =>
                          setOnboardForm((prev) => ({ ...prev, weekdayOpen: e.target.value }))
                        }
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#8a9e60]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Weekday Close
                      </label>
                      <input
                        type="time"
                        value={onboardForm.weekdayClose}
                        onChange={(e) =>
                          setOnboardForm((prev) => ({ ...prev, weekdayClose: e.target.value }))
                        }
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#8a9e60]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Weekend Open
                      </label>
                      <input
                        type="time"
                        value={onboardForm.weekendOpen}
                        onChange={(e) =>
                          setOnboardForm((prev) => ({ ...prev, weekendOpen: e.target.value }))
                        }
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#8a9e60]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Weekend Close
                      </label>
                      <input
                        type="time"
                        value={onboardForm.weekendClose}
                        onChange={(e) =>
                          setOnboardForm((prev) => ({ ...prev, weekendClose: e.target.value }))
                        }
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#8a9e60]"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Slot Config
                    </p>
                    <SlotConfigEditor
                      config={{
                        slotDurationMins: onboardForm.slotConfig.slotDurationMins,
                        dailyConfigs: onboardForm.slotConfig.dailyConfigs,
                      }}
                      onChange={(next) =>
                        setOnboardForm((prev) => ({
                          ...prev,
                          slotConfig: {
                            slotDurationMins: next.slotDurationMins,
                            dailyConfigs: next.dailyConfigs,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
              <button
                onClick={() => {
                  if (onboardStep === 1) resetOnboard();
                  else setOnboardStep((prev) => prev - 1);
                }}
                className={`text-xs font-bold text-gray-500 ${onboardStep === 1 ? "invisible" : ""}`}
              >
                Back
              </button>

              <div className="flex items-center gap-2">
                {onboardStep < 3 ? (
                  <button
                    onClick={() => {
                      if (validateOnboardStep(onboardStep)) {
                        setOnboardStep((prev) => prev + 1);
                      }
                    }}
                    className="rounded-xl bg-[#8a9e60] px-6 py-2.5 text-xs font-bold text-white hover:opacity-90"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={() => void handleCreateTurf()}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#8a9e60] px-6 py-2.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {submitting && <CircleNotch size={14} className="animate-spin" />}
                    Create Turf
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {editingTurf && editForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        >
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Edit Turf</h2>
                <p className="text-xs text-gray-400">{editingTurf.name}</p>
              </div>
              <button onClick={() => setEditingTurf(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 px-6 py-5">
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="col-span-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#8a9e60]"
                placeholder="Turf name"
              />
              <Select
                options={SPORT_OPTIONS}
                value={editForm.sport}
                onChange={(value) => setEditForm({ ...editForm, sport: value })}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700"
              />
              <Select
                options={SURFACE_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                value={editForm.surfaceType}
                onChange={(value) => setEditForm({ ...editForm, surfaceType: value })}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700"
              />
              <input
                value={editForm.capacity}
                onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                type="number"
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#8a9e60]"
                placeholder="Capacity"
              />
              <input
                value={editForm.sizeFormat}
                onChange={(e) => setEditForm({ ...editForm, sizeFormat: e.target.value })}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#8a9e60]"
                placeholder="Size / Format"
              />
              <input
                value={editForm.standardPrice}
                onChange={(e) => setEditForm({ ...editForm, standardPrice: e.target.value })}
                type="number"
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#8a9e60]"
                placeholder="Price in INR"
              />
              <input
                value={editForm.cancellationWindowHrs}
                onChange={(e) =>
                  setEditForm({ ...editForm, cancellationWindowHrs: e.target.value })
                }
                type="number"
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#8a9e60]"
                placeholder="Cancellation Window"
              />
              <input
                type="time"
                value={editForm.weekdayOpen}
                onChange={(e) => setEditForm({ ...editForm, weekdayOpen: e.target.value })}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#8a9e60]"
              />
              <input
                type="time"
                value={editForm.weekdayClose}
                onChange={(e) => setEditForm({ ...editForm, weekdayClose: e.target.value })}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#8a9e60]"
              />
              <input
                type="time"
                value={editForm.weekendOpen}
                onChange={(e) => setEditForm({ ...editForm, weekendOpen: e.target.value })}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#8a9e60]"
              />
              <input
                type="time"
                value={editForm.weekendClose}
                onChange={(e) => setEditForm({ ...editForm, weekendClose: e.target.value })}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#8a9e60]"
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
              <button
                onClick={() => setEditingTurf(null)}
                className="text-xs font-bold text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSaveEdit()}
                disabled={savingEdit}
                className="inline-flex items-center gap-2 rounded-xl bg-[#8a9e60] px-6 py-2.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-60"
              >
                {savingEdit && <CircleNotch size={14} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Confirm Action</h3>
            <p className="mt-2 text-sm text-gray-500">
              Apply <span className="font-semibold text-gray-800">{confirmAction.action}</span> to{" "}
              <span className="font-semibold text-gray-800">{confirmAction.turf.name}</span>?
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="text-xs font-bold text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => void executeAction(confirmAction.action, confirmAction.turf)}
                className="rounded-xl bg-[#8a9e60] px-5 py-2.5 text-xs font-bold text-white hover:opacity-90"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
