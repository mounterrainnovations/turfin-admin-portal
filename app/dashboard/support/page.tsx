"use client";

import {
  Ticket, MagnifyingGlass, FunnelSimple, ArrowsClockwise,
  CheckCircle, ClockCountdown, XCircle, Circle,
  UserCircle, CalendarBlank, CaretRight, PaperPlaneTilt,
  Phone, Envelope, X, Lightning, Lock, ArrowCounterClockwise,
  CurrencyDollar, Gear, Question, SoccerBall,
} from "@phosphor-icons/react";
import { useState, useRef, useEffect, useCallback } from "react";

import {
  getAllTickets,
  getTicketMessages,
  updateTicketStatus,
  addAgentMessage,
} from "@/features/support/api";
import { SupportTicketWithDetails, TicketStatus, TicketCategory } from "@/features/support/types";
import { useToast } from "@/features/toast/toast-context";

// ─── Types ────────────────────────────────────────────────────────────────────


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
  ticket: SupportTicketWithDetails;
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
            {ticket.messages.map(msg => {
              const agentInitials = msg.senderName
                ? msg.senderName.split("@")[0].slice(0, 2).toUpperCase()
                : "AG";
              const agentLabel = msg.senderName
                ? msg.senderName.split("@")[0]
                : "Agent";
              return (
                <div key={msg.id} className={`flex gap-3 ${msg.senderRole === "agent" ? "flex-row-reverse" : "flex-row"}`}>
                  {msg.senderRole === "user"
                    ? <Av initials={ticket.user.avatar} size="sm" />
                    : (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: "#6e8245" }}>{agentInitials}</div>
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
                      {msg.senderRole === "agent" ? agentLabel : ticket.user.name} · {msg.createdAt}
                    </p>
                  </div>
                </div>
              );
            })}
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
  const [tickets, setTickets]         = useState<SupportTicketWithDetails[]>([]);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter]     = useState<TicketStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const selectedTicket = tickets.find(t => t.id === selectedId) ?? null;

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAllTickets();
      setTickets(data);
    } catch (err: any) {
      showToast({ title: "Error", description: err.message || "Failed to load tickets", tone: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll ticket list every 30 s — detects new tickets and status changes
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const data = await getAllTickets();
        setTickets(prev => data.map(incoming => {
          const existing = prev.find(t => t.id === incoming.id);
          // Preserve already-loaded messages so the open modal doesn't lose them
          return existing && existing.messages.length > 0
            ? { ...incoming, messages: existing.messages }
            : incoming;
        }));
      } catch {} // silent — next tick will retry
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  // Load messages when a ticket is first opened, then poll every 5 s
  useEffect(() => {
    if (!selectedId) return;

    const mergeMessages = (msgs: any[]) => {
      setTickets(prev => prev.map(t => {
        if (t.id !== selectedId) return t;
        if (msgs.length > t.messages.length) return { ...t, messages: msgs };
        return t;
      }));
    };

    // Initial load
    getTicketMessages(selectedId)
      .then(mergeMessages)
      .catch(() => showToast({ title: "Error", description: "Could not load messages", tone: "error" }));

    // Background poll
    const id = setInterval(async () => {
      try {
        const msgs = await getTicketMessages(selectedId);
        mergeMessages(msgs);
      } catch {} // silent
    }, 5_000);

    return () => clearInterval(id);
  }, [selectedId, showToast]);

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

  const handleStatusChange = async (id: string, status: TicketStatus) => {
    try {
      await updateTicketStatus(id, status);
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status, updatedAt: new Date().toLocaleString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).replace(",", " —") } : t));
      showToast({ title: "Success", description: "Ticket status updated", tone: "success" });
    } catch (err: any) {
      showToast({ title: "Error", description: err.message || "Failed to update status", tone: "error" });
    }
  };

  const handleReply = async (id: string, body: string) => {
    try {
      const newMsg = await addAgentMessage(id, body);
      setTickets(prev => prev.map(t =>
        t.id === id ? {
          ...t,
          status: t.status === "open" ? "in_progress" : t.status,
          updatedAt: new Date().toLocaleString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).replace(",", " —"),
          messages: [...t.messages, newMsg],
        } : t
      ));
      showToast({ title: "Success", description: "Reply sent successfully", tone: "success" });
    } catch (err: any) {
      showToast({ title: "Error", description: err.message || "Failed to send reply", tone: "error" });
    }
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
        <button onClick={loadData} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors shrink-0">
          <ArrowsClockwise size={13} className={isLoading ? "animate-spin" : ""} />Refresh
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
