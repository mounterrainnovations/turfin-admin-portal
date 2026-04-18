"use client";

import {
  Handshake, MapPin, Phone, Envelope, ShieldCheck,
  CheckCircle, XCircle, WarningCircle, ClockCountdown,
  Plus, MagnifyingGlass, DotsThreeVertical, X,
  UploadSimple, UserCircle, Eye, PencilSimple, Trash,
  FileText, ArrowLeft, Percent, CalendarBlank, CaretRight,
  CurrencyDollar,
} from "@phosphor-icons/react";
import { useState, useEffect, useCallback } from "react";
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
  reviewVendorKyc,
  KYC_CFG,
  STATUS_CFG,
  SPORT_COLOR,
  SPORTS_LIST,
  FACILITIES_LIST,
  SURFACE_LIST,
  STATES_LIST,
  BusinessType,
  PayoutCycle,
  AdminOnboardVendorDto
} from "@/features/vendors";
import { DashboardPagination } from "@/components/DashboardPagination";


// ── Types ──────────────────────────────────────────────────────────────────────
type DocStatus = "pending" | "verified" | "rejected";

// ── Config ─────────────────────────────────────────────────────────────────────
const STEP_LABELS    = ["Business Info", "Location", "Banking", "KYC & Review"];
const KYC_DOCS = [
  { key: "identityProof",       label: "Identity Proof",        hint: "Aadhaar / Passport / Driving License" },
  { key: "addressProof",        label: "Address Proof",         hint: "Utility bill / Bank statement" },
  { key: "businessRegistration", label: "Business Registration", hint: "Incorporation cert / Partnership deed" },
  { key: "gstCertificate",       label: "GST Certificate",       hint: "If GST registered" },
  { key: "cancelledCheque",      label: "Cancelled Cheque",      hint: "For bank account verification" },
 ] as const;

const BUSINESS_FIELDS = [
  { key: "ownerFullName" as const, label: "Owner Full Name *", placeholder: "Riaz Ahmed", type: "text" },
  { key: "phone" as const,         label: "Phone Number *",    placeholder: "+91 98765 43210", type: "tel" },
  { key: "email" as const,         label: "Email Address *",   placeholder: "riaz@example.com", type: "email" },
  { key: "whatsapp" as const,      label: "WhatsApp Number",   placeholder: "+91 98765 43210", type: "tel" },
  { key: "gstNumber" as const,     label: "GST Number",        placeholder: "22AAAAA0000A1Z5", type: "text" },
  { key: "businessRegistrationNumber" as const, label: "Registration No.", placeholder: "Optional", type: "text" },
] as const;

const BANK_FIELDS = [
  { key: "bankName" as const,          label: "Bank Name *",      placeholder: "HDFC Bank", mono: false },
  { key: "accountHolderName" as const, label: "Account Holder *", placeholder: "Riaz Ahmed", mono: false },
  { key: "accountNumber" as const,     label: "Account Number *", placeholder: "50100234XXXX", mono: true },
  { key: "ifsc" as const,              label: "IFSC Code *",      placeholder: "HDFC0001234", mono: true },
  { key: "upiId" as const,             label: "UPI ID",           placeholder: "riaz@okaxis", mono: true },
] as const;

const INIT_FORM = {
  // User / Account fields (top-level AdminOnboardVendorDto)
  email: "", password: "",
  // Vendor profile fields
  businessName: "", businessType: "individual" as BusinessType, ownerFullName: "",
  phone: "", whatsapp: "", gstNumber: "", businessRegistrationNumber: "",
  address: {
    type: "work" as "home" | "work" | "other",
    houseNumber: "", // Address Line 1 — building, street
    landmark: "",    // Address Line 2 — landmark, area
    pinCode: "", city: "", state: "", country: "India", googleMapsLink: ""
  },
  bankingDetails: {
    bankName: "", accountHolderName: "", accountNumber: "", ifsc: "", upiId: ""
  },
  payoutCycle: "weekly" as PayoutCycle, commissionPct: "10",
  identityProof: "", addressProof: "", businessRegistration: "", gstCertificate: "", cancelledCheque: "",
};

type FormData = typeof INIT_FORM;
type KycDocKey = typeof KYC_DOCS[number]["key"];


function avatar(name: string) {
  return name ? name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "??";
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function VendorsPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [vendors, setVendors]         = useState<Vendor[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [search, setSearch]           = useState("");
  const [activeTab, setActiveTab]     = useState<"all" | VendorStatus>("all");
  const [selectedVendor, setSelected] = useState<Vendor | null>(null);
  const [actionMenu, setActionMenu]   = useState<string | null>(null);

  // Pagination
  const [page, setPage]               = useState(1);
  const [limit, setLimit]             = useState(10);
  const [total, setTotal]             = useState(0);

  // Onboard modal
  const [showOnboard, setShowOnboard] = useState(false);
  const [onboardStep, setOnboardStep] = useState(1);
  const [formData, setFormData]       = useState<FormData>({ ...INIT_FORM });

  // Edit modal
  const [editVendor, setEditVendor]   = useState<Vendor | null>(null);
  const [editForm, setEditForm]       = useState<Vendor | null>(null);
  const [editTab, setEditTab]         = useState<"basic" | "turf" | "financial">("basic");

  // KYC review modal
  const [kycVendor, setKycVendor]     = useState<Vendor | null>(null);
  const [kycDocs, setKycDocs]         = useState<Record<string, DocStatus>>({});

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState<{ type: "ban" | "unban" | "remove"; vendor: Vendor } | null>(null);
  const [banReason, setBanReason] = useState("");

  const { showToast } = useToast();

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      try {
        const res = await listVendors({ page, limit, status: activeTab, search });

        if (!active) return;
        setVendors(res.items || []);
        setTotal(res.total || 0);
      } catch (err: any) {
        if (!active) return;
        const isAuthError = err.message === "Unauthorized" || err.message?.toLowerCase().includes("unauthori");
        showToast({ 
          title: isAuthError ? "Vendor data unavailable" : "Error", 
          description: isAuthError ? "Unauthorised" : (err.message || "Failed to load vendors"), 
          tone: "error" 
        });
      } finally {
        if (active) setIsLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [page, limit, activeTab, search, showToast, refreshTrigger]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);


  useEffect(() => {
    if (selectedVendor) {
      const match = vendors.find(v => v.id === selectedVendor.id);
      if (match) setSelected(match);
    }
  }, [vendors]);

  const refreshData = () => setRefreshTrigger(p => p + 1);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = vendors.filter(v => {
    const matchTab = activeTab === "all" || v.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch = !q 
      || v.businessName.toLowerCase().includes(q) 
      || v.ownerFullName.toLowerCase().includes(q)
      || v.address.city.toLowerCase().includes(q) 
      || v.id.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const totalRevenue = vendors.reduce((s, v) => s + (v.revenue || 0), 0);
  const activeCount  = vendors.filter(v => v.status === "active").length;
  const pendingKyc   = vendors.filter(v => ["pending", "in_review", "not_started"].includes(v.kycStatus)).length;

  // ── Helpers ────────────────────────────────────────────────────────────────
  
  // Onboard form
  const setField = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setFormData(p => ({ ...p, [key]: val }));
  
  const setAddressField = (key: keyof typeof INIT_FORM.address, val: string) =>
    setFormData(p => ({ ...p, address: { ...p.address, [key]: val } }));

  const setBankField = (key: keyof typeof INIT_FORM.bankingDetails, val: string) =>
    setFormData(p => ({ ...p, bankingDetails: { ...p.bankingDetails, [key]: val } }));

  const closeOnboard = () => { setShowOnboard(false); setOnboardStep(1); setFormData({ ...INIT_FORM }); setBanReason(""); };

  const submitOnboard = async () => {
    try {
      const dto: AdminOnboardVendorDto = {
        email: formData.email,
        password: formData.password,
        vendorProfile: {
          businessName: formData.businessName,
          businessType: formData.businessType,
          ownerFullName: formData.ownerFullName,
          phone: formData.phone,
          whatsapp: formData.whatsapp || undefined,
          gstNumber: formData.gstNumber || undefined,
          businessRegistrationNumber: formData.businessRegistrationNumber || undefined,
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
        }
      };
      await onboardVendor(dto);
      showToast({ title: "Success", description: `${formData.businessName} onboarded successfully.`, tone: "success" });
      closeOnboard();
      refreshData();
    } catch (err: any) {
      showToast({ title: "Error", description: err.message || "Failed to onboard vendor", tone: "error" });
    }
  };

  // Edit
  function openEdit(v: Vendor) {
    setEditVendor(v);
    setEditForm({ ...v });
    setEditTab("basic");
  }
  function setEditField(key: keyof Vendor, val: any) {
    setEditForm(p => p ? { ...p, [key]: val } : p);
  }
  function setEditAddressField(key: keyof typeof INIT_FORM.address, val: string) {
    setEditForm(p => p ? { ...p, address: { ...p.address, [key]: val } } : p);
  }
  
  async function saveEdit() {
    if (!editVendor || !editForm) return;
    try {
      await updateVendor(editVendor.id, {
        businessName: editForm.businessName,
        phone: editForm.phone,
        whatsapp: editForm.whatsapp,
        gstNumber: editForm.gstNumber,
        businessRegistrationNumber: editForm.businessRegistrationNumber,
        payoutCycle: editForm.payoutCycle,
        address: editForm.address,
      });
      showToast({ title: "Success", description: `${editForm.businessName} updated successfully.`, tone: "success" });
      setEditVendor(null);
      setEditForm(null);
      refreshData();
    } catch (err: any) {
      showToast({ title: "Error", description: err.message || "Failed to update vendor", tone: "error" });
    }
  }

  // KYC
  function openKycReview(v: Vendor) {
    setKycVendor(v);
    const init: Record<string, DocStatus> = {};
    KYC_DOCS.forEach((d) => {
      const vVal = v.verification?.[d.key];
      init[d.key] = vVal === true ? "verified" : vVal === false ? "rejected" : "pending";
    });
    setKycDocs(init);
  }
  function setDocStatus(key: string, s: DocStatus) {
    setKycDocs(p => ({ ...p, [key]: s }));
  }
  async function applyKycVerify() {
    if (!kycVendor) return;
    try {
      const verification: Record<string, boolean> = {};
      Object.entries(kycDocs).forEach(([key, status]) => {
        if (status === "verified") verification[key] = true;
        if (status === "rejected") verification[key] = false;
        // Omit if pending
      });

      await reviewVendorKyc(kycVendor.id, {
        status: "verified",
        reviewerNotes: "Approved by Admin via Portal.",
        verification,
      });
      showToast({ title: "KYC Verified", description: `${kycVendor.businessName} KYC verified.`, tone: "success" });
      setKycVendor(null);
      refreshData();
    } catch (err: any) {
      showToast({ title: "Error", description: err.message || "Failed to verify KYC", tone: "error" });
    }
  }

  async function applyKycReject() {
    if (!kycVendor) return;
    try {
      const verification: Record<string, boolean> = {};
      Object.entries(kycDocs).forEach(([key, status]) => {
        if (status === "verified") verification[key] = true;
        if (status === "rejected") verification[key] = false;
      });

      await reviewVendorKyc(kycVendor.id, {
        status: "rejected",
        reviewerNotes: "Rejected by Admin via Portal.",
        verification,
      });
      showToast({ title: "KYC Rejected", description: `${kycVendor.businessName} KYC rejected.`, tone: "error" });
      
      const updated = { ...kycVendor, kycStatus: "rejected" as KycStatus, verification };
      if (selectedVendor?.id === kycVendor.id) setSelected(updated);

      setKycVendor(null);
      refreshData();
    } catch (err: any) {
      showToast({ title: "Error", description: err.message || "Failed to reject KYC", tone: "error" });
    }
  }

  async function applyKycResubmit() {
    if (!kycVendor) return;
    try {
      const verification: Record<string, boolean> = {};
      Object.entries(kycDocs).forEach(([key, status]) => {
        if (status === "verified") verification[key] = true;
        if (status === "rejected") verification[key] = false;
      });

      await reviewVendorKyc(kycVendor.id, {
        status: "in_review",
        reviewerNotes: "Resubmission requested for certain documents.",
        verification,
      });
      showToast({ title: "Resubmission Requested", description: `Requested resubmission for ${kycVendor.businessName}.`, tone: "warning" });
      
      const updated = { ...kycVendor, kycStatus: "in_review" as KycStatus, verification };
      if (selectedVendor?.id === kycVendor.id) setSelected(updated);

      setKycVendor(null);
      refreshData();
    } catch (err: any) {
      showToast({ title: "Error", description: err.message || "Failed to request resubmission", tone: "error" });
    }
  }

  async function saveKycReview() {
    if (!kycVendor) return;
    try {
      const verification: Record<string, boolean> = {};
      Object.entries(kycDocs).forEach(([key, status]) => {
        if (status === "verified") verification[key] = true;
        if (status === "rejected") verification[key] = false;
      });

      await reviewVendorKyc(kycVendor.id, {
        status: "in_review",
        reviewerNotes: "Review progress saved by admin.",
        verification,
      });
      showToast({ title: "Progress Saved", description: "Document verification states updated.", tone: "success" });
      
      const updated = { ...kycVendor, kycStatus: "in_review" as KycStatus, verification };
      if (selectedVendor?.id === kycVendor.id) setSelected(updated);

      setKycVendor(null);
      refreshData();
    } catch (err: any) {
      showToast({ title: "Error", description: err.message || "Failed to save progress", tone: "error" });
    }
  }
  
  // Confirm actions
  async function handleConfirm() {
    if (!confirmModal) return;
    const { type, vendor } = confirmModal;
    try {
      if (type === "remove") {
        await deleteVendor(vendor.id);
        showToast({ title: "Removed", description: `${vendor.businessName} has been removed.`, tone: "warning" });
      } else if (type === "ban") {
        await banVendor(vendor.id);
        showToast({ title: "Banned", description: `${vendor.businessName} has been banned.`, tone: "error" });
      } else if (type === "unban") {
        await unbanVendor(vendor.id);
        showToast({ title: "Reactivated", description: `${vendor.businessName} has been unbanned.`, tone: "success" });
      }
      setConfirmModal(null);
      setBanReason("");
      refreshData();
    } catch (err: any) {
      showToast({ title: "Error", description: err.message || "Action failed", tone: "error" });
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="px-6 py-5 space-y-5">

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Vendors",    value: String(total),   sub: "+3 this month",   icon: Handshake,     color: "#8a9e60" },
          { label: "Active Vendors",   value: String(activeCount),      sub: `${total ? Math.round(activeCount / total * 100) : 0}% of total`, icon: CheckCircle, color: "#6e8245" },
          { label: "Pending KYC",      value: String(pendingKyc),       sub: "Needs attention", icon: ShieldCheck,   color: "#c4953a" },
          { label: "Platform Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, sub: "This month", icon: CurrencyDollar, color: "#8a9e60" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
                <Icon size={16} weight="fill" style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-[10px] text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
          <MagnifyingGlass size={15} className="text-gray-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search vendors, owners, cities…"
            className="flex-1 outline-none text-sm text-gray-700 bg-transparent placeholder:text-gray-400" />
        </div>
        <button onClick={() => setShowOnboard(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 shrink-0"
          style={{ backgroundColor: "#8a9e60" }}>
          <Plus size={16} weight="bold" />
          Onboard Vendor
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-200 gap-1">
        {(["all", "active", "pending", "banned"] as const).map(tab => {
          const count = tab === "all" ? total : vendors.filter(v => (v.status as any) === tab).length;
          // Note: Local count is only for items in current page. In a full system, 
          // we'd use metadata from the API for each status.
          return (
            <button key={tab} onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 ${activeTab === tab ? "border-b-2 text-[#8a9e60]" : "text-gray-400 hover:text-gray-600"}`}
              style={activeTab === tab ? { borderColor: "#8a9e60" } : {}}>
              {tab === "all" ? "All Vendors" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={activeTab === tab ? { backgroundColor: "#8a9e60", color: "white" } : { backgroundColor: "#f3f4f6", color: "#9ca3af" }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {["Vendor", "Contact", "Location", "Fields", "Sports", "Status", "KYC", "Revenue", ""].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">No vendors found.</td></tr>
            ) : filtered.map((v, i) => {
              const kc = KYC_CFG[v.kycStatus]; const sc = STATUS_CFG[v.status]; const KycIcon = kc?.icon || WarningCircle;
              return (
                <tr key={v.id} className={`hover:bg-gray-50/50 transition-colors ${i < filtered.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: "#8a9e60" }}>{avatar(v.businessName)}</div>
                      <div><p className="text-xs font-semibold text-gray-800">{v.businessName}</p><p className="text-[10px] text-gray-400 font-mono">{v.id}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><p className="text-xs text-gray-700">{v.ownerFullName}</p><p className="text-[10px] text-gray-400">{v.phone}</p></td>
                  <td className="px-4 py-3"><p className="text-xs text-gray-700">{v.address?.city || '—'}</p><p className="text-[10px] text-gray-400">{v.address?.state || '—'}</p></td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-700 text-center">{v.fields?.length || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(v.sports || []).slice(0, 2).map(s => <span key={s} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${SPORT_COLOR[s] ?? "bg-gray-100 text-gray-600"}`}>{s}</span>)}
                      {(v.sports || []).length > 2 && <span className="text-[10px] text-gray-400">+{(v.sports || []).length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${kc?.cls || "bg-gray-100"}`}>
                      {KycIcon && <KycIcon size={10} weight="fill" />}{kc?.label || v.kycStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                    {(v.revenue ?? 0) > 0 ? `₹${v.revenue?.toLocaleString("en-IN")}` : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(v)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="View"><Eye size={14} /></button>
                      <button onClick={() => openEdit(v)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Edit"><PencilSimple size={14} /></button>
                      <div className="relative">
                        <button onClick={() => setActionMenu(actionMenu === v.id ? null : v.id)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                          <DotsThreeVertical size={14} />
                        </button>
                        {actionMenu === v.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[148px]">
                            {v.status === "banned" ? (
                              <button onClick={() => { setActionMenu(null); setConfirmModal({ type: "unban", vendor: v }); }}
                                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <CheckCircle size={13} className="text-green-500" />Unban
                              </button>
                            ) : (
                              <button onClick={() => { setActionMenu(null); setConfirmModal({ type: "ban", vendor: v }); }}
                                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <XCircle size={13} className="text-amber-500" />Ban
                              </button>
                            )}
                            <button onClick={() => { setActionMenu(null); openKycReview(v); }}
                              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                              <ShieldCheck size={13} className="text-blue-500" />Review KYC
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button onClick={() => { setActionMenu(null); setConfirmModal({ type: "remove", vendor: v }); }}
                              className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 flex items-center gap-2">
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
          </tbody>
        </table>
        <DashboardPagination 
          page={page} 
          total={total} 
          limit={limit} 
          onPageChange={setPage} 
          label="vendors"
        />

      </div>

      {/* Click-away */}
      {actionMenu && <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />}

      {/* ═══════════════════════════════════════════════════════════════════════
          VENDOR DETAIL DRAWER
      ═══════════════════════════════════════════════════════════════════════ */}
      {selectedVendor && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-[480px] bg-white h-full flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between p-6 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: "#8a9e60" }}>{avatar(selectedVendor.businessName)}</div>
                <div>
                  <h2 className="font-bold text-gray-800 text-base">{selectedVendor.businessName}</h2>
                  <p className="text-xs text-gray-400 font-mono">{selectedVendor.id}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_CFG[selectedVendor.status].cls}`}>{STATUS_CFG[selectedVendor.status].label}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${KYC_CFG[selectedVendor.kycStatus]?.cls || "bg-gray-100"}`}>KYC: {KYC_CFG[selectedVendor.kycStatus]?.label || selectedVendor.kycStatus}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1 shrink-0"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <section>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Information</h3>
                <div className="space-y-2.5">
                  {[
                    { icon: UserCircle, label: "Owner", val: selectedVendor.ownerFullName }, 
                    { icon: Envelope, label: "Email", val: selectedVendor.email }, 
                    { icon: Phone, label: "Phone", val: selectedVendor.phone }, 
                    { icon: CalendarBlank, label: "Joined", val: selectedVendor.joinedAt ? new Date(selectedVendor.joinedAt).toLocaleDateString() : '—' }
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded bg-gray-50 flex items-center justify-center shrink-0"><Icon size={14} className="text-gray-400" /></div>
                      <div><p className="text-[10px] text-gray-400">{label}</p><p className="text-xs text-gray-700 font-medium">{val}</p></div>
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Location</h3>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded bg-gray-50 flex items-center justify-center shrink-0 mt-0.5"><MapPin size={14} className="text-gray-400" /></div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">{selectedVendor.address?.houseNumber} {selectedVendor.address?.landmark}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedVendor.address?.city}, {selectedVendor.address?.state} – {selectedVendor.address?.pinCode}</p>
                  </div>
                </div>
              </section>
              <section>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Turf Details</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    { label: "Fields", val: String(selectedVendor.fields?.length || 0), lg: true }, 
                    { label: "Surface", val: selectedVendor.fields?.[0]?.surfaceType || '—', lg: false }, 
                    { label: "Commission", val: `${selectedVendor.commissionPct}%`, lg: false }, 
                    { label: "Payout", val: selectedVendor.payoutCycle, lg: false }
                  ].map(({ label, val, lg }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-3"><p className="text-[10px] text-gray-400 mb-1">{label}</p><p className={`font-semibold text-gray-800 ${lg ? "text-lg" : "text-xs"}`}>{val}</p></div>
                  ))}
                </div>
                <div className="mb-3"><p className="text-[10px] text-gray-400 mb-2">Sports Offered</p><div className="flex flex-wrap gap-1.5">{(selectedVendor.sports || []).map(s => <span key={s} className={`text-[10px] font-medium px-2 py-0.5 rounded ${SPORT_COLOR[s] ?? "bg-gray-100 text-gray-600"}`}>{s}</span>)}</div></div>
                <div><p className="text-[10px] text-gray-400 mb-2">Facilities</p><div className="flex flex-wrap gap-1.5">{(selectedVendor.facilities || []).map(f => <span key={f} className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-600">{f}</span>)}</div></div>
              </section>
              <section>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Financial</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[{ label: "Revenue", val: (selectedVendor.revenue ?? 0) > 0 ? `₹${selectedVendor.revenue?.toLocaleString("en-IN")}` : "—" }, { label: "Commission", val: `${selectedVendor.commissionPct}%` }, { label: "Payout", val: selectedVendor.payoutCycle }].map(({ label, val }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-3"><p className="text-[10px] text-gray-400 mb-1">{label}</p><p className="text-sm font-bold text-gray-800">{val}</p></div>
                  ))}
                </div>
                {selectedVendor.gstNumber && <p className="text-[10px] text-gray-400 mt-2">GST: <span className="font-mono text-gray-600">{selectedVendor.gstNumber}</span></p>}
              </section>
              <section>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">KYC Documents</h3>
                <div className="space-y-1">
                  {KYC_DOCS.map((doc) => {
                    const vVal = selectedVendor.verification?.[doc.key];
                    const s: DocStatus = vVal === true ? "verified" : vVal === false ? "rejected" : "pending";
                    return (
                      <div key={doc.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-2"><FileText size={13} className="text-gray-400" /><span className="text-xs text-gray-600">{doc.label}</span></div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s === "verified" ? "bg-green-50 text-green-700" : s === "rejected" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-400"}`}>{s === "verified" ? "Verified" : s === "rejected" ? "Rejected" : "Pending"}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-2 shrink-0">
              <button onClick={() => openEdit(selectedVendor)} className="flex-1 py-2 text-xs font-semibold border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"><PencilSimple size={13} />Edit</button>
              <button onClick={() => openKycReview(selectedVendor)} className="flex-1 py-2 text-xs font-semibold border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"><ShieldCheck size={13} />KYC Review</button>
              {selectedVendor.status === "banned" ? (
                <button onClick={() => setConfirmModal({ type: "unban", vendor: selectedVendor })} className="flex-1 py-2 text-xs font-semibold rounded-lg text-white flex items-center justify-center gap-1.5" style={{ backgroundColor: "#8a9e60" }}><CheckCircle size={13} />Unban</button>
              ) : (
                <button onClick={() => setConfirmModal({ type: "ban", vendor: selectedVendor })} className="flex-1 py-2 text-xs font-semibold rounded-lg text-white bg-amber-500 flex items-center justify-center gap-1.5"><XCircle size={13} />Ban</button>
              )}
              <button onClick={() => setConfirmModal({ type: "remove", vendor: selectedVendor })} className="py-2 px-3 text-xs font-semibold border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors"><Trash size={14} /></button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          ONBOARD MODAL (centered)
      ═══════════════════════════════════════════════════════════════════════ */}
      {showOnboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

            {/* Modal Header */}
            <div className="px-7 pt-6 pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Onboard New Vendor</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Step {onboardStep} of {STEP_LABELS.length} — {STEP_LABELS[onboardStep - 1]}</p>
                </div>
                <button onClick={closeOnboard} className="text-gray-400 hover:text-gray-600 mt-1"><X size={20} /></button>
              </div>
              {/* Step indicator */}
              <div className="flex items-center">
                {STEP_LABELS.map((label, i) => {
                  const n = i + 1; const done = n < onboardStep; const active = n === onboardStep;
                  return (
                    <div key={n} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all"
                          style={{ backgroundColor: done || active ? "#8a9e60" : "#f3f4f6", color: done || active ? "white" : "#9ca3af" }}>
                          {done ? <CheckCircle size={15} weight="fill" /> : n}
                        </div>
                        <span className="text-[9px] font-semibold whitespace-nowrap" style={{ color: active ? "#8a9e60" : "#9ca3af" }}>{label}</span>
                      </div>
                      {i < STEP_LABELS.length - 1 && <div className="flex-1 h-px mb-4 mx-1.5 transition-all" style={{ backgroundColor: done ? "#8a9e60" : "#e5e7eb" }} />}
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
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Business Name *</label>
                    <input value={formData.businessName} onChange={e => setField("businessName", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" placeholder="e.g. Riaz Sports Complex" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Business Type *</label>
                    <div className="flex gap-3">
                      {["individual", "company", "partnership"].map(t => (
                        <button key={t} onClick={() => setField("businessType", t as any)}
                          className="flex-1 py-2.5 rounded-lg border text-xs font-medium capitalize transition-colors"
                          style={formData.businessType === t ? { backgroundColor: "#8a9e60", color: "white", borderColor: "transparent" } : { borderColor: "#e5e7eb", color: "#6b7280" }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {BUSINESS_FIELDS.map(({ key, label, placeholder, type }) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
                        <input type={type} value={formData[key]} onChange={e => setField(key, e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" placeholder={placeholder} />
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Account Credentials</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Login Password *</label>
                        <input type="password" value={formData.password} onChange={e => setField("password", e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" placeholder="Min. 8 characters" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Address Type *</label>
                      <div className="flex gap-3">
                        {["home", "work", "other"].map(t => (
                          <button key={t} onClick={() => setAddressField("type", t as any)}
                            className="flex-1 py-2 rounded-lg border text-xs font-medium capitalize transition-colors"
                            style={formData.address.type === t ? { backgroundColor: "#8a9e60", color: "white", borderColor: "transparent" } : { borderColor: "#e5e7eb", color: "#6b7280" }}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">House / Shop Number</label>
                      <input value={formData.address.houseNumber} onChange={e => setAddressField("houseNumber", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" placeholder="e.g. 402, Building A" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Landmark</label>
                      <input value={formData.address.landmark} onChange={e => setAddressField("landmark", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" placeholder="e.g. Near City Mall" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">City *</label>
                      <input value={formData.address.city} onChange={e => setAddressField("city", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" placeholder="Mumbai" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">State *</label>
                      <select value={formData.address.state} onChange={e => setAddressField("state", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] bg-white">
                        <option value="">Select state</option>
                        {STATES_LIST.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pincode *</label>
                      <input value={formData.address.pinCode} onChange={e => setAddressField("pinCode", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" placeholder="400001" maxLength={6} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Google Maps Link</label>
                      <input value={formData.address.googleMapsLink} onChange={e => setAddressField("googleMapsLink", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" placeholder="Paste maps URL" />
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 3 && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <p className="text-xs text-amber-700 font-medium">Banking details are encrypted and stored securely. Used for vendor payouts only.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {BANK_FIELDS.map(({ key, label, placeholder, mono }) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
                        <input value={formData.bankingDetails[key as keyof typeof formData.bankingDetails]} onChange={e => setBankField(key as any, key === "ifsc" ? e.target.value.toUpperCase() : e.target.value)}
                          className={`w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] ${mono ? "font-mono" : ""}`} placeholder={placeholder} />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Commission % *</label>
                      <div className="relative">
                        <input type="number" min={0} max={30} value={formData.commissionPct} onChange={e => setField("commissionPct", e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" />
                        <Percent size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payout Cycle *</label>
                    <div className="flex gap-3">
                      {["daily", "weekly", "monthly"].map(c => (
                        <button key={c} onClick={() => setField("payoutCycle", c as any)} className="flex-1 py-2.5 rounded-lg border text-xs font-medium capitalize transition-colors"
                          style={formData.payoutCycle === c ? { backgroundColor: "#8a9e60", color: "white", borderColor: "transparent" } : { borderColor: "#e5e7eb", color: "#6b7280" }}>{c}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Upload KYC Documents</h3>
                    <div className="space-y-2.5">
                      {KYC_DOCS.map(({ key, label, hint }) => {
                        const uploaded = !!formData[key as KycDocKey];
                        return (
                          <div key={key} className="border border-dashed border-gray-200 rounded-xl p-3.5 flex items-center justify-between hover:border-[#8a9e60] transition-colors group cursor-pointer">
                            <div><p className="text-xs font-semibold text-gray-700">{label}</p><p className="text-[10px] text-gray-400 mt-0.5">{hint}</p></div>
                            {uploaded ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Uploaded</span>
                                <button onClick={() => setField(key, "")} className="text-gray-300 hover:text-red-400"><X size={12} /></button>
                              </div>
                            ) : (
                              <button onClick={() => setField(key, "uploaded.pdf")}
                                className="flex items-center gap-1 text-[10px] font-medium text-[#8a9e60] border border-[#8a9e60] px-2.5 py-1 rounded-lg transition-colors group-hover:bg-[#8a9e60] group-hover:text-white">
                                <UploadSimple size={11} />Upload
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Review Summary</h3>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                      {[
                        ["Business", formData.businessName || "—"], 
                        ["Type", formData.businessType], 
                        ["Owner", formData.ownerFullName || "—"], 
                        ["Email", formData.email || "—"], 
                        ["Phone", formData.phone || "—"], 
                        ["Location", [formData.address.city, formData.address.state].filter(Boolean).join(", ") || "—"], 
                        ["Bank", formData.bankingDetails.bankName || "—"], 
                        ["Commission", `${formData.commissionPct}%`], 
                        ["Payout", formData.payoutCycle]
                      ].map(([k, val]) => (
                        <div key={k} className="flex items-start justify-between text-xs">
                          <span className="text-gray-400 shrink-0 mr-3">{k}</span>
                          <span className="font-medium text-gray-700 text-right">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-7 py-4 border-t border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
              <button onClick={() => onboardStep > 1 ? setOnboardStep(s => s - 1) : closeOnboard()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-white transition-colors bg-white">
                <ArrowLeft size={15} />{onboardStep === 1 ? "Cancel" : "Back"}
              </button>
              <button onClick={() => onboardStep < 4 ? setOnboardStep(s => s + 1) : submitOnboard()}
                className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#8a9e60" }}>
                {onboardStep === 4 ? "Submit & Onboard" : "Continue"}{onboardStep < 4 && <CaretRight size={15} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          EDIT VENDOR MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {editVendor && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-7 pt-6 pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Vendor</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{editVendor.businessName} · {editVendor.id}</p>
                </div>
                <button onClick={() => { setEditVendor(null); setEditForm(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
              <div className="flex gap-1 border-b border-gray-100 -mb-4">
                {(["basic", "turf", "financial"] as const).map(tab => (
                  <button key={tab} onClick={() => setEditTab(tab)}
                    className={`px-4 py-2 text-xs font-semibold capitalize transition-colors ${editTab === tab ? "border-b-2 text-[#8a9e60]" : "text-gray-400 hover:text-gray-600"}`}
                    style={editTab === tab ? { borderColor: "#8a9e60" } : {}}>
                    {tab === "basic" ? "Basic Info" : tab === "turf" ? "Turf Details" : "Financial"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-7 py-6">

              {editTab === "basic" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: "businessName" as keyof Vendor, label: "Business Name *", placeholder: "Business name" }, 
                      { key: "ownerFullName" as keyof Vendor, label: "Owner Name *", placeholder: "Full name" }, 
                      { key: "email" as keyof Vendor, label: "Email *", placeholder: "email@example.com" }, 
                      { key: "phone" as keyof Vendor, label: "Phone *", placeholder: "+91 XXXXX XXXXX" }, 
                      { key: "gstNumber" as keyof Vendor, label: "GST Number", placeholder: "22AAAAA0000A1Z5" }
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
                        <input value={String(editForm[key] ?? "")} onChange={e => setEditField(key, e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" placeholder={placeholder} />
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Location</h4>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Address Type *</label>
                        <div className="flex gap-3">
                          {["home", "work", "other"].map(t => (
                            <button key={t} onClick={() => setEditAddressField("type", t as any)}
                              className="flex-1 py-1.5 rounded-lg border text-xs font-medium capitalize transition-colors"
                              style={editForm.address.type === t ? { backgroundColor: "#8a9e60", color: "white", borderColor: "transparent" } : { borderColor: "#e5e7eb", color: "#6b7280" }}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">House / Shop Number</label>
                        <input value={editForm.address.houseNumber ?? ""} onChange={e => setEditAddressField("houseNumber", e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" placeholder="402, Building A" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Landmark</label>
                        <input value={editForm.address.landmark ?? ""} onChange={e => setEditAddressField("landmark", e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" placeholder="Near City Mall" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">City *</label>
                        <input value={editForm.address.city} onChange={e => setEditAddressField("city", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">State *</label>
                        <select value={editForm.address.state} onChange={e => setEditAddressField("state", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] bg-white">
                          {STATES_LIST.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pincode *</label>
                        <input value={editForm.address.pinCode} onChange={e => setEditAddressField("pinCode", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" maxLength={6} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editTab === "turf" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Number of Fields</label>
                      <div className="w-full px-3 py-2.5 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-lg">{editForm.fields?.length || 0}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Surface Type</label>
                      <div className="w-full px-3 py-2.5 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-lg">{editForm.fields?.[0]?.surfaceType || '—'}</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sports Offered</label>
                    <div className="flex flex-wrap gap-2">
                      {(editForm.sports || []).map(s => <span key={s} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">{s}</span>)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Facilities</label>
                    <div className="flex flex-wrap gap-2">
                      {(editForm.facilities || []).map(f => <span key={f} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">{f}</span>)}
                    </div>
                  </div>
                </div>
              )}

              {editTab === "financial" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Commission % *</label>
                      <div className="relative">
                        <input type="number" min={0} max={30} value={editForm.commissionPct} onChange={e => setEditField("commissionPct", e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" />
                        <Percent size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">GST Number</label>
                      <input value={editForm.gstNumber} onChange={e => setEditField("gstNumber", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 font-mono focus:outline-none focus:border-[#8a9e60]" placeholder="22AAAAA0000A1Z5" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payout Cycle *</label>
                    <div className="flex gap-3">
                      {["daily", "weekly", "monthly"].map(c => (
                        <button key={c} onClick={() => setEditField("payoutCycle", c)} className="flex-1 py-2.5 rounded-lg border text-xs font-medium capitalize transition-colors"
                          style={editForm.payoutCycle === c ? { backgroundColor: "#8a9e60", color: "white", borderColor: "transparent" } : { borderColor: "#e5e7eb", color: "#6b7280" }}>{c}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Vendor Status</label>
                    <div className="flex gap-3">
                      {(["active", "pending", "banned"] as VendorStatus[]).map(s => (
                        <button key={s} onClick={() => setEditField("status", s)} className="flex-1 py-2.5 rounded-lg border text-xs font-medium capitalize transition-colors"
                          style={editForm.status === s ? { backgroundColor: s === "active" ? "#8a9e60" : s === "banned" ? "#b05252" : "#c4953a", color: "white", borderColor: "transparent" } : { borderColor: "#e5e7eb", color: "#6b7280" }}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-7 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0 bg-gray-50/50">
              <button onClick={() => { setEditVendor(null); setEditForm(null); }} className="px-4 py-2 text-sm font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-white transition-colors bg-white">Cancel</button>
              <button onClick={saveEdit} className="px-6 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: "#8a9e60" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          KYC REVIEW MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {kycVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: "#8a9e60" }}>{avatar(kycVendor.businessName)}</div>
                  <div>
                    <h2 className="font-bold text-gray-900">KYC Review</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{kycVendor.businessName} · {kycVendor.id}</p>
                  </div>
                </div>
                <button onClick={() => setKycVendor(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
            </div>
            <div className="px-6 py-5 space-y-3 flex-1 overflow-y-auto">
              <p className="text-xs text-gray-500">Review each document individually, then approve or reject the vendor&apos;s KYC.</p>
              {KYC_DOCS.map(({ key, label, hint }) => {
                const s = kycDocs[key] ?? "pending";
                return (
                  <div key={key} className={`rounded-xl border p-4 transition-colors ${s === "verified" ? "border-green-200 bg-green-50/40" : s === "rejected" ? "border-red-200 bg-red-50/30" : "border-gray-200"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <FileText size={16} className={`mt-0.5 shrink-0 ${s === "verified" ? "text-green-500" : s === "rejected" ? "text-red-400" : "text-gray-400"}`} />
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{label}</p>
                          <p className="text-[10px] text-gray-400">{hint}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s === "verified" ? "bg-green-100 text-green-700" : s === "rejected" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                          {s === "verified" ? "Verified" : s === "rejected" ? "Rejected" : "Pending"}
                        </span>
                        <button onClick={() => setDocStatus(key, "verified")}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs font-medium transition-colors ${s === "verified" ? "border-green-400 bg-green-500 text-white" : "border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-500"}`} title="Approve">
                          <CheckCircle size={13} weight="fill" />
                        </button>
                        <button onClick={() => setDocStatus(key, "rejected")}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs font-medium transition-colors ${s === "rejected" ? "border-red-400 bg-red-500 text-white" : "border-gray-200 text-gray-400 hover:border-red-400 hover:text-red-500"}`} title="Reject">
                          <XCircle size={13} weight="fill" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap gap-2 shrink-0 bg-gray-50/50">
              <button onClick={saveKycReview} className="flex-1 min-w-[120px] py-2 text-[10px] font-bold border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"><FileText size={13} />Save Review</button>
              <button onClick={applyKycReject} className="flex-1 min-w-[120px] py-2 text-[10px] font-bold border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"><XCircle size={13} />Reject KYC</button>
              <button onClick={applyKycResubmit} className="flex-1 min-w-[120px] py-2 text-[10px] font-bold border border-amber-200 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center gap-1.5"><WarningCircle size={13} />Request Resubmit</button>
              <button 
                onClick={applyKycVerify} 
                className={`flex-1 min-w-[120px] py-2 text-[10px] font-bold rounded-lg text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5 ${!KYC_DOCS.every(d => kycDocs[d.key] === "verified") ? "opacity-50 pointer-events-none" : ""}`} 
                style={{ backgroundColor: "#8a9e60" }}
              >
                <CheckCircle size={13} />Verify KYC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          CONFIRM MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                {confirmModal.type === "remove" ? <Trash size={24} className="text-red-500" /> : <WarningCircle size={24} className="text-amber-500" />}
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">
                {confirmModal.type === "remove" ? "Remove Vendor?" : confirmModal.type === "ban" ? "Ban Vendor?" : "Unban Vendor?"}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {confirmModal.type === "remove"
                  ? `${confirmModal.vendor.businessName} will be permanently removed from the platform. This action cannot be undone.`
                  : confirmModal.type === "ban"
                  ? `${confirmModal.vendor.businessName} will be banned and their listings will go offline.`
                  : `${confirmModal.vendor.businessName} will be unbanned and their listings will go live.`}
              </p>
              {confirmModal.type === "ban" && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Reason (optional)</label>
                  <textarea value={banReason} onChange={e => setBanReason(e.target.value)} rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] resize-none"
                    placeholder="e.g. Policy violation, payment dispute…" />
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => { setConfirmModal(null); setBanReason(""); }} className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleConfirm}
                className={`flex-1 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 ${confirmModal.type === "remove" ? "bg-red-500" : confirmModal.type === "ban" ? "bg-amber-500" : ""}`}
                style={confirmModal.type === "unban" ? { backgroundColor: "#8a9e60" } : {}}>
                {confirmModal.type === "remove" ? "Yes, Remove" : confirmModal.type === "ban" ? "Ban" : "Unban"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
