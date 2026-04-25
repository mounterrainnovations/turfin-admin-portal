"use client";

import {
  Handshake,
  MapPin,
  Phone,
  Envelope,
  ShieldCheck,
  CheckCircle,
  XCircle,
  WarningCircle,
  ClockCountdown,
  Plus,
  MagnifyingGlass,
  DotsThreeVertical,
  X,
  UploadSimple,
  UserCircle,
  Eye,
  PencilSimple,
  Trash,
  FileText,
  ArrowLeft,
  Percent,
  CalendarBlank,
  CaretDown,
  CaretRight,
  CurrencyDollar,
  CircleNotch,
  Check,
} from "@phosphor-icons/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/features/toast/toast-context";
import {
  Vendor,
  VendorStatus,
  KycStatus,
  listVendors,
  onboardVendor,
  updateVendor,
  banVendor,
  unbanVendor,
  deleteVendor,
  suspendVendor,
  unsuspendVendor,
  reviewVendorKyc,
  uploadVendorKycByAdmin,
  getUploadUrl,
  getSignedViewUrl,
  getVendorById,
  KYC_CFG,
  STATUS_CFG,
  SPORT_COLOR,
  SPORTS_LIST,
  FACILITIES_LIST,
  SURFACE_LIST,
  STATES_LIST,
  BusinessType,
  PayoutCycle,
  AdminOnboardVendorDto,
  VendorKycUpload,
  KYC_DOCS,
  KycFileActions,
} from "@/features/vendors";
import {
  uploadToStorage,
  performSequentialUploads,
} from "@/features/vendors/utils";
import { DashboardPagination } from "@/components/DashboardPagination";
import Select from "@/components/Select";
import { TableRowsSkeleton } from "@/components/LoadingSkeleton";

// ── Types ──────────────────────────────────────────────────────────────────────

// ── Config ─────────────────────────────────────────────────────────────────────
const STEP_LABELS = ["Business Info", "Location", "Banking", "KYC & Review"];

const BUSINESS_FIELDS = [
  {
    key: "ownerFullName" as const,
    label: "Owner Full Name *",
    placeholder: "Riaz Ahmed",
    type: "text",
  },
  {
    key: "phone" as const,
    label: "Phone Number *",
    placeholder: "+91 98765 43210",
    type: "tel",
  },
  {
    key: "email" as const,
    label: "Email Address *",
    placeholder: "riaz@example.com",
    type: "email",
  },
  {
    key: "whatsapp" as const,
    label: "WhatsApp Number",
    placeholder: "+91 98765 43210",
    type: "tel",
  },
  {
    key: "gstNumber" as const,
    label: "GST Number",
    placeholder: "22AAAAA0000A1Z5",
    type: "text",
  },
  {
    key: "businessRegistrationNumber" as const,
    label: "Registration No.",
    placeholder: "Optional",
    type: "text",
  },
] as const;

const VENDOR_SEARCH_OPTIONS = [
  {
    value: "business_name",
    label: "Business Name",
    placeholder: "Search by business name",
  },
  {
    value: "vendor_id",
    label: "Vendor ID",
    placeholder: "Search by vendor UUID",
  },
  {
    value: "owner_name",
    label: "Owner Name",
    placeholder: "Search by owner name",
  },
  {
    value: "city",
    label: "City",
    placeholder: "Search by city",
  },
  {
    value: "state",
    label: "State",
    placeholder: "Search by state",
  },
] as const;

const BANK_FIELDS = [
  {
    key: "bankName" as const,
    label: "Bank Name *",
    placeholder: "HDFC Bank",
    mono: false,
  },
  {
    key: "accountHolderName" as const,
    label: "Account Holder *",
    placeholder: "Riaz Ahmed",
    mono: false,
  },
  {
    key: "accountNumber" as const,
    label: "Account Number *",
    placeholder: "50100234XXXX",
    mono: true,
  },
  {
    key: "ifsc" as const,
    label: "IFSC Code *",
    placeholder: "HDFC0001234",
    mono: true,
  },
  {
    key: "upiId" as const,
    label: "UPI ID",
    placeholder: "riaz@okaxis",
    mono: true,
  },
] as const;

const INIT_FORM = {
  // User / Account fields (top-level AdminOnboardVendorDto)
  email: "",
  password: "",
  // Vendor profile fields
  businessName: "",
  businessType: "individual" as BusinessType,
  ownerFullName: "",
  phone: "",
  whatsapp: "",
  gstNumber: "",
  businessRegistrationNumber: "",
  address: {
    type: "work" as "home" | "work" | "other",
    houseNumber: "", // Address Line 1 — building, street
    landmark: "", // Address Line 2 — landmark, area
    pinCode: "",
    city: "",
    state: "",
    country: "India",
    googleMapsLink: "",
  },
  bankingDetails: {
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifsc: "",
    upiId: "",
  },
  payoutCycle: "weekly" as PayoutCycle,
  commissionPct: "10",
  phonePrefix: "+91",
  whatsappPrefix: "+91",
  identityProof: "",
  addressProof: "",
  businessRegistration: "",
  gstCertificate: "",
  cancelledCheque: "",
};

type FormData = typeof INIT_FORM;
type KycDocKey = (typeof KYC_DOCS)[number]["key"];
type ActionMenuState = {
  vendor: Vendor;
  top: number;
  left: number;
};

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

// ── Main Component ─────────────────────────────────────────────────────────────
export default function VendorsPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchBy, setSearchBy] = useState<
    (typeof VENDOR_SEARCH_OPTIONS)[number]["value"]
  >("business_name");
  const [activeTab, setActiveTab] = useState<"all" | VendorStatus>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");

  const [selectedVendor, setSelected] = useState<Vendor | null>(null);
  const [actionMenu, setActionMenu] = useState<ActionMenuState | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Onboard modal
  const [showOnboard, setShowOnboard] = useState(false);
  const [onboardStep, setOnboardStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({ ...INIT_FORM });
  const [onboardKycFiles, setOnboardKycFiles] = useState<
    Partial<Record<KycDocKey, File>>
  >({});
  const [uploadingDocKey, setUploadingDocKey] = useState<KycDocKey | null>(
    null,
  );
  const onboardingFileInputRef = useRef<HTMLInputElement>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<
    "idle" | "creating" | "uploading" | "finalizing" | "success"
  >("idle");

  // Edit modal
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [editForm, setEditForm] = useState<Vendor | null>(null);
  const [editTab, setEditTab] = useState<"basic" | "turf" | "financial">(
    "basic",
  );

  // KYC review modal
  const [kycVendor, setKycVendor] = useState<Vendor | null>(null);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState<{
    type: "ban" | "unban" | "suspend" | "unsuspend" | "remove";
    vendor: Vendor;
  } | null>(null);

  const [banReason, setBanReason] = useState("");

  const { showToast } = useToast();

  const closeActionMenu = useCallback(() => setActionMenu(null), []);

  const openActionMenu = useCallback(
    (vendor: Vendor, trigger: HTMLButtonElement) => {
      const rect = trigger.getBoundingClientRect();
      const menuWidth = 148;
      const menuItemCount =
        1 +
        (vendor.status === "banned" ? 1 : 1) +
        (vendor.status !== "banned" ? 1 : 0);
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
        current?.vendor.id === vendor.id ? null : { vendor, top, left },
      );
    },
    [],
  );

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
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

        const res = await listVendors({
          page,
          limit,
          status: activeTab,
          search: debouncedSearch.trim() || undefined,
          searchBy,
          startDate,
          endDate,
        });

        if (!active) return;
        setVendors(res.items || []);
        setTotal(res.total || 0);
      } catch (err: any) {
        if (!active) return;
        const isAuthError =
          err.message === "Unauthorized" ||
          err.message?.toLowerCase().includes("unauthori");
        showToast({
          title: isAuthError ? "Vendor data unavailable" : "Error",
          description: isAuthError
            ? "Unauthorised"
            : err.message || "Failed to load vendors",
          tone: "error",
        });
      } finally {
        if (active) setIsLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [
    page,
    limit,
    activeTab,
    debouncedSearch,
    searchBy,
    timeFilter,
    showToast,
    refreshTrigger,
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
    setPage(1);
  }, [activeTab, debouncedSearch, searchBy, timeFilter]);

  useEffect(() => {
    if (selectedVendor) {
      const match = vendors.find((v) => v.id === selectedVendor.id);
      if (match) setSelected(match);
    }
  }, [vendors]);

  const refreshData = () => setRefreshTrigger((p) => p + 1);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = vendors.filter((v) => {
    return activeTab === "all" || v.status === activeTab;
  });

  const totalRevenue = vendors.reduce((s, v) => s + (v.revenue || 0), 0);
  const activeCount = vendors.filter((v) => v.status === "active").length;
  const pendingKyc = vendors.filter((v) =>
    ["pending", "in_review", "not_started"].includes(v.kycStatus),
  ).length;

  // ── Helpers ────────────────────────────────────────────────────────────────

  // Onboard form
  const setField = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setFormData((p) => ({ ...p, [key]: val }));

  const setAddressField = (key: keyof typeof INIT_FORM.address, val: string) =>
    setFormData((p) => ({ ...p, address: { ...p.address, [key]: val } }));

  const setBankField = (
    key: keyof typeof INIT_FORM.bankingDetails,
    val: string,
  ) =>
    setFormData((p) => ({
      ...p,
      bankingDetails: { ...p.bankingDetails, [key]: val },
    }));

  const closeOnboard = () => {
    setShowOnboard(false);
    setOnboardStep(1);
    setFormData({ ...INIT_FORM });
    setOnboardKycFiles({});
    setUploadingDocKey(null);
    setBanReason("");
    setErrors({});
  };

  const validateVendorStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.businessName.trim())
        newErrors.businessName = "Business name is required";
      if (!formData.ownerFullName.trim())
        newErrors.ownerFullName = "Owner name is required";

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!emailRegex.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }

      // Phone validation
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required";
      } else if (!/^\d{10}$/.test(formData.phone)) {
        newErrors.phone = "Must be exactly 10 digits";
      }

      // WhatsApp validation
      if (formData.whatsapp && !/^\d{10}$/.test(formData.whatsapp)) {
        newErrors.whatsapp = "Must be exactly 10 digits";
      }

      // GST validation
      if (formData.gstNumber && !/^[0-9A-Z]{15}$/i.test(formData.gstNumber)) {
        newErrors.gstNumber = "Must be 15 alphanumeric characters";
      }

      // Registration Number
      if (
        formData.businessRegistrationNumber &&
        !/^[0-9A-Z]+$/i.test(formData.businessRegistrationNumber)
      ) {
        newErrors.businessRegistrationNumber = "Must be alphanumeric";
      }

      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Minimum 8 characters required";
      }
    }

    if (step === 2) {
      if (!formData.address.city.trim()) newErrors.city = "City is required";
      if (!formData.address.state) newErrors.state = "State is required";

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

    if (step === 3) {
      if (!formData.bankingDetails.bankName.trim())
        newErrors.bankName = "Bank name is required";
      if (!formData.bankingDetails.accountHolderName.trim())
        newErrors.accountHolderName = "Account holder is required";

      if (!formData.bankingDetails.accountNumber.trim()) {
        newErrors.accountNumber = "Account number is required";
      } else if (!/^\d{9,18}$/.test(formData.bankingDetails.accountNumber)) {
        newErrors.accountNumber = "Must be 9 to 18 digits";
      }

      if (!formData.bankingDetails.ifsc.trim()) {
        newErrors.ifsc = "IFSC code is required";
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.bankingDetails.ifsc)) {
        newErrors.ifsc = "Invalid IFSC format (e.g. ABCD0123456)";
      }

      if (
        formData.bankingDetails.upiId &&
        !formData.bankingDetails.upiId.includes("@")
      ) {
        newErrors.upiId = "Invalid UPI ID";
      }

      const comm = parseFloat(formData.commissionPct);
      if (isNaN(comm) || comm < 0 || comm > 100) {
        newErrors.commissionPct = "Must be between 0 and 100";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOnboardFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingDocKey) {
      setOnboardKycFiles((prev) => ({ ...prev, [uploadingDocKey]: file }));
      setField(uploadingDocKey, file.name);
    }
    setUploadingDocKey(null);
    if (onboardingFileInputRef.current)
      onboardingFileInputRef.current.value = "";
  };

  const submitOnboard = async () => {
    setOnboardingStatus("creating");
    try {
      // 1. Create Vendor
      const dto: AdminOnboardVendorDto = {
        email: formData.email,
        password: formData.password,
        vendorProfile: {
          businessName: formData.businessName,
          businessType: formData.businessType,
          ownerFullName: formData.ownerFullName,
          phone: `${formData.phonePrefix}${formData.phone}`,
          whatsapp: formData.whatsapp
            ? `${formData.whatsappPrefix}${formData.whatsapp}`
            : undefined,
          gstNumber: formData.gstNumber || undefined,
          businessRegistrationNumber:
            formData.businessRegistrationNumber || undefined,
          address: {
            type: formData.address.type,
            houseNumber: formData.address.houseNumber || undefined,
            landmark: formData.address.landmark || undefined,
            pinCode: formData.address.pinCode,
            city: formData.address.city,
            state: formData.address.state,
            country: formData.address.country || "India",
            googleMapsLink: formData.address.googleMapsLink || undefined,
          },
          bankingDetails: formData.bankingDetails,
          commissionPct: formData.commissionPct,
          payoutCycle: formData.payoutCycle,
        },
      };

      const response = await onboardVendor(dto);
      // BUG FIX: Backend returns { success: true, data: { vendor: { id: "..." } } }
      // The previous code was doing vendor.id directly on the payload.
      const vendorId = (response as any).data?.vendor?.id;

      if (!vendorId) {
        throw new Error("Failed to retrieve Vendor ID from response.");
      }

      // 2. Sequential Uploads for KYC (if any)
      if (Object.keys(onboardKycFiles).length > 0) {
        setOnboardingStatus("uploading");
        try {
          const s3Paths = await performSequentialUploads(
            vendorId,
            onboardKycFiles,
            "vendor",
          );

          // 3. Finalize KYC with backend
          setOnboardingStatus("finalizing");
          await uploadVendorKycByAdmin(vendorId, {
            documents: s3Paths as any,
          });
        } catch (uploadError: any) {
          console.error("KYC upload error:", uploadError);
          showToast({
            title: "Partial Success",
            description:
              "Vendor created but document upload failed. You can upload them later.",
            tone: "warning",
          });
        }
      }

      setOnboardingStatus("success");
      showToast({
        title: "Vendor Onboarded",
        description: `${formData.businessName} onboarded successfully.`,
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
        title: "Error",
        description: err.message || "Failed to onboard vendor",
        tone: "error",
      });
    }
  };

  // Edit
  function openEdit(v: Vendor) {
    setEditVendor(v);
    setEditForm({ ...v });
    setEditTab("basic");
  }
  function setEditField(key: keyof Vendor, val: any) {
    setEditForm((p) => (p ? { ...p, [key]: val } : p));
  }
  function setEditAddressField(
    key: keyof typeof INIT_FORM.address,
    val: string,
  ) {
    setEditForm((p) =>
      p ? { ...p, address: { ...p.address, [key]: val } } : p,
    );
  }

  async function saveEdit() {
    if (!editVendor || !editForm) return;
    try {
      await updateVendor(editVendor.id, {
        businessName: editForm.businessName,
        ownerFullName: editForm.ownerFullName,
        email: editForm.email,
        phone: editForm.phone,
        whatsapp: editForm.whatsapp,
        gstNumber: editForm.gstNumber,
        businessRegistrationNumber: editForm.businessRegistrationNumber,
        payoutCycle: editForm.payoutCycle,
        commissionPct: editForm.commissionPct,
        address: editForm.address,
      });
      showToast({
        title: "Success",
        description: `${editForm.businessName} updated successfully.`,
        tone: "success",
      });
      setEditVendor(null);
      setEditForm(null);
      refreshData();
    } catch (err: any) {
      showToast({
        title: "Error",
        description: err.message || "Failed to update vendor",
        tone: "error",
      });
    }
  }

  // KYC
  function openKycReview(v: Vendor) {
    setKycVendor(v);
  }

  // Confirm actions
  async function handleConfirm() {
    if (!confirmModal) return;
    const { type, vendor } = confirmModal;
    try {
      if (type === "remove") {
        await deleteVendor(vendor.id);
        showToast({
          title: "Removed",
          description: `${vendor.businessName} has been removed.`,
          tone: "warning",
        });
      } else if (type === "ban") {
        await banVendor(vendor.id);
        showToast({
          title: "Banned",
          description: `${vendor.businessName} has been banned.`,
          tone: "error",
        });
      } else if (type === "unban") {
        await unbanVendor(vendor.id);
        showToast({
          title: "Reactivated",
          description: `${vendor.businessName} has been unbanned.`,
          tone: "success",
        });
      } else if (type === "suspend") {
        await suspendVendor(vendor.id);
        showToast({
          title: "Suspended",
          description: `${vendor.businessName} has been suspended.`,
          tone: "warning",
        });
      } else if (type === "unsuspend") {
        await unsuspendVendor(vendor.id);
        showToast({
          title: "Reactivated",
          description: `${vendor.businessName} has been unsuspended.`,
          tone: "success",
        });
      }

      setConfirmModal(null);
      setBanReason("");
      refreshData();
    } catch (err: any) {
      showToast({
        title: "Error",
        description: err.message || "Action failed",
        tone: "error",
      });
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="px-6 py-5">
      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          {
            label: "Total Vendors",
            value: String(total),
            sub: "All registered",
            icon: Handshake,
            color: "#8a9e60",
          },
          {
            label: "Active Vendors",
            value: String(activeCount),
            sub: `${total ? Math.round((activeCount / total) * 100) : 0}% of total`,
            icon: CheckCircle,
            color: "#15803d", // green-700
            bgColor: "#f0fdf4", // green-50
          },

          {
            label: "Pending KYC",
            value: String(pendingKyc),
            sub: "Needs attention",
            icon: ShieldCheck,
            color: "#b45309", // amber-700
            bgColor: "#fffbeb", // amber-50
          },

          {
            label: "Platform Revenue",
            value: `₹${totalRevenue.toLocaleString("en-IN")}`,
            sub: "This month",
            icon: CurrencyDollar,
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
                  val as (typeof VENDOR_SEARCH_OPTIONS)[number]["value"],
                )
              }
              options={[...VENDOR_SEARCH_OPTIONS]}
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
                VENDOR_SEARCH_OPTIONS.find((option) => option.value === searchBy)
                  ?.placeholder ?? "Search vendors"
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
                { value: "last30", label: "Last 30 Days" }
              ]}
              className="bg-transparent text-gray-700 text-xs font-medium outline-none min-w-[80px]"
              dropdownClassName="w-[150px] -left-2"
            />
          </div>

          {/* Pending KYC badge */}
          {pendingKyc > 0 && (
            <div className="ml-auto flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs font-semibold text-amber-700">
              <ShieldCheck size={13} weight="fill" />
              {pendingKyc} vendor{pendingKyc > 1 ? "s" : ""} pending KYC
            </div>
          )}

          {/* Onboard Vendor Button */}
          <button
            onClick={() => setShowOnboard(true)}
            className={`${pendingKyc > 0 ? "" : "ml-auto"} flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 shrink-0`}
            style={{ backgroundColor: "#8a9e60" }}
          >
            <Plus size={16} weight="bold" />
            Onboard Vendor
          </button>
        </div>

        {/* Status tabs — pill style */}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {(["all", "active", "pending", "suspended", "banned"] as const).map(
            (tab) => {
              const count =
                tab === "all"
                  ? total
                  : vendors.filter((v) => (v.status as any) === tab).length;

              const isActive = activeTab === tab;
              const sc = tab === "all" ? null : STATUS_CFG[tab as VendorStatus];

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
                    ? "All Vendors"
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
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {[
                  "Vendor",
                  "Contact",
                  "Location",
                  // "Fields",
                  "Status",
                  "KYC",
                  "Revenue",
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
            <tbody>
              {isLoading ? (
                <TableRowsSkeleton rows={limit} cols={7} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    No vendors found.
                  </td>
                </tr>
              ) : (
                filtered.map((v, i) => {
                  const kc = KYC_CFG[v.kycStatus];
                  const sc = STATUS_CFG[v.status] || {
                    label: v.status,
                    cls: "bg-gray-100 text-gray-700",
                    dot: "bg-gray-400",
                  };
                  const KycIcon = kc?.icon || WarningCircle;
                  return (
                    <tr
                      key={v.id}
                      onClick={() => {
                        setActionMenu(null);
                        setSelected(v);
                      }}
                      className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${
                        selectedVendor?.id === v.id ? "bg-[#8a9e60]/5" : ""
                      } ${i < filtered.length - 1 ? "border-b border-gray-50" : ""}`}
                    >
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: "#8a9e60" }}
                          >
                            {avatar(v.businessName)}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-800">
                              {v.businessName}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono">
                              {v.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-700">
                          {v.ownerFullName}
                        </p>
                        <p className="text-[10px] text-gray-400">{v.phone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-700">
                          {v.address?.city || "—"}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {v.address?.state || "—"}
                        </p>
                      </td>
                      {/* <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-bold transition-colors ${sc?.cls || "bg-gray-50 text-gray-400"}`}
                      >
                        {v.fields?.length || 0}
                      </span>
                    </td> */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.cls}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                          />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${kc?.cls || "bg-gray-100"}`}
                        >
                          {KycIcon && <KycIcon size={10} weight="fill" />}
                          {kc?.label || v.kycStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                        {(v.revenue ?? 0) > 0 ? (
                          `₹${v.revenue?.toLocaleString("en-IN")}`
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenu(null);
                              setSelected(v);
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
                              openEdit(v);
                            }}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Edit"
                          >
                            <PencilSimple size={14} />
                          </button>
                          <div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openActionMenu(v, e.currentTarget);
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
          label="vendors"
        />
      </div>

      {/* Click-away */}
      {actionMenu && (
        <div className="fixed inset-0 z-30" onClick={closeActionMenu} />
      )}

      {actionMenu && (
        <div
          className="fixed z-40 min-w-[148px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          style={{ top: actionMenu.top, left: actionMenu.left }}
          onClick={(e) => e.stopPropagation()}
        >
          {actionMenu.vendor.status === "banned" ? (
            <button
              onClick={() => {
                closeActionMenu();
                setConfirmModal({
                  type: "unban",
                  vendor: actionMenu.vendor,
                });
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
            >
              <CheckCircle size={13} className="text-green-500" />
              Unban
            </button>
          ) : (
            <button
              onClick={() => {
                closeActionMenu();
                setConfirmModal({ type: "ban", vendor: actionMenu.vendor });
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
            >
              <XCircle size={13} className="text-red-500" />
              Ban
            </button>
          )}
          {actionMenu.vendor.status === "suspended" ? (
            <button
              onClick={() => {
                closeActionMenu();
                setConfirmModal({
                  type: "unsuspend",
                  vendor: actionMenu.vendor,
                });
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
            >
              <Check size={13} className="text-blue-500" />
              Unsuspend
            </button>
          ) : (
            actionMenu.vendor.status !== "banned" && (
              <button
                onClick={() => {
                  closeActionMenu();
                  setConfirmModal({
                    type: "suspend",
                    vendor: actionMenu.vendor,
                  });
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
              >
                <Trash size={13} className="text-slate-500" />
                Suspend
              </button>
            )
          )}
          <button
            onClick={() => {
              closeActionMenu();
              openKycReview(actionMenu.vendor);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
          >
            <ShieldCheck size={13} className="text-blue-500" />
            Review KYC
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          VENDOR DETAIL DRAWER
      ═══════════════════════════════════════════════════════════════════════ */}
      {selectedVendor && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="flex-1 bg-black/10"
            onClick={() => setSelected(null)}
          />
          <div className="w-[420px] bg-white h-full flex flex-col shadow-2xl overflow-hidden border-l border-gray-100">
            <div
              className="shrink-0 px-5 py-4 flex items-start justify-between transition-colors duration-500"
              style={{
                background:
                  selectedVendor.status === "active"
                    ? "linear-gradient(135deg,#8a9e60,#6e8245)"
                    : selectedVendor.status === "pending"
                      ? "linear-gradient(135deg,#fbbf24,#d97706)"
                      : selectedVendor.status === "suspended"
                        ? "linear-gradient(135deg,#64748b,#475569)"
                        : "linear-gradient(135deg,#ef4444,#b91c1c)",
              }}
            >
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-white/60 text-[11px] font-medium mb-0.5">
                  {selectedVendor.id}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 bg-white/10 border border-white/15">
                    {avatar(selectedVendor.businessName)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-white font-bold text-base leading-tight truncate">
                      {selectedVendor.businessName}
                    </h2>
                    <p className="text-white/60 text-[11px] mt-0.5 flex items-center gap-1 leading-relaxed">
                      <MapPin size={10} /> {selectedVendor.address?.city || "—"}
                      , {selectedVendor.address?.state || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 bg-white/10 text-white border-white/20">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${STATUS_CFG[selectedVendor.status]?.dot || "bg-white/70"}`}
                    />
                    {(
                      STATUS_CFG[selectedVendor.status]?.label ||
                      selectedVendor.status
                    ).toUpperCase()}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white/10 text-white border-white/20">
                    {(
                      KYC_CFG[selectedVendor.kycStatus]?.label ||
                      selectedVendor.kycStatus
                    ).toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-white/60 hover:text-white shrink-0 mt-0.5"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {/* <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-800">
                    {selectedVendor.fields?.length || 0}
                  </p>
                  <p className="text-[10px] text-gray-400">fields</p>
                </div> */}
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-800">
                    {selectedVendor.commissionPct}%
                  </p>
                  <p className="text-[10px] text-gray-400">commission</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-800">
                    {(selectedVendor.revenue ?? 0) > 0
                      ? `₹${Math.round((selectedVendor.revenue ?? 0) / 1000)}K`
                      : "—"}
                  </p>
                  <p className="text-[10px] text-gray-400">revenue</p>
                </div>
              </div>

              <div>
                <p
                  className={`text-[10px] font-bold uppercase tracking-widest mb-3 px-2 py-1 rounded-md inline-block ${STATUS_CFG[selectedVendor.status]?.cls || "bg-gray-50 text-gray-400"}`}
                >
                  Contact
                </p>

                <div className="space-y-2.5">
                  {[
                    {
                      icon: UserCircle,
                      label: "Owner",
                      val: selectedVendor.ownerFullName,
                    },
                    {
                      icon: Envelope,
                      label: "Email",
                      val: selectedVendor.email,
                    },
                    { icon: Phone, label: "Phone", val: selectedVendor.phone },
                    {
                      icon: CalendarBlank,
                      label: "Joined",
                      val: selectedVendor.joinedAt
                        ? new Date(selectedVendor.joinedAt).toLocaleDateString()
                        : "—",
                    },
                  ].map(({ icon: Icon, label, val }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-gray-400 flex items-center gap-2">
                        <Icon size={13} className="text-gray-400" />
                        {label}
                      </span>
                      <span className="font-medium text-gray-700 text-right max-w-[58%] break-words">
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p
                  className={`text-[10px] font-bold uppercase tracking-widest mb-3 px-2 py-1 rounded-md inline-block ${STATUS_CFG[selectedVendor.status]?.cls || "bg-gray-50 text-gray-400"}`}
                >
                  Location
                </p>

                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-sm font-semibold text-gray-800">
                    {selectedVendor.address?.houseNumber || "—"}{" "}
                    {selectedVendor.address?.landmark || ""}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {selectedVendor.address?.city || "—"},{" "}
                    {selectedVendor.address?.state || "—"}{" "}
                    {selectedVendor.address?.pinCode
                      ? `- ${selectedVendor.address.pinCode}`
                      : ""}
                  </p>
                </div>
              </div>

              <div>
                <p
                  className={`text-[10px] font-bold uppercase tracking-widest mb-3 px-2 py-1 rounded-md inline-block ${STATUS_CFG[selectedVendor.status]?.cls || "bg-gray-50 text-gray-400"}`}
                >
                  Business
                </p>

                <div className="space-y-2.5">
                  {[
                    ["Business Type", selectedVendor.businessType || "—"],
                    ["Payout Cycle", selectedVendor.payoutCycle || "—"],
                    // ["Surface", selectedVendor.fields?.[0]?.surfaceType || "—"],
                    ["GST Number", selectedVendor.gstNumber || "—"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-gray-400">{label}</span>
                      <span className="font-medium text-gray-700 text-right max-w-[55%] capitalize">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p
                  className={`text-[10px] font-bold uppercase tracking-widest mb-3 px-2 py-1 rounded-md inline-block ${STATUS_CFG[selectedVendor.status]?.cls || "bg-gray-50 text-gray-400"}`}
                >
                  Facilities
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {(selectedVendor.facilities || []).length > 0 ? (
                    (selectedVendor.facilities || []).map((f) => (
                      <span
                        key={f}
                        className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium"
                      >
                        {f}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-gray-300 italic">
                      No facilities listed
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p
                  className={`text-[10px] font-bold uppercase tracking-widest mb-3 px-2 py-1 rounded-md inline-block ${STATUS_CFG[selectedVendor.status]?.cls || "bg-gray-50 text-gray-400"}`}
                >
                  KYC Documents
                </p>

                <div className="space-y-2">
                  {KYC_DOCS.map((doc) => {
                    const vVal = selectedVendor.verification?.[doc.key];
                    const s =
                      vVal === true
                        ? "verified"
                        : vVal === false
                          ? "rejected"
                          : "pending";
                    return (
                      <div
                        key={doc.key}
                        className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <FileText size={13} className="text-gray-400" />
                          <span className="text-xs text-gray-700">
                            {doc.label}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s === "verified" ? "bg-green-50 text-green-700" : s === "rejected" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-400"}`}
                        >
                          {s === "verified"
                            ? "Verified"
                            : s === "rejected"
                              ? "Rejected"
                              : "Pending"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-gray-100 p-4 bg-gray-50/50">
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(selectedVendor)}
                  className="flex-1 py-2 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <PencilSimple size={13} />
                  Edit
                </button>
                <button
                  onClick={() => openKycReview(selectedVendor)}
                  className="flex-1 py-2 text-xs font-semibold border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck size={13} />
                  KYC Review
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                {selectedVendor.status === "banned" ? (
                  <button
                    onClick={() =>
                      setConfirmModal({ type: "unban", vendor: selectedVendor })
                    }
                    className="flex-1 py-2 text-xs font-semibold rounded-lg text-white flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: "#8a9e60" }}
                  >
                    <CheckCircle size={13} />
                    Unban
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setConfirmModal({ type: "ban", vendor: selectedVendor })
                    }
                    className="flex-1 py-2 text-xs font-semibold rounded-lg text-white bg-red-600 flex items-center justify-center gap-1.5"
                  >
                    <XCircle size={13} />
                    Ban
                  </button>
                )}
                {selectedVendor.status === "suspended" ? (
                  <button
                    onClick={() =>
                      setConfirmModal({
                        type: "unsuspend",
                        vendor: selectedVendor,
                      })
                    }
                    className="flex-1 py-2 text-xs font-semibold border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check size={13} />
                    Unsuspend
                  </button>
                ) : (
                  selectedVendor.status !== "banned" && (
                    <button
                      onClick={() =>
                        setConfirmModal({
                          type: "suspend",
                          vendor: selectedVendor,
                        })
                      }
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
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          ONBOARD MODAL (centered)
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
                    Onboard New Vendor
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Step {onboardStep} of {STEP_LABELS.length} —{" "}
                    {STEP_LABELS[onboardStep - 1]}
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
                {STEP_LABELS.map((label, i) => {
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
                      {i < STEP_LABELS.length - 1 && (
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
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Business Name *
                    </label>
                    <input
                      value={formData.businessName}
                      onChange={(e) => setField("businessName", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                      placeholder="e.g. Riaz Sports Complex"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Business Type *
                    </label>
                    <div className="flex gap-3">
                      {["individual", "company", "partnership"].map((t) => (
                        <button
                          key={t}
                          onClick={() => setField("businessType", t as any)}
                          className="flex-1 py-2.5 rounded-lg border text-xs font-medium capitalize transition-colors"
                          style={
                            formData.businessType === t
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
                  <div className="grid grid-cols-2 gap-3">
                    {BUSINESS_FIELDS.map(
                      ({ key, label, placeholder, type }) => {
                        const isPhone = key === "phone" || key === "whatsapp";
                        const prefixKey =
                          key === "phone" ? "phonePrefix" : "whatsappPrefix";
                        return (
                          <div key={key}>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                              {label}
                            </label>
                            <div className="flex flex-col gap-1">
                              <div className="flex gap-2">
                                {isPhone && (
                                  <input
                                    value={
                                      formData[
                                        prefixKey as keyof FormData
                                      ] as string
                                    }
                                    onChange={(e) =>
                                      setField(prefixKey as any, e.target.value)
                                    }
                                    className="w-16 border border-gray-200 rounded-lg px-2 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] bg-gray-50"
                                    placeholder="+91"
                                  />
                                )}
                                <input
                                  type={type}
                                  value={formData[key] as string}
                                  onChange={(e) =>
                                    setField(key, e.target.value)
                                  }
                                  className={`flex-1 border ${errors[key] ? "border-red-400" : "border-gray-200"} rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]`}
                                  placeholder={placeholder}
                                />
                              </div>
                              {errors[key] && (
                                <p className="text-[10px] text-red-500 font-medium">
                                  {errors[key]}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Account Credentials
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          Login Password *
                        </label>
                        <div className="flex flex-col gap-1">
                          <input
                            type="password"
                            value={formData.password}
                            onChange={(e) =>
                              setField("password", e.target.value)
                            }
                            className={`w-full border ${errors.password ? "border-red-400" : "border-gray-200"} rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]`}
                            placeholder="Min. 8 characters"
                          />
                          {errors.password && (
                            <p className="text-[10px] text-red-500 font-medium">
                              {errors.password}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 2 && (
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
                            onClick={() => setAddressField("type", t as any)}
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
                          setAddressField("houseNumber", e.target.value)
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
                          setAddressField("landmark", e.target.value)
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
                      <div className="flex flex-col gap-1">
                        <input
                          value={formData.address.city}
                          onChange={(e) =>
                            setAddressField("city", e.target.value)
                          }
                          className={`w-full border ${errors.city ? "border-red-400" : "border-gray-200"} rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]`}
                          placeholder="Mumbai"
                        />
                        {errors.city && (
                          <p className="text-[10px] text-red-500 font-medium">
                            {errors.city}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        State *
                      </label>
                      <div className="flex flex-col gap-1">
                        <Select
                          value={formData.address.state}
                          onChange={(val) => setAddressField("state", val)}
                          options={[
                            { value: "", label: "Select state" },
                            ...STATES_LIST.map(s => ({ value: s, label: s }))
                          ]}
                          searchable
                          useFixed
                          className={`w-full border ${errors.state ? "border-red-400" : "border-gray-200"} rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] bg-white`}
                        />
                        {errors.state && (
                          <p className="text-[10px] text-red-500 font-medium">
                            {errors.state}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Pincode *
                      </label>
                      <div className="flex flex-col gap-1">
                        <input
                          value={formData.address.pinCode}
                          onChange={(e) =>
                            setAddressField("pinCode", e.target.value)
                          }
                          className={`w-full border ${errors.pinCode ? "border-red-400" : "border-gray-200"} rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]`}
                          placeholder="400001"
                          maxLength={6}
                        />
                        {errors.pinCode && (
                          <p className="text-[10px] text-red-500 font-medium">
                            {errors.pinCode}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Google Maps Link
                      </label>
                      <div className="flex flex-col gap-1">
                        <input
                          value={formData.address.googleMapsLink}
                          onChange={(e) =>
                            setAddressField("googleMapsLink", e.target.value)
                          }
                          className={`w-full border ${errors.googleMapsLink ? "border-red-400" : "border-gray-200"} rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]`}
                          placeholder="Paste maps URL"
                        />
                        {errors.googleMapsLink && (
                          <p className="text-[10px] text-red-500 font-medium">
                            {errors.googleMapsLink}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 3 && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <p className="text-xs text-amber-700 font-medium">
                      Banking details are encrypted and stored securely. Used
                      for vendor payouts only.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {BANK_FIELDS.map(({ key, label, placeholder, mono }) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          {label}
                        </label>
                        <div className="flex flex-col gap-1">
                          <input
                            value={
                              formData.bankingDetails[
                                key as keyof typeof formData.bankingDetails
                              ]
                            }
                            onChange={(e) =>
                              setBankField(
                                key as any,
                                key === "ifsc"
                                  ? e.target.value.toUpperCase()
                                  : e.target.value,
                              )
                            }
                            className={`w-full border ${errors[key] ? "border-red-400" : "border-gray-200"} rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] ${mono ? "font-mono" : ""}`}
                            placeholder={placeholder}
                          />
                          {errors[key] && (
                            <p className="text-[10px] text-red-500 font-medium">
                              {errors[key]}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Commission % *
                      </label>
                      <div className="flex flex-col gap-1">
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={formData.commissionPct}
                            onChange={(e) =>
                              setField("commissionPct", e.target.value)
                            }
                            className={`w-full border ${errors.commissionPct ? "border-red-400" : "border-gray-200"} rounded-lg px-3 py-2.5 pr-8 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]`}
                          />
                          <Percent
                            size={13}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          />
                        </div>
                        {errors.commissionPct && (
                          <p className="text-[10px] text-red-500 font-medium">
                            {errors.commissionPct}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Payout Cycle *
                    </label>
                    <div className="flex gap-3">
                      {["daily", "weekly", "monthly"].map((c) => (
                        <button
                          key={c}
                          onClick={() => setField("payoutCycle", c as any)}
                          className="flex-1 py-2.5 rounded-lg border text-xs font-medium capitalize transition-colors"
                          style={
                            formData.payoutCycle === c
                              ? {
                                  backgroundColor: "#8a9e60",
                                  color: "white",
                                  borderColor: "transparent",
                                }
                              : { borderColor: "#e5e7eb", color: "#6b7280" }
                          }
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3">
                      Upload KYC Documents
                    </h3>
                    <div className="space-y-2.5">
                      <input
                        type="file"
                        ref={onboardingFileInputRef}
                        className="hidden"
                        onChange={handleOnboardFileSelect}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      {KYC_DOCS.map(({ key, label, hint }) => {
                        const file = onboardKycFiles[key as KycDocKey];
                        const uploaded = !!file;
                        return (
                          <div
                            key={key}
                            className="border border-dashed border-gray-200 rounded-xl p-3.5 flex items-center justify-between hover:border-[#8a9e60] transition-colors group cursor-pointer"
                            onClick={() => {
                              if (!uploaded) {
                                setUploadingDocKey(key as KycDocKey);
                                onboardingFileInputRef.current?.click();
                              }
                            }}
                          >
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-gray-700">
                                {label}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[200px]">
                                {uploaded ? file.name : hint}
                              </p>
                            </div>
                            {uploaded ? (
                              <KycFileActions
                                file={file}
                                onRemove={() => {
                                  setOnboardKycFiles((prev) => {
                                    const next = { ...prev };
                                    delete next[key as KycDocKey];
                                    return next;
                                  });
                                  setField(key as any, "");
                                }}
                              />
                            ) : (
                              <button className="flex items-center gap-1 text-[10px] font-medium text-[#8a9e60] border border-[#8a9e60] px-2.5 py-1 rounded-lg transition-colors group-hover:bg-[#8a9e60] group-hover:text-white">
                                <UploadSimple size={11} />
                                Upload
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3">
                      Review Summary
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                      {[
                        ["Business", formData.businessName || "—"],
                        ["Type", formData.businessType],
                        ["Owner", formData.ownerFullName || "—"],
                        ["Email", formData.email || "—"],
                        ["Phone", formData.phone || "—"],
                        [
                          "Location",
                          [formData.address.city, formData.address.state]
                            .filter(Boolean)
                            .join(", ") || "—",
                        ],
                        ["Bank", formData.bankingDetails.bankName || "—"],
                        ["Commission", `${formData.commissionPct}%`],
                        ["Payout", formData.payoutCycle],
                      ].map(([k, val]) => (
                        <div
                          key={k}
                          className="flex items-start justify-between text-xs"
                        >
                          <span className="text-gray-400 shrink-0 mr-3">
                            {k}
                          </span>
                          <span className="font-medium text-gray-700 text-right">
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
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
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-white transition-colors bg-white"
              >
                <ArrowLeft size={15} />
                {onboardStep === 1 ? "Cancel" : "Back"}
              </button>
              <button
                onClick={() => {
                  if (validateVendorStep(onboardStep)) {
                    onboardStep < 4
                      ? setOnboardStep((s) => s + 1)
                      : submitOnboard();
                  }
                }}
                className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#8a9e60" }}
              >
                {onboardStep === 4 ? "Submit & Onboard" : "Continue"}
                {onboardStep < 4 && <CaretRight size={15} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          EDIT VENDOR MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {editVendor && editForm && (
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
                    Edit Vendor
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {editVendor.businessName} · {editVendor.id}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditVendor(null);
                    setEditForm(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex gap-1 border-b border-gray-100 -mb-4">
                {(["basic", "turf", "financial"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setEditTab(tab)}
                    className={`px-4 py-2 text-xs font-semibold capitalize transition-colors ${editTab === tab ? "border-b-2 text-[#8a9e60]" : "text-gray-400 hover:text-gray-600"}`}
                    style={editTab === tab ? { borderColor: "#8a9e60" } : {}}
                  >
                    {tab === "basic"
                      ? "Basic Info"
                      : tab === "turf"
                        ? "Turf Details"
                        : "Financial"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-7 py-6">
              {editTab === "basic" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        key: "businessName" as keyof Vendor,
                        label: "Business Name *",
                        placeholder: "Business name",
                      },
                      {
                        key: "ownerFullName" as keyof Vendor,
                        label: "Owner Name *",
                        placeholder: "Full name",
                      },
                      {
                        key: "email" as keyof Vendor,
                        label: "Email *",
                        placeholder: "email@example.com",
                      },
                      {
                        key: "phone" as keyof Vendor,
                        label: "Phone *",
                        placeholder: "+91 XXXXX XXXXX",
                      },
                      {
                        key: "gstNumber" as keyof Vendor,
                        label: "GST Number",
                        placeholder: "22AAAAA0000A1Z5",
                      },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          {label}
                        </label>
                        <input
                          value={String(editForm[key] ?? "")}
                          onChange={(e) => setEditField(key, e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                          placeholder={placeholder}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                      Location
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Address Type *
                        </label>
                        <div className="flex gap-3">
                          {["home", "work", "other"].map((t) => (
                            <button
                              key={t}
                              onClick={() =>
                                setEditAddressField("type", t as any)
                              }
                              className="flex-1 py-1.5 rounded-lg border text-xs font-medium capitalize transition-colors"
                              style={
                                editForm.address.type === t
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
                          value={editForm.address.houseNumber ?? ""}
                          onChange={(e) =>
                            setEditAddressField("houseNumber", e.target.value)
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                          placeholder="402, Building A"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          Landmark
                        </label>
                        <input
                          value={editForm.address.landmark ?? ""}
                          onChange={(e) =>
                            setEditAddressField("landmark", e.target.value)
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                          placeholder="Near City Mall"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          City *
                        </label>
                        <input
                          value={editForm.address.city}
                          onChange={(e) =>
                            setEditAddressField("city", e.target.value)
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          State *
                        </label>
                        <Select
                          value={editForm.address.state}
                          onChange={(val) => setEditAddressField("state", val)}
                          options={STATES_LIST.map(s => ({ value: s, label: s }))}
                          searchable
                          useFixed
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          Pincode *
                        </label>
                        <input
                          value={editForm.address.pinCode}
                          onChange={(e) =>
                            setEditAddressField("pinCode", e.target.value)
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                          maxLength={6}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editTab === "turf" && (
                <div className="space-y-5">
                  {/* <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Number of Fields
                      </label>
                      <div className="w-full px-3 py-2.5 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-lg">
                        {editForm.fields?.length || 0}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Surface Type
                      </label>
                      <div className="w-full px-3 py-2.5 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-lg">
                        {editForm.fields?.[0]?.surfaceType || "—"}
                      </div>
                    </div>
                  </div> */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Facilities
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(editForm.facilities || []).map((f) => (
                        <span
                          key={f}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {editTab === "financial" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Commission % *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={editForm.commissionPct}
                          onChange={(e) =>
                            setEditField("commissionPct", e.target.value)
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]"
                        />
                        <Percent
                          size={13}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        GST Number
                      </label>
                      <input
                        value={editForm.gstNumber}
                        onChange={(e) =>
                          setEditField("gstNumber", e.target.value)
                        }
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 font-mono focus:outline-none focus:border-[#8a9e60]"
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Payout Cycle *
                    </label>
                    <div className="flex gap-3">
                      {["daily", "weekly", "monthly"].map((c) => (
                        <button
                          key={c}
                          onClick={() => setEditField("payoutCycle", c)}
                          className="flex-1 py-2.5 rounded-lg border text-xs font-medium capitalize transition-colors"
                          style={
                            editForm.payoutCycle === c
                              ? {
                                  backgroundColor: "#8a9e60",
                                  color: "white",
                                  borderColor: "transparent",
                                }
                              : { borderColor: "#e5e7eb", color: "#6b7280" }
                          }
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Vendor Status
                    </label>
                    <div className="flex gap-3">
                      {(["active", "pending", "banned"] as VendorStatus[]).map(
                        (s) => (
                          <button
                            key={s}
                            onClick={() => setEditField("status", s)}
                            className="flex-1 py-2.5 rounded-lg border text-xs font-medium capitalize transition-colors"
                            style={
                              editForm.status === s
                                ? {
                                    backgroundColor:
                                      s === "active"
                                        ? "#8a9e60"
                                        : s === "banned"
                                          ? "#b05252"
                                          : "#c4953a",
                                    color: "white",
                                    borderColor: "transparent",
                                  }
                                : { borderColor: "#e5e7eb", color: "#6b7280" }
                            }
                          >
                            {s}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-7 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0 bg-gray-50/50">
              <button
                onClick={() => {
                  setEditVendor(null);
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

      {/* ═══════════════════════════════════════════════════════════════════════
          KYC REVIEW MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {kycVendor && (
        <VendorKycUpload
          vendor={kycVendor}
          onClose={() => setKycVendor(null)}
          onSuccess={async () => {
            refreshData();
            if (!kycVendor) return;
            try {
              const updated = await getVendorById(kycVendor.id);
              if (selectedVendor?.id === updated.id) {
                setSelected(updated);
              }
            } catch {}
          }}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          CONFIRM MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmModal.type === "remove" || confirmModal.type === "ban" ? "bg-red-50" : confirmModal.type === "suspend" ? "bg-slate-50" : "bg-blue-50"}`}
              >
                {confirmModal.type === "remove" ? (
                  <Trash size={24} className="text-red-500" />
                ) : confirmModal.type === "suspend" ? (
                  <Trash size={24} className="text-slate-500" />
                ) : confirmModal.type === "ban" ? (
                  <XCircle size={24} className="text-red-500" />
                ) : confirmModal.type === "unsuspend" ? (
                  <Check size={24} className="text-blue-500" />
                ) : (
                  <WarningCircle size={24} className="text-amber-500" />
                )}
              </div>

              <h3 className="text-base font-bold text-gray-800 mb-1">
                {confirmModal.type === "remove"
                  ? "Remove Vendor?"
                  : confirmModal.type === "suspend"
                    ? "Suspend Vendor?"
                    : confirmModal.type === "unsuspend"
                      ? "Unsuspend Vendor?"
                      : confirmModal.type === "ban"
                        ? "Ban Vendor?"
                        : "Unban Vendor?"}
              </h3>

              <p className="text-sm text-gray-500 mb-4">
                {confirmModal.type === "remove"
                  ? `${confirmModal.vendor.businessName} will be permanently removed from the platform. This action cannot be undone.`
                  : confirmModal.type === "suspend"
                    ? `${confirmModal.vendor.businessName} will be suspended. They won't be able to receive new bookings or manage their turfs until reactivated.`
                    : confirmModal.type === "unsuspend"
                      ? `${confirmModal.vendor.businessName} will be reactivated and can resume operations.`
                      : confirmModal.type === "ban"
                        ? `${confirmModal.vendor.businessName} will be banned and their listings will go offline.`
                        : `${confirmModal.vendor.businessName} will be unbanned and their listings will go live.`}
              </p>

              {confirmModal.type === "ban" && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Reason (optional)
                  </label>
                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] resize-none"
                    placeholder="e.g. Policy violation, payment dispute…"
                  />
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => {
                  setConfirmModal(null);
                  setBanReason("");
                }}
                className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 ${
                  confirmModal.type === "remove"
                    ? "bg-red-500"
                    : confirmModal.type === "ban"
                      ? "bg-red-600"
                      : confirmModal.type === "suspend"
                        ? "bg-slate-600"
                        : ""
                }`}
                style={
                  confirmModal.type === "unban" ||
                  confirmModal.type === "unsuspend"
                    ? { backgroundColor: "#8a9e60" }
                    : {}
                }
              >
                {confirmModal.type === "remove"
                  ? "Yes, Remove"
                  : confirmModal.type === "suspend"
                    ? "Suspend"
                    : confirmModal.type === "unsuspend"
                      ? "Unsuspend"
                      : confirmModal.type === "ban"
                        ? "Ban"
                        : "Unban"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ═══════════════════════════════════════════════════════════════════════
          ONBOARDING PROGRESS OVERLAY
      ═══════════════════════════════════════════════════════════════════════ */}
      {onboardingStatus !== "idle" && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="bg-white rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-gray-100 p-8 w-full max-w-sm text-center transform animate-in zoom-in-95 duration-300">
            <div className="relative w-20 h-20 mx-auto mb-6">
              {onboardingStatus === "success" ? (
                <div className="w-full h-full bg-[#8a9e60] rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                  <Check size={40} weight="bold" className="text-white" />
                </div>
              ) : (
                <>
                  <CircleNotch
                    size={80}
                    weight="light"
                    className="text-[#8a9e60] animate-spin absolute inset-0"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-[#8a9e60]/10 rounded-full animate-pulse" />
                  </div>
                </>
              )}
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {onboardingStatus === "creating" && "Creating Profile"}
              {onboardingStatus === "uploading" && "Uploading Files"}
              {onboardingStatus === "finalizing" && "Finalizing KYC"}
              {onboardingStatus === "success" && "Success!"}
            </h2>

            <p className="text-sm text-gray-500 leading-relaxed min-h-[40px]">
              {onboardingStatus === "creating" &&
                "Initializing vendor identity and business records..."}
              {onboardingStatus === "uploading" &&
                "Securely storing KYC documents in cloud storage..."}
              {onboardingStatus === "finalizing" &&
                "Linking data and activating the vendor account..."}
              {onboardingStatus === "success" &&
                `${formData.businessName} has been onboarded successfully.`}
            </p>

            <div className="mt-8 flex justify-center gap-1.5">
              {["creating", "uploading", "finalizing", "success"].map(
                (step, idx) => {
                  const steps = [
                    "creating",
                    "uploading",
                    "finalizing",
                    "success",
                  ];
                  const currentIdx = steps.indexOf(onboardingStatus);
                  const isActive = step === onboardingStatus;
                  const isDone = steps.indexOf(step) < currentIdx;

                  return (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        isActive
                          ? "w-8 bg-[#8a9e60]"
                          : isDone
                            ? "w-4 bg-[#8a9e60]/40"
                            : "w-1.5 bg-gray-100"
                      }`}
                    />
                  );
                },
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
