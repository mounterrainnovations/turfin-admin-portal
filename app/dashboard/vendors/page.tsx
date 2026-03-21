"use client";

import {
  Handshake, MapPin, Phone, Envelope, ShieldCheck,
  CheckCircle, XCircle, WarningCircle, ClockCountdown,
  Plus, MagnifyingGlass, DotsThreeVertical, X,
  UploadSimple, UserCircle, Eye, PencilSimple, Trash,
  FileText, ArrowLeft, Percent, CalendarBlank, CaretRight,
  CurrencyDollar,
} from "@phosphor-icons/react";
import { useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
type KycStatus = "verified" | "in-review" | "pending" | "not-started" | "rejected";
type VendorStatus = "active" | "pending" | "suspended";
type DocStatus = "pending" | "verified" | "rejected";

interface Vendor {
  id: string; name: string; owner: string; email: string; phone: string;
  city: string; state: string; address: string; pincode: string;
  fields: number; sports: string[]; status: VendorStatus; kyc: KycStatus;
  revenue: number; joined: string; gst: string; commission: number;
  surface: string; payoutCycle: string; facilities: string[];
  weekdayHours: string; weekendHours: string;
}

// ── Seed Data ──────────────────────────────────────────────────────────────────
const SEED: Vendor[] = [
  { id: "VND-001", name: "Riaz Sports Complex", owner: "Mohammed Riaz", email: "riaz@example.com", phone: "+91 98765 43210", city: "Mumbai", state: "Maharashtra", address: "42 Sports Lane, Andheri West", pincode: "400053", fields: 4, sports: ["Football", "Cricket"], status: "active", kyc: "verified", revenue: 48200, joined: "Jan 2025", gst: "27AAABR1234C1Z5", commission: 10, surface: "Artificial Turf", payoutCycle: "Weekly", facilities: ["Parking", "Floodlights", "Changing Rooms", "Cafeteria"], weekdayHours: "6:00 AM – 10:00 PM", weekendHours: "5:00 AM – 11:00 PM" },
  { id: "VND-002", name: "GreenZone FC", owner: "Priya Sharma", email: "greenzone@example.com", phone: "+91 87654 32109", city: "Pune", state: "Maharashtra", address: "18 FC Road, Shivajinagar", pincode: "411005", fields: 2, sports: ["Football", "Badminton"], status: "active", kyc: "in-review", revenue: 22100, joined: "Feb 2025", gst: "27AAABG5678D2Z6", commission: 10, surface: "Natural Grass", payoutCycle: "Monthly", facilities: ["Parking", "Changing Rooms"], weekdayHours: "7:00 AM – 9:00 PM", weekendHours: "6:00 AM – 10:00 PM" },
  { id: "VND-003", name: "Arena Sports Hub", owner: "Rajesh Kumar", email: "arena@example.com", phone: "+91 76543 21098", city: "Bangalore", state: "Karnataka", address: "5 Koramangala 4th Block", pincode: "560034", fields: 6, sports: ["Cricket", "Basketball", "Tennis"], status: "active", kyc: "verified", revenue: 71500, joined: "Dec 2024", gst: "29AAABA9012E3Z7", commission: 12, surface: "Hard Court", payoutCycle: "Weekly", facilities: ["Parking", "Floodlights", "Cafeteria", "Equipment Rental", "First Aid"], weekdayHours: "6:00 AM – 11:00 PM", weekendHours: "5:00 AM – 11:00 PM" },
  { id: "VND-004", name: "Premier Grounds", owner: "Anita Patel", email: "premier@example.com", phone: "+91 65432 10987", city: "Ahmedabad", state: "Gujarat", address: "78 Vastrapur, SG Road", pincode: "380015", fields: 3, sports: ["Football", "Cricket"], status: "pending", kyc: "pending", revenue: 0, joined: "Mar 2025", gst: "", commission: 10, surface: "Artificial Turf", payoutCycle: "Weekly", facilities: ["Parking", "Changing Rooms", "Floodlights"], weekdayHours: "7:00 AM – 10:00 PM", weekendHours: "6:00 AM – 10:00 PM" },
  { id: "VND-005", name: "CityTurf Ltd", owner: "Vikram Singh", email: "cityturf@example.com", phone: "+91 54321 09876", city: "Delhi", state: "Delhi", address: "23 Vasant Kunj Sector B", pincode: "110070", fields: 5, sports: ["Football", "Hockey"], status: "suspended", kyc: "rejected", revenue: 12800, joined: "Nov 2024", gst: "07AAABC3456F4Z8", commission: 10, surface: "Natural Grass", payoutCycle: "Monthly", facilities: ["Parking", "Floodlights"], weekdayHours: "6:00 AM – 10:00 PM", weekendHours: "6:00 AM – 10:00 PM" },
  { id: "VND-006", name: "ProFields Co.", owner: "Sneha Nair", email: "profields@example.com", phone: "+91 43210 98765", city: "Chennai", state: "Tamil Nadu", address: "11 Anna Nagar East", pincode: "600102", fields: 3, sports: ["Badminton", "Tennis"], status: "active", kyc: "verified", revenue: 31700, joined: "Jan 2025", gst: "33AAABP7890G5Z9", commission: 10, surface: "Hard Court", payoutCycle: "Weekly", facilities: ["Changing Rooms", "Equipment Rental", "WiFi"], weekdayHours: "6:00 AM – 10:00 PM", weekendHours: "6:00 AM – 11:00 PM" },
  { id: "VND-007", name: "Sunrise Turfs", owner: "Arun Mehta", email: "sunrise@example.com", phone: "+91 32109 87654", city: "Hyderabad", state: "Telangana", address: "34 Jubilee Hills Road No. 45", pincode: "500033", fields: 2, sports: ["Cricket", "Football"], status: "active", kyc: "in-review", revenue: 18900, joined: "Feb 2025", gst: "", commission: 10, surface: "Artificial Turf", payoutCycle: "Monthly", facilities: ["Parking", "CCTV"], weekdayHours: "6:00 AM – 10:00 PM", weekendHours: "5:00 AM – 11:00 PM" },
  { id: "VND-008", name: "Elite Sports Arena", owner: "Kavita Reddy", email: "elite@example.com", phone: "+91 21098 76543", city: "Kolkata", state: "West Bengal", address: "56 Salt Lake Sector V", pincode: "700091", fields: 4, sports: ["Football", "Basketball"], status: "pending", kyc: "not-started", revenue: 0, joined: "Mar 2025", gst: "", commission: 10, surface: "Natural Grass", payoutCycle: "Weekly", facilities: ["Parking", "Changing Rooms"], weekdayHours: "7:00 AM – 9:00 PM", weekendHours: "6:00 AM – 10:00 PM" },
];

// ── Config ─────────────────────────────────────────────────────────────────────
const SPORTS_LIST    = ["Football", "Cricket", "Tennis", "Badminton", "Basketball", "Hockey", "Volleyball", "Kabaddi"];
const FACILITIES_LIST= ["Parking", "Floodlights", "Changing Rooms", "Cafeteria", "Equipment Rental", "First Aid", "WiFi", "CCTV"];
const SURFACE_LIST   = ["Natural Grass", "Artificial Turf", "Hard Court", "Clay"];
const STATES_LIST    = ["Maharashtra", "Karnataka", "Delhi", "Gujarat", "Tamil Nadu", "Telangana", "West Bengal", "Rajasthan", "Uttar Pradesh", "Punjab"];
const STEP_LABELS    = ["Business Info", "Location", "Turf Details", "Banking", "KYC & Review"];
const KYC_DOCS = [
  { key: "idProof",       label: "Identity Proof",        hint: "Aadhaar / Passport / Driving License" },
  { key: "addressProof",  label: "Address Proof",         hint: "Utility bill / Bank statement" },
  { key: "businessReg",   label: "Business Registration", hint: "Incorporation cert / Partnership deed" },
  { key: "gstCert",       label: "GST Certificate",       hint: "If GST registered" },
  { key: "bankStatement", label: "Cancelled Cheque",      hint: "For bank account verification" },
];

const kycCfg: Record<KycStatus, { label: string; cls: string; icon: React.ElementType; dot: string }> = {
  "verified":    { label: "Verified",    cls: "bg-green-50 text-green-700", icon: CheckCircle,    dot: "bg-green-500"  },
  "in-review":   { label: "In Review",   cls: "bg-amber-50 text-amber-700", icon: ClockCountdown, dot: "bg-amber-400"  },
  "pending":     { label: "Pending",     cls: "bg-gray-100 text-gray-500",  icon: WarningCircle,  dot: "bg-gray-400"   },
  "not-started": { label: "Not Started", cls: "bg-gray-50 text-gray-400",   icon: FileText,       dot: "bg-gray-300"   },
  "rejected":    { label: "Rejected",    cls: "bg-red-50 text-red-600",     icon: XCircle,        dot: "bg-red-500"    },
};
const statusCfg: Record<VendorStatus, { label: string; cls: string; dot: string }> = {
  "active":    { label: "Active",    cls: "bg-green-50 text-green-700", dot: "bg-green-500" },
  "pending":   { label: "Pending",   cls: "bg-amber-50 text-amber-700", dot: "bg-amber-400" },
  "suspended": { label: "Suspended", cls: "bg-red-50 text-red-600",     dot: "bg-red-500"   },
};
const sportColor: Record<string, string> = {
  Football: "bg-blue-50 text-blue-600", Cricket: "bg-orange-50 text-orange-600",
  Tennis: "bg-yellow-50 text-yellow-700", Badminton: "bg-purple-50 text-purple-600",
  Basketball: "bg-red-50 text-red-600", Hockey: "bg-cyan-50 text-cyan-700",
  Volleyball: "bg-pink-50 text-pink-600", Kabaddi: "bg-lime-50 text-lime-700",
};

const INIT_FORM = {
  businessName: "", businessType: "individual", ownerName: "",
  email: "", phone: "", whatsapp: "", gst: "", regNo: "",
  address1: "", address2: "", city: "", state: "", pincode: "", mapsLink: "",
  fieldCount: "1", sports: [] as string[], weekdayFrom: "06:00", weekdayTo: "22:00",
  weekendFrom: "06:00", weekendTo: "23:00", facilities: [] as string[], surface: "Artificial Turf",
  bankName: "", accountHolder: "", accountNo: "", ifsc: "", upi: "",
  payoutCycle: "weekly", commission: "10",
  idProof: "", addressProof: "", businessReg: "", gstCert: "", bankStatement: "",
};

function avatar(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function VendorsPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [vendors, setVendors]         = useState<Vendor[]>([...SEED]);
  const [search, setSearch]           = useState("");
  const [activeTab, setActiveTab]     = useState<"all" | VendorStatus>("all");
  const [selectedVendor, setSelected] = useState<Vendor | null>(null);
  const [actionMenu, setActionMenu]   = useState<string | null>(null);

  // Onboard modal
  const [showOnboard, setShowOnboard] = useState(false);
  const [onboardStep, setOnboardStep] = useState(1);
  const [formData, setFormData]       = useState({ ...INIT_FORM });

  // Edit modal
  const [editVendor, setEditVendor]   = useState<Vendor | null>(null);
  const [editForm, setEditForm]       = useState<Vendor | null>(null);
  const [editTab, setEditTab]         = useState<"basic" | "turf" | "financial">("basic");

  // KYC review modal
  const [kycVendor, setKycVendor]     = useState<Vendor | null>(null);
  const [kycDocs, setKycDocs]         = useState<Record<string, DocStatus>>({});

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState<{ type: "suspend" | "reactivate" | "remove"; vendor: Vendor } | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  // Toast
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = vendors.filter(v => {
    const matchTab = activeTab === "all" || v.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch = !q || v.name.toLowerCase().includes(q) || v.owner.toLowerCase().includes(q)
      || v.city.toLowerCase().includes(q) || v.id.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const totalRevenue = vendors.reduce((s, v) => s + v.revenue, 0);
  const activeCount  = vendors.filter(v => v.status === "active").length;
  const pendingKyc   = vendors.filter(v => ["pending", "in-review", "not-started"].includes(v.kyc)).length;

  // ── Helpers ────────────────────────────────────────────────────────────────
  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  // Onboard form
  const setField = (key: string, val: unknown) => setFormData(p => ({ ...p, [key]: val }));
  const toggleArr = (key: "sports" | "facilities", val: string) =>
    setFormData(p => {
      const arr = p[key] as string[];
      return { ...p, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  const closeOnboard = () => { setShowOnboard(false); setOnboardStep(1); setFormData({ ...INIT_FORM }); };

  // Edit
  function openEdit(v: Vendor) {
    setEditVendor(v);
    setEditForm({ ...v });
    setEditTab("basic");
  }
  function setEditField(key: keyof Vendor, val: unknown) {
    setEditForm(p => p ? { ...p, [key]: val } : p);
  }
  function toggleEditArr(key: "sports" | "facilities", val: string) {
    setEditForm(p => {
      if (!p) return p;
      const arr = p[key] as string[];
      return { ...p, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  }
  function saveEdit() {
    if (!editVendor || !editForm) return;
    setVendors(vs => vs.map(x => x.id === editVendor.id ? { ...editForm } : x));
    if (selectedVendor?.id === editVendor.id) setSelected({ ...editForm });
    showToast(`${editForm.name} updated successfully.`);
    setEditVendor(null);
    setEditForm(null);
  }

  // KYC
  function openKycReview(v: Vendor) {
    setKycVendor(v);
    const init: Record<string, DocStatus> = {};
    KYC_DOCS.forEach((d, i) => {
      init[d.key] = v.kyc === "verified" ? "verified"
        : v.kyc === "rejected" ? (i === 0 ? "verified" : "rejected")
        : "pending";
    });
    setKycDocs(init);
  }
  function setDocStatus(key: string, s: DocStatus) {
    setKycDocs(p => ({ ...p, [key]: s }));
  }
  function applyKycVerify() {
    if (!kycVendor) return;
    const newStatus: KycStatus = "verified";
    setVendors(vs => vs.map(x => x.id === kycVendor.id ? { ...x, kyc: newStatus } : x));
    if (selectedVendor?.id === kycVendor.id) setSelected(p => p ? { ...p, kyc: newStatus } : p);
    showToast(`${kycVendor.name} KYC verified.`);
    setKycVendor(null);
  }
  function applyKycReject() {
    if (!kycVendor) return;
    const newStatus: KycStatus = "rejected";
    setVendors(vs => vs.map(x => x.id === kycVendor.id ? { ...x, kyc: newStatus } : x));
    if (selectedVendor?.id === kycVendor.id) setSelected(p => p ? { ...p, kyc: newStatus } : p);
    showToast(`${kycVendor.name} KYC rejected.`, false);
    setKycVendor(null);
  }
  function applyKycResubmit() {
    if (!kycVendor) return;
    const newStatus: KycStatus = "pending";
    setVendors(vs => vs.map(x => x.id === kycVendor.id ? { ...x, kyc: newStatus } : x));
    if (selectedVendor?.id === kycVendor.id) setSelected(p => p ? { ...p, kyc: newStatus } : p);
    showToast(`Resubmission requested from ${kycVendor.name}.`);
    setKycVendor(null);
  }

  // Confirm actions
  function handleConfirm() {
    if (!confirmModal) return;
    const { type, vendor } = confirmModal;
    if (type === "remove") {
      setVendors(vs => vs.filter(x => x.id !== vendor.id));
      if (selectedVendor?.id === vendor.id) setSelected(null);
      showToast(`${vendor.name} has been removed.`, false);
    } else if (type === "suspend") {
      setVendors(vs => vs.map(x => x.id === vendor.id ? { ...x, status: "suspended" } : x));
      if (selectedVendor?.id === vendor.id) setSelected(p => p ? { ...p, status: "suspended" } : p);
      showToast(`${vendor.name} has been suspended.`, false);
    } else if (type === "reactivate") {
      setVendors(vs => vs.map(x => x.id === vendor.id ? { ...x, status: "active" } : x));
      if (selectedVendor?.id === vendor.id) setSelected(p => p ? { ...p, status: "active" } : p);
      showToast(`${vendor.name} has been reactivated.`);
    }
    setConfirmModal(null);
    setSuspendReason("");
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="px-6 py-5 space-y-5">

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Vendors",    value: String(vendors.length),   sub: "+3 this month",   icon: Handshake,     color: "#8a9e60" },
          { label: "Active Vendors",   value: String(activeCount),      sub: `${vendors.length ? Math.round(activeCount / vendors.length * 100) : 0}% of total`, icon: CheckCircle, color: "#6e8245" },
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
        {(["all", "active", "pending", "suspended"] as const).map(tab => {
          const count = tab === "all" ? vendors.length : vendors.filter(v => v.status === tab).length;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
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
              const kc = kycCfg[v.kyc]; const sc = statusCfg[v.status]; const KycIcon = kc.icon;
              return (
                <tr key={v.id} className={`hover:bg-gray-50/50 transition-colors ${i < filtered.length - 1 ? "border-b border-gray-50" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: "#8a9e60" }}>{avatar(v.name)}</div>
                      <div><p className="text-xs font-semibold text-gray-800">{v.name}</p><p className="text-[10px] text-gray-400 font-mono">{v.id}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><p className="text-xs text-gray-700">{v.owner}</p><p className="text-[10px] text-gray-400">{v.phone}</p></td>
                  <td className="px-4 py-3"><p className="text-xs text-gray-700">{v.city}</p><p className="text-[10px] text-gray-400">{v.state}</p></td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-700 text-center">{v.fields}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {v.sports.slice(0, 2).map(s => <span key={s} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sportColor[s] ?? "bg-gray-100 text-gray-600"}`}>{s}</span>)}
                      {v.sports.length > 2 && <span className="text-[10px] text-gray-400">+{v.sports.length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${kc.cls}`}>
                      <KycIcon size={10} weight="fill" />{kc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                    {v.revenue > 0 ? `₹${v.revenue.toLocaleString("en-IN")}` : <span className="text-gray-300">—</span>}
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
                            {v.status === "suspended" ? (
                              <button onClick={() => { setActionMenu(null); setConfirmModal({ type: "reactivate", vendor: v }); }}
                                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <CheckCircle size={13} className="text-green-500" />Reactivate
                              </button>
                            ) : (
                              <button onClick={() => { setActionMenu(null); setConfirmModal({ type: "suspend", vendor: v }); }}
                                className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <XCircle size={13} className="text-amber-500" />Suspend
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-400">Showing {filtered.length} of {vendors.length} vendors</p>
          <div className="flex gap-1">
            {[1, 2, 3].map(p => (
              <button key={p} className="w-7 h-7 text-xs rounded font-medium transition-colors"
                style={p === 1 ? { backgroundColor: "#8a9e60", color: "white" } : { color: "#9ca3af" }}>{p}</button>
            ))}
          </div>
        </div>
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
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: "#8a9e60" }}>{avatar(selectedVendor.name)}</div>
                <div>
                  <h2 className="font-bold text-gray-800 text-base">{selectedVendor.name}</h2>
                  <p className="text-xs text-gray-400 font-mono">{selectedVendor.id}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusCfg[selectedVendor.status].cls}`}>{statusCfg[selectedVendor.status].label}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${kycCfg[selectedVendor.kyc].cls}`}>KYC: {kycCfg[selectedVendor.kyc].label}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1 shrink-0"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <section>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Information</h3>
                <div className="space-y-2.5">
                  {[{ icon: UserCircle, label: "Owner", val: selectedVendor.owner }, { icon: Envelope, label: "Email", val: selectedVendor.email }, { icon: Phone, label: "Phone", val: selectedVendor.phone }, { icon: CalendarBlank, label: "Joined", val: selectedVendor.joined }].map(({ icon: Icon, label, val }) => (
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
                  <div><p className="text-xs font-medium text-gray-700">{selectedVendor.address}</p><p className="text-xs text-gray-500 mt-0.5">{selectedVendor.city}, {selectedVendor.state} – {selectedVendor.pincode}</p></div>
                </div>
              </section>
              <section>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Turf Details</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[{ label: "Fields", val: String(selectedVendor.fields), lg: true }, { label: "Surface", val: selectedVendor.surface, lg: false }, { label: "Weekdays", val: selectedVendor.weekdayHours, lg: false }, { label: "Weekends", val: selectedVendor.weekendHours, lg: false }].map(({ label, val, lg }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-3"><p className="text-[10px] text-gray-400 mb-1">{label}</p><p className={`font-semibold text-gray-800 ${lg ? "text-lg" : "text-xs"}`}>{val}</p></div>
                  ))}
                </div>
                <div className="mb-3"><p className="text-[10px] text-gray-400 mb-2">Sports Offered</p><div className="flex flex-wrap gap-1.5">{selectedVendor.sports.map(s => <span key={s} className={`text-[10px] font-medium px-2 py-0.5 rounded ${sportColor[s] ?? "bg-gray-100 text-gray-600"}`}>{s}</span>)}</div></div>
                <div><p className="text-[10px] text-gray-400 mb-2">Facilities</p><div className="flex flex-wrap gap-1.5">{selectedVendor.facilities.map(f => <span key={f} className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-600">{f}</span>)}</div></div>
              </section>
              <section>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Financial</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[{ label: "Revenue", val: selectedVendor.revenue > 0 ? `₹${selectedVendor.revenue.toLocaleString("en-IN")}` : "—" }, { label: "Commission", val: `${selectedVendor.commission}%` }, { label: "Payout", val: selectedVendor.payoutCycle }].map(({ label, val }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-3"><p className="text-[10px] text-gray-400 mb-1">{label}</p><p className="text-sm font-bold text-gray-800">{val}</p></div>
                  ))}
                </div>
                {selectedVendor.gst && <p className="text-[10px] text-gray-400 mt-2">GST: <span className="font-mono text-gray-600">{selectedVendor.gst}</span></p>}
              </section>
              <section>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">KYC Documents</h3>
                <div className="space-y-1">
                  {KYC_DOCS.map((doc, i) => {
                    const statuses = selectedVendor.kyc === "verified" ? (["verified","verified","verified","verified","verified"] as DocStatus[]) : selectedVendor.kyc === "rejected" ? (["verified","rejected","pending","pending","pending"] as DocStatus[]) : (["verified","pending","pending","pending","pending"] as DocStatus[]);
                    const s = statuses[i];
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
              {selectedVendor.status === "suspended" ? (
                <button onClick={() => setConfirmModal({ type: "reactivate", vendor: selectedVendor })} className="flex-1 py-2 text-xs font-semibold rounded-lg text-white flex items-center justify-center gap-1.5" style={{ backgroundColor: "#8a9e60" }}><CheckCircle size={13} />Reactivate</button>
              ) : (
                <button onClick={() => setConfirmModal({ type: "suspend", vendor: selectedVendor })} className="flex-1 py-2 text-xs font-semibold rounded-lg text-white bg-amber-500 flex items-center justify-center gap-1.5"><XCircle size={13} />Suspend</button>
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
                  <p className="text-xs text-gray-400 mt-0.5">Step {onboardStep} of 5 — {STEP_LABELS[onboardStep - 1]}</p>
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
                        <button key={t} onClick={() => setField("businessType", t)}
                          className="flex-1 py-2.5 rounded-lg border text-xs font-medium capitalize transition-colors"
                          style={formData.businessType === t ? { backgroundColor: "#8a9e60", color: "white", borderColor: "transparent" } : { borderColor: "#e5e7eb", color: "#6b7280" }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ key: "ownerName", label: "Owner Full Name *", placeholder: "Full name", type: "text" }, { key: "email", label: "Email *", placeholder: "owner@email.com", type: "email" }, { key: "phone", label: "Phone *", placeholder: "+91 XXXXX XXXXX", type: "text" }, { key: "whatsapp", label: "WhatsApp", placeholder: "+91 XXXXX XXXXX", type: "text" }, { key: "gst", label: "GST Number", placeholder: "22AAAAA0000A1Z5", type: "text" }, { key: "regNo", label: "Business Reg. No.", placeholder: "Optional", type: "text" }].map(({ key, label, placeholder, type }) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
                        <input type={type} value={(formData as Record<string, string>)[key]} onChange={e => setField(key, e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" placeholder={placeholder} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {onboardStep === 2 && (
                <div className="space-y-4">
                  {[{ key: "address1", label: "Address Line 1 *", placeholder: "Building, Street" }, { key: "address2", label: "Address Line 2", placeholder: "Landmark, Area (optional)" }].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
                      <input value={(formData as Record<string, string>)[key]} onChange={e => setField(key, e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" placeholder={placeholder} />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">City *</label>
                      <input value={formData.city} onChange={e => setField("city", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" placeholder="Mumbai" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">State *</label>
                      <select value={formData.state} onChange={e => setField("state", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] bg-white">
                        <option value="">Select state</option>
                        {STATES_LIST.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pincode *</label>
                      <input value={formData.pincode} onChange={e => setField("pincode", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" placeholder="400001" maxLength={6} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Google Maps Link</label>
                      <input value={formData.mapsLink} onChange={e => setField("mapsLink", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" placeholder="Paste maps URL" />
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 3 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Number of Fields *</label>
                      <input type="number" min={1} value={formData.fieldCount} onChange={e => setField("fieldCount", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Surface Type *</label>
                      <select value={formData.surface} onChange={e => setField("surface", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] bg-white">
                        {SURFACE_LIST.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sports Offered *</label>
                    <div className="flex flex-wrap gap-2">
                      {SPORTS_LIST.map(s => {
                        const sel = formData.sports.includes(s);
                        return <button key={s} onClick={() => toggleArr("sports", s)} className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors" style={sel ? { backgroundColor: "#8a9e60", color: "white", borderColor: "transparent" } : { borderColor: "#e5e7eb", color: "#6b7280" }}>{s}</button>;
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Weekday Hours</label>
                      <div className="flex gap-2 items-center">
                        <input type="time" value={formData.weekdayFrom} onChange={e => setField("weekdayFrom", e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#8a9e60]" />
                        <span className="text-gray-400 text-xs shrink-0">to</span>
                        <input type="time" value={formData.weekdayTo} onChange={e => setField("weekdayTo", e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#8a9e60]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Weekend Hours</label>
                      <div className="flex gap-2 items-center">
                        <input type="time" value={formData.weekendFrom} onChange={e => setField("weekendFrom", e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#8a9e60]" />
                        <span className="text-gray-400 text-xs shrink-0">to</span>
                        <input type="time" value={formData.weekendTo} onChange={e => setField("weekendTo", e.target.value)} className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#8a9e60]" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Facilities Available</label>
                    <div className="flex flex-wrap gap-2">
                      {FACILITIES_LIST.map(f => {
                        const sel = formData.facilities.includes(f);
                        return <button key={f} onClick={() => toggleArr("facilities", f)} className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors" style={sel ? { backgroundColor: "#8a9e60", color: "white", borderColor: "transparent" } : { borderColor: "#e5e7eb", color: "#6b7280" }}>{f}</button>;
                      })}
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 4 && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <p className="text-xs text-amber-700 font-medium">Banking details are encrypted and stored securely. Used for vendor payouts only.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ key: "bankName", label: "Bank Name *", placeholder: "HDFC Bank", mono: false }, { key: "accountHolder", label: "Account Holder *", placeholder: "Full name as per bank", mono: false }, { key: "accountNo", label: "Account Number *", placeholder: "XXXXXXXXXXXX", mono: true }, { key: "ifsc", label: "IFSC Code *", placeholder: "HDFC0001234", mono: true }, { key: "upi", label: "UPI ID", placeholder: "name@upi", mono: false }].map(({ key, label, placeholder, mono }) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
                        <input value={(formData as Record<string, string>)[key]} onChange={e => setField(key, key === "ifsc" ? e.target.value.toUpperCase() : e.target.value)}
                          className={`w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] ${mono ? "font-mono" : ""}`} placeholder={placeholder} />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Commission % *</label>
                      <div className="relative">
                        <input type="number" min={0} max={30} value={formData.commission} onChange={e => setField("commission", e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" />
                        <Percent size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payout Cycle *</label>
                    <div className="flex gap-3">
                      {["daily", "weekly", "monthly"].map(c => (
                        <button key={c} onClick={() => setField("payoutCycle", c)} className="flex-1 py-2.5 rounded-lg border text-xs font-medium capitalize transition-colors"
                          style={formData.payoutCycle === c ? { backgroundColor: "#8a9e60", color: "white", borderColor: "transparent" } : { borderColor: "#e5e7eb", color: "#6b7280" }}>{c}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {onboardStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Upload KYC Documents</h3>
                    <div className="space-y-2.5">
                      {KYC_DOCS.map(({ key, label, hint }) => {
                        const uploaded = !!(formData as Record<string, string>)[key];
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
                      {[["Business", formData.businessName || "—"], ["Type", formData.businessType], ["Owner", formData.ownerName || "—"], ["Email", formData.email || "—"], ["Phone", formData.phone || "—"], ["Location", [formData.city, formData.state].filter(Boolean).join(", ") || "—"], ["Fields", formData.fieldCount], ["Sports", formData.sports.join(", ") || "—"], ["Surface", formData.surface], ["Bank", formData.bankName || "—"], ["Commission", `${formData.commission}%`], ["Payout", formData.payoutCycle]].map(([k, val]) => (
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
              <button onClick={() => onboardStep < 5 ? setOnboardStep(s => s + 1) : closeOnboard()}
                className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#8a9e60" }}>
                {onboardStep === 5 ? "Submit & Onboard" : "Continue"}{onboardStep < 5 && <CaretRight size={15} />}
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
                  <p className="text-xs text-gray-400 mt-0.5">{editVendor.name} · {editVendor.id}</p>
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
                    {[{ key: "name" as keyof Vendor, label: "Business Name *", placeholder: "Business name" }, { key: "owner" as keyof Vendor, label: "Owner Name *", placeholder: "Full name" }, { key: "email" as keyof Vendor, label: "Email *", placeholder: "email@example.com" }, { key: "phone" as keyof Vendor, label: "Phone *", placeholder: "+91 XXXXX XXXXX" }, { key: "gst" as keyof Vendor, label: "GST Number", placeholder: "22AAAAA0000A1Z5" }].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
                        <input value={String(editForm[key] ?? "")} onChange={e => setEditField(key, e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" placeholder={placeholder} />
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Location</h4>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Address</label>
                      <input value={editForm.address} onChange={e => setEditField("address", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] mb-3" placeholder="Street, Building" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">City *</label>
                        <input value={editForm.city} onChange={e => setEditField("city", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">State *</label>
                        <select value={editForm.state} onChange={e => setEditField("state", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] bg-white">
                          {STATES_LIST.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pincode *</label>
                        <input value={editForm.pincode} onChange={e => setEditField("pincode", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" maxLength={6} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {editTab === "turf" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Number of Fields *</label>
                      <input type="number" min={1} value={editForm.fields} onChange={e => setEditField("fields", Number(e.target.value))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Surface Type *</label>
                      <select value={editForm.surface} onChange={e => setEditField("surface", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] bg-white">
                        {SURFACE_LIST.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Weekday Hours</label>
                      <input value={editForm.weekdayHours} onChange={e => setEditField("weekdayHours", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" placeholder="6:00 AM – 10:00 PM" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Weekend Hours</label>
                      <input value={editForm.weekendHours} onChange={e => setEditField("weekendHours", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" placeholder="5:00 AM – 11:00 PM" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sports Offered</label>
                    <div className="flex flex-wrap gap-2">
                      {SPORTS_LIST.map(s => {
                        const sel = editForm.sports.includes(s);
                        return <button key={s} onClick={() => toggleEditArr("sports", s)} className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors" style={sel ? { backgroundColor: "#8a9e60", color: "white", borderColor: "transparent" } : { borderColor: "#e5e7eb", color: "#6b7280" }}>{s}</button>;
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Facilities</label>
                    <div className="flex flex-wrap gap-2">
                      {FACILITIES_LIST.map(f => {
                        const sel = editForm.facilities.includes(f);
                        return <button key={f} onClick={() => toggleEditArr("facilities", f)} className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors" style={sel ? { backgroundColor: "#8a9e60", color: "white", borderColor: "transparent" } : { borderColor: "#e5e7eb", color: "#6b7280" }}>{f}</button>;
                      })}
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
                        <input type="number" min={0} max={30} value={editForm.commission} onChange={e => setEditField("commission", Number(e.target.value))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60]" />
                        <Percent size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">GST Number</label>
                      <input value={editForm.gst} onChange={e => setEditField("gst", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 font-mono focus:outline-none focus:border-[#8a9e60]" placeholder="22AAAAA0000A1Z5" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payout Cycle *</label>
                    <div className="flex gap-3">
                      {["Daily", "Weekly", "Monthly"].map(c => (
                        <button key={c} onClick={() => setEditField("payoutCycle", c)} className="flex-1 py-2.5 rounded-lg border text-xs font-medium transition-colors"
                          style={editForm.payoutCycle === c ? { backgroundColor: "#8a9e60", color: "white", borderColor: "transparent" } : { borderColor: "#e5e7eb", color: "#6b7280" }}>{c}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Vendor Status</label>
                    <div className="flex gap-3">
                      {(["active", "pending", "suspended"] as VendorStatus[]).map(s => (
                        <button key={s} onClick={() => setEditField("status", s)} className="flex-1 py-2.5 rounded-lg border text-xs font-medium capitalize transition-colors"
                          style={editForm.status === s ? { backgroundColor: s === "active" ? "#8a9e60" : s === "suspended" ? "#b05252" : "#c4953a", color: "white", borderColor: "transparent" } : { borderColor: "#e5e7eb", color: "#6b7280" }}>{s}</button>
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
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: "#8a9e60" }}>{avatar(kycVendor.name)}</div>
                  <div>
                    <h2 className="font-bold text-gray-900">KYC Review</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{kycVendor.name} · {kycVendor.id}</p>
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
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2 shrink-0 bg-gray-50/50">
              <button onClick={applyKycReject} className="flex-1 py-2 text-xs font-semibold border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"><XCircle size={13} />Reject KYC</button>
              <button onClick={applyKycResubmit} className="flex-1 py-2 text-xs font-semibold border border-amber-200 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center gap-1.5"><WarningCircle size={13} />Request Resubmit</button>
              <button onClick={applyKycVerify} className="flex-1 py-2 text-xs font-semibold rounded-lg text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5" style={{ backgroundColor: "#8a9e60" }}><CheckCircle size={13} />Verify KYC</button>
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
            <div className="p-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmModal.type === "remove" ? "bg-red-100" : confirmModal.type === "suspend" ? "bg-amber-100" : "bg-green-100"}`}>
                {confirmModal.type === "remove" ? <Trash size={22} className="text-red-500" />
                  : confirmModal.type === "suspend" ? <XCircle size={22} className="text-amber-500" />
                  : <CheckCircle size={22} className="text-green-500" />}
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">
                {confirmModal.type === "remove" ? "Remove Vendor?" : confirmModal.type === "suspend" ? "Suspend Vendor?" : "Reactivate Vendor?"}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {confirmModal.type === "remove"
                  ? `${confirmModal.vendor.name} will be permanently removed from the platform. This action cannot be undone.`
                  : confirmModal.type === "suspend"
                  ? `${confirmModal.vendor.name} will be suspended and their listings will go offline.`
                  : `${confirmModal.vendor.name} will be reactivated and their listings will go live.`}
              </p>
              {confirmModal.type === "suspend" && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Reason (optional)</label>
                  <textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)} rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] resize-none"
                    placeholder="e.g. Policy violation, payment dispute…" />
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => { setConfirmModal(null); setSuspendReason(""); }} className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleConfirm}
                className={`flex-1 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 ${confirmModal.type === "remove" ? "bg-red-500" : confirmModal.type === "suspend" ? "bg-amber-500" : ""}`}
                style={confirmModal.type === "reactivate" ? { backgroundColor: "#8a9e60" } : {}}>
                {confirmModal.type === "remove" ? "Yes, Remove" : confirmModal.type === "suspend" ? "Suspend" : "Reactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TOAST
      ═══════════════════════════════════════════════════════════════════════ */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white transition-all"
          style={{ backgroundColor: toast.ok ? "#8a9e60" : "#b05252" }}>
          {toast.ok ? <CheckCircle size={16} weight="fill" /> : <XCircle size={16} weight="fill" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
