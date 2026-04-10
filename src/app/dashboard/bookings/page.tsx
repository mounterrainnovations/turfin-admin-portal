"use client";

import {
  CalendarBlank, MagnifyingGlass, ArrowUpRight, ArrowDownRight,
  CurrencyDollar, CheckCircle, ClockCountdown, XCircle,
  ArrowsClockwise, Export, Phone, ChatCircleDots, X, CaretLeft, CaretRight,
  UserCircle, Buildings, MapPin, Clock, CreditCard, Receipt, SealWarning,
  Prohibit, ArrowBendUpLeft, Envelope, Bell, DotsThree, CaretDown,
  PaperPlaneTilt, Eye, ArrowLeft,
} from "@phosphor-icons/react";
import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = "confirmed" | "pending" | "completed" | "cancelled" | "disputed";

interface Booking {
  id: string;
  client: { name: string; phone: string; email: string; avatar: string };
  turf: { name: string; location: string };
  vendor: { name: string; phone: string };
  date: string; slot: string; duration: string; amount: number;
  paymentMethod: string; paymentStatus: "paid" | "pending" | "refunded";
  status: Status; bookedAt: string; notes?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const bookings: Booking[] = [
  { id: "#BK-0041", client: { name: "Marco Rossi",   phone: "+91 98765 43210", email: "marco@email.com",   avatar: "MR" }, turf: { name: "Turf Arena A",   location: "North Zone, Mumbai"   }, vendor: { name: "Riaz Turf",       phone: "+91 99001 12233" }, date: "Mar 21, 2026", slot: "10:00–11:00", duration: "1 hr",   amount: 800,  paymentMethod: "UPI",    paymentStatus: "paid",     status: "confirmed",  bookedAt: "Mar 20, 9:14 AM"  },
  { id: "#BK-0042", client: { name: "Sara Bianchi",  phone: "+91 91234 56789", email: "sara@email.com",    avatar: "SB" }, turf: { name: "Green Zone B",  location: "East Zone, Pune"     }, vendor: { name: "GreenZone FC",    phone: "+91 98123 45678" }, date: "Mar 21, 2026", slot: "11:30–12:30", duration: "1 hr",   amount: 650,  paymentMethod: "Card",   paymentStatus: "pending",  status: "pending",    bookedAt: "Mar 21, 8:02 AM"  },
  { id: "#BK-0043", client: { name: "Luca Ferretti", phone: "+91 87654 32109", email: "luca@email.com",    avatar: "LF" }, turf: { name: "Turf Arena C",   location: "South Zone, Mumbai"  }, vendor: { name: "Premier Grounds", phone: "+91 97654 32100" }, date: "Mar 21, 2026", slot: "14:00–16:00", duration: "2 hrs",  amount: 1600, paymentMethod: "UPI",    paymentStatus: "paid",     status: "confirmed",  bookedAt: "Mar 19, 6:45 PM"  },
  { id: "#BK-0044", client: { name: "Anna Conti",    phone: "+91 76543 21098", email: "anna@email.com",    avatar: "AC" }, turf: { name: "Open Field D",  location: "West Zone, Nashik"   }, vendor: { name: "Arena Sports",    phone: "+91 96543 21087" }, date: "Mar 21, 2026", slot: "16:00–17:00", duration: "1 hr",   amount: 500,  paymentMethod: "Wallet", paymentStatus: "refunded", status: "cancelled",  bookedAt: "Mar 20, 2:10 PM", notes: "Client cancelled 2 hrs before slot." },
  { id: "#BK-0045", client: { name: "Davide Greco",  phone: "+91 65432 10987", email: "davide@email.com",  avatar: "DG" }, turf: { name: "Green Zone B",  location: "East Zone, Pune"     }, vendor: { name: "GreenZone FC",    phone: "+91 98123 45678" }, date: "Mar 22, 2026", slot: "18:00–19:00", duration: "1 hr",   amount: 650,  paymentMethod: "UPI",    paymentStatus: "paid",     status: "confirmed",  bookedAt: "Mar 21, 7:30 AM"  },
  { id: "#BK-0046", client: { name: "Ravi Kumar",    phone: "+91 80000 11223", email: "ravi@email.com",    avatar: "RK" }, turf: { name: "CityTurf Main", location: "North Zone, Mumbai"  }, vendor: { name: "CityTurf Ltd",    phone: "+91 81000 22334" }, date: "Mar 20, 2026", slot: "07:00–08:30", duration: "1.5 hrs", amount: 975,  paymentMethod: "Card",   paymentStatus: "paid",     status: "completed",  bookedAt: "Mar 19, 3:00 PM"  },
  { id: "#BK-0047", client: { name: "Priya Sharma",  phone: "+91 70000 33445", email: "priya@email.com",   avatar: "PS" }, turf: { name: "Premier Court", location: "Central, Bangalore"  }, vendor: { name: "Premier Grounds", phone: "+91 97654 32100" }, date: "Mar 20, 2026", slot: "09:00–11:00", duration: "2 hrs",  amount: 1400, paymentMethod: "UPI",    paymentStatus: "paid",     status: "completed",  bookedAt: "Mar 18, 10:15 AM" },
  { id: "#BK-0048", client: { name: "Arjun Mehta",   phone: "+91 60000 55667", email: "arjun@email.com",   avatar: "AM" }, turf: { name: "Turf Arena A",   location: "North Zone, Mumbai"  }, vendor: { name: "Riaz Turf",       phone: "+91 99001 12233" }, date: "Mar 21, 2026", slot: "19:00–20:00", duration: "1 hr",   amount: 800,  paymentMethod: "Wallet", paymentStatus: "pending",  status: "disputed",   bookedAt: "Mar 21, 5:50 AM", notes: "Client claims field was unavailable despite confirmed booking." },
  { id: "#BK-0049", client: { name: "Neha Patel",    phone: "+91 50000 77889", email: "neha@email.com",    avatar: "NP" }, turf: { name: "Green Zone B",  location: "East Zone, Pune"     }, vendor: { name: "GreenZone FC",    phone: "+91 98123 45678" }, date: "Mar 22, 2026", slot: "08:00–09:00", duration: "1 hr",   amount: 650,  paymentMethod: "Card",   paymentStatus: "paid",     status: "confirmed",  bookedAt: "Mar 21, 11:00 AM" },
  { id: "#BK-0050", client: { name: "Suresh Nair",   phone: "+91 40000 99001", email: "suresh@email.com",  avatar: "SN" }, turf: { name: "Arena Sports",  location: "South Zone, Chennai" }, vendor: { name: "Arena Sports",    phone: "+91 96543 21087" }, date: "Mar 22, 2026", slot: "06:00–07:30", duration: "1.5 hrs", amount: 750,  paymentMethod: "UPI",    paymentStatus: "paid",     status: "pending",    bookedAt: "Mar 21, 9:00 PM"  },
  { id: "#BK-0051", client: { name: "Fatima Sheikh", phone: "+91 30000 11223", email: "fatima@email.com",  avatar: "FS" }, turf: { name: "ProField Main", location: "West Zone, Hyderabad"}, vendor: { name: "ProFields Co.",   phone: "+91 88000 11200" }, date: "Mar 19, 2026", slot: "15:00–17:00", duration: "2 hrs",  amount: 1200, paymentMethod: "Card",   paymentStatus: "refunded", status: "cancelled",  bookedAt: "Mar 18, 4:30 PM", notes: "Vendor cancelled due to maintenance." },
  { id: "#BK-0052", client: { name: "Kiran Rao",     phone: "+91 20000 33445", email: "kiran@email.com",   avatar: "KR" }, turf: { name: "CityTurf Main", location: "North Zone, Mumbai"  }, vendor: { name: "CityTurf Ltd",    phone: "+91 81000 22334" }, date: "Mar 23, 2026", slot: "11:00–12:00", duration: "1 hr",   amount: 650,  paymentMethod: "UPI",    paymentStatus: "paid",     status: "confirmed",  bookedAt: "Mar 21, 2:00 PM"  },
];

// ─── Email Templates ──────────────────────────────────────────────────────────
interface Template { id: number; name: string; category: string; subject: string; body: string }

const EMAIL_TEMPLATES: Template[] = [
  { id: 1,  category: "Booking",  name: "Booking Confirmation",        subject: "Your booking {bookingId} is confirmed!",              body: "Hi {clientName},\n\nGreat news! Your booking {bookingId} at {turf} on {date} ({slot}) is confirmed.\n\nAmount Paid: ₹{amount} via {paymentMethod}.\n\nSee you on the field!\n\nTeam Turfin" },
  { id: 2,  category: "Booking",  name: "Booking Reminder (24h)",      subject: "Reminder: Your session tomorrow at {turf}",           body: "Hi {clientName},\n\nJust a reminder that your booking {bookingId} at {turf} is tomorrow, {date} from {slot}.\n\nPlease arrive 10 mins early.\n\nTeam Turfin" },
  { id: 3,  category: "Booking",  name: "Booking Modification Notice", subject: "Your booking {bookingId} has been updated",           body: "Hi {clientName},\n\nYour booking {bookingId} at {turf} has been updated by our team. Please check the app for the latest details.\n\nIf this wasn't expected, contact support.\n\nTeam Turfin" },
  { id: 4,  category: "Cancellation", name: "Booking Cancelled",       subject: "Booking {bookingId} has been cancelled",             body: "Hi {clientName},\n\nWe regret to inform you that booking {bookingId} at {turf} on {date} ({slot}) has been cancelled.\n\nYour refund of ₹{amount} will be processed within 5–7 business days.\n\nTeam Turfin" },
  { id: 5,  category: "Cancellation", name: "Vendor Cancellation",     subject: "Important: Field unavailable for your session",       body: "Hi {clientName},\n\nUnfortunately, {turf} has reported an unavailability for your slot on {date} ({slot}). Your booking {bookingId} has been cancelled and a full refund of ₹{amount} is being processed.\n\nWe apologise for the inconvenience.\n\nTeam Turfin" },
  { id: 6,  category: "Payment",  name: "Refund Initiated",            subject: "Refund initiated for {bookingId}",                   body: "Hi {clientName},\n\nWe've initiated a refund of ₹{amount} for booking {bookingId}. It will reflect in your {paymentMethod} within 5–7 business days.\n\nThank you for your patience.\n\nTeam Turfin" },
  { id: 7,  category: "Payment",  name: "Refund Completed",            subject: "Your refund of ₹{amount} has been credited",         body: "Hi {clientName},\n\nYour refund of ₹{amount} for booking {bookingId} has been successfully credited to your {paymentMethod}.\n\nWe hope to see you again soon!\n\nTeam Turfin" },
  { id: 8,  category: "Payment",  name: "Payment Reminder",            subject: "Action Required: Payment pending for {bookingId}",   body: "Hi {clientName},\n\nYour booking {bookingId} at {turf} on {date} ({slot}) has a pending payment of ₹{amount}.\n\nPlease complete your payment to secure your slot.\n\nTeam Turfin" },
  { id: 9,  category: "Dispute",  name: "Dispute Acknowledged",        subject: "We've received your dispute for {bookingId}",        body: "Hi {clientName},\n\nThank you for raising your concern about booking {bookingId}. Our team has acknowledged the dispute and will investigate within 48 hours.\n\nDisputeRef: DISP-{bookingId}\n\nTeam Turfin" },
  { id: 10, category: "Dispute",  name: "Dispute Resolved",            subject: "Your dispute for {bookingId} has been resolved",     body: "Hi {clientName},\n\nWe're happy to inform you that the dispute raised against booking {bookingId} has been resolved in your favour. A refund/credit of ₹{amount} will be processed.\n\nThank you for your patience.\n\nTeam Turfin" },
  { id: 11, category: "Support",  name: "Support Response",            subject: "Re: Your query about {bookingId}",                  body: "Hi {clientName},\n\nThank you for reaching out regarding booking {bookingId} at {turf}.\n\nOur support team has reviewed your query and [ADMIN: ADD RESOLUTION HERE].\n\nFeel free to reply to this email if you need further assistance.\n\nTeam Turfin Support" },
  { id: 12, category: "Support",  name: "Field Unavailability Apology",subject: "We're sorry — your field was unavailable",           body: "Hi {clientName},\n\nWe sincerely apologise for the inconvenience caused during your session at {turf} on {date}. This doesn't reflect our standards and we are working with the vendor to prevent recurrence.\n\nAs a goodwill gesture, a credit of ₹{amount} has been added to your Turfin wallet.\n\nTeam Turfin" },
  { id: 13, category: "General",  name: "Review Request",              subject: "How was your session at {turf}?",                   body: "Hi {clientName},\n\nWe hope you enjoyed your session at {turf} on {date}!\n\nWe'd love to hear your feedback. Please take a moment to rate your experience on the Turfin app.\n\nYour reviews help other players make great choices.\n\nTeam Turfin" },
  { id: 14, category: "General",  name: "Promotional Offer",           subject: "Exclusive offer on your next booking at Turfin!",   body: "Hi {clientName},\n\nAs a valued Turfin user, you've unlocked an exclusive 20% discount on your next booking!\n\nUse code TURFIN20 at checkout. Valid for 7 days.\n\nBook now and get on the field!\n\nTeam Turfin" },
  { id: 15, category: "General",  name: "Account Verification",        subject: "Action required: Verify your Turfin account",       body: "Hi {clientName},\n\nWe noticed your account is not fully verified. To continue enjoying uninterrupted bookings, please verify your email and phone in the Turfin app.\n\nThis ensures your booking receipts and updates reach you on time.\n\nTeam Turfin" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Booking:      "bg-green-50 text-green-700",
  Cancellation: "bg-red-50 text-red-600",
  Payment:      "bg-amber-50 text-amber-700",
  Dispute:      "bg-orange-50 text-orange-700",
  Support:      "bg-blue-50 text-blue-700",
  General:      "bg-gray-100 text-gray-600",
};

function interpolate(text: string, booking: Booking): string {
  return text
    .replace(/{clientName}/g, booking.client.name)
    .replace(/{bookingId}/g, booking.id)
    .replace(/{turf}/g, booking.turf.name)
    .replace(/{date}/g, booking.date)
    .replace(/{slot}/g, booking.slot)
    .replace(/{amount}/g, booking.amount.toLocaleString())
    .replace(/{paymentMethod}/g, booking.paymentMethod);
}

// ─── Email Template Modal ─────────────────────────────────────────────────────
function EmailModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const [selected, setSelected] = useState<Template | null>(null);
  const [preview, setPreview]   = useState(false);
  const [sent, setSent]         = useState(false);
  const categories = [...new Set(EMAIL_TEMPLATES.map(t => t.category))];

  if (sent) return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 w-80">
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "#8a9e60" + "20" }}>
          <PaperPlaneTilt size={28} style={{ color: "#8a9e60" }} weight="fill" />
        </div>
        <p className="text-base font-bold text-gray-800">Email Sent!</p>
        <p className="text-xs text-gray-500 text-center">
          <span className="font-semibold">{selected?.name}</span> was sent to{" "}
          <span className="font-semibold">{booking.client.email}</span>
        </p>
        <button onClick={onClose} className="mt-2 px-6 py-2 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: "#8a9e60" }}>
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[780px] max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0"
          style={{ background: "linear-gradient(135deg,#8a9e60,#6e8245)" }}>
          <div className="flex items-center gap-3">
            {preview && (
              <button onClick={() => setPreview(false)} className="text-white/70 hover:text-white">
                <ArrowLeft size={18} />
              </button>
            )}
            <Envelope size={18} className="text-white" weight="fill" />
            <div>
              <p className="text-white font-bold text-sm">{preview ? "Preview & Send" : "Select Email Template"}</p>
              <p className="text-white/60 text-xs">To: {booking.client.name} · {booking.client.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>

        {!preview ? (
          /* Template List */
          <div className="flex flex-1 overflow-hidden">
            {/* Category sidebar */}
            <div className="w-36 border-r border-gray-100 bg-gray-50/50 overflow-y-auto shrink-0 py-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">Category</p>
              {["All", ...categories].map(cat => (
                <button key={cat} className="w-full text-left px-3 py-2 text-xs font-medium text-gray-600 hover:bg-white hover:text-gray-900 transition-colors rounded-lg mx-1" style={{ width: "calc(100% - 8px)" }}>
                  {cat}
                  <span className="ml-1 text-[10px] text-gray-400">
                    ({cat === "All" ? EMAIL_TEMPLATES.length : EMAIL_TEMPLATES.filter(t => t.category === cat).length})
                  </span>
                </button>
              ))}
            </div>

            {/* Template grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                {EMAIL_TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => { setSelected(t); setPreview(true); }}
                    className={`text-left p-4 rounded-xl border transition-all hover:shadow-md
                      ${selected?.id === t.id ? "border-[#8a9e60] bg-[#8a9e60]/5 shadow-sm" : "border-gray-100 hover:border-gray-200 bg-white"}`}>
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${CATEGORY_COLORS[t.category]}`}>
                        {t.category}
                      </span>
                      <Eye size={13} className="text-gray-300 mt-0.5" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 mb-1 leading-snug">{t.name}</p>
                    <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">{t.subject.replace(/{[^}]+}/g, "…")}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : selected && (
          /* Preview */
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {/* Subject */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Subject</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 font-medium">
                  {interpolate(selected.subject, booking)}
                </div>
              </div>
              {/* Body */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Body</label>
                <pre className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                  {interpolate(selected.body, booking)}
                </pre>
              </div>
              {/* Meta */}
              <div className="bg-[#8a9e60]/5 border border-[#8a9e60]/20 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: "#8a9e60" }}>
                  {booking.client.avatar}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{booking.client.name}</p>
                  <p className="text-[10px] text-gray-400">{booking.client.email} · Booking {booking.id}</p>
                </div>
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${CATEGORY_COLORS[selected.category]}`}>
                  {selected.category}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          <p className="text-xs text-gray-400">
            {preview && selected ? `Template: ${selected.name}` : `${EMAIL_TEMPLATES.length} templates available`}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            {preview && selected && (
              <button onClick={() => setSent(true)}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#8a9e60" }}>
                <PaperPlaneTilt size={13} weight="fill" /> Send Email
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Calendar Range Picker ────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function CalendarRangePicker({
  from, to, onChange, onClose,
}: {
  from: Date | null; to: Date | null;
  onChange: (from: Date | null, to: Date | null) => void;
  onClose: () => void;
}) {
  const today = new Date(2026, 2, 21); // Mar 21, 2026
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [hovered, setHovered]     = useState<Date | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const next = viewMonth === 11 ? { m: 0, y: viewYear + 1 } : { m: viewMonth + 1, y: viewYear };

  function getDays(month: number, year: number) {
    const first = new Date(year, month, 1).getDay();
    const count = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = Array(first).fill(null);
    for (let d = 1; d <= count; d++) cells.push(new Date(year, month, d));
    return cells;
  }

  function handleDay(d: Date) {
    if (!from || (from && to)) { onChange(d, null); }
    else {
      if (d < from) onChange(d, from);
      else onChange(from, d);
    }
  }

  function isInRange(d: Date) {
    const end = to ?? hovered;
    if (!from || !end) return false;
    const lo = from < end ? from : end;
    const hi = from < end ? end : from;
    return d > lo && d < hi;
  }

  function isStart(d: Date) { return from?.toDateString() === d.toDateString(); }
  function isEnd(d: Date)   { return to?.toDateString() === d.toDateString(); }
  function isToday(d: Date) { return today.toDateString() === d.toDateString(); }

  function formatDate(d: Date | null) {
    if (!d) return "—";
    return `${MONTHS[d.getMonth()].slice(0,3)} ${d.getDate()}, ${d.getFullYear()}`;
  }

  function renderMonth(month: number, year: number) {
    return (
      <div className="flex-1">
        <p className="text-xs font-bold text-gray-700 text-center mb-3">{MONTHS[month]} {year}</p>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {DAYS.map(d => <p key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</p>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {getDays(month, year).map((d, i) => {
            if (!d) return <div key={i} />;
            const start  = isStart(d);
            const end    = isEnd(d);
            const range  = isInRange(d);
            const tod    = isToday(d);
            return (
              <button key={i}
                onClick={() => handleDay(d)}
                onMouseEnter={() => setHovered(d)}
                onMouseLeave={() => setHovered(null)}
                className={`h-8 w-full text-xs font-medium transition-colors rounded-lg
                  ${start || end ? "text-white" : range ? "bg-[#8a9e60]/15 text-[#6e8245] rounded-none" : tod ? "text-[#8a9e60] font-bold" : "text-gray-700 hover:bg-gray-100"}`}
                style={(start || end) ? { backgroundColor: "#8a9e60" } : {}}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="absolute left-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden" style={{ width: 560 }}>
      {/* Selected range display */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-100" style={{ backgroundColor: "#8a9e60" + "08" }}>
        <div className="flex-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">From</p>
          <p className="text-sm font-semibold" style={{ color: from ? "#6e8245" : "#d1d5db" }}>{formatDate(from)}</p>
        </div>
        <div className="w-8 flex items-center justify-center">
          <div className="h-px w-full" style={{ backgroundColor: "#8a9e6040" }} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">To</p>
          <p className="text-sm font-semibold" style={{ color: to ? "#6e8245" : "#d1d5db" }}>{formatDate(to)}</p>
        </div>
        {(from || to) && (
          <button onClick={() => onChange(null, null)} className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-1 shrink-0">
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {/* Calendar body */}
      <div className="flex gap-0 px-5 py-4">
        {renderMonth(viewMonth, viewYear)}
        <div className="w-px bg-gray-100 mx-4" />
        {renderMonth(next.m, next.y)}
      </div>

      {/* Nav + shortcuts */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
        <div className="flex gap-1">
          {["Today", "Last 7 days", "Last 30 days", "This month"].map(s => (
            <button key={s} onClick={() => {
              const t2 = new Date(today);
              if (s === "Today")       onChange(today, today);
              if (s === "Last 7 days") { const f = new Date(today); f.setDate(f.getDate() - 6); onChange(f, today); }
              if (s === "Last 30 days"){ const f = new Date(today); f.setDate(f.getDate() - 29); onChange(f, today); }
              if (s === "This month")  { onChange(new Date(today.getFullYear(), today.getMonth(), 1), today); }
            }} className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors">
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><CaretLeft size={14} /></button>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"><CaretRight size={14} /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<Status, { label: string; cls: string; Icon: React.ElementType }> = {
  confirmed: { label: "Confirmed", cls: "bg-green-50 text-green-700",  Icon: CheckCircle    },
  pending:   { label: "Pending",   cls: "bg-amber-50 text-amber-700",  Icon: ClockCountdown },
  completed: { label: "Completed", cls: "bg-blue-50 text-blue-700",    Icon: ArrowsClockwise},
  cancelled: { label: "Cancelled", cls: "bg-gray-100 text-gray-500",   Icon: XCircle        },
  disputed:  { label: "Disputed",  cls: "bg-red-50 text-red-600",      Icon: SealWarning    },
};
const PAYMENT_CONFIG: Record<string, { cls: string; label: string }> = {
  paid:     { cls: "bg-green-50 text-green-700",   label: "Paid"     },
  pending:  { cls: "bg-amber-50 text-amber-700",   label: "Pending"  },
  refunded: { cls: "bg-purple-50 text-purple-700", label: "Refunded" },
};
const STATUS_TABS = [
  { label: "All", value: "all" }, { label: "Confirmed", value: "confirmed" },
  { label: "Pending", value: "pending" }, { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" }, { label: "Disputed", value: "disputed" },
];
const SUMMARY_STATS = [
  { label: "Total Bookings",    value: "1,284",   change: "+12.5%", up: true,  icon: CalendarBlank,  color: "#8a9e60" },
  { label: "Revenue",          value: "₹48,320", change: "+8.2%",  up: true,  icon: CurrencyDollar, color: "#6e8245" },
  { label: "Cancellation Rate", value: "8.3%",    change: "-1.2%",  up: true,  icon: XCircle,        color: "#8a9e60" },
  { label: "Active Disputes",   value: "3",       change: "+2",     up: false, icon: SealWarning,    color: "#b05252" },
];

// ─── Actions Dropdown ─────────────────────────────────────────────────────────
function ActionsMenu({ booking, onView, onEmail }: { booking: Booking; onView: () => void; onEmail: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const items: ({ label: string; icon: React.ElementType; color: string; bg: string; action: () => void } | { divider: true })[] = [
    { label: "Send Email",   icon: Envelope,         color: "#8a9e60", bg: "hover:bg-green-50", action: () => { onEmail(); setOpen(false); } },
    { label: "Call Client",  icon: Phone,            color: "#6e8245", bg: "hover:bg-green-50", action: () => { window.location.href = `tel:${booking.client.phone}`; setOpen(false); } },
    { label: "Raise Alert",  icon: Bell,             color: "#b05252", bg: "hover:bg-red-50",   action: () => { alert(`Alert raised for ${booking.id}`); setOpen(false); } },
    { divider: true },
    { label: "View Details", icon: DotsThree,        color: "#6b7280", bg: "hover:bg-gray-50",  action: () => { onView(); setOpen(false); } },
  ];

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors">
        Actions <CaretDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden py-1">
          {items.map((item, i) =>
            "divider" in item ? <div key={i} className="my-1 border-t border-gray-100" /> : (
              <button key={item.label} onClick={item.action}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 transition-colors ${item.bg}`}>
                <item.icon size={14} style={{ color: item.color }} weight="fill" />
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const [activeTab, setActiveTab]     = useState("all");
  const [search, setSearch]           = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = bookings.find((b) => b.id === selectedId) || null;
  const [emailBooking, setEmailBooking] = useState<Booking | null>(null);
  const [page, setPage]               = useState(1);

  // Date range
  const [showCal, setShowCal]         = useState(false);
  const [datePreset, setDatePreset]   = useState("This Week");
  const [fromDate, setFromDate]       = useState<Date | null>(null);
  const [toDate, setToDate]           = useState<Date | null>(null);
  const calAnchorRef = useRef<HTMLDivElement>(null);

  const PER_PAGE = 8;
  const isCustom = datePreset === "Custom";

  const filtered = bookings.filter(b => {
    const matchTab    = activeTab === "all" || b.status === activeTab;
    const matchSearch = search === "" ||
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.client.name.toLowerCase().includes(search.toLowerCase()) ||
      b.turf.name.toLowerCase().includes(search.toLowerCase()) ||
      b.vendor.name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function formatRange() {
    if (!fromDate && !toDate) return null;
    const fmt = (d: Date) => `${d.getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]} ${d.getFullYear()}`;
    if (fromDate && toDate) return `${fmt(fromDate)} – ${fmt(toDate)}`;
    if (fromDate)           return `From ${fmt(fromDate)}`;
    return null;
  }

  return (
    <>
      {emailBooking && <EmailModal booking={emailBooking} onClose={() => setEmailBooking(null)} />}

      <div className="flex h-full overflow-hidden">
        <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${selected ? "mr-[400px]" : ""}`}>
          <div className="px-6 py-5 space-y-4 overflow-y-auto h-full">

            {/* ── Global Date Filter Bar ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 shrink-0">
                    <CalendarBlank size={15} weight="fill" style={{ color: "#8a9e60" }} />
                    Date Range
                  </div>
                  <div className="h-4 w-px bg-gray-200" />
                  <div className="flex gap-1 flex-wrap">
                    {["Today","Yesterday","This Week","This Month","Last Month"].map(d => (
                      <button key={d} onClick={() => { setDatePreset(d); setFromDate(null); setToDate(null); setPage(1); setShowCal(false); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${datePreset === d && !isCustom ? "text-white" : "text-gray-500 hover:bg-gray-100"}`}
                        style={datePreset === d && !isCustom ? { backgroundColor: "#8a9e60" } : {}}>
                        {d}
                      </button>
                    ))}

                    {/* Custom toggle */}
                    <div ref={calAnchorRef} className="relative">
                      <button onClick={() => { setDatePreset("Custom"); setShowCal(c => !c); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${isCustom ? "text-white" : "text-gray-500 hover:bg-gray-100"}`}
                        style={isCustom ? { backgroundColor: "#8a9e60" } : {}}>
                        <CalendarBlank size={12} />
                        {isCustom && fromDate ? formatRange() ?? "Custom Range" : "Custom Range"}
                      </button>

                      {showCal && (
                        <CalendarRangePicker
                          from={fromDate} to={toDate}
                          onChange={(f, t) => { setFromDate(f); setToDate(t); setPage(1); }}
                          onClose={() => setShowCal(false)}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Active badge */}
                <span className="text-[10px] font-semibold px-3 py-1 rounded-full border shrink-0"
                  style={{ backgroundColor: "#8a9e60" + "15", color: "#6e8245", borderColor: "#8a9e60" + "30" }}>
                  {isCustom && fromDate ? formatRange() : `Viewing: ${datePreset}`}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              {SUMMARY_STATS.map(({ label, value, change, up, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "20" }}>
                      <Icon size={14} weight="fill" style={{ color }} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 mb-1">{value}</p>
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${up ? "text-green-600" : "text-red-500"}`}>
                    {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                    <span>{change} vs last period</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Filter bar */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-1">
                {STATUS_TABS.map(t => (
                  <button key={t.value} onClick={() => { setActiveTab(t.value); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeTab === t.value ? "text-white" : "text-gray-500 hover:bg-gray-100"}`}
                    style={activeTab === t.value ? { backgroundColor: "#8a9e60" } : {}}>
                    {t.label}
                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === t.value ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                      {t.value === "all" ? bookings.length : bookings.filter(b => b.status === t.value).length}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-52">
                  <MagnifyingGlass size={14} className="text-gray-400 shrink-0" />
                  <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search bookings…" className="bg-transparent text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none w-full" />
                </div>
                <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                  <Export size={14} /> Export CSV
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {["Booking ID", "Client", "Turf / Vendor", "Date & Slot", "Duration", "Amount", "Payment", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-12 text-sm text-gray-400">No bookings found.</td></tr>
                  ) : paginated.map(b => {
                    const s = STATUS_CONFIG[b.status];
                    const p = PAYMENT_CONFIG[b.paymentStatus];
                    const isActive = selected?.id === b.id;
                    return (
                      <tr key={b.id} onClick={() => setSelectedId(selectedId === b.id ? null : b.id)}
                        className={`cursor-pointer transition-colors ${isActive ? "bg-[#8a9e60]/5" : "hover:bg-gray-50/60"}`}>
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs font-semibold text-gray-700">{b.id}</span>
                          {b.notes && <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-amber-400 align-middle" />}
                          <p className="text-[10px] text-gray-400 mt-0.5">{b.bookedAt}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: "#8a9e60" }}>{b.client.avatar}</div>
                            <div><p className="text-xs font-semibold text-gray-700">{b.client.name}</p><p className="text-[10px] text-gray-400">{b.client.phone}</p></div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5"><p className="text-xs font-semibold text-gray-700">{b.turf.name}</p><p className="text-[10px] text-gray-400">{b.vendor.name}</p></td>
                        <td className="px-4 py-3.5"><p className="text-xs font-medium text-gray-700">{b.date}</p><p className="text-[10px] text-gray-400">{b.slot}</p></td>
                        <td className="px-4 py-3.5 text-xs text-gray-600">{b.duration}</td>
                        <td className="px-4 py-3.5 text-xs font-semibold text-gray-800">₹{b.amount.toLocaleString()}</td>
                        <td className="px-4 py-3.5"><span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.cls}`}>{p.label}</span></td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>
                            <s.Icon size={10} weight="fill" />{s.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                          <ActionsMenu booking={b} onView={() => setSelected(isActive ? null : b)} onEmail={() => setEmailBooking(b)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/30">
                <p className="text-xs text-gray-400">
                  Showing <span className="font-semibold text-gray-700">{(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)}</span> of <span className="font-semibold text-gray-700">{filtered.length}</span> bookings
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30"><CaretLeft size={14} /></button>
                  {Array.from({length:totalPages},(_,i)=>i+1).map(n=>(
                    <button key={n} onClick={()=>setPage(n)} className={`w-6 h-6 rounded text-xs font-semibold transition-colors ${page===n?"text-white":"text-gray-500 hover:bg-gray-100"}`} style={page===n?{backgroundColor:"#8a9e60"}:{}}>{n}</button>
                  ))}
                  <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30"><CaretRight size={14} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="fixed right-0 top-0 bottom-0 w-[400px] bg-white border-l border-gray-100 shadow-2xl flex flex-col z-50 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0" style={{ background: "linear-gradient(135deg,#8a9e60,#6e8245)" }}>
              <div><p className="text-white font-bold text-sm">{selected.id}</p><p className="text-white/70 text-xs mt-0.5">Booked {selected.bookedAt}</p></div>
              <button onClick={() => setSelectedId(null)} className="text-white/70 hover:text-white"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              <div className="flex items-center gap-2 flex-wrap">
                {(() => { const s = STATUS_CONFIG[selected.status]; return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.cls}`}><s.Icon size={12} weight="fill" />{s.label}</span>; })()}
                {(() => { const p = PAYMENT_CONFIG[selected.paymentStatus]; return <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${p.cls}`}><CreditCard size={12} weight="fill" />{p.label}</span>; })()}
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3"><UserCircle size={15} style={{color:"#8a9e60"}} weight="fill" /><h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Client</h3></div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{backgroundColor:"#8a9e60"}}>{selected.client.avatar}</div>
                  <div><p className="text-sm font-semibold text-gray-800">{selected.client.name}</p><p className="text-xs text-gray-400">{selected.client.email}</p></div>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${selected.client.phone}`} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white transition-colors"><Phone size={12}/>{selected.client.phone}</a>
                  <button onClick={() => setEmailBooking(selected)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white transition-colors"><Envelope size={12}/> Email</button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3"><Buildings size={15} style={{color:"#8a9e60"}} weight="fill"/><h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Turf & Vendor</h3></div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-1"><MapPin size={13} className="text-gray-400"/>{selected.turf.name}</div>
                <p className="text-xs text-gray-400 pl-5 mb-2">{selected.turf.location}</p>
                <div className="flex items-center pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600">Owner: <span className="font-semibold text-gray-800">{selected.vendor.name}</span></p>
                  <a href={`tel:${selected.vendor.phone}`} className="ml-auto flex items-center gap-1 text-xs text-[#8a9e60] hover:underline"><Phone size={11}/>{selected.vendor.phone}</a>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3"><Receipt size={15} style={{color:"#8a9e60"}} weight="fill"/><h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Booking Details</h3></div>
                <div className="grid grid-cols-2 gap-y-2.5 text-xs">
                  <div><p className="text-gray-400">Date</p><p className="font-semibold text-gray-800 mt-0.5">{selected.date}</p></div>
                  <div><p className="text-gray-400">Slot</p><p className="font-semibold text-gray-800 mt-0.5">{selected.slot}</p></div>
                  <div><p className="text-gray-400">Duration</p><p className="font-semibold text-gray-800 mt-0.5">{selected.duration}</p></div>
                  <div><p className="text-gray-400">Amount</p><p className="font-semibold text-gray-800 mt-0.5">₹{selected.amount.toLocaleString()}</p></div>
                  <div><p className="text-gray-400">Method</p><p className="font-semibold text-gray-800 mt-0.5">{selected.paymentMethod}</p></div>
                  <div><p className="text-gray-400">Payment</p><span className={`inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${PAYMENT_CONFIG[selected.paymentStatus].cls}`}>{PAYMENT_CONFIG[selected.paymentStatus].label}</span></div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3"><Clock size={15} style={{color:"#8a9e60"}} weight="fill"/><h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Timeline</h3></div>
                {[{event:"Booking Created",done:true},{event:"Payment Received",done:selected.paymentStatus==="paid"||selected.paymentStatus==="refunded"},{event:"Vendor Confirmed",done:selected.status==="confirmed"||selected.status==="completed"},{event:"Session Completed",done:selected.status==="completed"}].map((t,i,arr)=>(
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full mt-0.5 shrink-0 border-2" style={t.done?{backgroundColor:"#8a9e60",borderColor:"#8a9e60"}:{backgroundColor:"white",borderColor:"#e5e7eb"}}/>
                      {i<arr.length-1&&<div className="w-0.5 h-6" style={{backgroundColor:t.done?"#8a9e6040":"#f3f4f6"}}/>}
                    </div>
                    <div className="pb-4"><p className={`text-xs font-semibold ${t.done?"text-gray-800":"text-gray-400"}`}>{t.event}</p>{t.done&&<p className="text-[10px] text-gray-400 mt-0.5">{selected.bookedAt}</p>}</div>
                  </div>
                ))}
              </div>
              {selected.notes&&<div className="bg-amber-50 border border-amber-100 rounded-xl p-3"><p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Admin Note</p><p className="text-xs text-amber-700">{selected.notes}</p></div>}
            </div>
            <div className="px-5 py-4 border-t border-gray-100 shrink-0 space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Admin Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={()=>setEmailBooking(selected)} className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-white" style={{backgroundColor:"#8a9e60"}}><Envelope size={13}/> Email Client</button>
                <button className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-white" style={{backgroundColor:"#6e8245"}}><ChatCircleDots size={13}/> Message Vendor</button>
                <button className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"><ArrowBendUpLeft size={13}/> Issue Refund</button>
                <button className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"><SealWarning size={13}/> Mark Disputed</button>
              </div>
              <button className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"><Prohibit size={13}/> Cancel Booking</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
