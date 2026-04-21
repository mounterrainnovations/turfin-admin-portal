"use client";

import {
  Ticket, MagnifyingGlass, FunnelSimple, ArrowsClockwise,
  CheckCircle, ClockCountdown, XCircle, Circle,
  UserCircle, CalendarBlank, CaretRight, PaperPlaneTilt,
  Phone, Envelope, X, Lightning, Lock, ArrowCounterClockwise,
  CurrencyDollar, Gear, Question, SoccerBall,
} from "@phosphor-icons/react";
import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type TicketStatus   = "open" | "in_progress" | "resolved" | "closed";
type TicketCategory = "booking" | "payment" | "account" | "technical" | "general";
type SenderRole     = "user" | "agent";

interface TicketMessage {
  id: string;
  senderRole: SenderRole;
  body: string;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  ticketNumber: string;
  user: { name: string; email: string; phone: string; avatar: string };
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_TICKETS: SupportTicket[] = [
  {
    id: "a1b2c3d4-0001", ticketNumber: "TKT-0001",
    user: { name: "Marco Rossi", email: "marco@email.com", phone: "+91 98765 43210", avatar: "MR" },
    category: "payment", subject: "Charged twice for booking on 14 April",
    description: "I was charged twice on 14 April for a booking at Green Arena. Amount deducted from UPI but only one confirmation received. Please refund the duplicate charge.",
    status: "open", createdAt: "Apr 19, 2026 — 10:30 AM", updatedAt: "Apr 19, 2026 — 10:30 AM",
    messages: [
      { id: "m1", senderRole: "user", body: "I was charged twice on 14 April for a booking at Green Arena. Amount deducted from UPI but only one confirmation received. Please refund the duplicate charge.", createdAt: "Apr 19, 10:30 AM" },
    ],
  },
  {
    id: "a1b2c3d4-0002", ticketNumber: "TKT-0002",
    user: { name: "Sara Bianchi", email: "sara@email.com", phone: "+91 91234 56789", avatar: "SB" },
    category: "booking", subject: "Booking confirmed but field was locked",
    description: "My booking was confirmed (BK-0041) and I arrived at Turf Arena A at 10:00 AM but the field was locked. I waited 20 minutes and had to leave. I need a full refund and an explanation.",
    status: "in_progress", createdAt: "Apr 18, 2026 — 9:15 AM", updatedAt: "Apr 19, 2026 — 2:45 PM",
    messages: [
      { id: "m2", senderRole: "user",  body: "My booking was confirmed (BK-0041) and I arrived at Turf Arena A at 10:00 AM but the field was locked. I waited 20 minutes and had to leave. I need a full refund and an explanation.", createdAt: "Apr 18, 9:15 AM" },
      { id: "m3", senderRole: "agent", body: "Hi Sara, we're sorry to hear about this experience. We've contacted the venue owner and are investigating the issue. Can you share any photos of the locked field?", createdAt: "Apr 18, 11:00 AM" },
      { id: "m4", senderRole: "user",  body: "Yes, I'll share the photos now. The lock was clearly on the main gate the entire time.", createdAt: "Apr 18, 11:30 AM" },
      { id: "m5", senderRole: "agent", body: "Thank you for the photos. We've escalated this to our operations team and a full refund of ₹800 has been initiated. It will reflect in 5–7 business days.", createdAt: "Apr 19, 2:45 PM" },
    ],
  },
  {
    id: "a1b2c3d4-0003", ticketNumber: "TKT-0003",
    user: { name: "Luca Ferretti", email: "luca@email.com", phone: "+91 87654 32109", avatar: "LF" },
    category: "booking", subject: "Cannot cancel booking within allowed window",
    description: "I'm trying to cancel my booking #BK-0043 which is 3 days away. The app says I'm outside the cancellation window but according to your policy I should have 24 hours. Please help.",
    status: "open", createdAt: "Apr 20, 2026 — 3:00 PM", updatedAt: "Apr 20, 2026 — 3:00 PM",
    messages: [
      { id: "m6", senderRole: "user", body: "I'm trying to cancel my booking #BK-0043 which is 3 days away. The app says I'm outside the cancellation window but according to your policy I should have 24 hours. Please help.", createdAt: "Apr 20, 3:00 PM" },
    ],
  },
  {
    id: "a1b2c3d4-0004", ticketNumber: "TKT-0004",
    user: { name: "Anna Conti", email: "anna@email.com", phone: "+91 76543 21098", avatar: "AC" },
    category: "account", subject: "Unable to update phone number",
    description: "I changed my phone number but the OTP is being sent to my old number. I can no longer access my old number. Please update my phone number manually to +91 99999 00001.",
    status: "resolved", createdAt: "Apr 15, 2026 — 11:00 AM", updatedAt: "Apr 16, 2026 — 4:30 PM",
    messages: [
      { id: "m7", senderRole: "user",  body: "I changed my phone number but the OTP is being sent to my old number. I can no longer access my old number. Please update my phone number manually to +91 99999 00001.", createdAt: "Apr 15, 11:00 AM" },
      { id: "m8", senderRole: "agent", body: "Hi Anna! We've verified your identity and updated your phone number in our system. Please try logging in again with the new number.", createdAt: "Apr 16, 4:30 PM" },
    ],
  },
  {
    id: "a1b2c3d4-0005", ticketNumber: "TKT-0005",
    user: { name: "Davide Greco", email: "davide@email.com", phone: "+91 65432 10987", avatar: "DG" },
    category: "payment", subject: "Refund still pending after 10 days",
    description: "I cancelled booking #BK-0039 on April 10th and was told the refund would be processed in 5–7 days. It's been 10 days and there's no refund yet.",
    status: "in_progress", createdAt: "Apr 20, 2026 — 1:00 PM", updatedAt: "Apr 21, 2026 — 9:00 AM",
    messages: [
      { id: "m9",  senderRole: "user",  body: "I cancelled booking #BK-0039 on April 10th and was told the refund would be processed in 5–7 days. It's been 10 days and there's no refund yet.", createdAt: "Apr 20, 1:00 PM" },
      { id: "m10", senderRole: "agent", body: "Hi Davide, we sincerely apologise for the delay. We're escalating this with our payments team and will have a resolution within 24 hours. Thank you for your patience.", createdAt: "Apr 21, 9:00 AM" },
    ],
  },
  {
    id: "a1b2c3d4-0006", ticketNumber: "TKT-0006",
    user: { name: "Priya Sharma", email: "priya@email.com", phone: "+91 70000 33445", avatar: "PS" },
    category: "technical", subject: "App crashes when trying to view booking receipt",
    description: "Every time I tap on 'View Receipt' for booking #BK-0047 the app crashes. I've tried reinstalling the app but the issue persists.",
    status: "closed", createdAt: "Apr 10, 2026 — 5:00 PM", updatedAt: "Apr 12, 2026 — 3:00 PM",
    messages: [
      { id: "m11", senderRole: "user",  body: "Every time I tap on 'View Receipt' for booking #BK-0047 the app crashes. I've tried reinstalling the app but the issue persists.", createdAt: "Apr 10, 5:00 PM" },
      { id: "m12", senderRole: "agent", body: "Hi Priya! We've identified a bug in the receipt renderer for bookings with multi-slot durations. A fix has been deployed in app version 1.2.3. Please update the app.", createdAt: "Apr 11, 2:00 PM" },
      { id: "m13", senderRole: "user",  body: "Updated the app and it's working now. Thank you!", createdAt: "Apr 12, 10:00 AM" },
      { id: "m14", senderRole: "agent", body: "Glad to hear that! We're closing this ticket. Please feel free to raise a new one if you face any issues.", createdAt: "Apr 12, 3:00 PM" },
    ],
  },
  {
    id: "a1b2c3d4-0007", ticketNumber: "TKT-0007",
    user: { name: "Ravi Kumar", email: "ravi@email.com", phone: "+91 80000 11223", avatar: "RK" },
    category: "general", subject: "How do I share a booking with teammates?",
    description: "I booked a slot for my team but I want to share the details with my teammates easily. Is there a share feature in the app?",
    status: "resolved", createdAt: "Apr 17, 2026 — 8:00 AM", updatedAt: "Apr 17, 2026 — 10:30 AM",
    messages: [
      { id: "m15", senderRole: "user",  body: "I booked a slot for my team but I want to share the details with my teammates easily. Is there a share feature in the app?", createdAt: "Apr 17, 8:00 AM" },
      { id: "m16", senderRole: "agent", body: "Hi Ravi! Yes — open the booking in the app, tap the share icon in the top right corner, and you can share a summary via WhatsApp, SMS, or copy the link. Let us know if you need further help!", createdAt: "Apr 17, 10:30 AM" },
    ],
  },
  {
    id: "a1b2c3d4-0008", ticketNumber: "TKT-0008",
    user: { name: "Neha Patel", email: "neha@email.com", phone: "+91 50000 77889", avatar: "NP" },
    category: "payment", subject: "Promo code not applied to booking",
    description: "I used promo code TURFIN20 during checkout but the discount wasn't applied. I was charged the full amount of ₹650. The code shows as valid in the promo section.",
    status: "open", createdAt: "Apr 21, 2026 — 7:30 AM", updatedAt: "Apr 21, 2026 — 7:30 AM",
    messages: [
      { id: "m17", senderRole: "user", body: "I used promo code TURFIN20 during checkout but the discount wasn't applied. I was charged the full amount of ₹650. The code shows as valid in the promo section.", createdAt: "Apr 21, 7:30 AM" },
    ],
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────
const statusConfig: Record<TicketStatus, { label: string; cls: string; dot: string }> = {
  open:        { label: "Open",        cls: "bg-amber-50 text-amber-700 border-amber-200",  dot: "bg-amber-400"  },
  in_progress: { label: "In Progress", cls: "bg-blue-50 text-blue-700 border-blue-200",    dot: "bg-blue-500"   },
  resolved:    { label: "Resolved",    cls: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500"  },
  closed:      { label: "Closed",      cls: "bg-gray-100 text-gray-500 border-gray-200",   dot: "bg-gray-400"   },
};

const categoryConfig: Record<TicketCategory, { label: string; icon: any; color: string }> = {
  booking:   { label: "Booking",   icon: SoccerBall,     color: "#8a9e60" },
  payment:   { label: "Payment",   icon: CurrencyDollar, color: "#c4953a" },
  account:   { label: "Account",   icon: UserCircle,     color: "#6e8245" },
  technical: { label: "Technical", icon: Gear,           color: "#6b7a96" },
  general:   { label: "General",   icon: Question,       color: "#8a9e60" },
};

const ALL_CATEGORIES: (TicketCategory | "all")[] = ["all", "booking", "payment", "account", "technical", "general"];

// ─── Small helpers ────────────────────────────────────────────────────────────
function Av({ initials, size = "sm" }: { initials: string; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "w-12 h-12 text-base" : size === "md" ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs";
  return (
    <div className={`${sz} rounded-full flex items-center justify-center text-white font-bold shrink-0`} style={{ backgroundColor: "#8a9e60" }}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const { label, cls, dot } = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function CategoryBadge({ category }: { category: TicketCategory }) {
  const { label, icon: Icon, color } = categoryConfig[category];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
      style={{ backgroundColor: color + "15", color, borderColor: color + "40" }}>
      <Icon size={10} weight="fill" />
      {label}
    </span>
  );
}

// ─── Category Dropdown ────────────────────────────────────────────────────────
function CategoryDropdown({ value, onChange }: { value: TicketCategory | "all"; onChange: (v: TicketCategory | "all") => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const label = value === "all" ? "All Categories" : categoryConfig[value].label;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 text-xs font-medium px-3 py-2.5 rounded-xl border bg-white transition-colors ${open ? "border-[#8a9e60] text-gray-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
      >
        <FunnelSimple size={13} className="text-gray-400" />
        <span>{label}</span>
        <CaretRight size={11} className={`text-gray-400 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden min-w-[160px]">
          {ALL_CATEGORIES.map(c => {
            const isAll = c === "all";
            const active = value === c;
            const cfg = isAll ? null : categoryConfig[c];
            return (
              <button key={c} onClick={() => { onChange(c); setOpen(false); }}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-xs font-medium transition-colors ${active ? "bg-[#8a9e60]/10 text-[#8a9e60]" : "text-gray-700 hover:bg-gray-50"}`}>
                {cfg
                  ? <cfg.icon size={13} weight="fill" style={{ color: active ? "#8a9e60" : cfg.color }} />
                  : <FunnelSimple size={13} className={active ? "text-[#8a9e60]" : "text-gray-400"} />}
                {isAll ? "All Categories" : cfg!.label}
                {active && <CheckCircle size={12} className="ml-auto" weight="fill" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Ticket Modal ─────────────────────────────────────────────────────────────
function TicketModal({
  ticket,
  onClose,
  onStatusChange,
  onReply,
}: {
  ticket: SupportTicket;
  onClose: () => void;
  onStatusChange: (id: string, status: TicketStatus) => void;
  onReply: (id: string, body: string) => void;
}) {
  const [replyBody, setReplyBody]       = useState("");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const statusMenuRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket.messages.length]);

  // Close status menu on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) setShowStatusMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const handleReply = () => {
    if (!replyBody.trim()) return;
    onReply(ticket.id, replyBody.trim());
    setReplyBody("");
  };

  const otherStatuses = (["open", "in_progress", "resolved", "closed"] as TicketStatus[]).filter(s => s !== ticket.status);

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      {/* Modal shell — 2-column layout */}
      <div className="bg-white rounded-2xl shadow-2xl flex overflow-hidden w-full max-w-5xl" style={{ height: "82vh" }}>

        {/* ── Left column: thread ─────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 border-r border-gray-100">

          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="font-mono text-xs font-semibold text-gray-400">{ticket.ticketNumber}</span>
                <StatusBadge status={ticket.status} />
                <CategoryBadge category={ticket.category} />
              </div>
              <h2 className="text-base font-bold text-gray-800 leading-snug">{ticket.subject}</h2>
            </div>
            <button onClick={onClose}
              className="shrink-0 p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Message thread */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {ticket.messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.senderRole === "agent" ? "flex-row-reverse" : "flex-row"}`}>
                {msg.senderRole === "user"
                  ? <Av initials={ticket.user.avatar} size="sm" />
                  : (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: "#6e8245" }}>A</div>
                  )
                }
                <div className={`max-w-[72%] flex flex-col ${msg.senderRole === "agent" ? "items-end" : "items-start"}`}>
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.senderRole === "agent"
                        ? "text-white rounded-tr-sm"
                        : "bg-gray-100 text-gray-700 rounded-tl-sm"
                    }`}
                    style={msg.senderRole === "agent" ? { backgroundColor: "#8a9e60" } : {}}
                  >
                    {msg.body}
                  </div>
                  <p className={`text-[10px] text-gray-400 mt-1.5 ${msg.senderRole === "agent" ? "text-right" : ""}`}>
                    {msg.senderRole === "agent" ? "Support Agent" : ticket.user.name} · {msg.createdAt}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply box */}
          <div className="px-6 py-4 border-t border-gray-100 shrink-0">
            {ticket.status !== "closed" ? (
              <>
                <div className="flex gap-3 items-end">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: "#6e8245" }}>A</div>
                  <div className="flex-1 flex gap-2 items-center">
                    <textarea
                      value={replyBody}
                      onChange={e => setReplyBody(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                      placeholder="Type your reply… (Enter to send, Shift+Enter for new line)"
                      rows={1}
                      className="flex-1 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#8a9e60] resize-none leading-relaxed"
                    />
                    <button
                      onClick={handleReply}
                      disabled={!replyBody.trim()}
                      className="p-2.5 rounded-xl text-white shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                      style={{ backgroundColor: "#8a9e60" }}
                    >
                      <PaperPlaneTilt size={18} weight="fill" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 pl-10">Reply is visible to the customer in the Turfin app.</p>
              </>
            ) : (
              <div className="flex items-center gap-2 justify-center py-3 bg-gray-50 rounded-xl">
                <Lock size={13} className="text-gray-400" />
                <p className="text-xs text-gray-500">This ticket is closed. Reopen it to send a reply.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: info + actions ────────────────────────────── */}
        <div className="w-72 shrink-0 flex flex-col bg-gray-50/60 overflow-y-auto">

          {/* User card */}
          <div className="px-5 py-5 border-b border-gray-100">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Customer</p>
            <div className="flex items-center gap-3 mb-3">
              <Av initials={ticket.user.avatar} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{ticket.user.name}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Envelope size={12} className="text-gray-400 shrink-0" />
                <span className="truncate">{ticket.user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Phone size={12} className="text-gray-400 shrink-0" />
                <span>{ticket.user.phone}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
                <Phone size={12} />Call
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
                <Envelope size={12} />Email
              </button>
            </div>
          </div>

          {/* Ticket metadata */}
          <div className="px-5 py-4 border-b border-gray-100 space-y-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Ticket Info</p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <CalendarBlank size={12} className="text-gray-400 shrink-0" />
              <span className="text-gray-400 shrink-0">Raised</span>
              <span className="font-medium truncate">{ticket.createdAt}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <ArrowsClockwise size={12} className="text-gray-400 shrink-0" />
              <span className="text-gray-400 shrink-0">Updated</span>
              <span className="font-medium truncate">{ticket.updatedAt}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Ticket size={12} className="text-gray-400 shrink-0" />
              <span className="text-gray-400 shrink-0">Messages</span>
              <span className="font-medium">{ticket.messages.length}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 py-5 space-y-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Actions</p>

            {/* Primary CTA — context-aware */}
            {ticket.status === "open" && (
              <button
                onClick={() => onStatusChange(ticket.id, "in_progress")}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
                style={{ backgroundColor: "#8a9e60" }}
              >
                <Lightning size={15} weight="fill" />
                Start Working
              </button>
            )}
            {ticket.status === "in_progress" && (
              <button
                onClick={() => onStatusChange(ticket.id, "resolved")}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
                style={{ backgroundColor: "#8a9e60" }}
              >
                <CheckCircle size={15} weight="fill" />
                Mark as Resolved
              </button>
            )}
            {ticket.status === "closed" && (
              <button
                onClick={() => onStatusChange(ticket.id, "open")}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
                style={{ backgroundColor: "#c4953a" }}
              >
                <ArrowCounterClockwise size={15} weight="fill" />
                Reopen Ticket
              </button>
            )}

            {/* Move to status — single dropdown button */}
            <div ref={statusMenuRef} className="relative">
              <button
                onClick={() => setShowStatusMenu(o => !o)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all
                  ${showStatusMenu ? "border-[#8a9e60] bg-[#8a9e60]/5 text-gray-800" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"}`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${statusConfig[ticket.status].dot}`} />
                <span className="flex-1 text-left">
                  Current: <span className="font-bold">{statusConfig[ticket.status].label}</span>
                </span>
                <CaretRight size={12} className={`text-gray-400 transition-transform shrink-0 ${showStatusMenu ? "rotate-90" : ""}`} />
              </button>

              {showStatusMenu && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Move to</p>
                  {otherStatuses.filter(s => s !== "closed").map(s => {
                    const cfg = statusConfig[s];
                    return (
                      <button
                        key={s}
                        onClick={() => { onStatusChange(ticket.id, s); setShowStatusMenu(false); }}
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Destructive — always at bottom */}
            {ticket.status !== "closed" && (
              <button
                onClick={() => onStatusChange(ticket.id, "closed")}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl bg-red-500 text-white shadow-sm hover:bg-red-600 active:scale-[0.98] transition-all"
              >
                <Lock size={14} weight="fill" />
                Close Ticket
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SupportPage() {
  const [tickets, setTickets]         = useState<SupportTicket[]>(MOCK_TICKETS);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter]     = useState<TicketStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | "all">("all");

  const selectedTicket = tickets.find(t => t.id === selectedId) ?? null;

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    const matchSearch   = !search || t.subject.toLowerCase().includes(q) || t.user.name.toLowerCase().includes(q) || t.ticketNumber.toLowerCase().includes(q);
    const matchStatus   = statusFilter === "all"   || t.status === statusFilter;
    const matchCategory = categoryFilter === "all" || t.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const counts = {
    all:         tickets.length,
    open:        tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    resolved:    tickets.filter(t => t.status === "resolved").length,
    closed:      tickets.filter(t => t.status === "closed").length,
  };

  const handleStatusChange = (id: string, status: TicketStatus) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status, updatedAt: "Apr 21, 2026 — just now" } : t));
  };

  const handleReply = (id: string, body: string) => {
    setTickets(prev => prev.map(t =>
      t.id === id ? {
        ...t,
        status: t.status === "open" ? "in_progress" : t.status,
        updatedAt: "Apr 21, 2026 — just now",
        messages: [...t.messages, { id: `m${Date.now()}`, senderRole: "agent", body, createdAt: "Apr 21, just now" }],
      } : t
    ));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Stats row */}
      <div className="px-6 pt-5 pb-4 shrink-0">
        <div className="grid grid-cols-5 gap-3">
          {(["all", "open", "in_progress", "resolved", "closed"] as const).map(s => {
            const isAll  = s === "all";
            const cfg    = isAll ? null : statusConfig[s];
            const active = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`rounded-xl px-4 py-3 text-left border transition-all ${active ? "border-[#8a9e60] shadow-sm" : "bg-white border-gray-100 hover:border-gray-200"}`}
                style={active ? { backgroundColor: "#8a9e6010" } : {}}>
                <p className={`text-2xl font-bold mb-0.5 ${active ? "text-[#8a9e60]" : "text-gray-800"}`}>{counts[s]}</p>
                <p className={`text-[10px] font-semibold uppercase tracking-wide ${active ? "text-[#8a9e60]" : "text-gray-400"}`}>
                  {isAll ? "All Tickets" : statusConfig[s].label}
                </p>
                {cfg && (
                  <span className={`mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${cfg.cls}`}>
                    <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />{cfg.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 pb-3 flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-2 flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5">
          <MagnifyingGlass size={14} className="text-gray-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tickets, users, IDs…"
            className="flex-1 text-xs bg-transparent focus:outline-none text-gray-700 placeholder-gray-400" />
        </div>
        <CategoryDropdown value={categoryFilter} onChange={setCategoryFilter} />
        <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors shrink-0">
          <ArrowsClockwise size={13} />Refresh
        </button>
      </div>

      {/* Tickets list — always full width */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Ticket size={44} className="text-gray-200 mb-3" />
            <p className="text-sm font-semibold text-gray-400">No tickets found</p>
            <p className="text-xs text-gray-300 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          filtered.map(ticket => {
            const lastMsg = ticket.messages[ticket.messages.length - 1];
            return (
              <button key={ticket.id} onClick={() => setSelectedId(ticket.id)}
                className="w-full text-left rounded-xl border bg-white p-4 hover:border-[#8a9e60] hover:shadow-sm transition-all group">
                <div className="flex items-start gap-3">
                  <Av initials={ticket.user.avatar} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className="text-[10px] font-mono text-gray-400 shrink-0">{ticket.ticketNumber}</span>
                        <StatusBadge status={ticket.status} />
                        <CategoryBadge category={ticket.category} />
                      </div>
                      <span className="text-[9px] text-gray-400 shrink-0">{ticket.createdAt.split("—")[0].trim()}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 truncate mb-0.5">{ticket.subject}</p>
                    <p className="text-[11px] text-gray-500 mb-2">{ticket.user.name} · {ticket.user.email}</p>
                    {lastMsg && (
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${lastMsg.senderRole === "agent" ? "bg-[#8a9e60]" : "bg-amber-400"}`} />
                        <p className="text-[10px] text-gray-400 truncate">
                          <span className="font-semibold">{lastMsg.senderRole === "agent" ? "Agent" : ticket.user.name.split(" ")[0]}:</span>{" "}{lastMsg.body}
                        </p>
                      </div>
                    )}
                  </div>
                  <CaretRight size={15} className="shrink-0 mt-1 text-gray-300 group-hover:text-[#8a9e60] transition-colors" />
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Modal */}
      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          onClose={() => setSelectedId(null)}
          onStatusChange={handleStatusChange}
          onReply={handleReply}
        />
      )}
    </div>
  );
}
