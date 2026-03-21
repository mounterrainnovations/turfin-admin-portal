"use client";

import {
  CalendarBlank, Users, CurrencyDollar, ArrowUpRight, ArrowDownRight,
  SoccerBall, ClockCountdown, CheckCircle, WarningCircle, ChatCircleDots,
  ShieldCheck, PaperPlaneTilt, UserCircle, Buildings, XCircle, CaretRight,
  Siren, Handshake,
} from "@phosphor-icons/react";
import { useState } from "react";

const stats = [
  { label: "Turfs Open Today",   value: "18",     change: "+3",    up: true,  icon: SoccerBall,    color: "#8a9e60" },
  { label: "Turfs Closed Today", value: "6",      change: "-1",    up: false, icon: XCircle,       color: "#b05252" },
  { label: "Today's Bookings",   value: "143",    change: "+18",   up: true,  icon: CalendarBlank, color: "#6e8245" },
  { label: "Revenue Today",      value: "$3,820", change: "+9.4%", up: true,  icon: CurrencyDollar,color: "#8a9e60" },
  { label: "Registered Users",   value: "3,891",  change: "+5.1%", up: true,  icon: UserCircle,    color: "#6e8245" },
  { label: "Pending KYC",        value: "12",     change: "+4",    up: false, icon: ShieldCheck,   color: "#c4953a" },
];

const ownerAlerts = [
  { id: 1, name: "Riaz Turf",       issue: "Payment not received for booking #BK-0031", time: "10 min ago", severity: "high"   },
  { id: 2, name: "GreenZone FC",    issue: "Field lighting malfunction on Court B",      time: "32 min ago", severity: "medium" },
  { id: 3, name: "Arena Sports",    issue: "Unable to update field availability slots",  time: "1 hr ago",   severity: "low"    },
  { id: 4, name: "Premier Grounds", issue: "Refund request for cancelled booking",       time: "2 hr ago",   severity: "medium" },
  { id: 5, name: "CityTurf Ltd",    issue: "App crashing when uploading field photos",   time: "3 hr ago",   severity: "low"    },
];

const clientAlerts = [
  { id: 1, name: "Marco Rossi",   issue: "Booking confirmed but field was locked",       time: "15 min ago", severity: "high"   },
  { id: 2, name: "Sara Bianchi",  issue: "Refund still pending after 5 days",            time: "45 min ago", severity: "high"   },
  { id: 3, name: "Luca Ferretti", issue: "Cannot cancel booking within allowed window",  time: "1 hr ago",   severity: "medium" },
  { id: 4, name: "Anna Conti",    issue: "Wrong field location shown on map",            time: "2 hr ago",   severity: "low"    },
  { id: 5, name: "Davide Greco",  issue: "Duplicate charge for same booking",            time: "4 hr ago",   severity: "high"   },
];

const severityStyle: Record<string, string> = {
  high: "bg-red-50 text-red-600 border-red-100", medium: "bg-amber-50 text-amber-600 border-amber-100", low: "bg-blue-50 text-blue-500 border-blue-100",
};
const severityDot: Record<string, string> = { high: "bg-red-500", medium: "bg-amber-400", low: "bg-blue-400" };

const kycVendors = [
  { name: "Riaz Turf",       stage: "Documents Submitted", progress: 80,  status: "in-review" },
  { name: "GreenZone FC",    stage: "Identity Verified",   progress: 100, status: "verified"  },
  { name: "Arena Sports",    stage: "Pending Documents",   progress: 30,  status: "pending"   },
  { name: "Premier Grounds", stage: "Bank Details Added",  progress: 60,  status: "in-review" },
  { name: "CityTurf Ltd",    stage: "Rejected — Resubmit", progress: 20,  status: "rejected"  },
  { name: "ProFields Co.",   stage: "Identity Verified",   progress: 100, status: "verified"  },
];

const kycColor: Record<string, string> = { verified: "#8a9e60", "in-review": "#c4953a", pending: "#6b7a96", rejected: "#b05252" };
const kycBadge: Record<string, string> = { verified: "bg-green-50 text-green-700", "in-review": "bg-amber-50 text-amber-700", pending: "bg-gray-100 text-gray-500", rejected: "bg-red-50 text-red-600" };

const chatOwners = [
  { name: "Riaz Turf",       last: "Can you check my account?",    time: "2m",  unread: 3 },
  { name: "GreenZone FC",    last: "Thanks for the update!",       time: "18m", unread: 0 },
  { name: "Arena Sports",    last: "Still waiting on approval…",   time: "1h",  unread: 1 },
  { name: "Premier Grounds", last: "Invoice sent. Please confirm", time: "2h",  unread: 0 },
];

const chatMessages = [
  { from: "owner", text: "Hi, I raised a payment issue 2 days ago. Any update?", time: "10:02" },
  { from: "admin", text: "Hi Riaz! We're looking into it. Can you share the booking ID?", time: "10:04" },
  { from: "owner", text: "It's #BK-0031. The amount was deducted but not credited.", time: "10:05" },
  { from: "admin", text: "Got it. We'll escalate this to our payments team right away.", time: "10:07" },
];

const turfStatus = [
  { name: "Turf Arena A",    status: "open",   bookings: 8,  location: "North Zone" },
  { name: "Green Zone B",    status: "open",   bookings: 5,  location: "East Zone"  },
  { name: "Open Field D",    status: "closed", bookings: 0,  location: "West Zone"  },
  { name: "Premier Court",   status: "open",   bookings: 12, location: "Central"    },
  { name: "Arena Sports",    status: "closed", bookings: 0,  location: "South Zone" },
  { name: "CityTurf Main",   status: "open",   bookings: 6,  location: "North Zone" },
];

export default function DashboardPage() {
  const [alertTab, setAlertTab] = useState<"owners" | "clients">("owners");
  const [activeChatOwner, setActiveChatOwner] = useState(chatOwners[0]);
  const [chatInput, setChatInput] = useState("");
  const alerts = alertTab === "owners" ? ownerAlerts : clientAlerts;

  return (
    <div className="px-6 py-5 space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-6 gap-4">
        {stats.map(({ label, value, change, up, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-tight">{label}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + "20" }}>
                <Icon size={14} weight="fill" style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-1">{value}</p>
            <div className={`flex items-center gap-0.5 text-xs font-medium ${up ? "text-green-600" : "text-red-500"}`}>
              {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              <span>{change} today</span>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-3 gap-4">

        {/* Alerts */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col" style={{ height: 380 }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <Siren size={16} weight="fill" style={{ color: "#b05252" }} />
              <h2 className="font-semibold text-gray-800 text-sm">Alerts & Queries</h2>
            </div>
            <span className="text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
              {ownerAlerts.filter(a => a.severity === "high").length + clientAlerts.filter(a => a.severity === "high").length} urgent
            </span>
          </div>
          <div className="flex border-b border-gray-100 shrink-0">
            {(["owners", "clients"] as const).map(tab => (
              <button key={tab} onClick={() => setAlertTab(tab)}
                className={`flex-1 py-2 text-xs font-semibold capitalize transition-colors ${alertTab === tab ? "border-b-2 text-[#8a9e60]" : "text-gray-400 hover:text-gray-600"}`}
                style={alertTab === tab ? { borderColor: "#8a9e60" } : {}}>
                {tab === "owners" ? "Turf Owners" : "Clients"}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {alerts.map(a => (
              <div key={a.id} className={`px-4 py-3 border-l-2 ${a.severity === "high" ? "border-red-400" : a.severity === "medium" ? "border-amber-400" : "border-blue-300"}`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-gray-700">{a.name}</span>
                  <span className="text-[10px] text-gray-400">{a.time}</span>
                </div>
                <p className="text-xs text-gray-500 leading-snug">{a.issue}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${severityStyle[a.severity]}`}>
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${severityDot[a.severity]}`} />{a.severity}
                  </span>
                  <button className="text-[10px] font-medium text-[#8a9e60] hover:underline flex items-center gap-0.5">
                    Respond <CaretRight size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KYC */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col" style={{ height: 380 }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} weight="fill" style={{ color: "#8a9e60" }} />
              <h2 className="font-semibold text-gray-800 text-sm">Vendor KYC Status</h2>
            </div>
            <div className="flex gap-2 text-[10px] font-medium">
              <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{kycVendors.filter(v => v.status === "verified").length} verified</span>
              <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{kycVendors.filter(v => v.status === "in-review").length} in review</span>
            </div>
          </div>
          <div className="px-4 pt-3 pb-2 shrink-0">
            <div className="flex rounded-full overflow-hidden h-2 bg-gray-100">
              {[{ status: "verified", color: "#8a9e60" }, { status: "in-review", color: "#c4953a" }, { status: "pending", color: "#6b7a96" }, { status: "rejected", color: "#b05252" }].map(({ status, color }) => (
                <div key={status} style={{ width: `${(kycVendors.filter(v => v.status === status).length / kycVendors.length) * 100}%`, backgroundColor: color }} />
              ))}
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-gray-400"><span>0</span><span>{kycVendors.length} vendors total</span></div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 px-2 pb-2">
            {kycVendors.map(v => (
              <div key={v.name} className="px-2 py-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Buildings size={14} className="text-gray-400 shrink-0" />
                    <span className="text-xs font-semibold text-gray-700">{v.name}</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${kycBadge[v.status]}`}>{v.status.replace("-", " ")}</span>
                </div>
                <p className="text-[10px] text-gray-400 mb-1.5 pl-5">{v.stage}</p>
                <div className="pl-5">
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${v.progress}%`, backgroundColor: kycColor[v.status] }} />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-0.5 block">{v.progress}% complete</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Turf Status */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col" style={{ height: 380 }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <SoccerBall size={16} weight="fill" style={{ color: "#8a9e60" }} />
              <h2 className="font-semibold text-gray-800 text-sm">Turf Status Today</h2>
            </div>
            <div className="flex gap-2 text-[10px] font-medium">
              <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{turfStatus.filter(t => t.status === "open").length} open</span>
              <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{turfStatus.filter(t => t.status === "closed").length} closed</span>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center gap-4 border-b border-gray-50 shrink-0">
            <div className="relative w-14 h-14 shrink-0">
              <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#f3f4f6" strokeWidth="5" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#8a9e60" strokeWidth="5"
                  strokeDasharray={`${(turfStatus.filter(t => t.status === "open").length / turfStatus.length) * 88} 88`} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                {Math.round((turfStatus.filter(t => t.status === "open").length / turfStatus.length) * 100)}%
              </span>
            </div>
            <div className="text-xs space-y-1">
              <p className="text-gray-500">Total <span className="font-bold text-gray-800">{turfStatus.length}</span> fields registered</p>
              <p className="text-green-600 font-medium">{turfStatus.filter(t => t.status === "open").length} operational today</p>
              <p className="text-red-500 font-medium">{turfStatus.filter(t => t.status === "closed").length} offline / closed</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {turfStatus.map(t => (
              <div key={t.name} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-xs font-semibold text-gray-700">{t.name}</p>
                  <p className="text-[10px] text-gray-400">{t.location}</p>
                </div>
                <div className="flex items-center gap-3">
                  {t.status === "open" && <span className="text-[10px] text-gray-500">{t.bookings} bookings</span>}
                  <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.status === "open" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${t.status === "open" ? "bg-green-500" : "bg-red-400"}`} />
                    {t.status === "open" ? "Open" : "Closed"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-3 gap-4">

        {/* Bookings table */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm">Recent Bookings</h2>
            <button className="text-xs font-medium px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: "#8a9e60" }}>View all</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                {["ID", "Field", "User", "Time", "Date", "Status"].map(h => (
                  <th key={h} className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { id: "#BK-0041", field: "Turf Arena A", user: "Marco Rossi",   time: "10:00–11:00", date: "Mar 21", status: "confirmed" },
                { id: "#BK-0042", field: "Green Zone B", user: "Sara Bianchi",  time: "11:30–12:30", date: "Mar 21", status: "pending"   },
                { id: "#BK-0043", field: "Turf Arena C", user: "Luca Ferretti", time: "14:00–15:00", date: "Mar 21", status: "confirmed" },
                { id: "#BK-0044", field: "Open Field D", user: "Anna Conti",    time: "16:00–17:00", date: "Mar 21", status: "cancelled" },
                { id: "#BK-0045", field: "Green Zone B", user: "Davide Greco",  time: "18:00–19:00", date: "Mar 22", status: "confirmed" },
              ].map((b, i, arr) => {
                const s = { confirmed: { cls: "bg-green-50 text-green-700", Icon: CheckCircle }, pending: { cls: "bg-amber-50 text-amber-700", Icon: ClockCountdown }, cancelled: { cls: "bg-red-50 text-red-600", Icon: WarningCircle } }[b.status]!;
                return (
                  <tr key={b.id} className={`hover:bg-gray-50/60 transition-colors ${i < arr.length - 1 ? "border-b border-gray-50" : ""}`}>
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">{b.id}</td>
                    <td className="px-5 py-3 font-medium text-gray-700 text-xs">{b.field}</td>
                    <td className="px-5 py-3 text-gray-600 text-xs">{b.user}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{b.time}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{b.date}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.cls}`}>
                        <s.Icon size={11} weight="fill" /> {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Chat */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden" style={{ height: 340 }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
            <ChatCircleDots size={16} weight="fill" style={{ color: "#8a9e60" }} />
            <h2 className="font-semibold text-gray-800 text-sm">Chat — Turf Owners</h2>
          </div>
          <div className="flex flex-1 overflow-hidden">
            <div className="w-32 border-r border-gray-100 overflow-y-auto shrink-0">
              {chatOwners.map(o => (
                <button key={o.name} onClick={() => setActiveChatOwner(o)}
                  className={`w-full text-left px-3 py-2.5 border-b border-gray-50 transition-colors ${activeChatOwner.name === o.name ? "bg-[#8a9e60]/10" : "hover:bg-gray-50"}`}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-semibold text-gray-700 truncate">{o.name}</span>
                    {o.unread > 0 && <span className="text-[9px] font-bold text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0 ml-1" style={{ backgroundColor: "#8a9e60" }}>{o.unread}</span>}
                  </div>
                  <p className="text-[9px] text-gray-400 truncate">{o.last}</p>
                  <p className="text-[9px] text-gray-300 mt-0.5">{o.time}</p>
                </button>
              ))}
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-50 shrink-0">
                <p className="text-[10px] font-semibold text-gray-700">{activeChatOwner.name}</p>
                <p className="text-[9px] text-green-500 font-medium">Online</p>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.from === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-2.5 py-1.5 rounded-lg text-[10px] leading-snug ${m.from === "admin" ? "text-white rounded-br-none" : "bg-gray-100 text-gray-700 rounded-bl-none"}`}
                      style={m.from === "admin" ? { backgroundColor: "#8a9e60" } : {}}>
                      {m.text}
                      <p className={`text-[8px] mt-0.5 ${m.from === "admin" ? "text-white/60" : "text-gray-400"}`}>{m.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100 shrink-0">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message…"
                  className="flex-1 text-[10px] bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#8a9e60]" />
                <button className="text-white p-1.5 rounded-lg shrink-0" style={{ backgroundColor: "#8a9e60" }}>
                  <PaperPlaneTilt size={13} weight="fill" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
