"use client";

import {
  MapPin, MagnifyingGlass, CheckCircle, XCircle, ClockCountdown,
  Prohibit, DotsThree, X, Phone, Envelope, CaretDown, Eye,
  ArrowsClockwise, Buildings, Star, Wrench, Funnel,
  CaretLeft, CaretRight, LockSimple, LockSimpleOpen,
} from "@phosphor-icons/react";
import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type FieldStatus = "active" | "inactive" | "pending" | "maintenance" | "suspended";

interface Field {
  id: string;
  name: string;
  sports: string[];
  vendor: { name: string; phone: string; email: string; avatar: string };
  location: { address: string; city: string; zone: string };
  status: FieldStatus;
  pricePerHour: number;
  peakPricePerHour: number;
  capacity: number;
  size: string;
  surface: string;
  rating: number;
  totalReviews: number;
  todayBookings: number;
  totalBookings: number;
  totalRevenue: number;
  amenities: string[];
  operatingHours: string;
  listedAt: string;
  description: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<FieldStatus, { label: string; color: string; dot: string }> = {
  active:      { label: "Active",      color: "bg-green-100 text-green-700", dot: "bg-green-500"  },
  inactive:    { label: "Inactive",    color: "bg-gray-100 text-gray-500",   dot: "bg-gray-400"   },
  pending:     { label: "Pending",     color: "bg-amber-100 text-amber-700", dot: "bg-amber-500"  },
  maintenance: { label: "Maintenance", color: "bg-blue-100 text-blue-600",   dot: "bg-blue-500"   },
  suspended:   { label: "Suspended",   color: "bg-red-100 text-red-600",     dot: "bg-red-500"    },
};

// ─── Sample Data ──────────────────────────────────────────────────────────────
const fields: Field[] = [
  {
    id: "#FL-001", name: "Turf Arena A", sports: ["Football"],
    vendor: { name: "Riaz Turf", phone: "+91 99001 12233", email: "riaz@turfin.com", avatar: "RT" },
    location: { address: "Link Road, Andheri West", city: "Mumbai", zone: "North Zone" },
    status: "active", pricePerHour: 800, peakPricePerHour: 1200, capacity: 14, size: "5-a-side", surface: "Artificial Turf",
    rating: 4.5, totalReviews: 128, todayBookings: 6, totalBookings: 847, totalRevenue: 712000,
    amenities: ["Floodlights", "Parking", "Changing Room", "Drinking Water", "CCTV"],
    operatingHours: "6:00 AM – 11:00 PM", listedAt: "Jan 15, 2025",
    description: "Premium 5-a-side football turf with high-quality artificial grass. Located in the heart of Andheri West with excellent road connectivity and ample parking.",
  },
  {
    id: "#FL-002", name: "Green Zone B", sports: ["Football", "Cricket"],
    vendor: { name: "GreenZone FC", phone: "+91 98123 45678", email: "greenzone@turfin.com", avatar: "GZ" },
    location: { address: "Kalyani Nagar", city: "Pune", zone: "East Zone" },
    status: "active", pricePerHour: 650, peakPricePerHour: 950, capacity: 22, size: "7-a-side", surface: "Natural Grass",
    rating: 4.2, totalReviews: 93, todayBookings: 4, totalBookings: 612, totalRevenue: 435000,
    amenities: ["Floodlights", "Parking", "WiFi", "First Aid"],
    operatingHours: "5:30 AM – 10:00 PM", listedAt: "Mar 3, 2025",
    description: "A versatile natural grass ground suitable for both football and cricket. Popular with corporate teams and weekend leagues.",
  },
  {
    id: "#FL-003", name: "Premier Court", sports: ["Badminton", "Basketball"],
    vendor: { name: "Premier Grounds", phone: "+91 97654 32100", email: "premier@turfin.com", avatar: "PG" },
    location: { address: "Indiranagar, 100 Ft Road", city: "Bangalore", zone: "Central" },
    status: "inactive", pricePerHour: 400, peakPricePerHour: 600, capacity: 8, size: "Standard Court", surface: "Wooden",
    rating: 3.8, totalReviews: 47, todayBookings: 0, totalBookings: 284, totalRevenue: 128000,
    amenities: ["AC", "Drinking Water", "CCTV", "Changing Room"],
    operatingHours: "7:00 AM – 9:00 PM", listedAt: "May 20, 2025",
    description: "Indoor badminton and basketball court with wooden flooring. Currently inactive pending vendor renewal of facility license.",
  },
  {
    id: "#FL-004", name: "CityTurf Main", sports: ["Football"],
    vendor: { name: "CityTurf Ltd", phone: "+91 81000 22334", email: "cityturf@turfin.com", avatar: "CT" },
    location: { address: "Jogeshwari, SV Road", city: "Mumbai", zone: "North Zone" },
    status: "active", pricePerHour: 950, peakPricePerHour: 1400, capacity: 14, size: "5-a-side", surface: "Artificial Turf",
    rating: 4.7, totalReviews: 201, todayBookings: 8, totalBookings: 1240, totalRevenue: 1250000,
    amenities: ["Floodlights", "Parking", "WiFi", "CCTV", "Changing Room", "First Aid"],
    operatingHours: "6:00 AM – 12:00 AM", listedAt: "Oct 5, 2024",
    description: "The most booked turf in North Mumbai. Equipped with premium FIFA-standard artificial turf and state-of-the-art floodlights for night sessions.",
  },
  {
    id: "#FL-005", name: "Open Field D", sports: ["Cricket"],
    vendor: { name: "Arena Sports", phone: "+91 96543 21087", email: "arena@turfin.com", avatar: "AS" },
    location: { address: "College Road", city: "Nashik", zone: "West Zone" },
    status: "maintenance", pricePerHour: 500, peakPricePerHour: 700, capacity: 22, size: "Full Ground", surface: "Natural Grass",
    rating: 3.5, totalReviews: 32, todayBookings: 0, totalBookings: 198, totalRevenue: 98000,
    amenities: ["Parking", "Drinking Water"],
    operatingHours: "6:00 AM – 8:00 PM", listedAt: "Feb 14, 2025",
    description: "Open cricket ground in Nashik. Currently under maintenance for pitch resurfacing. Expected to reopen by end of March 2026.",
  },
  {
    id: "#FL-006", name: "ProField Main", sports: ["Football"],
    vendor: { name: "ProFields Co.", phone: "+91 88000 11200", email: "profields@turfin.com", avatar: "PF" },
    location: { address: "Madhapur, HITEC City", city: "Hyderabad", zone: "West Zone" },
    status: "pending", pricePerHour: 700, peakPricePerHour: 1000, capacity: 14, size: "5-a-side", surface: "Artificial Turf",
    rating: 0, totalReviews: 0, todayBookings: 0, totalBookings: 0, totalRevenue: 0,
    amenities: ["Floodlights", "Parking", "CCTV", "Changing Room"],
    operatingHours: "6:00 AM – 11:00 PM", listedAt: "Mar 18, 2026",
    description: "New listing from ProFields Co. in the HITEC City area. Awaiting admin inspection and approval. Documents submitted and under review.",
  },
  {
    id: "#FL-007", name: "ArenaMax A1", sports: ["Football", "Basketball"],
    vendor: { name: "ArenaMax Sports", phone: "+91 92000 88441", email: "arenamax@turfin.com", avatar: "AM" },
    location: { address: "Dwarka Sector 10", city: "Delhi", zone: "West Zone" },
    status: "active", pricePerHour: 1100, peakPricePerHour: 1600, capacity: 22, size: "7-a-side", surface: "Artificial Turf",
    rating: 4.6, totalReviews: 154, todayBookings: 7, totalBookings: 930, totalRevenue: 1050000,
    amenities: ["Floodlights", "Parking", "WiFi", "CCTV", "Changing Room", "First Aid", "Cafeteria"],
    operatingHours: "5:00 AM – 12:00 AM", listedAt: "Sep 12, 2024",
    description: "Delhi's premier multi-sport arena. Hosts corporate leagues, inter-school tournaments, and weekend community games. Well-maintained and professionally managed.",
  },
  {
    id: "#FL-008", name: "The Cricket Den", sports: ["Cricket"],
    vendor: { name: "Cricket Den Pvt.", phone: "+91 76000 33210", email: "cricketden@turfin.com", avatar: "CD" },
    location: { address: "Anna Nagar East", city: "Chennai", zone: "North Zone" },
    status: "active", pricePerHour: 600, peakPricePerHour: 800, capacity: 22, size: "Full Ground", surface: "Natural Grass",
    rating: 4.1, totalReviews: 67, todayBookings: 3, totalBookings: 421, totalRevenue: 283000,
    amenities: ["Floodlights", "Drinking Water", "Parking", "CCTV"],
    operatingHours: "5:30 AM – 9:30 PM", listedAt: "Apr 8, 2025",
    description: "Full-size cricket ground in Chennai's Anna Nagar. Caters to club cricket, corporate matches, and net practice sessions.",
  },
  {
    id: "#FL-009", name: "BadminCourt Pro", sports: ["Badminton"],
    vendor: { name: "ProSports Hub", phone: "+91 85000 44321", email: "prosports@turfin.com", avatar: "PS" },
    location: { address: "Koramangala Block 7", city: "Bangalore", zone: "South Zone" },
    status: "inactive", pricePerHour: 350, peakPricePerHour: 500, capacity: 4, size: "Single Court", surface: "Synthetic",
    rating: 3.9, totalReviews: 28, todayBookings: 0, totalBookings: 182, totalRevenue: 68000,
    amenities: ["AC", "Drinking Water", "Changing Room"],
    operatingHours: "6:00 AM – 10:00 PM", listedAt: "Jul 11, 2025",
    description: "Indoor badminton court with professional synthetic flooring. Temporarily inactive while the vendor upgrades the court lighting system.",
  },
  {
    id: "#FL-010", name: "Kick Zone FC", sports: ["Football"],
    vendor: { name: "KickZone LLC", phone: "+91 74000 55432", email: "kickzone@turfin.com", avatar: "KZ" },
    location: { address: "Baner Road", city: "Pune", zone: "West Zone" },
    status: "suspended", pricePerHour: 750, peakPricePerHour: 1050, capacity: 14, size: "5-a-side", surface: "Artificial Turf",
    rating: 2.8, totalReviews: 41, todayBookings: 0, totalBookings: 310, totalRevenue: 198000,
    amenities: ["Floodlights", "Parking"],
    operatingHours: "7:00 AM – 10:00 PM", listedAt: "Jun 2, 2025",
    description: "Suspended due to unresolved KYC verification and multiple client complaints regarding field condition. Vendor contacted and case under review.",
  },
  {
    id: "#FL-011", name: "Field One Club", sports: ["Tennis", "Badminton"],
    vendor: { name: "Field One Corp", phone: "+91 91000 66543", email: "fieldone@turfin.com", avatar: "FO" },
    location: { address: "Powai, Hiranandani", city: "Mumbai", zone: "Central" },
    status: "pending", pricePerHour: 500, peakPricePerHour: 750, capacity: 4, size: "2 Courts", surface: "Hardcourt",
    rating: 0, totalReviews: 0, todayBookings: 0, totalBookings: 0, totalRevenue: 0,
    amenities: ["Floodlights", "WiFi", "Drinking Water", "CCTV", "Changing Room"],
    operatingHours: "6:00 AM – 10:30 PM", listedAt: "Mar 20, 2026",
    description: "New tennis and badminton facility in the premium Hiranandani complex. Two courts available. Awaiting admin approval before going live on the platform.",
  },
  {
    id: "#FL-012", name: "The Green Patch", sports: ["Football"],
    vendor: { name: "Green Patch Co.", phone: "+91 87000 77654", email: "greenpatch@turfin.com", avatar: "GP" },
    location: { address: "Banjara Hills, Road No. 12", city: "Hyderabad", zone: "Central" },
    status: "active", pricePerHour: 600, peakPricePerHour: 850, capacity: 14, size: "5-a-side", surface: "Artificial Turf",
    rating: 4.3, totalReviews: 89, todayBookings: 5, totalBookings: 563, totalRevenue: 368000,
    amenities: ["Floodlights", "Parking", "Drinking Water", "CCTV"],
    operatingHours: "6:00 AM – 11:00 PM", listedAt: "Nov 30, 2024",
    description: "Popular community turf in Banjara Hills. Known for its well-maintained pitch and affordable pricing. Frequently used for evening community matches.",
  },
];

// ─── Actions Menu ─────────────────────────────────────────────────────────────
function ActionsMenu({ field, onView }: { field: Field; onView: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <DotsThree size={18} weight="bold" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-20">
          <button
            onClick={() => { onView(); setOpen(false); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Eye size={13} className="text-gray-400" /> View Details
          </button>
          <button className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
            <Phone size={13} className="text-gray-400" /> Call Vendor
          </button>
          <button className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
            <Envelope size={13} className="text-gray-400" /> Email Vendor
          </button>

          <div className="border-t border-gray-100 my-1" />

          {field.status === "pending" && (
            <button className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-green-600 hover:bg-green-50 transition-colors font-medium">
              <CheckCircle size={13} /> Approve Field
            </button>
          )}
          {field.status === "active" && (
            <button className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
              <XCircle size={13} /> Deactivate
            </button>
          )}
          {field.status === "inactive" && (
            <button className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-green-600 hover:bg-green-50 transition-colors">
              <CheckCircle size={13} /> Reactivate
            </button>
          )}
          {field.status === "suspended" && (
            <button className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-green-600 hover:bg-green-50 transition-colors">
              <ArrowsClockwise size={13} /> Reinstate
            </button>
          )}
          {field.status !== "suspended" && (
            <button className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors">
              <Prohibit size={13} /> Suspend Field
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
const TOTAL_SLOTS = 17; // 6 AM – 10 PM (last slot starts at 10 PM)
const TODAY = new Date(2026, 2, 21); // Mar 21, 2026

/** Deterministic mock booked slots for a given field + date */
function getMockBookedSlots(field: Field, date: Date): Set<number> {
  if (field.status !== "active") return new Set();
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  const popularity = Math.min(Math.floor(field.totalBookings / 80), 8);
  const base = isWeekend ? popularity + 5 : popularity + 2;
  const count = Math.min(base, 13);
  const seed = (field.id.charCodeAt(4) || 3) + date.getDate() * 7 + date.getMonth() * 31;
  const booked = new Set<number>();
  for (let i = 0; booked.size < count; i++) {
    booked.add(((seed * (i + 3) * 7) + i * 13) % TOTAL_SLOTS);
    if (i > 200) break;
  }
  return booked;
}

/** Format a Date to display string */
function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

/** Format a Date to a key string */
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function FieldDetailPanel({ field, onClose }: { field: Field; onClose: () => void }) {
  const [tab, setTab] = useState<"overview" | "schedule" | "analytics">("overview");
  const sc = STATUS_CONFIG[field.status];

  // Schedule state
  const [scheduleDate, setScheduleDate] = useState<Date>(new Date(TODAY));
  const [calOpen, setCalOpen]           = useState(false);
  const [calMonth, setCalMonth]         = useState(TODAY.getMonth());
  const [calYear, setCalYear]           = useState(TODAY.getFullYear());
  // blocked slots: dateKey -> Set of slot indices blocked by admin
  const [blockedMap, setBlockedMap]     = useState<Record<string, Set<number>>>({});

  const calRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const dk            = dateKey(scheduleDate);
  const bookedSlots   = getMockBookedSlots(field, scheduleDate);
  const blocked       = blockedMap[dk] ?? new Set<number>();

  function toggleBlock(slotIdx: number) {
    if (bookedSlots.has(slotIdx)) return; // can't block a booked slot
    setBlockedMap(prev => {
      const next = new Map(Object.entries(prev));
      const cur  = new Set(prev[dk] ?? []);
      if (cur.has(slotIdx)) cur.delete(slotIdx); else cur.add(slotIdx);
      return { ...prev, [dk]: cur };
    });
  }

  function blockAllAvailable() {
    setBlockedMap(prev => {
      const cur = new Set(prev[dk] ?? []);
      for (let i = 0; i < TOTAL_SLOTS; i++) {
        if (!bookedSlots.has(i)) cur.add(i);
      }
      return { ...prev, [dk]: cur };
    });
  }

  function unblockAll() {
    setBlockedMap(prev => ({ ...prev, [dk]: new Set() }));
  }

  function blockPeak() {
    // Peak = slots 11 onwards (5PM+)
    setBlockedMap(prev => {
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

  const bookedCount    = bookedSlots.size;
  const blockedCount   = [...blocked].filter(i => !bookedSlots.has(i)).length;
  const availableCount = TOTAL_SLOTS - bookedCount - blockedCount;
  const occupancyPct   = Math.round((bookedCount / TOTAL_SLOTS) * 100);

  // Mini calendar helpers
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const calDays: (Date | null)[] = [];
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  for (let i = 0; i < firstDay; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(new Date(calYear, calMonth, d));

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[420px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden border-l border-gray-100">

      {/* Header */}
      <div
        className="shrink-0 px-5 py-4 flex items-start justify-between"
        style={{ background: "linear-gradient(135deg,#8a9e60,#6e8245)" }}
      >
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-white/60 text-[11px] font-medium mb-0.5">{field.id}</p>
          <h2 className="text-white font-bold text-base leading-tight truncate">{field.name}</h2>
          <p className="text-white/60 text-[11px] mt-0.5 flex items-center gap-1">
            <MapPin size={10} /> {field.location.address}, {field.location.city}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${sc.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
            {field.sports.map(s => (
              <span key={s} className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white shrink-0 mt-0.5">
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 shrink-0 bg-white">
        {(["overview", "schedule", "analytics"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${
              tab === t
                ? "border-b-2 border-[#8a9e60] text-[#8a9e60]"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <>
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-gray-800">₹{field.pricePerHour}</p>
                <p className="text-[10px] text-gray-400">per hour</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-gray-800">{field.capacity}</p>
                <p className="text-[10px] text-gray-400">capacity</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-0.5">
                  <p className="text-lg font-bold text-gray-800">{field.rating > 0 ? field.rating : "—"}</p>
                  {field.rating > 0 && <Star size={11} weight="fill" className="text-amber-400 mb-0.5" />}
                </div>
                <p className="text-[10px] text-gray-400">{field.totalReviews > 0 ? `${field.totalReviews} reviews` : "No reviews"}</p>
              </div>
            </div>

            {/* About */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">About</p>
              <p className="text-xs text-gray-600 leading-relaxed">{field.description}</p>
            </div>

            {/* Field Details */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Field Details</p>
              <div className="space-y-2.5">
                {[
                  ["Surface",          field.surface],
                  ["Size / Format",    field.size],
                  ["Capacity",         `${field.capacity} players`],
                  ["Operating Hours",  field.operatingHours],
                  ["Standard Price",   `₹${field.pricePerHour} / hr`],
                  ["Peak Price",       `₹${field.peakPricePerHour} / hr`],
                  ["Listed Since",     field.listedAt],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-medium text-gray-700 text-right max-w-[55%]">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Amenities</p>
              <div className="flex flex-wrap gap-1.5">
                {field.amenities.map(a => (
                  <span key={a} className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">{a}</span>
                ))}
              </div>
            </div>

            {/* Vendor */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Vendor</p>
              <div className="bg-gray-50 rounded-xl p-3.5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                    style={{ backgroundColor: "#8a9e60" }}
                  >
                    {field.vendor.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{field.vendor.name}</p>
                    <p className="text-[11px] text-gray-400">{field.vendor.email}</p>
                    <p className="text-[11px] text-gray-400">{field.vendor.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`tel:${field.vendor.phone}`}
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
                onClick={() => setCalOpen(o => !o)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors relative"
              >
                <CaretDown size={12} className="text-gray-400" />
                {fmtDate(scheduleDate)}
                {dateKey(scheduleDate) === dateKey(TODAY) && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ml-1" style={{ backgroundColor: "#8a9e60" }}>
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
                <div className="absolute left-4 right-4 top-auto z-30 mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3"
                  style={{ top: "auto" }}
                >
                  {/* Month nav */}
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
                      className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                      <CaretLeft size={13} weight="bold" />
                    </button>
                    <p className="text-xs font-bold text-gray-700">{monthNames[calMonth]} {calYear}</p>
                    <button
                      onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
                      className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                      <CaretRight size={13} weight="bold" />
                    </button>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 mb-1">
                    {["S","M","T","W","T","F","S"].map((d, i) => (
                      <div key={i} className="text-center text-[10px] font-bold text-gray-300 py-1">{d}</div>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {calDays.map((d, i) => {
                      if (!d) return <div key={`e${i}`} />;
                      const isToday    = dateKey(d) === dateKey(TODAY);
                      const isSel      = dateKey(d) === dateKey(scheduleDate);
                      const isPast     = d < new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
                      const hasBooking = getMockBookedSlots(field, d).size > 0;
                      return (
                        <button
                          key={i}
                          onClick={() => { setScheduleDate(new Date(d)); setCalOpen(false); }}
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
                              style={{ backgroundColor: isSel ? "white" : "#8a9e60" }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => { setScheduleDate(new Date(TODAY)); setCalMonth(TODAY.getMonth()); setCalYear(TODAY.getFullYear()); setCalOpen(false); }}
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
                <p className="text-sm font-semibold text-blue-600">Under Maintenance</p>
                <p className="text-xs text-blue-400 mt-1">No slots available on any date</p>
              </div>
            ) : field.status !== "active" ? (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 text-center">
                <XCircle size={26} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-500">Field Not Active</p>
                <p className="text-xs text-gray-400 mt-1">Activate the field to manage slots</p>
              </div>
            ) : (
              <>
                {/* ── Legend ── */}
                <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: "#8a9e60" }} /> Booked
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-red-100 border border-red-200" /> Blocked
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200" /> Available
                  </span>
                  <span className="text-[10px] text-gray-400 ml-auto">Click to block/unblock</span>
                </div>

                {/* ── Slot grid ── */}
                <div className="grid grid-cols-4 gap-1.5">
                  {Array.from({ length: TOTAL_SLOTS }, (_, i) => {
                    const hour     = 6 + i;
                    const isBooked = bookedSlots.has(i);
                    const isBlocked = !isBooked && blocked.has(i);
                    const h    = hour > 12 ? hour - 12 : hour === 12 ? 12 : hour;
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
                        <span className={`text-[10px] font-bold ${
                          isBooked ? "text-white" : isBlocked ? "text-red-500" : "text-gray-500"
                        }`}>
                          {h}{ampm}
                        </span>
                        {isPeak && !isBooked && (
                          <span className={`text-[8px] font-semibold ${isBlocked ? "text-red-400" : "text-amber-500"}`}>
                            PEAK
                          </span>
                        )}
                        {isBooked && (
                          <CheckCircle size={10} className="text-white/70" weight="fill" />
                        )}
                        {isBlocked && (
                          <LockSimple size={10} className="text-red-400" weight="fill" />
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
                      <p className="text-base font-bold text-gray-800">{bookedCount}</p>
                      <p className="text-[10px] text-gray-400">Booked</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-red-500">{blockedCount}</p>
                      <p className="text-[10px] text-gray-400">Blocked</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-600">{availableCount}</p>
                      <p className="text-[10px] text-gray-400">Available</p>
                    </div>
                    <div>
                      <p className="text-base font-bold" style={{ color: "#8a9e60" }}>{occupancyPct}%</p>
                      <p className="text-[10px] text-gray-400">Booked%</p>
                    </div>
                  </div>
                  {/* Stacked bar */}
                  <div className="flex rounded-full overflow-hidden h-2 bg-gray-200">
                    <div style={{ width: `${occupancyPct}%`, backgroundColor: "#8a9e60" }} />
                    <div style={{ width: `${Math.round((blockedCount / TOTAL_SLOTS) * 100)}%`, backgroundColor: "#fca5a5" }} />
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                    <span>Booked</span>
                    <span>Blocked</span>
                    <span>Available</span>
                  </div>
                </div>

                {/* ── Pricing note ── */}
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <p className="text-[11px] font-bold text-amber-700 mb-1.5">Pricing Tiers</p>
                  <div className="space-y-1 text-xs text-amber-700">
                    <div className="flex justify-between">
                      <span className="text-amber-600">Standard (6AM – 5PM)</span>
                      <span className="font-semibold">₹{field.pricePerHour}/hr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-600">Peak (5PM – close)</span>
                      <span className="font-semibold">₹{field.peakPricePerHour}/hr</span>
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
                { label: "Total Bookings", value: field.totalBookings.toLocaleString(), sub: "all time" },
                { label: "Total Revenue",  value: field.totalRevenue > 0 ? `₹${(field.totalRevenue / 1000).toFixed(0)}K` : "—", sub: "all time" },
                { label: "Avg. Rating",    value: field.rating > 0 ? `${field.rating} ★` : "—", sub: `${field.totalReviews} reviews` },
                {
                  label: "Avg / Booking",
                  value: field.totalBookings > 0 ? `₹${Math.round(field.totalRevenue / field.totalBookings).toLocaleString()}` : "—",
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
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Weekly Occupancy</p>
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
                      <div key={day} className="flex-1 flex flex-col items-center gap-1">
                        <p className="text-[9px] text-gray-500 font-medium">{pct}%</p>
                        <div
                          className="w-full rounded-t"
                          style={{ height: `${(pct / 100) * 72}px`, backgroundColor: "#8a9e60", opacity: 0.85 }}
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
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Revenue Breakdown</p>
              <div className="space-y-2.5">
                {[
                  [
                    "Est. This Month",
                    field.totalBookings > 0
                      ? `₹${((field.pricePerHour * field.todayBookings * 21) / 1000).toFixed(1)}K`
                      : "—",
                  ],
                  [
                    "Platform Fee (10%)",
                    field.totalRevenue > 0
                      ? `₹${(field.totalRevenue * 0.1 / 1000).toFixed(1)}K`
                      : "—",
                  ],
                  [
                    "Vendor Payout (90%)",
                    field.totalRevenue > 0
                      ? `₹${(field.totalRevenue * 0.9 / 1000).toFixed(0)}K`
                      : "—",
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-semibold text-gray-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance badge */}
            {field.totalBookings > 500 && (
              <div
                className="rounded-xl p-3.5 flex items-center gap-3"
                style={{ background: "linear-gradient(135deg,#8a9e6015,#6e824510)" }}
              >
                <Star size={24} weight="fill" style={{ color: "#8a9e60" }} className="shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-700">Top Performing Field</p>
                  <p className="text-[11px] text-gray-500">Over 500 bookings — top 20% on the platform</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Admin Actions */}
      <div className="shrink-0 border-t border-gray-100 p-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Admin Actions</p>
        <div className="space-y-2">
          {field.status === "pending" && (
            <button
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 flex items-center justify-center gap-2 transition-opacity"
              style={{ backgroundColor: "#8a9e60" }}
            >
              <CheckCircle size={16} weight="fill" /> Approve Field
            </button>
          )}
          {field.status === "inactive" && (
            <button
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 flex items-center justify-center gap-2 transition-opacity"
              style={{ backgroundColor: "#8a9e60" }}
            >
              <CheckCircle size={16} weight="fill" /> Reactivate Field
            </button>
          )}
          {field.status === "suspended" && (
            <button
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 flex items-center justify-center gap-2 transition-opacity"
              style={{ backgroundColor: "#8a9e60" }}
            >
              <ArrowsClockwise size={16} /> Reinstate Field
            </button>
          )}
          {field.status === "active" && (
            <button className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center gap-2 transition-colors">
              <XCircle size={16} /> Deactivate Field
            </button>
          )}
          {(field.status === "active" || field.status === "inactive") && (
            <button className="w-full py-2.5 rounded-xl text-sm font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center gap-2 transition-colors">
              <Wrench size={16} /> Mark as Maintenance
            </button>
          )}
          {field.status !== "suspended" && (
            <button className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center gap-2 transition-colors">
              <Prohibit size={16} /> Suspend Field
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FieldsPage() {
  const [search, setSearch]       = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [sportFilter, setSportFilter] = useState("All");
  const [cityFilter, setCityFilter]   = useState("All");
  const [sportOpen, setSportOpen] = useState(false);
  const [cityOpen, setCityOpen]   = useState(false);
  const [selected, setSelected]   = useState<Field | null>(null);

  const sportRef = useRef<HTMLDivElement>(null);
  const cityRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sportRef.current && !sportRef.current.contains(e.target as Node)) setSportOpen(false);
      if (cityRef.current  && !cityRef.current.contains(e.target as Node))  setCityOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Derived counts
  const total       = fields.length;
  const activeCount = fields.filter(f => f.status === "active").length;
  const inactiveCount  = fields.filter(f => f.status === "inactive").length;
  const pendingCount   = fields.filter(f => f.status === "pending").length;
  const maintCount     = fields.filter(f => f.status === "maintenance").length;
  const suspendedCount = fields.filter(f => f.status === "suspended").length;

  const allSports = ["All", ...Array.from(new Set(fields.flatMap(f => f.sports)))];
  const allCities = ["All", ...Array.from(new Set(fields.map(f => f.location.city)))];

  const filtered = fields.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      f.name.toLowerCase().includes(q) ||
      f.vendor.name.toLowerCase().includes(q) ||
      f.location.city.toLowerCase().includes(q) ||
      f.id.toLowerCase().includes(q);
    const matchStatus = statusTab === "all" || f.status === statusTab;
    const matchSport  = sportFilter === "All" || f.sports.includes(sportFilter);
    const matchCity   = cityFilter === "All"  || f.location.city === cityFilter;
    return matchSearch && matchStatus && matchSport && matchCity;
  });

  const STATUS_TABS = [
    { key: "all",         label: "All",         count: total        },
    { key: "active",      label: "Active",      count: activeCount  },
    { key: "inactive",    label: "Inactive",    count: inactiveCount},
    { key: "pending",     label: "Pending",     count: pendingCount },
    { key: "maintenance", label: "Maintenance", count: maintCount   },
    { key: "suspended",   label: "Suspended",   count: suspendedCount },
  ];

  const STAT_CARDS = [
    { label: "Total Fields",     value: total,        sub: "on platform",        color: "#8a9e60", Icon: MapPin        },
    { label: "Active Today",     value: activeCount,  sub: "accepting bookings", color: "#22c55e", Icon: CheckCircle   },
    { label: "Inactive",         value: inactiveCount,sub: "not accepting",      color: "#9ca3af", Icon: XCircle       },
    { label: "Pending Approval", value: pendingCount, sub: "awaiting review",    color: "#f59e0b", Icon: ClockCountdown},
    { label: "Maintenance",      value: maintCount,   sub: "temporarily closed", color: "#3b82f6", Icon: Wrench        },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Stat cards + filters */}
      <div className="p-6 pb-0 shrink-0">

        {/* Stat cards */}
        <div className="grid grid-cols-5 gap-4 mb-5">
          {STAT_CARDS.map(({ label, value, sub, color, Icon }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 leading-tight">{label}</span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + "18" }}>
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
                onChange={e => setSearch(e.target.value)}
                placeholder="Search fields, vendors, cities..."
                className="bg-transparent text-gray-700 placeholder-gray-400 text-xs flex-1 outline-none"
              />
            </div>

            {/* Sport filter */}
            <div className="relative" ref={sportRef}>
              <button
                onClick={() => setSportOpen(o => !o)}
                className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 bg-white hover:bg-gray-50 transition-colors"
              >
                <Funnel size={13} className="text-gray-400" />
                Sport: <span className="font-medium">{sportFilter}</span>
                <CaretDown size={11} className="text-gray-400" />
              </button>
              {sportOpen && (
                <div className="absolute top-10 left-0 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-10 min-w-[150px]">
                  {allSports.map(s => (
                    <button
                      key={s}
                      onClick={() => { setSportFilter(s); setSportOpen(false); }}
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
                onClick={() => setCityOpen(o => !o)}
                className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 bg-white hover:bg-gray-50 transition-colors"
              >
                <MapPin size={13} className="text-gray-400" />
                City: <span className="font-medium">{cityFilter}</span>
                <CaretDown size={11} className="text-gray-400" />
              </button>
              {cityOpen && (
                <div className="absolute top-10 left-0 bg-white border border-gray-100 rounded-xl shadow-xl py-1.5 z-10 min-w-[150px]">
                  {allCities.map(c => (
                    <button
                      key={c}
                      onClick={() => { setCityFilter(c); setCityOpen(false); }}
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
                {pendingCount} field{pendingCount > 1 ? "s" : ""} awaiting approval
              </div>
            )}
          </div>

          {/* Status tabs */}
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {STATUS_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setStatusTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  statusTab === t.key ? "text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
                style={statusTab === t.key ? { backgroundColor: "#8a9e60" } : {}}
              >
                {t.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  statusTab === t.key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full">
              <thead className="bg-gray-50/80 sticky top-0 z-10">
                <tr>
                  {["Field", "Vendor", "Status", "Price / hr", "Today's Slots", "Rating", "Bookings", ""].map(h => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {filtered.map(field => {
                  const sc = STATUS_CONFIG[field.status];
                  const isSelected = selected?.id === field.id;
                  return (
                    <tr
                      key={field.id}
                      onClick={() => setSelected(field)}
                      className={`hover:bg-gray-50/60 transition-colors cursor-pointer ${
                        isSelected ? "bg-[#8a9e60]/5" : ""
                      }`}
                    >
                      {/* Field */}
                      <td className="px-4 py-3.5">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-800 text-sm">{field.name}</p>
                            {field.sports.map(s => (
                              <span key={s} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">{s}</span>
                            ))}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                            <MapPin size={10} /> {field.location.address}, {field.location.city}
                          </p>
                          <p className="text-[10px] text-gray-300 mt-0.5">{field.id} · {field.surface} · {field.size}</p>
                        </div>
                      </td>

                      {/* Vendor */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                            style={{ backgroundColor: "#8a9e60" }}
                          >
                            {field.vendor.avatar}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700 whitespace-nowrap">{field.vendor.name}</p>
                            <p className="text-[10px] text-gray-400">{field.location.city}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-bold text-gray-800">₹{field.pricePerHour}</p>
                        <p className="text-[10px] text-gray-400">Peak: ₹{field.peakPricePerHour}</p>
                      </td>

                      {/* Today's Slots */}
                      <td className="px-4 py-3.5">
                        {field.status === "active" ? (
                          <div>
                            <p className="text-xs font-semibold text-gray-700">{field.todayBookings} / 17 booked</p>
                            <div className="w-24 bg-gray-100 rounded-full h-1.5 mt-1.5">
                              <div
                                className="h-1.5 rounded-full"
                                style={{ width: `${(field.todayBookings / 17) * 100}%`, backgroundColor: "#8a9e60" }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>

                      {/* Rating */}
                      <td className="px-4 py-3.5">
                        {field.rating > 0 ? (
                          <div>
                            <div className="flex items-center gap-1">
                              <Star size={13} weight="fill" className="text-amber-400" />
                              <span className="text-sm font-bold text-gray-800">{field.rating}</span>
                            </div>
                            <p className="text-[10px] text-gray-400">{field.totalReviews} reviews</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">No reviews</span>
                        )}
                      </td>

                      {/* Bookings */}
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-bold text-gray-800">{field.totalBookings.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400">
                          {field.totalRevenue > 0 ? `₹${(field.totalRevenue / 1000).toFixed(0)}K rev.` : "No revenue yet"}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                        <ActionsMenu field={field} onView={() => setSelected(field)} />
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-20 text-center">
                      <Buildings size={32} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">No fields match your filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-gray-100 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of {total} fields
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              {pendingCount > 0 && (
                <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                  <ClockCountdown size={12} weight="fill" />
                  {pendingCount} pending approval
                </span>
              )}
              {suspendedCount > 0 && (
                <span className="flex items-center gap-1.5 text-red-500 font-medium">
                  <Prohibit size={12} />
                  {suspendedCount} suspended
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail panel overlay */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/10 z-40" onClick={() => setSelected(null)} />
          <FieldDetailPanel field={selected} onClose={() => setSelected(null)} />
        </>
      )}
    </div>
  );
}
