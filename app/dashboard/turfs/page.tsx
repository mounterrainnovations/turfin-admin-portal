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
  CalendarBlank,
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
  CircleNotch,
  Check,
  Info,
  Warning,
  Timer,
} from "@phosphor-icons/react";
import { useState, useRef, useEffect, useCallback } from "react";
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
  TurfStatus,
  createTurfForVendor,
  CreateTurfDto,
  getTurfById,
  uploadTurfDocuments,
} from "@/features/turfs";
import {
  AdminSlot,
  SlotConfig,
  getAdminSlots,
  getAdminSlotConfig,
  upsertAdminSlotConfig,
  generateAdminSlots,
  patchAdminSlot,
  SLOT_STATUS_COLORS,
  UpsertSlotConfigPayload,
  SlotDayConfig,
  BlockReason,
  AdminSlotPatchPayload,
} from "@/features/slots";
import { generateDefaultDailyConfigs } from "@/features/slots/utils";
import { SlotConfigEditor } from "@/features/slots/components/SlotConfigEditor";
import { DashboardPagination } from "@/components/DashboardPagination";
import Select from "@/components/Select";
import { TableRowsSkeleton } from "@/components/LoadingSkeleton";
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

type ActionMenuState = {
  turf: Turf;
  top: number;
  left: number;
};

const FACILITIES_LIST = [
  "Changing Room",
  "Parking",
  "Washroom",
  "Drinking Water",
  "Floodlights",
  "Cafeteria",
  "Lockers",
  "First Aid",
  "Shower",
  "Equipment Rental",
  "Viewing Area",
];

const SPORTS_LIST = [
  "Football",
  "Cricket",
  "Badminton",
  "Tennis",
  "Basketball",
  "Volleyball",
  "Table Tennis",
  "Swimming",
  "Pickleball",
];

const KYC_DOCS_TURF = [
  { key: "propertyDocument", label: "Property Ownership/Lease" },
  { key: "municipalNoc", label: "Municipal NOC / Trade License" },
  { key: "liabilityInsurance", label: "Public Liability Insurance" },
  { key: "fieldPhotos", label: "Field Photos (Gallery)" },
];

const INIT_FORM = {
  vendorId: "",
  name: "",
  description: "",
  address: {
    houseNumber: "",
    landmark: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",
    googleMapsLink: "",
  },
  sports: [] as string[],
  surface: "",
  size: "",
  capacity: "",
  pricePerHour: "",
  cancellationWindowHrs: "2",
  weekdayFrom: "06:00",
  weekdayTo: "23:00",
  weekendFrom: "06:00",
  weekendTo: "23:00",
  facilities: [] as string[],
  propertyDocument: "",
  municipalNoc: "",
  liabilityInsurance: "",
  fieldPhotos: "none",
  slotConfig: {
    slotDurationMins: 60,
    bufferMins: 0,
    dailyConfigs: [] as SlotDayConfig[],
  },
};

type FormData = typeof INIT_FORM;

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
const dateKey = (d: Date) => d.toISOString().split("T")[0];
const TODAY = new Date();

// ─── Component ────────────────────────────────────────────────────────────────

export default function TurfsPage() {
  // Navigation & UI State
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusTab, setStatusTab] = useState<
    "all" | "active" | "inactive" | "pending" | "maintenance" | "suspended" | "banned"
  >("all");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchBy, setSearchBy] = useState<"name" | "vendor">("name");
  const [sportFilter, setSportFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState<
    "all" | "today" | "last7" | "last30"
  >("all");

  const [sportOpen, setSportOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const sportRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  // Data
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Selection & Details
  const [selected, setSelected] = useState<Turf | null>(null);
  const [tab, setTab] = useState<"overview" | "reviews" | "schedule" | "analytics">(
    "overview",
  );

  // Reviews
  const [reviews, setReviews] = useState<TurfReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // Schedule / Slots
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [slots, setSlots] = useState<AdminSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);
  const [slotToEdit, setSlotToEdit] = useState<AdminSlot | null>(null);
  const [slotBlockReason, setSlotBlockReason] = useState("");
  const [slotPriceInput, setSlotPriceInput] = useState("");
  const [updatingSlot, setUpdatingSlot] = useState(false);

  // Status Menu
  const [statusOpen, setStatusOpen] = useState(false);

  // Modals & Popovers
  const [actionMenu, setActionMenu] = useState<ActionMenuState | null>(null);
  const [sportsTooltip, setSportsTooltip] = useState<{
    fieldId: string;
    sports: string[];
    top: number;
    left: number;
  } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: "activate" | "deactivate" | "maintenance" | "suspend" | "unsuspend" | "ban" | "unban" | "remove";
    turf: Turf;
  } | null>(null);

  // Confirmation Drawer (for actions)
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    type: "success" | "warning" | "danger";
    icon: React.ReactNode;
    onConfirm: () => void;
  } | null>(null);

  // Edit Modal
  const [editTurf, setEditTurf] = useState<Turf | null>(null);
  const [editForm, setEditForm] = useState<UpdateTurfDto | null>(null);
  const [editTab, setEditTab] = useState<"general" | "slot-config" | "sports">(
    "general",
  );
  const [editSlotConfig, setEditSlotConfig] = useState<SlotConfig | null>(null);
  const [editSlotConfigLoading, setEditSlotConfigLoading] = useState(false);

  // Onboarding
  const [showOnboard, setShowOnboard] = useState(false);
  const [onboardStep, setOnboardStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({ ...INIT_FORM });

  // Sync slot config with pricing/hours
  useEffect(() => {
    setFormData((prev) => {
      const dailyConfigs = generateDefaultDailyConfigs({
        weekdayOpen: prev.weekdayFrom,
        weekdayClose: prev.weekdayTo,
        weekendOpen: prev.weekendFrom,
        weekendClose: prev.weekendTo,
        pricePerHour: parseFloat(prev.pricePerHour) || 0,
      });

      return {
        ...prev,
        slotConfig: {
          ...prev.slotConfig,
          dailyConfigs,
        },
      };
    });
  }, [
    formData.weekdayFrom,
    formData.weekdayTo,
    formData.weekendFrom,
    formData.weekendTo,
    formData.pricePerHour,
    formData.slotConfig.slotDurationMins,
  ]);
  const [onboardKycFiles, setOnboardKycFiles] = useState<
    Record<string, File | File[]>
  >({});
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(
    null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const onboardingFileInputRef = useRef<HTMLInputElement>(null);

  // KYC review modal
  const [kycField, setKycField] = useState<Turf | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<
    "idle" | "creating" | "uploading" | "finalizing" | "success"
  >("idle");
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
    setErrors({});
  };

  const validateTurfStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.vendorId) newErrors.vendorId = "Vendor is required";
    }

    if (step === 2) {
      if (!formData.name.trim()) newErrors.name = "Turf name is required";
      if (formData.sports.length === 0)
        newErrors.sports = "Select at least one sport";
      if (!formData.surface) newErrors.surface = "Surface type is required";
    }

    if (step === 3) {
      if (!formData.address.houseNumber?.trim())
        newErrors.houseNumber = "House number is required";
      if (!formData.address.landmark?.trim())
        newErrors.landmark = "Landmark is required";
      if (!formData.address.city.trim()) newErrors.city = "City is required";
      if (!formData.address.state) newErrors.state = "State is required";
      if (!formData.address.country.trim())
        newErrors.country = "Country is required";

      if (!formData.address.pinCode.trim()) {
        newErrors.pinCode = "PIN code is required";
      } else if (!/^\d{6}$/.test(formData.address.pinCode)) {
        newErrors.pinCode = "Must be 6 digits";
      }

      if (
        formData.address.googleMapsLink &&
        !/^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/[^\s]*)?$/.test(
          formData.address.googleMapsLink,
        )
      ) {
        newErrors.googleMapsLink = "Invalid URL format (no spaces allowed)";
      }
    }

    if (step === 4) {
      const price = parseFloat(formData.pricePerHour);
      if (isNaN(price) || price <= 0) {
        newErrors.pricePerHour = "Price must be greater than 0";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      setField(key as any, "selected");
    } else {
      // Single file for other documents
      setOnboardKycFiles((prev) => ({ ...prev, [key]: files[0] }));
      setField(key as any, files[0].name);
    }

    setUploadingDocKey(null);
    if (onboardingFileInputRef.current) {
      onboardingFileInputRef.current.value = "";
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onOnboard = async () => {
    setOnboardingStatus("creating");
    try {
      // Convert display values to DTO snake_case enums
      const toSnake = (s: string) =>
        s
          .toLowerCase()
          .trim()
          .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "")
          .replace(/\s+/g, "_");

      const payload: CreateTurfDto = {
        name: formData.name,
        standardPricePaise: Math.round(
          parseFloat(formData.pricePerHour || "0") * 100,
        ),
        cancellationWindowHrs: formData.cancellationWindowHrs
          ? parseInt(formData.cancellationWindowHrs)
          : undefined,
        address: {
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

      const response = await createTurfForVendor(formData.vendorId, payload);
      // BUG FIX: API returns { success: true, data: { ... } }
      const turfId = (response as any).data?.id;

      if (!turfId) {
        throw new Error("Failed to retrieve Turf ID from response.");
      }

      // 1.5. Upsert Slot Config
      try {
        await upsertAdminSlotConfig(turfId, formData.slotConfig);
      } catch (slotErr) {
        console.error("Slot config upsert failed:", slotErr);
        // We don't block the whole process if slot config fails
      }

      // 2. Sequential Uploads for KYC (if any)
      if (Object.keys(onboardKycFiles).length > 0) {
        setOnboardingStatus("uploading");
        try {
          const s3Paths = await performSequentialUploads(
            turfId,
            onboardKycFiles,
            "turf",
          );

          // 3. Finalize KYC with backend
          setOnboardingStatus("finalizing");
          await uploadTurfDocuments(turfId, {
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
            description:
              "Turf created but document upload failed. You can upload them later.",
            tone: "warning",
          });
        }
      }

      setOnboardingStatus("success");
      showToast({
        title: "Turf Onboarded",
        description: "New turf has been successfully created.",
        tone: "success",
      });

      // Delay closing to show success state for a moment
      setTimeout(() => {
        closeOnboard();
        refreshData();
        setOnboardingStatus("idle");
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setOnboardingStatus("idle");
      showToast({
        title: "Onboarding Failed",
        description: err.message || "Could not onboard turf",
        tone: "error",
      });
    }
  };

  // KYC Helpers
  function openKycReview(turf: Turf) {
    setKycField(turf);
    const init: Record<string, "pending" | "verified" | "rejected"> = {};
    const docs = (turf as any).kyc?.verification || turf.verification || {};
    KYC_DOCS_TURF.forEach((d) => {
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
        description: `Vendor notified to resubmit documents for ${kycField.name}.`,
        tone: "warning",
      });
      setKycField(null);
      refreshData();
    } catch (err: any) {
      showToast({ title: "Error", description: err.message, tone: "error" });
    }
  }

  // Row Helpers
  const avatar = (s: string) =>
    s
      .split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const getReviewerName = (r: TurfReview) =>
    r.user?.displayName || r.user?.email || "Anonymous Player";
  const formatRating = (n?: number) => (n ? n.toFixed(1) : "0.0");

  // Selection interactions
  const handleRowClick = (turf: Turf) => {
    setSelected(turf);
    setTab("overview");
  };

  // Status updates
  const handleStatusUpdate = async (status: TurfStatus) => {
    if (!selected) return;
    try {
      await updateTurfStatus(selected.id, { status });
      showToast({
        title: "Status Updated",
        description: `Turf is now ${status}.`,
        tone: "success",
      });
      refreshData();
    } catch (err: any) {
      showToast({
        title: "Update Failed",
        description: err.message,
        tone: "error",
      });
    } finally {
      setConfirm(null);
    }
  };

  // Modal Actions
  const handleConfirm = async () => {
    if (!confirmModal) return;
    const { type, turf } = confirmModal;
    try {
      if (type === "ban") await banTurf(turf.id);
      else if (type === "unban") await unbanTurf(turf.id);
      else if (type === "activate") await updateTurfStatus(turf.id, { status: "active" });
      else if (type === "deactivate") await updateTurfStatus(turf.id, { status: "inactive" });
      else if (type === "maintenance") await updateTurfStatus(turf.id, { status: "maintenance" });
      else if (type === "suspend") await updateTurfStatus(turf.id, { status: "suspended" });
      else if (type === "unsuspend") await updateTurfStatus(turf.id, { status: "active" });

      showToast({
        title: "Success",
        description: `Turf ${type}ed successfully.`,
        tone: "success",
      });
      refreshData();
    } catch (err: any) {
      showToast({ title: "Error", description: err.message, tone: "error" });
    } finally {
      setConfirmModal(null);
    }
  };

  // Edit logic
  const openEdit = async (turf: Turf) => {
    setEditTurf(turf);
    setEditForm({
      name: turf.name,
      description: turf.description,
      standardPricePaise: turf.standardPricePaise,
      cancellationWindowHrs: turf.cancellationWindowHrs,
      weekdayOpen: turf.weekdayOpen,
      weekdayClose: turf.weekdayClose,
      weekendOpen: turf.weekendOpen,
      weekendClose: turf.weekendClose,
      surfaceType: turf.surfaceType as any,
      sizeFormat: turf.sizeFormat,
      capacity: turf.capacity,
      sports: turf.sports as any[],
      amenities: turf.amenities as any[],
    });
    setEditTab("general");

    // Preload slot config
    setEditSlotConfigLoading(true);
    try {
      const cfg = await getAdminSlotConfig(turf.id);
      setEditSlotConfig(cfg);
    } catch (err) {
      console.error("Failed to load slot config:", err);
    } finally {
      setEditSlotConfigLoading(false);
    }
  };

  const saveEdit = async () => {
    if (!editTurf || !editForm) return;
    try {
      await updateTurf(editTurf.id, editForm);
      if (editSlotConfig) {
        await upsertAdminSlotConfig(editTurf.id, editSlotConfig);
      }
      showToast({
        title: "Turf Updated",
        description: "Changes saved successfully.",
        tone: "success",
      });
      setEditTurf(null);
      refreshData();
    } catch (err: any) {
      showToast({ title: "Error", description: err.message, tone: "error" });
    }
  };

  // Review logic
  const loadReviews = async (silent = false) => {
    if (!selected) return;
    if (!silent) setReviewsLoading(true);
    try {
      const data = await getTurfReviews(selected.id);
      setReviews(data);
    } catch (err) {
      console.error("Reviews load error:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleDeleteReview = async (review: TurfReview) => {
    if (!selected) return;
    setDeletingReviewId(review.id);
    try {
      await deleteTurfReview(selected.id, review.id);
      showToast({
        title: "Review Deleted",
        description: "Review has been removed.",
        tone: "success",
      });
      loadReviews(true);
    } catch (err: any) {
      showToast({ title: "Error", description: err.message, tone: "error" });
    } finally {
      setDeletingReviewId(null);
    }
  };

  // Schedule logic
  const loadSlots = async () => {
    if (!selected) return;
    setSlotsLoading(true);
    try {
      const data = await getAdminSlots(selected.id, dateKey(scheduleDate));
      setSlots(data);
    } catch (err) {
      console.error("Slots load error:", err);
    } finally {
      setSlotsLoading(false);
    }
  };

  const shiftDate = (n: number) => {
    const d = new Date(scheduleDate);
    d.setDate(d.getDate() + n);
    setScheduleDate(d);
  };

  const handleUpdateSlot = async (payload: AdminSlotPatchPayload) => {
    if (!selected || !slotToEdit) return;
    setUpdatingSlot(true);
    try {
      await patchAdminSlot(selected.id, slotToEdit.id, payload);
      showToast({
        title: "Slot Updated",
        description: "Status and pricing saved.",
        tone: "success",
      });
      setSlotToEdit(null);
      loadSlots();
    } catch (err: any) {
      showToast({ title: "Error", description: err.message, tone: "error" });
    } finally {
      setUpdatingSlot(false);
      setConfirm(null);
    }
  };

  useEffect(() => {
    if (tab === "reviews" && selected) loadReviews();
    if (tab === "schedule" && selected) loadSlots();
  }, [tab, selected, scheduleDate]);

  // Handle outside clicks for dropdowns
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
      const match = turfs.find((f) => f.id === selected.id);
      if (match) setSelected(match);
    }
  }, [turfs]);

  const { showToast } = useToast();

  const closeActionMenu = useCallback(() => setActionMenu(null), []);
  const closeSportsTooltip = useCallback(() => setSportsTooltip(null), []);

  const openActionMenu = useCallback(
    (turf: Turf, trigger: HTMLButtonElement) => {
      const rect = trigger.getBoundingClientRect();
      const menuWidth = 148;
      const menuItemCount = turf.status === "banned" ? 3 : 5;
      const menuHeight = menuItemCount * 34 + 18;
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
        current?.turf.id === turf.id ? null : { turf, top, left },
      );
    },
    [],
  );

  const openSportsTooltip = useCallback((turf: Turf, trigger: HTMLElement) => {
    const rect = trigger.getBoundingClientRect();
    const tooltipWidth = 260;
    const viewportPadding = 12;
    const left = Math.min(
      Math.max(viewportPadding + tooltipWidth / 2, rect.left + rect.width / 2),
      window.innerWidth - viewportPadding - tooltipWidth / 2,
    );

    setSportsTooltip({
      fieldId: turf.id,
      sports: turf.sports || [],
      top: rect.top - 8,
      left,
    });
  }, []);

  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [maintCount, setMaintCount] = useState(0);
  const [suspendedCount, setSuspendedCount] = useState(0);
  const [bannedCount, setBannedCount] = useState(0);

  const refreshData = async () => {
    setLoading(true);
    try {
      let startDate: string | undefined;
      let endDate: string | undefined;
      if (timeFilter !== "all") {
        const end = new Date();
        const start = new Date();
        if (timeFilter === "today") {
          start.setHours(0, 0, 0, 0);
        } else if (timeFilter === "last7") {
          start.setDate(end.getDate() - 7);
        } else if (timeFilter === "last30") {
          start.setDate(end.getDate() - 30);
        }
        startDate = start.toISOString();
        endDate = end.toISOString();
      }

      const [res, vRes] = await Promise.all([
        listTurfs({
          page,
          limit,
          status: statusTab === "all" ? undefined : statusTab,
          sportType:
            sportFilter === "All" ? undefined : sportFilter.toLowerCase(),
          city: cityFilter === "All" ? undefined : cityFilter,
          search: debouncedSearch.trim() || undefined,
          searchBy,
          startDate,
          endDate,
        }),
        listVendors({ limit: 100 }),
      ]);

      setTurfs(res.items);
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
      setBannedCount(res.items.filter((f) => f.status === "banned").length);
    } catch (err: any) {
      const isAuthError =
        err.message === "Unauthorized" ||
        err.message?.toLowerCase().includes("unauthorized") ||
        err.message?.toLowerCase().includes("unauthorised");

      showToast({
        title: isAuthError ? "Turf data unavailable" : "Error",
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
  }, [
    page,
    limit,
    statusTab,
    sportFilter,
    cityFilter,
    debouncedSearch,
    searchBy,
    timeFilter,
  ]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    if (!actionMenu) return;

    const handleViewportChange = () => setActionMenu(null);

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [actionMenu]);

  useEffect(() => {
    if (!sportsTooltip) return;

    const handleViewportChange = () => setSportsTooltip(null);

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [sportsTooltip]);

  useEffect(() => {
    setPage(1);
  }, [
    statusTab,
    sportFilter,
    cityFilter,
    debouncedSearch,
    searchBy,
    timeFilter,
  ]);

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

  const filtered = turfs;

  const STATUS_TABS = [
    "all",
    "active",
    "inactive",
    "pending",
    "maintenance",
    "suspended",
    "banned",
  ] as const;

  const STAT_CARDS = [
    {
      label: "Total Turfs",
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
    <>
    {/* Stat cards + filters */}
    <div>
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
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-gray-800">
                  {loading ? "—" : value}
                </p>
                <p className="text-[10px] text-gray-400 font-medium truncate">
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
            {STATUS_TABS.map((tabId) => (
              <button
                key={tabId}
                onClick={() => setStatusTab(tabId)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  statusTab === tabId
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tabId}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <MagnifyingGlass size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={`Search ${searchBy}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium w-64 focus:ring-1 focus:ring-[#8a9e60] focus:border-[#8a9e60] outline-none transition-all shadow-sm"
              />
              <div className="absolute inset-y-0 right-1.5 flex items-center">
                <button
                  onClick={() => setSearchBy(searchBy === "name" ? "vendor" : "name")}
                  className="px-2 py-1 rounded-lg bg-gray-50 text-[9px] font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wider border border-gray-100"
                >
                  By {searchBy}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 h-9 px-1.5 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="relative" ref={sportRef}>
                <button
                  onClick={() => setSportOpen(!sportOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-xs font-semibold text-gray-600"
                >
                  <Funnel size={14} className="text-gray-400" />
                  {sportFilter}
                  <CaretDown size={12} className="text-gray-400" />
                </button>
                {sportOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-20">
                    {allSports.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setSportFilter(s);
                          setSportOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-xs font-medium hover:bg-gray-50 transition-colors ${
                          sportFilter === s ? "text-[#8a9e60]" : "text-gray-600"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-px h-4 bg-gray-100" />
              <div className="relative" ref={cityRef}>
                <button
                  onClick={() => setCityOpen(!cityOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-xs font-semibold text-gray-600"
                >
                  <MapPin size={14} className="text-gray-400" />
                  {cityFilter}
                  <CaretDown size={12} className="text-gray-400" />
                </button>
                {cityOpen && (
                  <div className="absolute top-full right-0 mt-1.5 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-20">
                    {allCities.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setCityFilter(c);
                          setCityOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-xs font-medium hover:bg-gray-50 transition-colors ${
                          cityFilter === c ? "text-[#8a9e60]" : "text-gray-600"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowOnboard(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#8a9e60] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#8a9e60]/20 hover:opacity-90 transition-all shrink-0"
            >
              <Plus size={16} weight="bold" />
              Onboard Turf
            </button>
          </div>
        </div>

        {/* Data table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px] flex flex-col">
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Turf Details
                  </th>
                  <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Sports
                  </th>
                  <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Standard Price
                  </th>
                  <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Rating
                  </th>
                  <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    KYC
                  </th>
                  <th className="px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                    Bookings
                  </th>
                  <th className="w-20 px-4 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50/50">
                {loading ? (
                  <TableRowsSkeleton columns={8} rows={5} />
                ) : turfs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                        <MapPin size={40} />
                        <p className="text-sm font-medium">No turfs found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  turfs.map((turf) => {
                    const sc = STATUS_CONFIG[turf.status] || {
                      label: turf.status,
                      dot: "bg-gray-400",
                      cls: "bg-gray-50 text-gray-500",
                    };
                    const kyc = KYC_CFG[turf.kycStatus || "pending"] || {
                      label: "Pending",
                      cls: "bg-gray-50 text-gray-400",
                    };
                    const KycIcon =
                      turf.kycStatus === "verified"
                        ? ShieldCheck
                        : turf.kycStatus === "rejected"
                          ? XCircle
                          : ClockCountdown;

                    return (
                      <tr
                        key={turf.id}
                        onClick={() => handleRowClick(turf)}
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                              style={{ backgroundColor: "#8a9e60" }}
                            >
                              {avatar(turf.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight mb-0.5">
                                {turf.id.slice(0, 8)}...
                              </p>
                              <h3 className="text-sm font-bold text-gray-800 truncate leading-tight">
                                {turf.name}
                              </h3>
                              <p className="text-[10px] text-gray-400 mt-0.5 truncate flex items-center gap-1 font-medium">
                                <Buildings size={10} />
                                {turf.vendor?.businessName ||
                                  turf.vendorBusinessName ||
                                  "Independent Vendor"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Sports */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 items-center">
                            {(turf.sports || []).slice(0, 2).map((s) => (
                              <span
                                key={s}
                                onMouseEnter={(e) =>
                                  openSportsTooltip(turf, e.currentTarget)
                                }
                                onMouseLeave={closeSportsTooltip}
                                className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-gray-100 text-gray-500 bg-gray-50 capitalize whitespace-nowrap"
                              >
                                {s.replace(/_/g, " ")}
                              </span>
                            ))}
                            {(turf.sports || []).length > 2 && (
                              <div
                                className="relative inline-block"
                                onMouseEnter={(e) =>
                                  openSportsTooltip(turf, e.currentTarget)
                                }
                                onMouseLeave={closeSportsTooltip}
                              >
                                <span
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 border border-gray-200 cursor-help"
                                >
                                  +{(turf.sports || []).length - 2}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3">
                          <p className="text-xs font-bold text-gray-800">
                            ₹
                            {(
                              (turf.standardPricePaise || 0) / 100
                            ).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-gray-400">per hour</p>
                        </td>

                        {/* Rating */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-gray-800">
                              {formatRating(turf.rating)}
                            </span>
                            {(turf.rating || 0) > 0 && (
                              <Star
                                size={12}
                                weight="fill"
                                className="text-amber-400"
                              />
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400">
                            {turf.totalReviews || 0} review
                            {(turf.totalReviews || 0) === 1 ? "" : "s"}
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
                          {turf.totalBookings || 0}
                        </td>

                        {/* Actions */}
                        <td
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenu(null);
                                setSelected(turf);
                              }}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                              title="View"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenu(null);
                                openEdit(turf);
                              }}
                              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Edit"
                            >
                              <PencilSimple size={14} />
                            </button>
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openActionMenu(turf, e.currentTarget);
                                }}
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <DotsThreeVertical size={14} />
                              </button>
                            </div>
                          </div>
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
                    Onboard New Turf
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Step {onboardStep} of 6 — Selection
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
                {[1, 2, 3, 4, 5, 6].map((n) => {
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
                      </div>
                      {n !== 6 && (
                        <div
                          className="h-0.5 flex-1 mx-2"
                          style={{
                            backgroundColor: done ? "#8a9e60" : "#f3f4f6",
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-7">
              {onboardStep === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                        Turf Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setField("name", e.target.value)}
                        placeholder="e.g. Kickoff Arena - Field A"
                        className={`w-full px-4 py-2.5 bg-gray-50 border ${
                          errors.name ? "border-red-300" : "border-gray-100"
                        } rounded-xl text-sm focus:ring-1 focus:ring-[#8a9e60] outline-none transition-all`}
                      />
                      {errors.name && (
                        <p className="text-[10px] text-red-500 mt-1 font-medium">
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                        Sports Supported
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {SPORTS_LIST.map((s) => (
                          <button
                            key={s}
                            onClick={() => toggleArr("sports", s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              formData.sports.includes(s)
                                ? "bg-[#8a9e60] text-white border-[#8a9e60]"
                                : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      {errors.sports && (
                        <p className="text-[10px] text-red-500 mt-1 font-medium">
                          {errors.sports}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                          Surface Type
                        </label>
                        <select
                          value={formData.surface}
                          onChange={(e) => setField("surface", e.target.value)}
                          className={`w-full px-4 py-2.5 bg-gray-50 border ${
                            errors.surface ? "border-red-300" : "border-gray-100"
                          } rounded-xl text-sm outline-none`}
                        >
                          <option value="">Select...</option>
                          <option value="Artificial Turf">Artificial Turf</option>
                          <option value="Natural Grass">Natural Grass</option>
                          <option value="Matting">Matting</option>
                          <option value="Hard Court">Hard Court</option>
                          <option value="Sand">Sand</option>
                          <option value="Clay">Clay</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                          Size / Format (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.size}
                          onChange={(e) => setField("size", e.target.value)}
                          placeholder="e.g. 5-a-side, 7-a-side"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-1 focus:ring-[#8a9e60] outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                        House/Plot Number
                      </label>
                      <input
                        type="text"
                        value={formData.address.houseNumber}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            address: { ...p.address, houseNumber: e.target.value },
                          }))
                        }
                        className={`w-full px-4 py-2.5 bg-gray-50 border ${
                          errors.houseNumber
                            ? "border-red-300"
                            : "border-gray-100"
                        } rounded-xl text-sm outline-none`}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                        Landmark / Street
                      </label>
                      <input
                        type="text"
                        value={formData.address.landmark}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            address: { ...p.address, landmark: e.target.value },
                          }))
                        }
                        className={`w-full px-4 py-2.5 bg-gray-50 border ${
                          errors.landmark ? "border-red-300" : "border-gray-100"
                        } rounded-xl text-sm outline-none`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.address.city}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            address: { ...p.address, city: e.target.value },
                          }))
                        }
                        className={`w-full px-4 py-2.5 bg-gray-50 border ${
                          errors.city ? "border-red-300" : "border-gray-100"
                        } rounded-xl text-sm outline-none`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                        State
                      </label>
                      <select
                        value={formData.address.state}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            address: { ...p.address, state: e.target.value },
                          }))
                        }
                        className={`w-full px-4 py-2.5 bg-gray-50 border ${
                          errors.state ? "border-red-300" : "border-gray-100"
                        } rounded-xl text-sm outline-none`}
                      >
                        <option value="">Select State</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Gujarat">Gujarat</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                        PIN Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={formData.address.pinCode}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            address: { ...p.address, pinCode: e.target.value },
                          }))
                        }
                        className={`w-full px-4 py-2.5 bg-gray-50 border ${
                          errors.pinCode ? "border-red-300" : "border-gray-100"
                        } rounded-xl text-sm outline-none`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                        Google Maps Link
                      </label>
                      <input
                        type="text"
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
                        placeholder="https://maps.google.com/..."
                        className={`w-full px-4 py-2.5 bg-gray-50 border ${
                          errors.googleMapsLink
                            ? "border-red-300"
                            : "border-gray-100"
                        } rounded-xl text-sm outline-none`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 4 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                        Base Pricing (Standard Rate)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 inset-y-0 flex items-center text-gray-400 font-bold text-sm">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={formData.pricePerHour}
                          onChange={(e) =>
                            setField("pricePerHour", e.target.value)
                          }
                          placeholder="0"
                          className={`w-full pl-8 pr-16 py-3 bg-gray-50 border ${
                            errors.pricePerHour
                              ? "border-red-300"
                              : "border-gray-100"
                          } rounded-xl text-lg font-bold outline-none focus:ring-1 focus:ring-[#8a9e60] transition-all`}
                        />
                        <span className="absolute right-4 inset-y-0 flex items-center text-gray-400 text-[10px] font-bold uppercase">
                          Per Hour
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Weekday Hours
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={formData.weekdayFrom}
                          onChange={(e) =>
                            setField("weekdayFrom", e.target.value)
                          }
                          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs outline-none"
                        />
                        <span className="text-gray-300">to</span>
                        <input
                          type="time"
                          value={formData.weekdayTo}
                          onChange={(e) => setField("weekdayTo", e.target.value)}
                          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        Weekend Hours
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={formData.weekendFrom}
                          onChange={(e) =>
                            setField("weekendFrom", e.target.value)
                          }
                          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs outline-none"
                        />
                        <span className="text-gray-300">to</span>
                        <input
                          type="time"
                          value={formData.weekendTo}
                          onChange={(e) => setField("weekendTo", e.target.value)}
                          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div className="col-span-2 pt-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 block">
                        Amenities & Facilities
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {FACILITIES_LIST.map((f) => (
                          <button
                            key={f}
                            onClick={() => toggleArr("facilities", f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              formData.facilities.includes(f)
                                ? "bg-[#8a9e60]/10 text-[#8a9e60] border-[#8a9e60]"
                                : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 5 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 mb-6">
                    <div className="flex gap-3">
                      <ShieldCheck
                        size={20}
                        weight="fill"
                        className="text-amber-600 shrink-0"
                      />
                      <div>
                        <p className="text-xs font-bold text-amber-900 mb-1">
                          Document Verification Required
                        </p>
                        <p className="text-[10px] text-amber-700 leading-relaxed">
                          Please upload clear scanned copies of the following
                          documents. Max file size 5MB per document. Supported:
                          PDF, JPG, PNG.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {KYC_DOCS_TURF.map((doc) => {
                      const isSelected = !!onboardKycFiles[doc.key];
                      return (
                        <div
                          key={doc.key}
                          className={`p-4 rounded-xl border transition-all ${
                            isSelected
                              ? "border-green-200 bg-green-50/30"
                              : "border-gray-100 bg-gray-50/50"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-gray-400">
                              <FileText size={18} />
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white">
                                <Check size={12} weight="bold" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-bold text-gray-800 mb-1">
                            {doc.label}
                          </p>
                          <button
                            onClick={() => {
                              setUploadingDocKey(doc.key);
                              onboardingFileInputRef.current?.click();
                            }}
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              isSelected ? "text-green-600" : "text-[#8a9e60]"
                            } hover:underline`}
                          >
                            {isSelected ? "Change File" : "Upload Document"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <input
                    type="file"
                    ref={onboardingFileInputRef}
                    onChange={handleOnboardFileSelect}
                    className="hidden"
                    multiple={uploadingDocKey === "fieldPhotos"}
                    accept="image/*,.pdf"
                  />
                </div>
              )}

              {onboardStep === 6 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 border-b border-gray-200 pb-3 flex items-center gap-2">
                      <ShieldCheck size={18} weight="fill" className="text-[#8a9e60]" />
                      Review & Confirm
                    </h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Turf Name
                        </p>
                        <p className="text-sm font-bold text-gray-800">
                          {formData.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Vendor
                        </p>
                        <p className="text-sm font-bold text-gray-800">
                          {vendors.find((v) => v.id === formData.vendorId)
                            ?.businessName || "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Location
                        </p>
                        <p className="text-sm font-bold text-gray-800 truncate">
                          {formData.address.city}, {formData.address.state}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Standard Price
                        </p>
                        <p className="text-sm font-bold text-gray-800">
                          ₹{formData.pricePerHour}/hr
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                          Sports & Surface
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {formData.sports.map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 rounded-lg bg-[#8a9e60]/10 text-[#8a9e60] text-[10px] font-bold border border-[#8a9e60]/20"
                            >
                              {s}
                            </span>
                          ))}
                          <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500 text-[10px] font-bold border border-gray-200">
                            {formData.surface}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <Info size={20} weight="fill" className="text-blue-500 shrink-0" />
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      By clicking finish, the turf will be created in the system.
                      Document verification by an admin is required before the
                      turf can go live.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-7 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
              <button
                onClick={() => setOnboardStep((s) => Math.max(1, s - 1))}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors ${
                  onboardStep === 1 ? "invisible" : ""
                }`}
              >
                <CaretLeft size={16} weight="bold" />
                Back
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={closeOnboard}
                  className="px-5 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (onboardStep < 6) {
                      if (validateTurfStep(onboardStep)) {
                        setOnboardStep((s) => s + 1);
                      }
                    } else {
                      onOnboard();
                    }
                  }}
                  className="flex items-center gap-2 px-8 py-2.5 bg-[#8a9e60] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#8a9e60]/20 hover:opacity-90 transition-all"
                >
                  {onboardStep === 6 ? (
                    "Finish Onboarding"
                  ) : (
                    <>
                      Next
                      <CaretRight size={16} weight="bold" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Menu Popover */}
      {actionMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeActionMenu} />
          <div
            className="fixed z-50 w-44 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 animate-in fade-in zoom-in-95 duration-200"
            style={{ top: actionMenu.top, left: actionMenu.left }}
          >
            <div className="px-3 py-1.5 mb-1.5 border-b border-gray-50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Actions
              </p>
            </div>
            {actionMenu.turf.status === "banned" ? (
              <button
                onClick={() => {
                  setConfirmModal({ type: "unban", turf: actionMenu.turf });
                  closeActionMenu();
                }}
                className="w-full px-4 py-2 text-left text-xs font-bold text-green-600 hover:bg-green-50 transition-colors flex items-center gap-2.5"
              >
                <CheckCircle size={16} weight="bold" />
                Unban Turf
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setSelected(actionMenu.turf);
                    closeActionMenu();
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2.5"
                >
                  <Eye size={16} weight="bold" />
                  View Details
                </button>
                <button
                  onClick={() => {
                    openEdit(actionMenu.turf);
                    closeActionMenu();
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2.5"
                >
                  <PencilSimple size={16} weight="bold" />
                  Edit Turf
                </button>
                <div className="h-px bg-gray-50 my-1.5" />
                {actionMenu.turf.status === "active" ? (
                  <button
                    onClick={() => {
                      setConfirmModal({
                        type: "deactivate",
                        turf: actionMenu.turf,
                      });
                      closeActionMenu();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-amber-600 hover:bg-amber-50 transition-colors flex items-center gap-2.5"
                  >
                    <XCircle size={16} weight="bold" />
                    Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setConfirmModal({
                        type: "activate",
                        turf: actionMenu.turf,
                      });
                      closeActionMenu();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-[#8a9e60] hover:bg-[#8a9e60]/5 transition-colors flex items-center gap-2.5"
                  >
                    <CheckCircle size={16} weight="bold" />
                    Activate
                  </button>
                )}
                <button
                  onClick={() => {
                    setConfirmModal({ type: "ban", turf: actionMenu.turf });
                    closeActionMenu();
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2.5"
                >
                  <Prohibit size={16} weight="bold" />
                  Ban Turf
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Sports Tooltip */}
      {sportsTooltip && (
        <div
          className="fixed z-[100] px-4 py-3 bg-white rounded-2xl shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200 pointer-events-none"
          style={{
            top: sportsTooltip.top,
            left: sportsTooltip.left,
            transform: "translate(-50%, -100%)",
            width: "260px",
          }}
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-white border-b border-r border-gray-100 rotate-45" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
            Supported Sports
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sportsTooltip.sports.map((s) => (
              <span
                key={s}
                className="px-2.5 py-1 rounded-lg bg-[#8a9e60]/5 text-[#8a9e60] text-[10px] font-bold border border-[#8a9e60]/10 capitalize"
              >
                {s.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Details Side Panel */}
      {selected && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-300"
            onClick={() => setSelected(null)}
          />
          <div className="fixed inset-y-0 right-0 w-[420px] bg-white shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.15)] z-[70] flex flex-col animate-in slide-in-from-right duration-500 ease-out border-l border-gray-100">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
                >
                  <ArrowLeft size={18} weight="bold" />
                </button>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                    ID: {selected.id.slice(0, 8)}
                  </p>
                  <h2 className="text-base font-bold text-gray-900 truncate max-w-[220px]">
                    {selected.name}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(selected)}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
                >
                  <PencilSimple size={18} weight="bold" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setStatusOpen(!statusOpen)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all flex items-center gap-2 ${
                      STATUS_CONFIG[selected.status]?.cls ||
                      "bg-gray-50 text-gray-500 border-gray-100"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selected.status]?.dot || "bg-gray-400"}`}
                    />
                    {STATUS_CONFIG[selected.status]?.label || selected.status}
                    <CaretDown size={10} weight="bold" />
                  </button>
                  {statusOpen && (
                    <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-20">
                      {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
                        <button
                          key={k}
                          onClick={() => {
                            handleStatusUpdate(k as TurfStatus);
                            setStatusOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2.5"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                          />
                          {cfg.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center px-6 border-b border-gray-50 shrink-0 bg-white">
              {[
                { id: "overview", label: "Overview" },
                { id: "schedule", label: "Schedule" },
                { id: "reviews", label: "Reviews" },
                { id: "analytics", label: "Analytics" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as any)}
                  className={`px-4 py-4 text-xs font-bold transition-all relative ${
                    tab === t.id ? "text-[#8a9e60]" : "text-gray-400"
                  }`}
                >
                  {t.label}
                  {tab === t.id && (
                    <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#8a9e60] rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30 custom-scrollbar">
              {tab === "overview" && (
                <>
                  {/* Quick stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                        Price
                      </p>
                      <p className="text-base font-bold text-gray-900 leading-none">
                        ₹
                        {(
                          (selected.standardPricePaise || 0) / 100
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                        Rating
                      </p>
                      <p className="text-base font-bold text-gray-900 leading-none flex items-center gap-1">
                        {formatRating(selected.rating)}
                        <Star
                          size={14}
                          weight="fill"
                          className="text-amber-400"
                        />
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                        KYC
                      </p>
                      <p
                        className={`text-[10px] font-bold leading-none ${
                          KYC_CFG[selected.kycStatus || "pending"]?.cls || ""
                        }`}
                      >
                        {KYC_CFG[selected.kycStatus || "pending"]?.label ||
                          "Pending"}
                      </p>
                    </div>
                  </div>

                  {/* Vendor Info */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                      Vendor Details
                    </p>
                    <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-50">
                      <div className="w-12 h-12 rounded-2xl bg-[#8a9e60]/10 flex items-center justify-center text-[#8a9e60] font-bold text-sm shrink-0 shadow-inner">
                        {avatar(
                          selected.vendor?.businessName ||
                            selected.vendorBusinessName ||
                            "IV",
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 truncate">
                          {selected.vendor?.businessName ||
                            selected.vendorBusinessName ||
                            "Independent Vendor"}
                        </h4>
                        <p className="text-[11px] text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
                          <Envelope size={12} />
                          {selected.vendor?.email || "No email linked"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                          <MapPin size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">
                            Location
                          </p>
                          <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                            {selected.address?.houseNumber || ""}{" "}
                            {selected.address?.landmark || ""},{" "}
                            {selected.address?.city}, {selected.address?.state}{" "}
                            — {selected.address?.pinCode}
                          </p>
                          {selected.address?.googleMapsLink && (
                            <a
                              href={selected.address.googleMapsLink}
                              target="_blank"
                              className="text-[10px] font-bold text-[#8a9e60] hover:underline mt-1.5 inline-block"
                            >
                              View on Google Maps
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                          <ClockCountdown size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">
                            Operational Hours
                          </p>
                          <p className="text-[11px] text-gray-600 font-medium">
                            WD: {selected.weekdayOpen} - {selected.weekdayClose}{" "}
                            | WE: {selected.weekendOpen} -{" "}
                            {selected.weekendClose}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sports & Amenities */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                        Sports
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(selected.sports || []).map((s) => (
                          <span
                            key={s}
                            className="px-2.5 py-1 rounded-lg bg-gray-50 text-[10px] font-bold text-gray-600 border border-gray-100 capitalize"
                          >
                            {s.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                        Amenities
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(selected.amenities || []).map((a) => (
                          <span
                            key={a}
                            className="px-2.5 py-1 rounded-lg bg-gray-50 text-[10px] font-bold text-gray-600 border border-gray-100 capitalize"
                          >
                            {a.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* KYC Verification */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        KYC Documents
                      </p>
                      <button
                        onClick={() => openKycReview(selected)}
                        className="px-3 py-1.5 bg-[#8a9e60] text-white rounded-xl text-[10px] font-bold hover:opacity-90 transition-all shadow-lg shadow-[#8a9e60]/20"
                      >
                        Review Documents
                      </button>
                    </div>
                    <div className="space-y-3">
                      {KYC_DOCS_TURF.map((doc) => {
                        const verified =
                          (selected as any).kyc?.verification?.[doc.key] === true ||
                          (selected as any).verification?.[doc.key] === true;
                        const rejected =
                          (selected as any).kyc?.verification?.[doc.key] === false ||
                          (selected as any).verification?.[doc.key] === false;

                        return (
                          <div
                            key={doc.key}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/50 border border-gray-100 group hover:border-gray-200 transition-colors"
                          >
                            <span className="text-[11px] font-bold text-gray-600 flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                <FileText size={14} className="text-gray-400" />
                              </div>
                              {doc.label}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {verified ? (
                                <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                  <CheckCircle size={10} weight="fill" />
                                  Verified
                                </span>
                              ) : rejected ? (
                                <span className="text-[9px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                  <XCircle size={10} weight="fill" />
                                  Rejected
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                  <ClockCountdown size={10} weight="fill" />
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {tab === "reviews" && (
                <div className="space-y-4">
                  {reviewsLoading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                      <CircleNotch
                        size={32}
                        className="animate-spin text-[#8a9e60]"
                      />
                      <p className="text-xs text-gray-400 font-medium">
                        Fetching player reviews...
                      </p>
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="py-20 flex flex-col items-center gap-3 opacity-20">
                      <Star size={40} />
                      <p className="text-sm font-bold">No reviews yet</p>
                    </div>
                  ) : (
                    reviews.map((r) => (
                      <div
                        key={r.id}
                        className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm group relative"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-[#8a9e60] text-xs shadow-inner">
                              {avatar(getReviewerName(r))}
                            </div>
                            <div>
                              <h5 className="text-sm font-bold text-gray-900 truncate max-w-[180px]">
                                {getReviewerName(r)}
                              </h5>
                              <p className="text-[10px] text-gray-400 font-medium">
                                {new Date(r.createdAt).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                            <span className="text-[10px] font-bold text-amber-700">
                              {r.rating.toFixed(1)}
                            </span>
                            <Star
                              size={12}
                              weight="fill"
                              className="text-amber-400"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-600 leading-relaxed font-medium mb-3 italic">
                          "{r.comment || "No comment provided."}"
                        </p>
                        <button
                          onClick={() => handleDeleteReview(r)}
                          disabled={deletingReviewId === r.id}
                          className="absolute bottom-4 right-4 p-2 rounded-xl text-red-100 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        >
                          {deletingReviewId === r.id ? (
                            <CircleNotch size={14} className="animate-spin" />
                          ) : (
                            <Trash size={14} weight="bold" />
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === "schedule" && (
                <>
                  {/* Date picker */}
                  <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-gray-100 shadow-sm sticky top-0 z-10">
                    <button
                      onClick={() => shiftDate(-1)}
                      className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 transition-colors"
                    >
                      <CaretLeft size={16} weight="bold" />
                    </button>
                    <div className="relative" ref={calRef}>
                      <button
                        onClick={() => setCalOpen(!calOpen)}
                        className="flex flex-col items-center gap-0.5"
                      >
                        <p className="text-sm font-bold text-gray-800">
                          {fmtDate(scheduleDate)}
                        </p>
                        <p className="text-[9px] font-bold text-[#8a9e60] uppercase tracking-widest">
                          {scheduleDate.getFullYear() === TODAY.getFullYear()
                            ? "Current Year"
                            : scheduleDate.getFullYear()}
                        </p>
                      </button>
                    </div>
                    <button
                      onClick={() => shiftDate(1)}
                      className="p-2 rounded-xl hover:bg-gray-50 text-gray-400 transition-colors"
                    >
                      <CaretRight size={16} weight="bold" />
                    </button>
                  </div>

                  {/* Slots list */}
                  <div className="space-y-2.5">
                    {slotsLoading ? (
                      [...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="h-16 bg-white/50 rounded-2xl animate-pulse border border-gray-50"
                        />
                      ))
                    ) : slots.length === 0 ? (
                      <div className="py-20 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center opacity-30">
                          <CalendarBlank size={32} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-gray-400">
                            No slots generated
                          </p>
                          <button
                            onClick={async () => {
                              try {
                                await generateAdminSlots(
                                  selected.id,
                                  dateKey(scheduleDate),
                                );
                                loadSlots();
                              } catch (err: any) {
                                showToast({
                                  title: "Error",
                                  description: err.message,
                                  tone: "error",
                                });
                              }
                            }}
                            className="text-[10px] font-bold text-[#8a9e60] hover:underline mt-2 uppercase tracking-widest"
                          >
                            Generate for this day
                          </button>
                        </div>
                      </div>
                    ) : (
                      slots.map((s) => {
                        const status = s.status || "available";
                        const cfg = SLOT_STATUS_COLORS[status] || {
                          bg: "bg-gray-50",
                          text: "text-gray-400",
                          dot: "bg-gray-300",
                          label: "Unknown",
                        };

                        return (
                          <div
                            key={s.id}
                            onClick={() => setSlotToEdit(s)}
                            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#8a9e60]/30 transition-all cursor-pointer relative overflow-hidden"
                          >
                            <div className="absolute left-0 inset-y-0 w-1 bg-transparent group-hover:bg-[#8a9e60] transition-all" />
                            <div className="flex items-center gap-4">
                              <div className="w-12 flex flex-col items-center">
                                <p className="text-xs font-bold text-gray-800 leading-none mb-1">
                                  {s.startTime.slice(0, 5)}
                                </p>
                                <div className="h-2 w-px bg-gray-100" />
                                <p className="text-[10px] font-bold text-gray-400 leading-none mt-1">
                                  {s.endTime.slice(0, 5)}
                                </p>
                              </div>
                              <div>
                                <span
                                  className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-0.5 rounded-lg ${cfg.bg} ${cfg.text} uppercase tracking-wider mb-1.5`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                                  />
                                  {cfg.label}
                                </span>
                                {s.blockReason && (
                                  <p className="text-[10px] text-gray-500 font-medium italic">
                                    "{s.blockReason}"
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-800">
                                ₹{((s.pricePaise || 0) / 100).toLocaleString()}
                              </p>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                Per Slot
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}

              {tab === "analytics" && (
                <div className="space-y-6">
                  {/* Key metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: "Total Bookings",
                        value: (selected.totalBookings || 0).toLocaleString(),
                        sub: "all time",
                      },
                      {
                        label: "Total Revenue",
                        value:
                          ((selected as any).totalRevenue || 0) > 0
                            ? `₹${(((selected as any).totalRevenue || 0) / 1000).toFixed(0)}K`
                            : "—",
                        sub: "estimated gross",
                      },
                      {
                        label: "Avg. Rating",
                        value:
                          (selected.rating || 0) > 0
                            ? `${formatRating(selected.rating)} ★`
                            : "—",
                        sub: `${selected.totalReviews || 0} reviews`,
                      },
                      {
                        label: "Occupancy",
                        value: "68%",
                        sub: "last 30 days",
                      },
                    ].map(({ label, value, sub }) => (
                      <div
                        key={label}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                      >
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                          {label}
                        </p>
                        <p className="text-xl font-bold text-gray-900 leading-tight">
                          {value}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-1 font-bold uppercase tracking-wider">
                          {sub}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Placeholder chart */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                      Weekly Utilization
                    </p>
                    <div className="flex items-end gap-2.5 h-32 pt-4">
                      {[
                        { day: "Mon", pct: 45 },
                        { day: "Tue", pct: 38 },
                        { day: "Wed", pct: 52 },
                        { day: "Thu", pct: 41 },
                        { day: "Fri", pct: 78 },
                        { day: "Sat", pct: 92 },
                        { day: "Sun", pct: 86 },
                      ].map(({ day, pct }) => (
                        <div
                          key={day}
                          className="flex-1 flex flex-col items-center gap-2"
                        >
                          <div
                            className="w-full rounded-t-lg transition-all duration-1000 bg-[#8a9e60]/80 group-hover:bg-[#8a9e60]"
                            style={{ height: `${pct}%` }}
                          />
                          <span className="text-[9px] font-bold text-gray-400 uppercase">
                            {day}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                    <div className="flex gap-3">
                      <WarningCircle
                        size={20}
                        weight="fill"
                        className="text-amber-500 shrink-0"
                      />
                      <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                        Detailed financial analytics and exportable reports are
                        currently being processed for this turf. Check back in
                        24 hours for full visibility.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Edit Slot Modal */}
      {slotToEdit && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Modify Slot
                  </h3>
                  <p className="text-xs text-gray-400 font-medium">
                    {fmtDate(scheduleDate)} — {slotToEdit.startTime.slice(0, 5)}
                  </p>
                </div>
                <button
                  onClick={() => setSlotToEdit(null)}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 block">
                    Change Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        id: "available",
                        label: "Available",
                        icon: CheckCircle,
                        color: "#22c55e",
                      },
                      {
                        id: "maintenance",
                        label: "Maintenance",
                        icon: Wrench,
                        color: "#3b82f6",
                      },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          const payload: AdminSlotPatchPayload = {
                            status: s.id as any,
                          };
                          handleUpdateSlot(payload);
                        }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                          slotToEdit.status === s.id
                            ? "bg-white border-2 shadow-md"
                            : "bg-gray-50 border-gray-100 opacity-60 hover:opacity-100"
                        }`}
                        style={{
                          borderColor:
                            slotToEdit.status === s.id ? s.color : undefined,
                        }}
                      >
                        <s.icon
                          size={20}
                          weight="fill"
                          style={{
                            color:
                              slotToEdit.status === s.id ? s.color : "#9ca3af",
                          }}
                        />
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            color:
                              slotToEdit.status === s.id ? s.color : "#6b7280",
                          }}
                        >
                          {s.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 block">
                    Custom Slot Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 inset-y-0 flex items-center text-gray-400 font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      placeholder={((slotToEdit.pricePaise || 0) / 100).toString()}
                      onChange={(e) => setSlotPriceInput(e.target.value)}
                      className="w-full pl-8 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold outline-none focus:ring-1 focus:ring-[#8a9e60] transition-all"
                    />
                    <button
                      onClick={() => {
                        const price = parseFloat(slotPriceInput);
                        if (!isNaN(price)) {
                          handleUpdateSlot({
                            pricePaise: Math.round(price * 100),
                          });
                        }
                      }}
                      className="absolute right-2 top-2 bottom-2 px-3 bg-[#8a9e60] text-white rounded-lg text-[10px] font-bold shadow-md shadow-[#8a9e60]/20 active:scale-95 transition-all"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTurf && editForm && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#8a9e60]/10 flex items-center justify-center text-[#8a9e60]">
                  <PencilSimple size={24} weight="fill" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Turf</h2>
                  <p className="text-xs text-gray-400 font-medium">
                    Configuration for {editTurf.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
                {[
                  { id: "general", label: "General", Icon: Buildings },
                  { id: "sports", label: "Sports & Amenities", Icon: Star },
                  { id: "slot-config", label: "Slot Settings", Icon: Timer },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setEditTab(t.id as any)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      editTab === t.id
                        ? "bg-white text-gray-800 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <t.Icon size={14} weight={editTab === t.id ? "bold" : "regular"} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {editTab === "general" && (
                <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                        Turf Name
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-1 focus:ring-[#8a9e60] transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                        Description (Optional)
                      </label>
                      <textarea
                        value={editForm.description || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, description: e.target.value })
                        }
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-1 focus:ring-[#8a9e60] transition-all resize-none"
                        placeholder="Detailed information about the venue..."
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                          Base Price (₹)
                        </label>
                        <input
                          type="number"
                          value={(editForm.standardPricePaise || 0) / 100}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              standardPricePaise: Math.round(
                                parseFloat(e.target.value) * 100,
                              ),
                            })
                          }
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-1 focus:ring-[#8a9e60] transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                          Cancellation (Hrs)
                        </label>
                        <input
                          type="number"
                          value={editForm.cancellationWindowHrs}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              cancellationWindowHrs: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-1 focus:ring-[#8a9e60] transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                        Operational Window
                      </label>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div className="space-y-2">
                          <p className="text-[9px] font-bold text-gray-400 uppercase">
                            Weekday Open
                          </p>
                          <input
                            type="time"
                            value={editForm.weekdayOpen}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                weekdayOpen: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-xs outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-[9px] font-bold text-gray-400 uppercase">
                            Weekday Close
                          </p>
                          <input
                            type="time"
                            value={editForm.weekdayClose}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                weekdayClose: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-xs outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-[9px] font-bold text-gray-400 uppercase">
                            Weekend Open
                          </p>
                          <input
                            type="time"
                            value={editForm.weekendOpen}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                weekendOpen: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-xs outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-[9px] font-bold text-gray-400 uppercase">
                            Weekend Close
                          </p>
                          <input
                            type="time"
                            value={editForm.weekendClose}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                weekendClose: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-xs outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editTab === "sports" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 block">
                      Enabled Sports
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {SPORTS_LIST.map((s) => {
                        const active = editForm.sports?.includes(s as any);
                        return (
                          <button
                            key={s}
                            onClick={() => {
                              const current = editForm.sports || [];
                              const next = active
                                ? current.filter((x) => x !== (s as any))
                                : [...current, s as any];
                              setEditForm({ ...editForm, sports: next });
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                              active
                                ? "bg-[#8a9e60] text-white border-[#8a9e60] shadow-md shadow-[#8a9e60]/20"
                                : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 block">
                      Amenities & Facilities
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {FACILITIES_LIST.map((f) => {
                        const active = editForm.amenities?.includes(f as any);
                        return (
                          <button
                            key={f}
                            onClick={() => {
                              const current = editForm.amenities || [];
                              const next = active
                                ? current.filter((x) => x !== (f as any))
                                : [...current, f as any];
                              setEditForm({ ...editForm, amenities: next });
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                              active
                                ? "bg-[#8a9e60]/10 text-[#8a9e60] border-[#8a9e60] shadow-sm"
                                : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
                            }`}
                          >
                            {f}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                        Surface Type
                      </label>
                      <select
                        value={editForm.surfaceType}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            surfaceType: e.target.value as any,
                          })
                        }
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none"
                      >
                        <option value="artificial_turf">Artificial Turf</option>
                        <option value="natural_grass">Natural Grass</option>
                        <option value="matting">Matting</option>
                        <option value="hard_court">Hard Court</option>
                        <option value="clay">Clay</option>
                        <option value="sand">Sand</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                        Turf Size/Format
                      </label>
                      <input
                        type="text"
                        value={editForm.sizeFormat || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, sizeFormat: e.target.value })
                        }
                        placeholder="e.g. 5-a-side"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-1 focus:ring-[#8a9e60]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {editTab === "slot-config" && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {editSlotConfigLoading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                      <CircleNotch size={32} className="animate-spin text-[#8a9e60]" />
                      <p className="text-xs text-gray-400 font-medium">
                        Loading slot configuration...
                      </p>
                    </div>
                  ) : editSlotConfig ? (
                    <div className="space-y-6">
                      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex gap-3">
                        <Info size={18} weight="fill" className="text-blue-500 shrink-0" />
                        <p className="text-[11px] text-blue-700 leading-relaxed">
                          Slot configuration changes will apply to future
                          generated slots. Existing generated slots will remain
                          unchanged unless manually modified.
                        </p>
                      </div>
                      <SlotConfigEditor
                        config={editSlotConfig}
                        onChange={setEditSlotConfig}
                      />
                    </div>
                  ) : (
                    <div className="py-20 text-center">
                      <p className="text-sm font-bold text-gray-400">
                        No slot configuration found for this turf.
                      </p>
                      <button
                        onClick={() =>
                          setEditSlotConfig({
                            slotDurationMins: 60,
                            bufferMins: 0,
                            dailyConfigs: generateDefaultDailyConfigs({
                              weekdayOpen: editForm.weekdayOpen || "06:00",
                              weekdayClose: editForm.weekdayClose || "23:00",
                              weekendOpen: editForm.weekendOpen || "06:00",
                              weekendClose: editForm.weekendClose || "23:00",
                              pricePerHour: (editForm.standardPricePaise || 0) / 100,
                            }),
                          })
                        }
                        className="text-xs font-bold text-[#8a9e60] mt-4 hover:underline uppercase tracking-widest"
                      >
                        Initialize Default Config
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-6 border-t border-gray-50 flex items-center justify-end gap-3 shrink-0 bg-gray-50/50">
              <button
                onClick={() => {
                  setEditTurf(null);
                  setEditForm(null);
                }}
                className="px-6 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-10 py-2.5 bg-[#8a9e60] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#8a9e60]/20 hover:opacity-90 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KYC Review Modal */}
      {kycField && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Review KYC Documents
                </h3>
                <p className="text-xs text-gray-400 font-medium">
                  {kycField.name} — {kycField.vendor?.businessName || "Independent"}
                </p>
              </div>
              <button
                onClick={() => setKycField(null)}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <TurfKycUpload
                field={kycField}
                docStatus={kycDocs}
                onSetStatus={setDocStatus}
              />
            </div>

            <div className="px-8 py-6 border-t border-gray-50 flex items-center justify-between bg-gray-50/50">
              <button
                onClick={applyKycResubmit}
                className="px-5 py-2.5 text-xs font-bold text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
              >
                Request Resubmission
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={applyKycReject}
                  className="px-6 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  Reject All
                </button>
                <button
                  onClick={applyKycVerify}
                  className="px-8 py-2.5 bg-[#8a9e60] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#8a9e60]/20 hover:opacity-90 transition-all"
                >
                  Verify & Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div
                className={`w-16 h-16 rounded-3xl mx-auto mb-6 flex items-center justify-center ${
                  confirmModal.type === "ban" || confirmModal.type === "remove"
                    ? "bg-red-50 text-red-500"
                    : "bg-amber-50 text-amber-500"
                }`}
              >
                {confirmModal.type === "ban" ? (
                  <Prohibit size={32} weight="bold" />
                ) : confirmModal.type === "remove" ? (
                  <Trash size={32} weight="bold" />
                ) : (
                  <Warning size={32} weight="bold" />
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 capitalize">
                {confirmModal.type} Turf?
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium px-4">
                Are you sure you want to {confirmModal.type} <b>{confirmModal.turf.name}</b>?
                {confirmModal.type === "ban" &&
                  " This will immediately delist the turf and cancel all future bookings."}
              </p>
            </div>
            <div className="px-8 py-6 border-t border-gray-50 flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 py-3 rounded-xl text-xs font-bold text-white transition-all shadow-lg ${
                  confirmModal.type === "ban" || confirmModal.type === "remove"
                    ? "bg-red-500 shadow-red-500/20"
                    : "bg-[#8a9e60] shadow-[#8a9e60]/20"
                }`}
              >
                Confirm {confirmModal.type.charAt(0).toUpperCase() + confirmModal.type.slice(1)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Overlay */}
      {onboardingStatus !== "idle" && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="bg-white rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-gray-100 p-10 w-full max-w-sm text-center transform animate-in zoom-in-95 duration-300">
            <div className="relative w-24 h-24 mx-auto mb-8">
              {onboardingStatus === "success" ? (
                <div className="w-full h-full bg-[#8a9e60] rounded-full flex items-center justify-center animate-in zoom-in duration-500 shadow-xl shadow-[#8a9e60]/30">
                  <Check size={48} weight="bold" className="text-white" />
                </div>
              ) : (
                <>
                  <CircleNotch
                    size={96}
                    weight="light"
                    className="text-[#8a9e60] animate-spin absolute inset-0"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 bg-[#8a9e60]/10 rounded-full animate-pulse shadow-inner" />
                  </div>
                </>
              )}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {onboardingStatus === "creating" && "Creating Turf"}
              {onboardingStatus === "uploading" && "Uploading Assets"}
              {onboardingStatus === "finalizing" && "Finalizing Records"}
              {onboardingStatus === "success" && "Perfect!"}
            </h2>

            <p className="text-sm text-gray-400 leading-relaxed min-h-[48px] font-medium px-4">
              {onboardingStatus === "creating" && "Initializing turf profile and vendor links..."}
              {onboardingStatus === "uploading" && "Processing and securing legal documents..."}
              {onboardingStatus === "finalizing" && "Syncing with global search and slot systems..."}
              {onboardingStatus === "success" && "The new turf has been onboarded successfully."}
            </p>

            <div className="mt-10 flex justify-center gap-2">
              {["creating", "uploading", "finalizing", "success"].map((step) => {
                const steps = ["creating", "uploading", "finalizing", "success"];
                const currentIdx = steps.indexOf(onboardingStatus);
                const isActive = step === onboardingStatus;
                const isDone = steps.indexOf(step) < currentIdx;

                return (
                  <div
                    key={step}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      isActive
                        ? "w-10 bg-[#8a9e60]"
                        : isDone
                          ? "w-4 bg-[#8a9e60]/40"
                          : "w-1.5 bg-gray-100"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}


