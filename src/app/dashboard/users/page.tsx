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
} from "@phosphor-icons/react";
import { useState, useMemo } from "react";
import { usersApi, useUsersList } from "@/domains/users/api";
import { UserProfile, UserStatus } from "@/domains/users/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast as hotToast } from "react-hot-toast";

// ── Types ──────────────────────────────────────────────────────────────────────
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

// ── Mapping ──────────────────────────────────────────────────────────────────
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
    emailVerified: true,
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
    bookings: 0,
    completed: 0,
    cancelled: 0,
    noShows: 0,
    totalSpent: 0,
    favSport: u.preferredSports?.[0] || "N/A",
    favVendor: "N/A",
    source: "Direct",
  };
}

// ── Config & Helpers ───────────────────────────────────────────────────────────
const statusCfg: Record<
  UserStatus,
  { label: string; cls: string; dot: string }
> = {
  active: {
    label: "Active",
    cls: "bg-green-50 text-green-700",
    dot: "bg-green-500",
  },
  inactive: {
    label: "Inactive",
    cls: "bg-gray-100 text-gray-500",
    dot: "bg-gray-400",
  },
  banned: { label: "Banned", cls: "bg-red-50 text-red-600", dot: "bg-red-500" },
  pending: {
    label: "Pending",
    cls: "bg-blue-50 text-blue-600",
    dot: "bg-blue-500",
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

// ── Main Component ─────────────────────────────────────────────────────────────
export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | UserStatus>("all");
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const [banModal, setBanModal] = useState<AppUser | null>(null);
  const [banReason, setBanReason] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useUsersList({ page, limit: 10 });

  // Directly process data inside useMemo to avoid linting warnings and extra renders
  const users = useMemo(() => {
    // Correctly cast the response from useUsersList
    const raw = (data as any)?.data || [];
    return (raw as UserProfile[]).map(mapBackendUser);
  }, [data]);

  const meta = (data as any)?.meta;
  const totalPages = meta?.total ? Math.ceil(meta.total / 10) : 1;

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
    },
    onError: (err) => {
      hotToast.error(
        err instanceof Error ? err.message : "Failed to update status",
      );
    },
  });

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchTab = activeTab === "all" || u.status === activeTab;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        u.city.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [users, activeTab, search]);

  const stats = useMemo(() => {
    const totalRev = users.reduce((s, u) => s + u.totalSpent, 0);
    const active = users.filter((u) => u.status === "active").length;
    const currentMonth = new Date().toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
    const newThisMo = users.filter((u) =>
      u.joined.includes(currentMonth),
    ).length;
    const avg = users.length ? Math.round(totalRev / users.length) : 0;
    return { totalRev, active, newThisMo, avg };
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

  if (isLoading) {
    return (
      <div className="p-10 text-center text-gray-400">Loading users...</div>
    );
  }

  return (
    <div className="px-6 py-5 space-y-5">
      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Total Users",
            value: String(users.length),
            sub: "All registered",
            icon: Users,
            color: "#8a9e60",
          },
          {
            label: "Active Users",
            value: String(stats.active),
            sub: "Currently active",
            icon: CheckCircle,
            color: "#6e8245",
          },
          {
            label: "New This Month",
            value: String(stats.newThisMo),
            sub: "Current month",
            icon: CheckCircle,
            color: "#8a9e60",
          },
          {
            label: "Avg. User Spend",
            value: `₹${stats.avg.toLocaleString("en-IN")}`,
            sub: "Per user lifetime",
            icon: CurrencyDollar,
            color: "#c4953a",
          },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
          >
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
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 max-w-sm">
          <MagnifyingGlass size={15} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, city…"
            className="flex-1 outline-none text-sm text-gray-700 bg-transparent placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
            VIP = 25+ bookings or ₹40k+ spent
          </span>
          <span className="flex items-center gap-1 ml-3">
            <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
            High cancellation risk
          </span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-200 gap-1">
        {(["all", "active", "inactive", "banned"] as const).map((tab) => {
          const count =
            tab === "all"
              ? users.length
              : users.filter((u) => u.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-semibold transition-colors flex items-center gap-1.5 ${activeTab === tab ? "border-b-2 text-[#8a9e60]" : "text-gray-400 hover:text-gray-600"}`}
              style={activeTab === tab ? { borderColor: "#8a9e60" } : {}}
            >
              {tab === "all"
                ? "All Users"
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={
                  activeTab === tab
                    ? { backgroundColor: "#8a9e60", color: "white" }
                    : { backgroundColor: "#f3f4f6", color: "#9ca3af" }
                }
              >
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
              {[
                "User",
                "Contact",
                "City",
                "Bookings",
                "Spent",
                "Cancel Rate",
                "Status",
                "Verified",
                "Last Active",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-12 text-center text-sm text-gray-400"
                >
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((u, i) => {
                const sc = statusCfg[u.status] || statusCfg.active;
                const cr =
                  u.bookings > 0
                    ? Math.round(((u.cancelled + u.noShows) / u.bookings) * 100)
                    : 0;
                const vip = isVip(u);
                const risky = cr >= 20;
                return (
                  <tr
                    key={u.id}
                    className={`hover:bg-gray-50/50 transition-colors ${i < filtered.length - 1 ? "border-b border-gray-50" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: avatarColor(u.id) }}
                          >
                            {avatar(u.name)}
                          </div>
                          {vip && (
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-yellow-400 flex items-center justify-center border border-white">
                              <span className="text-[6px] text-white font-bold">
                                V
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">
                            {u.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono">
                            {u.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700">{u.email}</p>
                      <p className="text-[10px] text-gray-400">{u.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-gray-700">{u.city}</p>
                      <p className="text-[10px] text-gray-400">{u.state}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                      {u.bookings}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">
                      {u.totalSpent > 0 ? (
                        `₹${u.totalSpent.toLocaleString("en-IN")}`
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${risky ? "bg-orange-50 text-orange-600" : cr > 0 ? "bg-gray-100 text-gray-500" : "bg-green-50 text-green-600"}`}
                      >
                        {cr}%
                      </span>
                      {u.noShows > 0 && (
                        <span className="ml-1 text-[9px] text-orange-500 font-medium">
                          {u.noShows} no-show{u.noShows > 1 ? "s" : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.cls}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                        />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${u.emailVerified ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}
                        >
                          Email
                        </span>
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${u.phoneVerified ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}
                        >
                          Phone
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {u.lastActive}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActionMenu(actionMenu === u.id ? null : u.id)
                            }
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <DotsThreeVertical size={18} weight="bold" />
                          </button>
                          {actionMenu === u.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[148px]">
                              {u.status === "banned" ? (
                                <button
                                  onClick={() => {
                                    setActionMenu(null);
                                    setBanModal(u);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <ArrowCounterClockwise
                                    size={13}
                                    className="text-green-500"
                                  />
                                  Unban User
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActionMenu(null);
                                    setBanModal(u);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Prohibit
                                    size={13}
                                    className="text-red-500"
                                  />
                                  Ban User
                                </button>
                              )}
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/30">
          <p className="text-[11px] text-gray-400 font-medium">
            Showing <span className="text-gray-700">{users.length}</span> of{" "}
            {meta?.total || users.length} users
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-400 disabled:opacity-30 hover:bg-white transition-all shadow-sm"
            >
              <CaretLeft size={14} weight="bold" />
            </button>
            <span className="text-[11px] font-bold text-gray-600 px-3">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-400 disabled:opacity-30 hover:bg-white transition-all shadow-sm"
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {actionMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setActionMenu(null)}
        />
      )}

      {/* BAN / UNBAN MODAL */}
      {banModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${banModal.status === "banned" ? "bg-green-100" : "bg-red-100"}`}
              >
                {banModal.status === "banned" ? (
                  <ArrowCounterClockwise size={22} className="text-green-500" />
                ) : (
                  <Prohibit size={22} className="text-red-500" />
                )}
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">
                {banModal.status === "banned" ? "Unban User?" : "Ban User?"}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {banModal.status === "banned"
                  ? `${banModal.name} will be restored and can log in and make bookings again.`
                  : `${banModal.name} will be banned from the platform and lose access immediately.`}
              </p>
              {banModal.status !== "banned" && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Reason *
                  </label>
                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] resize-none"
                    placeholder="e.g. Repeated no-shows, fraudulent refund claims…"
                  />
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => {
                  setBanModal(null);
                  setBanReason("");
                }}
                className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                className={`flex-1 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 ${banModal.status === "banned" ? "" : "bg-red-500"}`}
                style={
                  banModal.status === "banned"
                    ? { backgroundColor: "#8a9e60" }
                    : {}
                }
              >
                {banModal.status === "banned" ? "Yes, Unban" : "Ban User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
