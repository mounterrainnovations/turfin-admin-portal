"use client";

import {
  ArrowUpRight, ArrowDownRight, CurrencyDollar, CalendarBlank,
  Users, MapPin, SoccerBall, ClockCountdown, Trophy, CheckCircle,
  XCircle, Receipt, ChartLineUp,
} from "@phosphor-icons/react";
import { useState } from "react";

// ── Period data ────────────────────────────────────────────────────────────────
type Period = "7d" | "30d" | "3m" | "6m";

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "Last 7 Days", "30d": "Last 30 Days",
  "3m": "Last 3 Months", "6m": "Last 6 Months",
};

interface PeriodData {
  revenue: number; revenueChange: number;
  bookings: number; bookingsChange: number;
  completion: number; completionChange: number;
  avgValue: number; avgValueChange: number;
  newUsers: number; disputes: number; cancellations: number;
  // Bar chart: labels + values
  trendLabels: string[]; trendValues: number[];
  // Day of week
  dayLabels: string[]; dayValues: number[];
  // Sport mix
  sports: { label: string; value: number; color: string }[];
  // Top venues
  venues: { name: string; revenue: number; bookings: number }[];
  // Cities
  cities: { city: string; bookings: number; revenue: number }[];
  // Acquisition
  sources: { label: string; value: number; color: string }[];
}

const DATA: Record<Period, PeriodData> = {
  "7d": {
    revenue: 94200, revenueChange: 12,
    bookings: 83, bookingsChange: 8,
    completion: 91, completionChange: 2,
    avgValue: 1135, avgValueChange: 4,
    newUsers: 11, disputes: 1, cancellations: 7,
    trendLabels: ["15", "16", "17", "18", "19", "20", "21"],
    trendValues:  [9800, 11200, 13400, 18000, 15600, 14200, 12000],
    dayLabels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    dayValues: [9, 8, 9, 10, 16, 18, 13],
    sports: [
      { label: "Football",  value: 38, color: "#4a90d9" },
      { label: "Cricket",   value: 31, color: "#e07b3a" },
      { label: "Badminton", value: 17, color: "#9b6de0" },
      { label: "Tennis",    value: 9,  color: "#e0c23a" },
      { label: "Others",    value: 5,  color: "#a0aab4" },
    ],
    venues: [
      { name: "Arena Sports Hub",    revenue: 22100, bookings: 20 },
      { name: "GreenZone FC",        revenue: 18400, bookings: 17 },
      { name: "Riaz Sports Complex", revenue: 16200, bookings: 15 },
      { name: "Premier Grounds",     revenue: 14800, bookings: 14 },
      { name: "Sunrise Turfs",       revenue: 10900, bookings: 10 },
    ],
    cities: [
      { city: "Mumbai",    bookings: 28, revenue: 31800 },
      { city: "Delhi",     bookings: 21, revenue: 24200 },
      { city: "Bangalore", bookings: 16, revenue: 17600 },
      { city: "Pune",      bookings: 10, revenue: 11400 },
      { city: "Chennai",   bookings: 8,  revenue: 9200  },
    ],
    sources: [
      { label: "Google",   value: 42, color: "#4285F4" },
      { label: "Organic",  value: 31, color: "#8a9e60" },
      { label: "Referral", value: 19, color: "#c4953a" },
      { label: "Social",   value: 8,  color: "#9b59b6" },
    ],
  },
  "30d": {
    revenue: 382400, revenueChange: 23,
    bookings: 345, bookingsChange: 19,
    completion: 89, completionChange: 1,
    avgValue: 1107, avgValueChange: 3,
    newUsers: 48, disputes: 3, cancellations: 38,
    trendLabels: ["1","3","5","7","9","11","13","15","17","19","21","23","25","27"],
    trendValues:  [11200,15400,9800,18200,22000,31000,28000,14000,16500,20000,25000,33000,29000,18500],
    dayLabels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    dayValues: [34, 28, 31, 35, 52, 89, 76],
    sports: [
      { label: "Football",  value: 38, color: "#4a90d9" },
      { label: "Cricket",   value: 31, color: "#e07b3a" },
      { label: "Badminton", value: 17, color: "#9b6de0" },
      { label: "Tennis",    value: 9,  color: "#e0c23a" },
      { label: "Others",    value: 5,  color: "#a0aab4" },
    ],
    venues: [
      { name: "Arena Sports Hub",    revenue: 82400, bookings: 74 },
      { name: "GreenZone FC",        revenue: 71200, bookings: 68 },
      { name: "Riaz Sports Complex", revenue: 63800, bookings: 58 },
      { name: "Premier Grounds",     revenue: 58100, bookings: 52 },
      { name: "Sunrise Turfs",       revenue: 44700, bookings: 41 },
    ],
    cities: [
      { city: "Mumbai",    bookings: 128, revenue: 141800 },
      { city: "Delhi",     bookings: 94,  revenue: 87400  },
      { city: "Bangalore", bookings: 68,  revenue: 63200  },
      { city: "Pune",      bookings: 31,  revenue: 28900  },
      { city: "Chennai",   bookings: 24,  revenue: 21100  },
    ],
    sources: [
      { label: "Google",   value: 42, color: "#4285F4" },
      { label: "Organic",  value: 31, color: "#8a9e60" },
      { label: "Referral", value: 19, color: "#c4953a" },
      { label: "Social",   value: 8,  color: "#9b59b6" },
    ],
  },
  "3m": {
    revenue: 1042000, revenueChange: 31,
    bookings: 941, bookingsChange: 27,
    completion: 87, completionChange: -1,
    avgValue: 1107, avgValueChange: 2,
    newUsers: 134, disputes: 9, cancellations: 122,
    trendLabels: ["Jan","","","Feb","","","Mar","","","","","",""],
    trendValues:  [78000,82000,91000,95000,88000,104000,112000,98000,103000,115000,121000,109000,106000],
    dayLabels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    dayValues: [94, 78, 86, 98, 142, 248, 195],
    sports: [
      { label: "Football",  value: 36, color: "#4a90d9" },
      { label: "Cricket",   value: 33, color: "#e07b3a" },
      { label: "Badminton", value: 16, color: "#9b6de0" },
      { label: "Tennis",    value: 10, color: "#e0c23a" },
      { label: "Others",    value: 5,  color: "#a0aab4" },
    ],
    venues: [
      { name: "Arena Sports Hub",    revenue: 224000, bookings: 202 },
      { name: "GreenZone FC",        revenue: 196000, bookings: 187 },
      { name: "Riaz Sports Complex", revenue: 174000, bookings: 157 },
      { name: "Premier Grounds",     revenue: 158000, bookings: 143 },
      { name: "Sunrise Turfs",       revenue: 121000, bookings: 112 },
    ],
    cities: [
      { city: "Mumbai",    bookings: 354, revenue: 391200 },
      { city: "Delhi",     bookings: 261, revenue: 242400 },
      { city: "Bangalore", bookings: 188, revenue: 174600 },
      { city: "Pune",      bookings: 86,  revenue: 79900  },
      { city: "Chennai",   bookings: 52,  revenue: 48300  },
    ],
    sources: [
      { label: "Google",   value: 43, color: "#4285F4" },
      { label: "Organic",  value: 30, color: "#8a9e60" },
      { label: "Referral", value: 20, color: "#c4953a" },
      { label: "Social",   value: 7,  color: "#9b59b6" },
    ],
  },
  "6m": {
    revenue: 1980000, revenueChange: 44,
    bookings: 1784, bookingsChange: 38,
    completion: 86, completionChange: -2,
    avgValue: 1109, avgValueChange: 5,
    newUsers: 298, disputes: 18, cancellations: 249,
    trendLabels: ["Oct","","Nov","","Dec","","Jan","","Feb","","Mar","","",""],
    trendValues:  [182000,192000,210000,228000,312000,298000,248000,261000,310000,328000,382000,355000,340000,312000],
    dayLabels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    dayValues: [178, 148, 165, 188, 272, 468, 365],
    sports: [
      { label: "Football",  value: 37, color: "#4a90d9" },
      { label: "Cricket",   value: 32, color: "#e07b3a" },
      { label: "Badminton", value: 17, color: "#9b6de0" },
      { label: "Tennis",    value: 9,  color: "#e0c23a" },
      { label: "Others",    value: 5,  color: "#a0aab4" },
    ],
    venues: [
      { name: "Arena Sports Hub",    revenue: 428000, bookings: 384 },
      { name: "GreenZone FC",        revenue: 372000, bookings: 354 },
      { name: "Riaz Sports Complex", revenue: 330000, bookings: 298 },
      { name: "Premier Grounds",     revenue: 301000, bookings: 271 },
      { name: "Sunrise Turfs",       revenue: 230000, bookings: 212 },
    ],
    cities: [
      { city: "Mumbai",    bookings: 674, revenue: 744800 },
      { city: "Delhi",     bookings: 496, revenue: 460400 },
      { city: "Bangalore", bookings: 358, revenue: 332400 },
      { city: "Pune",      bookings: 164, revenue: 152400 },
      { city: "Chennai",   bookings: 92,  revenue: 85400  },
    ],
    sources: [
      { label: "Google",   value: 44, color: "#4285F4" },
      { label: "Organic",  value: 29, color: "#8a9e60" },
      { label: "Referral", value: 20, color: "#c4953a" },
      { label: "Social",   value: 7,  color: "#9b59b6" },
    ],
  },
};

// ── Peak hours heatmap (Mon-Sun × 6am-10pm) ───────────────────────────────────
// Values 0-4: 0=none, 1=low, 2=medium, 3=high, 4=peak
const PEAK_MATRIX = [
  // 6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22
  [0, 1, 2, 1, 0, 0, 0, 0, 0, 1, 1, 2, 3, 3, 4, 3, 1], // Mon
  [0, 1, 2, 1, 0, 0, 0, 0, 0, 1, 1, 2, 3, 3, 4, 3, 1], // Tue
  [0, 1, 2, 1, 0, 0, 0, 0, 0, 1, 1, 2, 3, 4, 4, 3, 1], // Wed
  [0, 1, 2, 1, 0, 0, 0, 0, 0, 1, 1, 2, 3, 4, 4, 4, 2], // Thu
  [0, 2, 3, 1, 1, 0, 0, 0, 0, 1, 2, 3, 4, 4, 4, 4, 2], // Fri
  [1, 3, 4, 3, 2, 2, 1, 1, 2, 3, 3, 4, 4, 4, 4, 4, 3], // Sat
  [1, 3, 4, 3, 2, 2, 1, 1, 2, 3, 3, 4, 4, 4, 4, 3, 2], // Sun
];
const PEAK_HOURS  = ["6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22"];
const PEAK_DAYS   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const HEAT_COLORS = ["#f3f4f6","#d1e0b0","#a8c070","#8a9e60","#5a7035"];

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

function Sparkline({ values, color = "#8a9e60" }: { values: number[]; color?: string }) {
  const w = 120, h = 36;
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let cum = 0;
  const stops = data.map(d => {
    const start = (cum / total) * 360;
    cum += d.value;
    const end = (cum / total) * 360;
    return `${d.color} ${start}deg ${end}deg`;
  }).join(", ");
  return (
    <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
      <div className="w-24 h-24 rounded-full" style={{ background: `conic-gradient(${stops})` }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-white" />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const d = DATA[period];

  const maxTrend = Math.max(...d.trendValues);
  const maxDay   = Math.max(...d.dayValues);
  const maxVenue = d.venues[0]?.revenue ?? 1;
  const maxCity  = d.cities[0]?.bookings ?? 1;

  return (
    <div className="px-6 py-5 space-y-4">

      {/* ── Period selector ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-800">Platform Analytics</h2>
          <p className="text-xs text-gray-400 mt-0.5">{PERIOD_LABELS[period]} · All figures in INR</p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
          {(["7d","30d","3m","6m"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${period === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {p === "7d" ? "7D" : p === "30d" ? "30D" : p === "3m" ? "3M" : "6M"}
            </button>
          ))}
        </div>
      </div>

      {/* ══ BENTO GRID ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-4">

        {/* ── [1] Revenue Hero — col 1-8 ── */}
        <div className="col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
          style={{ background: "linear-gradient(135deg,#8a9e60 0%,#5a7035 100%)" }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Total Revenue</p>
              <p className="text-4xl font-black text-white tracking-tight">{fmt(d.revenue)}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold
                  ${d.revenueChange >= 0 ? "bg-white/20 text-white" : "bg-red-400/30 text-white"}`}>
                  {d.revenueChange >= 0
                    ? <ArrowUpRight size={12} weight="bold" />
                    : <ArrowDownRight size={12} weight="bold" />}
                  {Math.abs(d.revenueChange)}% vs prev period
                </div>
              </div>
            </div>
            <Sparkline values={d.trendValues} color="rgba(255,255,255,0.7)" />
          </div>

          {/* Mini stat row */}
          <div className="grid grid-cols-4 gap-3 mt-2">
            {[
              { icon: CalendarBlank, label: "Bookings",        value: d.bookings.toLocaleString(),    change: d.bookingsChange   },
              { icon: CheckCircle,   label: "Completion",      value: `${d.completion}%`,              change: d.completionChange },
              { icon: Receipt,       label: "Avg Booking",     value: `₹${d.avgValue.toLocaleString()}`,change: d.avgValueChange  },
              { icon: Users,         label: "New Users",       value: String(d.newUsers),              change: null               },
            ].map(({ icon: Icon, label, value, change }) => (
              <div key={label} className="bg-white/10 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Icon size={13} className="text-white/60" weight="fill" />
                  <p className="text-white/60 text-[10px] font-medium">{label}</p>
                </div>
                <p className="text-white font-bold text-lg leading-none">{value}</p>
                {change !== null && (
                  <p className={`text-[9px] font-semibold mt-1 ${change >= 0 ? "text-white/60" : "text-red-300"}`}>
                    {change >= 0 ? "+" : ""}{change}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── [2] Health Indicators — col 9-12 ── */}
        <div className="col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
          <p className="text-xs font-bold text-gray-700">Operational Health</p>

          {/* Completion rate radial */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
              <div className="w-[72px] h-[72px] rounded-full" style={{
                background: `conic-gradient(#8a9e60 0deg ${d.completion * 3.6}deg, #f3f4f6 ${d.completion * 3.6}deg 360deg)`
              }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                  <span className="text-xs font-black text-gray-800">{d.completion}%</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Completion Rate</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Bookings completed vs total</p>
              <p className={`text-[10px] font-semibold mt-1 ${d.completionChange >= 0 ? "text-[#8a9e60]" : "text-red-500"}`}>
                {d.completionChange >= 0 ? "+" : ""}{d.completionChange}% vs prev
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1 border-t border-gray-50">
            {[
              { label: "Disputes",      value: d.disputes,     color: "text-orange-500", bg: "bg-orange-50", icon: XCircle       },
              { label: "Cancellations", value: d.cancellations,color: "text-red-500",    bg: "bg-red-50",    icon: XCircle       },
              { label: "Vendors Live",  value: 18,             color: "text-[#8a9e60]",  bg: "bg-green-50",  icon: CheckCircle   },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${bg}`}>
                    <Icon size={12} className={color} weight="fill" />
                  </div>
                  <p className="text-xs text-gray-600">{label}</p>
                </div>
                <p className={`text-sm font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── [3] Revenue Trend bars — col 1-8 ── */}
        <div className="col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-gray-800">Revenue Trend</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Daily breakdown · {PERIOD_LABELS[period]}</p>
            </div>
            <ChartLineUp size={16} className="text-gray-300" weight="fill" />
          </div>
          {/* Bar chart */}
          <div className="flex items-end gap-1.5 h-32">
            {d.trendValues.map((v, i) => {
              const pct = (v / maxTrend) * 100;
              const isMax = v === maxTrend;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full flex flex-col justify-end" style={{ height: 104 }}>
                    {/* Tooltip */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {fmt(v)}
                    </div>
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: `${pct}%`,
                        backgroundColor: isMax ? "#5a7035" : "#8a9e60",
                        opacity: isMax ? 1 : 0.65,
                      }}
                    />
                  </div>
                  <span className="text-[8px] text-gray-400">{d.trendLabels[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── [4] Sport Mix — col 9-12 ── */}
        <div className="col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-800 mb-4">Sport Mix</p>
          <div className="flex items-center gap-4">
            <DonutChart data={d.sports} />
            <div className="flex-1 space-y-2">
              {d.sports.map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <p className="text-[10px] text-gray-600 flex-1">{s.label}</p>
                  <p className="text-[10px] font-bold text-gray-800">{s.value}%</p>
                </div>
              ))}
            </div>
          </div>
          {/* Horizontal bar per sport */}
          <div className="mt-4 space-y-1.5">
            {d.sports.map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${s.value}%`, backgroundColor: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── [5] Day-of-week — col 1-4 ── */}
        <div className="col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-800 mb-1">Bookings by Day</p>
          <p className="text-[10px] text-gray-400 mb-4">Weekend vs weekday demand</p>
          <div className="flex items-end gap-2 h-28">
            {d.dayValues.map((v, i) => {
              const pct = (v / maxDay) * 100;
              const isWeekend = i >= 5;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div className="relative w-full flex flex-col justify-end" style={{ height: 88 }}>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {v}
                    </div>
                    <div className="w-full rounded-t-lg transition-all"
                      style={{ height: `${pct}%`, backgroundColor: isWeekend ? "#5a7035" : "#8a9e60", opacity: isWeekend ? 1 : 0.55 }} />
                  </div>
                  <span className="text-[9px] font-medium text-gray-400">{d.dayLabels[i]}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#8a9e60", opacity: 0.55 }} />
              <span className="text-[9px] text-gray-400">Weekday</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "#5a7035" }} />
              <span className="text-[9px] text-gray-400">Weekend</span>
            </div>
          </div>
        </div>

        {/* ── [6] Peak Hours Heatmap — col 5-9 ── */}
        <div className="col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-800 mb-1">Peak Hours</p>
          <p className="text-[10px] text-gray-400 mb-3">Booking intensity by day & hour</p>
          {/* Grid */}
          <div className="overflow-x-auto">
            <div style={{ minWidth: 340 }}>
              {/* Hour labels */}
              <div className="flex gap-0.5 mb-1 ml-7">
                {PEAK_HOURS.map((h, i) => (
                  <div key={i} className="flex-1 text-center text-[7px] text-gray-400">
                    {parseInt(h) % 3 === 0 ? `${h}` : ""}
                  </div>
                ))}
              </div>
              {/* Rows */}
              {PEAK_MATRIX.map((row, di) => (
                <div key={di} className="flex items-center gap-0.5 mb-0.5">
                  <div className="w-6 shrink-0 text-[8px] text-gray-400 text-right pr-1">{PEAK_DAYS[di]}</div>
                  {row.map((intensity, hi) => (
                    <div key={hi} className="flex-1 rounded-sm group relative"
                      style={{ height: 16, backgroundColor: HEAT_COLORS[intensity] }}>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-800 text-white text-[9px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        {PEAK_DAYS[di]} {PEAK_HOURS[hi]}:00 — {["none","low","medium","high","peak"][intensity]}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {/* Intensity legend */}
              <div className="flex items-center gap-1.5 mt-2 ml-7">
                <span className="text-[8px] text-gray-400">Low</span>
                {HEAT_COLORS.map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
                ))}
                <span className="text-[8px] text-gray-400">Peak</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── [7] Top Venues — col 10-12 ── */}
        <div className="col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={14} style={{ color: "#c4953a" }} weight="fill" />
            <p className="text-xs font-bold text-gray-800">Top Venues</p>
          </div>
          <div className="space-y-3">
            {d.venues.map((v, i) => {
              const pct = (v.revenue / maxVenue) * 100;
              const medals = ["#c4953a","#9ca3af","#cd7f32"];
              return (
                <div key={v.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[9px] font-black shrink-0" style={{ color: medals[i] ?? "#9ca3af" }}>#{i+1}</span>
                      <p className="text-[10px] font-semibold text-gray-700 truncate">{v.name}</p>
                    </div>
                    <p className="text-[10px] font-bold text-gray-800 shrink-0 ml-1">{fmt(v.revenue)}</p>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: "#8a9e60" }} />
                  </div>
                  <p className="text-[9px] text-gray-400 mt-0.5">{v.bookings} bookings</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── [8] City Performance — col 1-6 ── */}
        <div className="col-span-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={14} className="text-gray-400" weight="fill" />
            <p className="text-xs font-bold text-gray-800">City Performance</p>
          </div>
          <div className="space-y-3">
            {d.cities.map(c => {
              const pct = (c.bookings / maxCity) * 100;
              return (
                <div key={c.city} className="flex items-center gap-4">
                  <p className="text-xs font-semibold text-gray-700 w-20 shrink-0">{c.city}</p>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: "#8a9e60" }} />
                      </div>
                      <span className="text-[10px] text-gray-500 w-14 text-right">{c.bookings} bk.</span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-gray-800 w-16 text-right shrink-0">{fmt(c.revenue)}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── [9] User Acquisition — col 7-12 ── */}
        <div className="col-span-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={14} className="text-gray-400" weight="fill" />
            <p className="text-xs font-bold text-gray-800">User Acquisition Sources</p>
          </div>
          <div className="flex items-center gap-6">
            <DonutChart data={d.sources} />
            <div className="flex-1 space-y-3">
              {d.sources.map(s => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <p className="text-xs text-gray-700">{s.label}</p>
                    </div>
                    <p className="text-xs font-bold text-gray-800">{s.value}%</p>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${s.value}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
