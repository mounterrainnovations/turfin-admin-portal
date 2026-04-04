"use client";

import {
  Handshake,
  MapPin,
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
  CaretRight,
  CurrencyDollar,
} from "@phosphor-icons/react";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { vendorsApi } from "@/domains/vendors/api";
import {
  Vendor,
  KycStatus as DomainKycStatus,
  VendorStatus as DomainVendorStatus,
} from "@/domains/vendors/types";

// ── Types ──────────────────────────────────────────────────────────────────────
type UIKycStatus =
  | "verified"
  | "in-review"
  | "pending"
  | "not-started"
  | "rejected";
type UIVendorStatus = "active" | "pending" | "suspended";
type DocStatus = "pending" | "verified" | "rejected";

// ── Config ─────────────────────────────────────────────────────────────────────
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
];
const STEP_LABELS = ["Business Info", "Location", "Banking", "KYC & Review"];
const KYC_DOCS = [
  {
    key: "idProof",
    label: "Identity Proof",
    hint: "Aadhaar / Passport / Driving License",
  },
  {
    key: "addressProof",
    label: "Address Proof",
    hint: "Utility bill / Bank statement",
  },
  {
    key: "businessReg",
    label: "Business Registration",
    hint: "Incorporation cert / Partnership deed",
  },
  { key: "gstCert", label: "GST Certificate", hint: "If GST registered" },
  {
    key: "bankStatement",
    label: "Cancelled Cheque",
    hint: "For bank account verification",
  },
] as const;

const kycCfg: Record<
  UIKycStatus,
  { label: string; cls: string; icon: React.ElementType; dot: string }
> = {
  verified: {
    label: "Verified",
    cls: "bg-green-50 text-green-700",
    icon: CheckCircle,
    dot: "bg-green-500",
  },
  "in-review": {
    label: "In Review",
    cls: "bg-amber-50 text-amber-700",
    icon: ClockCountdown,
    dot: "bg-amber-400",
  },
  pending: {
    label: "Pending",
    cls: "bg-gray-100 text-gray-500",
    icon: WarningCircle,
    dot: "bg-gray-400",
  },
  "not-started": {
    label: "Not Started",
    cls: "bg-gray-50 text-gray-400",
    icon: FileText,
    dot: "bg-gray-300",
  },
  rejected: {
    label: "Rejected",
    cls: "bg-red-50 text-red-600",
    icon: XCircle,
    dot: "bg-red-500",
  },
};

const statusCfg: Record<
  UIVendorStatus,
  { label: string; cls: string; dot: string }
> = {
  active: {
    label: "Active",
    cls: "bg-green-50 text-green-700",
    dot: "bg-green-500",
  },
  pending: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-700",
    dot: "bg-amber-400",
  },
  suspended: {
    label: "Suspended",
    cls: "bg-red-50 text-red-600",
    dot: "bg-red-500",
  },
};

const INIT_FORM = {
  businessName: "",
  businessType: "individual",
  ownerName: "",
  email: "",
  phone: "",
  whatsapp: "",
  gst: "",
  regNo: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  pincode: "",
  mapsLink: "",
  payoutCycle: "weekly",
  commission: "10",
  idProof: "",
  addressProof: "",
  businessReg: "",
  gstCert: "",
  bankStatement: "",
};

type FormData = typeof INIT_FORM;
type FormStringKey = keyof FormData;

const BUSINESS_FIELDS = [
  {
    key: "ownerName",
    label: "Owner Full Name *",
    placeholder: "Full name",
    type: "text",
  },
  {
    key: "email",
    label: "Email *",
    placeholder: "owner@email.com",
    type: "email",
  },
  {
    key: "phone",
    label: "Phone *",
    placeholder: "+91 XXXXX XXXXX",
    type: "text",
  },
  {
    key: "gst",
    label: "GST Number",
    placeholder: "22AAAAA0000A1Z5",
    type: "text",
  },
] as const;

const BANK_FIELDS = [
  { key: "bankName", label: "Bank Name *", placeholder: "HDFC Bank" },
  {
    key: "accountHolder",
    label: "Account Holder *",
    placeholder: "Full name as per bank",
  },
  { key: "accountNo", label: "Account Number *", placeholder: "XXXXXXXXXXXX" },
  { key: "ifsc", label: "IFSC Code *", placeholder: "HDFC0001234" },
] as const;

function avatar(name: string) {
  return (name || "Vendor")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ── Components ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: any;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: color + "20" }}
        >
          <Icon size={16} weight="fill" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-[10px] text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function VendorsPage() {
  const queryClient = useQueryClient();
  const { data: vendors = [], isFetching } = useQuery({
    queryKey: ["vendors"],
    queryFn: vendorsApi.listVendors,
  });

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | UIVendorStatus>("all");
  const [selectedVendorId, setSelected] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const [showOnboard, setShowOnboard] = useState(false);
  const [onboardStep, setOnboardStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({ ...INIT_FORM });

  const [editVendorId, setEditVendorId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any | null>(null);
  const [editTab, setEditTab] = useState<"basic" | "financial">("basic");

  const [kycVendorId, setKycVendorId] = useState<string | null>(null);
  const [kycDocs, setKycDocs] = useState<Record<string, DocStatus>>({});

  const [confirmModal, setConfirmModal] = useState<{
    type: "suspend" | "reactivate" | "remove";
    vendor: Vendor;
  } | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  // Mutations
  const onboardMutation = useMutation({
    mutationFn: (data: FormData) =>
      vendorsApi.onboardVendor({
        email: data.email,
        businessName: data.businessName,
        ownerFullName: data.ownerName,
        businessType: data.businessType.toUpperCase() as any,
        commissionPct: Number(data.commission),
        payoutCycle: data.payoutCycle.toUpperCase() as any,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor onboarded successfully!");
      closeOnboard();
    },
    onError: (err: any) => toast.error(err.message || "Onboarding failed"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "ACTIVE" | "SUSPENDED";
    }) => vendorsApi.updateVendorStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Status updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const kycMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: DomainKycStatus;
      reason?: string;
    }) => vendorsApi.reviewVendorKyc(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("KYC review completed");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const closeOnboard = () => {
    setShowOnboard(false);
    setOnboardStep(1);
    setFormData({ ...INIT_FORM });
  };

  const setField = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setFormData((p) => ({ ...p, [key]: val }));

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      const vStatus = v.status.toLowerCase() as UIVendorStatus;
      const matchTab = activeTab === "all" || vStatus === activeTab;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        v.businessName.toLowerCase().includes(q) ||
        v.ownerFullName.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q) ||
        v.id.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [vendors, activeTab, search]);

  const selectedVendor = useMemo(
    () => vendors.find((v) => v.id === selectedVendorId) || null,
    [vendors, selectedVendorId],
  );

  const kycVendor = useMemo(
    () => vendors.find((v) => v.id === kycVendorId) || null,
    [vendors, kycVendorId],
  );

  const activeCount = useMemo(
    () => vendors.filter((v) => v.status === "ACTIVE").length,
    [vendors],
  );

  const pendingKycCount = useMemo(
    () => vendors.filter((v) => v.kycStatus !== "APPROVED").length,
    [vendors],
  );

  const getKycUIStatus = (status: string): UIKycStatus => {
    switch (status) {
      case "APPROVED":
        return "verified";
      case "REJECTED":
        return "rejected";
      case "PENDING":
        return "in-review";
      default:
        return "not-started";
    }
  };

  const getStatusUIStatus = (status: string): UIVendorStatus => {
    switch (status) {
      case "ACTIVE":
        return "active";
      case "SUSPENDED":
        return "suspended";
      default:
        return "pending";
    }
  };

  function openEdit(v: Vendor) {
    setEditVendorId(v.id);
    setEditForm({ ...v });
    setEditTab("basic");
  }

  function setEditField(key: string, val: any) {
    setEditForm((p: any) => (p ? { ...p, [key]: val } : null));
  }

  function openKycReview(v: Vendor) {
    setKycVendorId(v.id);
    const init: Record<string, DocStatus> = {};
    KYC_DOCS.forEach((d) => {
      init[d.key] = v.kycStatus === "APPROVED" ? "verified" : "pending";
    });
    setKycDocs(init);
  }

  function setDocStatus(key: string, s: DocStatus) {
    setKycDocs((p) => ({ ...p, [key]: s }));
  }

  function applyKycVerify() {
    if (!kycVendorId) return;
    kycMutation.mutate({ id: kycVendorId, status: "APPROVED" });
    setKycVendorId(null);
  }

  function applyKycReject() {
    if (!kycVendorId) return;
    kycMutation.mutate({
      id: kycVendorId,
      status: "REJECTED",
      reason: "Rejected by admin",
    });
    setKycVendorId(null);
  }

  function applyKycResubmit() {
    if (!kycVendorId) return;
    kycMutation.mutate({ id: kycVendorId, status: "PENDING" });
    setKycVendorId(null);
  }

  function handleConfirm() {
    if (!confirmModal) return;
    const { type, vendor } = confirmModal;
    if (type === "suspend") {
      updateStatusMutation.mutate({ id: vendor.id, status: "SUSPENDED" });
    } else if (type === "reactivate") {
      updateStatusMutation.mutate({ id: vendor.id, status: "ACTIVE" });
    } else if (type === "remove") {
      toast.error("Cleanup endpoint not yet available.");
    }
    setConfirmModal(null);
    setSuspendReason("");
  }

  return (
    <div className="px-6 py-5 space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Vendors"
          value={String(vendors.length)}
          sub="+3 this month"
          icon={Handshake}
          color="#8a9e60"
        />
        <StatCard
          label="Active Vendors"
          value={String(activeCount)}
          sub={`${vendors.length ? Math.round((activeCount / vendors.length) * 100) : 0}% of total`}
          icon={CheckCircle}
          color="#6e8245"
        />
        <StatCard
          label="Pending KYC"
          value={String(pendingKycCount)}
          sub="Needs attention"
          icon={WarningCircle}
          color="#c4953a"
        />
        <StatCard
          label="Platform Revenue"
          value={`₹${vendors.reduce((s, v) => s + (v.revenue || 0), 0).toLocaleString("en-IN")}`}
          sub="This month"
          icon={CurrencyDollar}
          color="#8a9e60"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-sm shadow-sm focus-within:border-[#8a9e60] transition-colors">
          <MagnifyingGlass size={15} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors, owners, cities…"
            className="flex-1 outline-none text-sm text-gray-700 bg-transparent placeholder:text-gray-400"
          />
        </div>
        <button
          onClick={() => setShowOnboard(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 shadow-sm active:scale-[0.98]"
          style={{ backgroundColor: "#8a9e60" }}
        >
          <Plus size={16} weight="bold" />
          Onboard Vendor
        </button>
      </div>

      <div className="flex border-b border-gray-200">
        {[
          { id: "all" as const, label: "All Vendors" },
          { id: "active" as const, label: "Active" },
          { id: "pending" as const, label: "Pending" },
          { id: "suspended" as const, label: "Suspended" },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-semibold relative transition-colors ${active ? "text-[#8a9e60]" : "text-gray-400 hover:text-gray-600"}`}
            >
              {tab.label}
              {active && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8a9e60] rounded-t-full shadow-[0_-1px_4px_rgba(138,158,96,0.3)]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {[
                  "Vendor",
                  "Contact",
                  "Location",
                  "Fields",
                  "Status",
                  "KYC",
                  "Revenue",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 py-3.5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-16 text-center text-sm text-gray-400"
                  >
                    {isFetching
                      ? "Syncing with backend..."
                      : "No vendors match your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((v) => {
                  const kc = kycCfg[getKycUIStatus(v.kycStatus)];
                  const sc = statusCfg[getStatusUIStatus(v.status)];
                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-inner"
                            style={{ backgroundColor: "#8a9e60" }}
                          >
                            {avatar(v.businessName)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800 group-hover:text-[#8a9e60] transition-colors">
                              {v.businessName}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                              {v.id.slice(0, 12)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs text-gray-700 font-medium">
                          {v.ownerFullName}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs text-gray-700">{v.city}</p>
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-gray-700">
                        {v.fieldsCount || 0}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${sc.cls}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                          />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${kc.cls}`}
                        >
                          <kc.icon size={11} weight="fill" />
                          {kc.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-gray-700">
                        {v.revenue && v.revenue > 0 ? (
                          `₹${v.revenue.toLocaleString("en-IN")}`
                        ) : (
                          <span className="text-gray-300 font-normal">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setSelected(v.id)}
                            className="p-2 rounded-lg hover:bg-white hover:shadow-md text-gray-400 hover:text-[#8a9e60] transition-all"
                            title="View"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => openEdit(v)}
                            className="p-2 rounded-lg hover:bg-white hover:shadow-md text-gray-400 hover:text-[#8a9e60] transition-all"
                            title="Edit"
                          >
                            <PencilSimple size={15} />
                          </button>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenu(
                                  actionMenu === v.id ? null : v.id,
                                );
                              }}
                              className={`p-2 rounded-lg transition-all ${actionMenu === v.id ? "bg-gray-100 text-[#8a9e60]" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
                            >
                              <DotsThreeVertical size={16} weight="bold" />
                            </button>
                            {actionMenu === v.id && (
                              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-premium z-50 py-1.5 min-w-[160px] animate-in fade-in slide-in-from-top-1 duration-200">
                                {v.status === "SUSPENDED" ? (
                                  <button
                                    onClick={() => {
                                      setActionMenu(null);
                                      setConfirmModal({
                                        type: "reactivate",
                                        vendor: v,
                                      });
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-[#8a9e60]/5 hover:text-[#8a9e60] transition-colors flex items-center gap-2.5 font-medium"
                                  >
                                    <CheckCircle
                                      size={14}
                                      className="text-green-500"
                                    />
                                    Reactivate
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setActionMenu(null);
                                      setConfirmModal({
                                        type: "suspend",
                                        vendor: v,
                                      });
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition-colors flex items-center gap-2.5 font-medium"
                                  >
                                    <XCircle
                                      size={14}
                                      className="text-amber-500"
                                    />
                                    Suspend
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setActionMenu(null);
                                    openKycReview(v);
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2.5 font-medium"
                                >
                                  <ShieldCheck
                                    size={14}
                                    className="text-blue-500"
                                  />
                                  Review KYC
                                </button>
                                <div className="border-t border-gray-50 my-1.5 mx-2" />
                                <button
                                  onClick={() => {
                                    setActionMenu(null);
                                    setConfirmModal({
                                      type: "remove",
                                      vendor: v,
                                    });
                                  }}
                                  className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2.5 font-medium"
                                >
                                  <Trash size={14} />
                                  Remove
                                </button>
                              </div>
                            )}
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50 bg-gray-50/30">
          <p className="text-[11px] font-medium text-gray-400">
            Showing {filtered.length} of {vendors.length} vendors
          </p>
          <div className="flex gap-1.5">
            {[1].map((p) => (
              <button
                key={p}
                className="w-8 h-8 text-[11px] rounded-lg font-bold transition-all shadow-sm flex items-center justify-center p-0"
                style={{ backgroundColor: "#8a9e60", color: "white" }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {actionMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setActionMenu(null)}
        />
      )}

      {/* Drawer - Selected Vendor */}
      {selectedVendor && (
        <div className="fixed inset-0 z-[100] flex">
          <div
            className="flex-1 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setSelected(null)}
          />
          <div className="w-[480px] bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex items-start justify-between p-7 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg"
                  style={{ backgroundColor: "#8a9e60" }}
                >
                  {avatar(selectedVendor.businessName)}
                </div>
                <div>
                  <h2 className="font-bold text-gray-800 text-lg leading-tight">
                    {selectedVendor.businessName}
                  </h2>
                  <p className="text-[11px] text-gray-400 font-mono mt-1">
                    {selectedVendor.id}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusCfg[getStatusUIStatus(selectedVendor.status)].cls}`}
                    >
                      {
                        statusCfg[getStatusUIStatus(selectedVendor.status)]
                          .label
                      }
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${kycCfg[getKycUIStatus(selectedVendor.kycStatus)].cls}`}
                    >
                      KYC:{" "}
                      {kycCfg[getKycUIStatus(selectedVendor.kycStatus)].label}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-50 transition-colors shrink-0"
              >
                <X size={20} weight="bold" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-7 space-y-8">
              <section>
                <div className="flex items-center gap-2 mb-4 border-l-2 border-[#8a9e60] pl-3">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">
                    Ownership & Contact
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-5">
                  {[
                    {
                      icon: UserCircle,
                      label: "Full Name",
                      val: selectedVendor.ownerFullName,
                    },
                    {
                      icon: Envelope,
                      label: "Business Email",
                      val: "owner@turfin.com (Hidden)",
                    },
                    {
                      icon: CalendarBlank,
                      label: "Registered On",
                      val: new Date(
                        selectedVendor.createdAt,
                      ).toLocaleDateString("en-IN", { dateStyle: "long" }),
                    },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} className="flex items-center gap-4 group">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-[#8a9e60]/10 transition-colors">
                        <Icon
                          size={18}
                          className="text-gray-400 group-hover:text-[#8a9e60]"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          {label}
                        </p>
                        <p className="text-sm text-gray-800 font-semibold">
                          {val}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <div className="flex items-center gap-2 mb-4 border-l-2 border-[#8a9e60] pl-3">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">
                    Business Location
                  </h3>
                </div>
                <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={18} className="text-[#8a9e60]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 leading-snug">
                        {selectedVendor.addressLineOne}
                      </p>
                      <p className="text-[13px] text-gray-500 mt-1 font-medium">
                        {selectedVendor.city}, {selectedVendor.state} –{" "}
                        {selectedVendor.pinCode}
                      </p>
                      <button className="mt-3 text-[11px] font-bold text-[#8a9e60] hover:underline flex items-center gap-1">
                        Open in Google Maps <CaretRight size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
              <section>
                <div className="flex items-center gap-2 mb-4 border-l-2 border-[#8a9e60] pl-3">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">
                    Performance & Finance
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <CurrencyDollar size={12} className="text-[#8a9e60]" />{" "}
                      Revenue
                    </p>
                    <p className="text-lg font-black text-gray-800">
                      ₹{(selectedVendor.revenue || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Percent size={12} className="text-[#8a9e60]" />{" "}
                      Commission
                    </p>
                    <p className="text-lg font-black text-gray-800">
                      {selectedVendor.commissionPct}%
                    </p>
                  </div>
                  <div className="col-span-2 bg-gray-900 rounded-2xl p-4 flex items-center justify-between shadow-lg">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                        Payout Cycle
                      </p>
                      <p className="text-sm font-bold text-white capitalize">
                        {selectedVendor.payoutCycle.toLowerCase()}
                      </p>
                    </div>
                    <div className="text-right text-white/40">
                      <Plus size={20} />
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 shrink-0 bg-gray-50/50">
              <button
                onClick={() => openEdit(selectedVendor)}
                className="flex-1 h-11 text-xs font-bold border border-gray-200 rounded-xl text-gray-600 hover:bg-white hover:shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <PencilSimple size={14} weight="bold" />
                Edit Details
              </button>
              <button
                onClick={() => openKycReview(selectedVendor)}
                className="flex-1 h-11 text-xs font-bold border border-blue-100 rounded-xl text-blue-600 bg-blue-50/50 hover:bg-blue-100 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <ShieldCheck size={14} weight="bold" />
                Review KYC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard Modal */}
      {showOnboard && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-6"
          style={{
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="bg-white rounded-[28px] shadow-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 pt-8 pb-6 border-b border-gray-50 shrink-0">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    Onboard Vendor
                  </h2>
                  <p className="text-xs font-bold text-[#8a9e60] mt-1 uppercase tracking-widest">
                    Step {onboardStep} — {STEP_LABELS[onboardStep - 1]}
                  </p>
                </div>
                <button
                  onClick={closeOnboard}
                  className="text-gray-300 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                >
                  <X size={24} weight="bold" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Vendor Status
                  </label>
                  <div className="flex gap-3">
                    {(
                      ["active", "pending", "suspended"] as UIVendorStatus[]
                    ).map((s) => (
                      <button
                        key={s}
                        onClick={() => setEditField("status", s.toUpperCase())}
                        className="flex-1 py-2.5 rounded-lg border text-[11px] font-bold uppercase tracking-widest transition-all"
                        style={
                          editForm.status.toLowerCase() === s
                            ? {
                                backgroundColor:
                                  s === "active"
                                    ? "#8a9e60"
                                    : s === "suspended"
                                      ? "#b05252"
                                      : "#c4953a",
                                color: "white",
                                borderColor: "transparent",
                              }
                            : { borderColor: "#f3f4f6", color: "#9ca3af" }
                        }
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                {STEP_LABELS.map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-1.5 rounded-full transition-all duration-500 overflow-hidden bg-gray-100"
                  >
                    <div
                      className="h-full bg-[#8a9e60] transition-all duration-500"
                      style={{ width: i + 1 <= onboardStep ? "100%" : "0%" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-7">
              {onboardStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Business Name *
                    </label>
                    <input
                      value={formData.businessName}
                      onChange={(e) => setField("businessName", e.target.value)}
                      className="w-full h-12 bg-gray-50 border border-transparent rounded-2xl px-5 text-sm font-bold text-gray-800 focus:outline-none focus:bg-white focus:border-[#8a9e60] focus:shadow-md transition-all"
                      placeholder="e.g. Arena Champions"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Legal Entity Type
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["individual", "company", "partnership"].map((t) => (
                        <button
                          key={t}
                          onClick={() => setField("businessType", t)}
                          className={`h-11 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all border ${formData.businessType === t ? "bg-[#8a9e60] text-white border-transparent shadow-lg" : "bg-white text-gray-500 border-gray-100 hover:border-[#8a9e60]"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    {BUSINESS_FIELDS.map((f) => (
                      <div key={f.key}>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                          {f.label}
                        </label>
                        <input
                          type={f.type}
                          value={formData[f.key as any] as string}
                          onChange={(e) =>
                            setField(f.key as any, e.target.value)
                          }
                          className="w-full h-11 bg-gray-50 border border-transparent rounded-xl px-4 text-sm font-bold text-gray-800 focus:outline-none focus:bg-white focus:border-[#8a9e60] transition-all"
                          placeholder={f.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Step 2, 3, 4 simplified for brevity but functional */}
              {onboardStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        Building/Street Address *
                      </label>
                      <input
                        value={formData.address1}
                        onChange={(e) => setField("address1", e.target.value)}
                        className="w-full h-12 bg-gray-50 border-transparent rounded-2xl px-5 text-sm font-bold focus:bg-white focus:border-[#8a9e60] transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        City *
                      </label>
                      <input
                        value={formData.city}
                        onChange={(e) => setField("city", e.target.value)}
                        className="w-full h-11 bg-gray-50 border-transparent rounded-xl px-4 text-sm font-bold focus:bg-white focus:border-[#8a9e60] transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        Pincode *
                      </label>
                      <input
                        value={formData.pincode}
                        onChange={(e) => setField("pincode", e.target.value)}
                        className="w-full h-11 bg-gray-50 border-transparent rounded-xl px-4 text-sm font-bold focus:bg-white focus:border-[#8a9e60] transition-all outline-none"
                        maxLength={6}
                      />
                    </div>
                  </div>
                </div>
              )}
              {onboardStep === 3 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-5">
                    {BANK_FIELDS.map((f) => (
                      <div key={f.key}>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                          {f.label}
                        </label>
                        <input
                          value={formData[f.key as any] as string}
                          onChange={(e) =>
                            setField(f.key as any, e.target.value)
                          }
                          className="w-full h-11 bg-gray-50 border-transparent rounded-xl px-4 text-sm font-bold focus:bg-white focus:border-[#8a9e60] transition-all outline-none"
                          placeholder={f.placeholder}
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                        Platform Commission %
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={formData.commission}
                          onChange={(e) =>
                            setField("commission", e.target.value)
                          }
                          className="w-full h-11 bg-gray-50 border-transparent rounded-xl px-4 pr-10 text-sm font-bold focus:bg-white focus:border-[#8a9e60] transition-all outline-none"
                        />
                        <Percent
                          size={14}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                          weight="bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {onboardStep === 4 && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-[20px] p-6 border border-gray-100">
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest mb-4">
                      Summary Verification
                    </h3>
                    <div className="space-y-3">
                      {[
                        ["Business", formData.businessName],
                        ["Owner", formData.ownerName],
                        ["Contact", formData.phone],
                        ["Commission", `${formData.commission}%`],
                      ].map(([k, v]) => (
                        <div
                          key={k}
                          className="flex justify-between items-center text-xs"
                        >
                          <span className="text-gray-400 font-bold uppercase">
                            {k}
                          </span>
                          <span className="text-gray-800 font-black">
                            {v || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed text-center px-4 font-medium">
                    By clicking submit, an account will be created and the
                    vendor will receive an email to complete their profile
                    setup.
                  </p>
                </div>
              )}
            </div>

            <div className="px-8 py-6 border-t border-gray-50 flex items-center justify-between shrink-0 bg-gray-50/20">
              <button
                onClick={() =>
                  onboardStep > 1
                    ? setOnboardStep((s) => s - 1)
                    : closeOnboard()
                }
                className="h-12 px-6 text-sm font-black text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={18} weight="bold" />{" "}
                {onboardStep === 1 ? "Cancel" : "Back"}
              </button>
              <button
                onClick={() =>
                  onboardStep < 4
                    ? setOnboardStep((s) => s + 1)
                    : onboardMutation.mutate(formData)
                }
                disabled={onboardMutation.isPending}
                className="h-12 px-8 text-sm font-black text-white rounded-2xl shadow-xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: "#8a9e60" }}
              >
                {onboardMutation.isPending
                  ? "Onboarding..."
                  : onboardStep === 4
                    ? "Complete Onboarding"
                    : "Next Step"}
                {onboardStep < 4 && <CaretRight size={18} weight="bold" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Component (Simplified for production Drop-in) */}
      {editVendorId && editForm && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-6"
          style={{
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="bg-white rounded-[32px] shadow-4xl w-full max-w-md p-8 flex flex-col text-center">
            <div className="w-16 h-16 bg-[#8a9e60]/10 text-[#8a9e60] rounded-3xl flex items-center justify-center mx-auto mb-6">
              <PencilSimple size={32} weight="duotone" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
              Edit {editForm.businessName}
            </h2>
            <p className="text-sm text-gray-500 font-medium mb-8">
              Full profile editing will be enabled once the corresponding
              backend domain service is finalized. You can currently manage
              status and KYC below.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => {
                  setEditVendorId(null);
                  setKycVendorId(editForm.id);
                }}
                className="h-12 rounded-2xl bg-blue-50 text-blue-600 font-bold text-sm hover:bg-blue-100 transition-all"
              >
                Review Documents (KYC)
              </button>
              <button
                onClick={() => {
                  setEditVendorId(null);
                  setConfirmModal({
                    type:
                      editForm.status === "ACTIVE" ? "suspend" : "reactivate",
                    vendor: editForm,
                  });
                }}
                className="h-12 rounded-2xl bg-gray-50 text-gray-600 font-bold text-sm hover:bg-gray-100 transition-all"
              >
                {editForm.status === "ACTIVE"
                  ? "Suspend Account"
                  : "Activate Account"}
              </button>
              <button
                onClick={() => setEditVendorId(null)}
                className="h-12 mt-4 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-gray-600 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KYC Review */}
      {kycVendorId && kycVendor && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center p-6"
          style={{
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="bg-white rounded-[32px] shadow-4xl w-full max-w-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-8 pt-8 pb-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                  <ShieldCheck size={24} weight="fill" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900">
                    KYC Review
                  </h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                    {kycVendor.businessName} · ID Verification
                  </p>
                </div>
              </div>
              <button
                onClick={() => setKycVendorId(null)}
                className="text-gray-300 hover:text-gray-600 p-2"
              >
                <X size={24} weight="bold" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-7 space-y-4">
              {KYC_DOCS.map((doc) => {
                const status = kycDocs[doc.key] || "pending";
                return (
                  <div
                    key={doc.key}
                    className={`rounded-2xl border p-5 flex items-center justify-between transition-all ${status === "verified" ? "bg-green-50/40 border-green-100" : status === "rejected" ? "bg-red-50/40 border-red-100" : "bg-gray-50/50 border-gray-100"}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${status === "verified" ? "bg-green-100 text-green-600" : status === "rejected" ? "bg-red-100 text-red-500" : "bg-white text-gray-400 shadow-sm"}`}
                      >
                        <FileText size={20} weight="bold" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-800 leading-tight">
                          {doc.label}
                        </p>
                        <button className="text-[10px] font-bold text-[#8a9e60] mt-1 hover:underline">
                          View Attachment_01.pdf
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDocStatus(doc.key, "verified")}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${status === "verified" ? "bg-green-500 text-white shadow-lg" : "bg-white text-gray-300 border border-gray-100 hover:border-green-300 hover:text-green-500"}`}
                      >
                        <CheckCircle size={18} weight="bold" />
                      </button>
                      <button
                        onClick={() => setDocStatus(doc.key, "rejected")}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${status === "rejected" ? "bg-red-500 text-white shadow-lg" : "bg-white text-gray-300 border border-gray-100 hover:border-red-300 hover:text-red-500"}`}
                      >
                        <XCircle size={18} weight="bold" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-8 py-6 border-t border-gray-50 bg-gray-50/30 flex gap-4">
              <button
                onClick={applyKycReject}
                disabled={kycMutation.isPending}
                className="flex-1 h-12 rounded-2xl bg-white border border-red-100 text-red-500 font-bold text-xs uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                Revoke / Reject
              </button>
              <button
                onClick={applyKycVerify}
                disabled={kycMutation.isPending}
                className="flex-1 h-12 rounded-2xl text-white font-bold text-xs uppercase tracking-widest shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: "#8a9e60" }}
              >
                {kycMutation.isPending ? "Processing..." : "Approve KYC"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          style={{
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="bg-white rounded-[32px] shadow-4xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-200">
            <div
              className={`w-16 h-16 rounded-[24px] flex items-center justify-center mx-auto mb-6 shrink-0 ${confirmModal.type === "remove" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"}`}
            >
              {confirmModal.type === "remove" ? (
                <Trash size={32} weight="duotone" />
              ) : (
                <WarningCircle size={32} weight="duotone" />
              )}
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">
              {confirmModal.type === "remove"
                ? "Delete Vendor?"
                : "Confirm Suspension"}
            </h3>
            <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">
              Are you sure you want to {confirmModal.type}{" "}
              <span className="text-gray-900 font-bold font-mono">
                @{confirmModal.vendor.businessName}
              </span>
              ? This will affect their ability to accept bookings immediately.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleConfirm}
                className={`h-13 rounded-2xl text-white font-bold text-sm tracking-tight shadow-md active:scale-95 transition-all ${confirmModal.type === "remove" ? "bg-red-500" : "bg-amber-500"}`}
              >
                {confirmModal.type === "remove"
                  ? "Yes, Delete Permanently"
                  : "Confirm & Suspend"}
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                className="h-12 bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all mt-1"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
