"use client";

import {
  Users,
  CheckCircle,
  MagnifyingGlass,
  DotsThreeVertical,
  Prohibit,
  ArrowCounterClockwise,
  CurrencyDollar,
  CaretLeft,
  CaretRight,
  X,
  MapPin,
  CalendarBlank,
  Clock,
} from "@phosphor-icons/react";
import { useState, useMemo } from "react";
import { usersApi, useUsersList } from "@/domains/users/api";
import { UserProfile, UserStatus } from "@/domains/users/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast as hotToast } from "react-hot-toast";
import { useDebounce } from "@/hooks/use-debounce";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  joined: string;
  lastActive: string;
  bookings: number;
  completed: number;
  cancelled: number;
  noShows: number;
  totalSpent: number;
  favSport: string;
  favVendor: string;
  source: string;
  banReason?: string;
}

const PAGE_SIZE = 10;

// ─── Mapping ──────────────────────────────────────────────────────────────────
function mapBackendUser(u: UserProfile): AppUser {
  return {
    id: u.id,
    name:
      `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
      u.displayName ||
      "Unknown User",
    email: u.email,
    phone: "N/A",
    city: u.city || "—",
    state: u.state || "—",
    status: u.status,
    emailVerified: false,
    phoneVerified: false,
    joined: u.createdAt
      ? new Date(u.createdAt).toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        })
      : "—",
    lastActive: u.lastActiveAt
      ? new Date(u.lastActiveAt).toLocaleString()
      : "Never",
    bookings: 0, // Placeholder
    completed: 0,
    cancelled: 0,
    noShows: 0,
    totalSpent: 0,
    favSport: u.preferredSports?.[0] || "N/A",
    favVendor: "N/A",
    source: "Direct",
  };
}

// ─── Config & Helpers ───────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  UserStatus,
  { label: string; color: string; dot: string; bg: string }
> = {
  active: {
    label: "Active",
    color: "text-green-700",
    dot: "bg-green-500",
    bg: "bg-green-50",
  },
  inactive: {
    label: "Inactive",
    color: "text-gray-500",
    dot: "bg-gray-400",
    bg: "bg-gray-100",
  },
  banned: {
    label: "Banned",
    color: "text-red-600",
    dot: "bg-red-500",
    bg: "bg-red-50",
  },
  pending: {
    label: "Pending",
    color: "text-blue-600",
    dot: "bg-blue-500",
    bg: "bg-blue-50",
  },
  under_review: {
    label: "Under Review",
    color: "text-amber-600",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
  },
};

function avatar(name: string) {
  if (!name || !name.trim()) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return parts
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function avatarColor(id: string): string {
  const colors = [
    "#8a9e60",
    "#6e8245",
    "#c4953a",
    "#6b7a96",
    "#7a6e9e",
    "#9e6e6e",
    "#6e9e8a",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function isVip(u: AppUser): boolean {
  return u.bookings >= 25 || u.totalSpent >= 40000;
}

// ─── Components ───────────────────────────────────────────────────────────────
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
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
          style={{ backgroundColor: color + "15" }}
        >
          <Icon size={16} weight="fill" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-[10px] text-gray-400 mt-1 font-medium">{sub}</p>
    </div>
  );
}

function UserDetailPanel({
  user,
  onClose,
  onBanAction,
}: {
  user: AppUser;
  onClose: () => void;
  onBanAction: () => void;
}) {
  const st = STATUS_CONFIG[user.status] || STATUS_CONFIG.active;
  const col = avatarColor(user.id);
  const cr =
    user.bookings > 0
      ? Math.round(((user.cancelled + user.noShows) / user.bookings) * 100)
      : 0;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden border-l border-gray-100 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div
        className="shrink-0 p-6 flex items-start justify-between border-b border-gray-100"
        style={{ background: `linear-gradient(135deg, ${col}, ${col}dd)` }}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-bold border border-white/30 shadow-lg shrink-0 overflow-hidden">
            {avatar(user.name)}
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-bold text-lg leading-tight truncate">
              {user.name}
              {isVip(user) && (
                <span className="ml-2 text-[10px] bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-md align-middle">
                  VIP
                </span>
              )}
            </h2>
            <p className="text-white/70 text-[11px] font-mono mt-1 truncate">
              {user.id}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 bg-white/20 text-white border border-white/10`}
              >
                <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                {st.label.toUpperCase()}
              </span>
              <span className="text-[9px] bg-white/10 text-white/80 px-2 py-0.5 rounded-full border border-white/5 uppercase tracking-widest font-bold">
                USER
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white shrink-0"
        >
          <X size={20} weight="bold" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        {/* Contact info cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Email Status
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.emailVerified ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}
              >
                {user.emailVerified ? "VERIFIED" : "PENDING"}
              </span>
            </div>
            <p className="text-[11px] text-gray-800 font-semibold mt-2 truncate">
              {user.email}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Phone Status
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.phoneVerified ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}
              >
                {user.phoneVerified ? "VERIFIED" : "PENDING"}
              </span>
            </div>
            <p className="text-[11px] text-gray-800 font-semibold mt-2">
              {user.phone}
            </p>
          </div>
        </div>

        {/* Life-time metrics */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-[#8a9e60] rounded-full" />
            <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-widest">
              Platform Metrics
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
              <p className="text-[9px] font-bold text-gray-400 uppercase">
                Bookings
              </p>
              <p className="text-lg font-bold text-gray-800">{user.bookings}</p>
            </div>
            <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
              <p className="text-[9px] font-bold text-gray-400 uppercase">
                Spent
              </p>
              <p className="text-lg font-bold text-gray-800">
                ₹{user.totalSpent.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
              <p className="text-[9px] font-bold text-gray-400 uppercase">
                Cancel Rate
              </p>
              <p
                className={`text-lg font-bold ${cr > 20 ? "text-red-500" : "text-gray-800"}`}
              >
                {cr}%
              </p>
            </div>
          </div>
        </section>

        {/* About User */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-blue-500 rounded-full" />
            <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-widest">
              Activity & Info
            </h3>
          </div>
          <div className="space-y-4">
            {[
              {
                label: "Location",
                val: `${user.city}, ${user.state}`,
                icon: MapPin,
              },
              { label: "Joined On", val: user.joined, icon: CalendarBlank },
              { label: "Last Active", val: user.lastActive, icon: Clock },
              {
                label: "Preferred Sport",
                val: user.favSport,
                icon: CheckCircle,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <row.icon size={16} className="text-gray-300" />
                  <span className="text-xs text-gray-400 font-medium">
                    {row.label}
                  </span>
                </div>
                <span className="text-xs text-gray-700 font-bold">
                  {row.val}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Quick Action Button */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <button
          onClick={onBanAction}
          className={`w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm ${user.status === "banned" ? "bg-[#8a9e60]" : "bg-red-500"}`}
        >
          {user.status === "banned" ? (
            <>
              <ArrowCounterClockwise size={14} weight="bold" /> Reactivate User
              Account
            </>
          ) : (
            <>
              <Prohibit size={14} weight="bold" /> Restrict / Ban User Account
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | UserStatus>("all");
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const [selected, setSelected] = useState<AppUser | null>(null);
  const [banModal, setBanModal] = useState<AppUser | null>(null);
  const [banReason, setBanReason] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading } = useUsersList({
    page,
    limit: PAGE_SIZE,
    status: activeTab === "all" ? undefined : activeTab,
    search: debouncedSearch || undefined,
  });

  const users = useMemo(() => {
    const raw = (data as { data: UserProfile[] })?.data || [];
    return raw.map(mapBackendUser);
  }, [data]);

  const meta = (data as { meta: { total: number } })?.meta;
  const totalPages = meta?.total ? Math.ceil(meta.total / PAGE_SIZE) : 1;

  const statusMutation = useMutation({
    mutationFn: ({
      userId,
      status,
    }: {
      userId: string;
      status: "active" | "banned";
    }) =>
      status === "banned"
        ? usersApi.banUser(userId)
        : usersApi.unbanUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      hotToast.success("User status updated successfully");
      setBanModal(null);
      // Update selected user in view if applicable
      if (selected && selected.id === banModal?.id) {
        setSelected({
          ...selected,
          status: selected.status === "banned" ? "active" : "banned",
        });
      }
    },
    onError: (err) => {
      hotToast.error(
        err instanceof Error ? err.message : "Failed to update status",
      );
    },
  });

  const filtered = users;

  const stats = useMemo(() => {
    const active = users.filter((u) => u.status === "active").length;
    const currentMonth = new Date().toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
    const newThisMo = users.filter((u) =>
      u.joined.includes(currentMonth),
    ).length;
    return { active, newThisMo };
  }, [users]);

  function handleBan() {
    if (!banModal) return;
    const isBanned = banModal.status === "banned";
    statusMutation.mutate({
      userId: banModal.id,
      status: isBanned ? "active" : "banned",
    });
    setBanModal(null);
    setBanReason("");
  }

  return (
    <div className="px-6 py-5 space-y-6 h-full flex flex-col">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <StatCard
          label="Total Users"
          value={String(meta?.total || users.length)}
          sub="All registered accounts"
          icon={Users}
          color="#8a9e60"
        />
        <StatCard
          label="Active Users"
          value={String(stats.active)}
          sub="On this page"
          icon={CheckCircle}
          color="#6e8245"
        />
        <StatCard
          label="New This Month"
          value={String(stats.newThisMo)}
          sub="Current month signups"
          icon={CalendarBlank}
          color="#3b82f6"
        />
        <StatCard
          label="Top Tier (VIP)"
          value={String(users.filter(isVip).length)}
          sub="Power users on page"
          icon={CurrencyDollar}
          color="#c4953a"
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 flex-1 max-w-sm shadow-sm transition-all focus-within:ring-2 focus-within:ring-[#8a9e60]/20 focus-within:border-[#8a9e60]/30">
          <MagnifyingGlass size={15} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, phone, city…"
            className="flex-1 outline-none text-sm text-gray-600 bg-transparent placeholder:text-gray-400"
          />
        </div>
        <div className="hidden md:flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-sm" />
            Vip Status
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 shadow-sm" />
            Risky Account
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1 shrink-0 overflow-x-auto scrollbar-hide">
        {(
          ["all", "active", "pending", "under_review", "inactive", "banned"] as const
        ).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
              }}
              className={`px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-2 border-b-2 whitespace-nowrap ${
                isActive
                  ? "text-[#8a9e60] border-[#8a9e60]"
                  : "text-gray-400 border-transparent hover:text-gray-600"
              }`}
            >
              {tab === "all"
                ? "All Users"
                : tab.charAt(0).toUpperCase() + tab.slice(1).replace(/_/g, " ")}
              {isActive && meta?.total !== undefined && (
                <span
                  className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#8a9e60] text-white"
                >
                  {meta.total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto flex-1 scrollbar-thin">
          <table className="w-full">
            <thead className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm">
              <tr className="border-b border-gray-100">
                {[
                  "User Detail",
                  "Contact Info",
                  "Location",
                  "Activity Stats",
                  "Status",
                  "Last Login",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-4 bg-gray-50 rounded-lg w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users
                        size={32}
                        weight="thin"
                        className="text-gray-200"
                      />
                      <p className="text-sm text-gray-400 font-medium">
                        No user accounts found
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const sc = STATUS_CONFIG[u.status] || STATUS_CONFIG.active;
                  const cr =
                    u.bookings > 0
                      ? Math.round(
                          ((u.cancelled + u.noShows) / u.bookings) * 100,
                        )
                      : 0;
                  const risky = cr >= 20;
                  const col = avatarColor(u.id);

                  return (
                    <tr
                      key={u.id}
                      onClick={() => setSelected(u)}
                      className="hover:bg-gray-50/60 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-black shadow-sm"
                              style={{ backgroundColor: col }}
                            >
                              {avatar(u.name)}
                            </div>
                            {isVip(u) && (
                              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-yellow-400 flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-yellow-200">
                                <span className="text-[7px] text-white font-black">
                                  V
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">
                              {u.name}
                            </p>
                            <p className="text-[9px] text-gray-400 font-mono mt-0.5 truncate max-w-[100px]">
                              {u.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs font-semibold text-gray-700 truncate max-w-[160px]">
                          {u.email}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {u.phone}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs font-semibold text-gray-700">
                          {u.city}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {u.state}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-gray-700 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
                            {u.bookings} BKGS
                          </span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${risky ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-green-50 text-green-600 border-green-100"}`}
                          >
                            {cr}% CR
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${sc.bg} ${sc.color} ${sc.bg.replace("bg-", "border-").replace("50", "100")}`}
                        >
                          <span className={`w-1 h-1 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <p className="text-[10px] text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded inline-block">
                          {u.lastActive}
                        </p>
                      </td>
                      <td
                        className="px-4 py-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActionMenu(actionMenu === u.id ? null : u.id)
                            }
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <DotsThreeVertical size={18} weight="bold" />
                          </button>
                          {actionMenu === u.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1.5 min-w-[150px] animate-in fade-in slide-in-from-top-1 duration-200">
                              <button
                                onClick={() => {
                                  setActionMenu(null);
                                  setBanModal(u);
                                }}
                                className={`w-full text-left px-4 py-2 text-[10px] font-black flex items-center gap-2.5 ${u.status === "banned" ? "text-green-600 hover:bg-green-50" : "text-red-500 hover:bg-red-50"}`}
                              >
                                {u.status === "banned" ? (
                                  <>
                                    <ArrowCounterClockwise size={14} />{" "}
                                    Reactivate
                                  </>
                                ) : (
                                  <>
                                    <Prohibit size={14} /> Ban User
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="shrink-0 border-t border-gray-100 px-6 py-3 flex items-center justify-between bg-gray-50/30">
          <p className="text-xs text-gray-400 font-medium">
            Showing <span className="text-gray-700">{filtered.length}</span> of{" "}
            {meta?.total || users.length} users
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-white transition-all shadow-sm"
            >
              <CaretLeft size={14} weight="bold" />
            </button>
            <span className="text-[11px] font-bold text-gray-600 px-3">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-white transition-all shadow-sm"
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {actionMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActionMenu(null)}
        />
      )}

      {/* Details Panel Overlay */}
      {selected && (
        <>
          <div
            className="fixed inset-0 bg-black/10 z-40 backdrop-blur-[2px]"
            onClick={() => setSelected(null)}
          />
          <UserDetailPanel
            user={selected}
            onClose={() => setSelected(null)}
            onBanAction={() => {
              setBanModal(selected);
              setActionMenu(null);
            }}
          />
        </>
      )}

      {/* BAN / UNBAN MODAL */}
      {banModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={() => {
              setBanModal(null);
              setBanReason("");
            }}
          />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-white/20 ${banModal.status === "banned" ? "bg-green-50 text-green-500" : "bg-red-50 text-red-500"}`}
              >
                {banModal.status === "banned" ? (
                  <ArrowCounterClockwise size={28} weight="bold" />
                ) : (
                  <Prohibit size={28} weight="bold" />
                )}
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">
                {banModal.status === "banned"
                  ? "Reactivate User?"
                  : "Restrict User?"}
              </h3>
              <p className="text-xs text-gray-400 font-medium leading-relaxed mb-6">
                {banModal.status === "banned"
                  ? `Are you sure you want to restore access for ${banModal.name}? They will be able to log in and book fields again.`
                  : `Are you sure you want to ban ${banModal.name}? This person will lose all access to the Turfin app immediately.`}
              </p>
              {banModal.status !== "banned" && (
                <div className="mb-6">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Action Note / Reason
                  </label>
                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:ring-2 focus:ring-[#8a9e60] transition-all resize-none placeholder:text-gray-300"
                    placeholder="e.g. Terms of service violation, repeated no-shows..."
                  />
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setBanModal(null);
                    setBanReason("");
                  }}
                  className="flex-1 py-3 text-xs font-bold text-gray-400 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={handleBan}
                  className={`flex-1 py-3 text-xs font-bold text-white rounded-xl shadow-lg transition-all hover:opacity-90 active:scale-95 ${banModal.status === "banned" ? "bg-[#8a9e60]" : "bg-red-500"}`}
                >
                  {banModal.status === "banned"
                    ? "Confirm Unban"
                    : "Confirm Ban"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
