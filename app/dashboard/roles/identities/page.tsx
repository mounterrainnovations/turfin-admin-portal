"use client";

import {
  UserPlus,
  UserCircle,
  Envelope,
  Shield,
  MagnifyingGlass,
  DotsThreeVertical,
  X,
  Check,
  Warning,
  Trash,
  Lock,
  Key,
  Prohibit,
  ArrowCounterClockwise,
  ShieldCheck,
  Crown,
  UserGear,
  Info,
} from "@phosphor-icons/react";
import { useState, useMemo } from "react";
import { useSubAdmins, useRoles } from "@/features/rbac/hooks";
import * as rbacApi from "@/features/rbac/api";
import { useToast } from "@/features/toast/toast-context";
import { getAdminSession } from "@/features/auth/session";
import Select from "@/components/Select";

// ── Components & Helpers ──────────────────────────────────────────────────────

function getAvatarColor(id: string) {
  const colors = [
    "#8a9e60",
    "#6e8245",
    "#2563eb",
    "#7c3aed",
    "#d97706",
    "#059669",
    "#db2777",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const ADMIN_SEARCH_OPTIONS = [
  { value: "email", label: "Email", placeholder: "Search by admin email" },
  {
    value: "identity_id",
    label: "Identity ID",
    placeholder: "Search by identity UUID",
  },
  { value: "role", label: "Role", placeholder: "Search by assigned role" },
  { value: "status", label: "Status", placeholder: "Search by status" },
] as const;

// ── Page ─────────────────────────────────────────────────────────────────────

export default function IdentityManagementPage() {
  const { showToast } = useToast();
  const session = getAdminSession();

  const { subAdmins, isLoading, refresh: refreshAdmins } = useSubAdmins();
  const { roles, isLoading: rolesLoading } = useRoles();

  const [search, setSearch] = useState("");
  const [searchBy, setSearchBy] =
    useState<(typeof ADMIN_SEARCH_OPTIONS)[number]["value"]>("email");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assignment Modal State
  const [modifyingAdmin, setModifyingAdmin] = useState<string | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const filteredAdmins = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subAdmins;

    return subAdmins.filter((admin) => {
      switch (searchBy) {
        case "email":
          return admin.email.toLowerCase().includes(q);
        case "identity_id":
          return admin.id.toLowerCase().includes(q);
        case "role":
          return admin.roles.some((role) =>
            `${role.name} ${role.id}`.toLowerCase().includes(q),
          );
        case "status":
          return admin.status.toLowerCase().includes(q);
        default:
          return admin.email.toLowerCase().includes(q);
      }
    });
  }, [subAdmins, search, searchBy]);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || invitePassword.length < 8) return;
    setIsSubmitting(true);
    try {
      await rbacApi.createSubAdmin({
        email: inviteEmail,
        password: invitePassword,
        name: inviteName.trim() || undefined,
      });
      showToast({
        title: "Invitation Sent",
        description: `Administrative identity created for ${inviteEmail}`,
        tone: "success",
      });
      setInviteEmail("");
      setInviteName("");
      setInvitePassword("");
      setShowInviteModal(false);
      refreshAdmins();
    } catch (err: any) {
      showToast({
        title: "Invite Failed",
        description: err.message,
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRoleAssignment = (adminId: string, currentRoleIds: string[]) => {
    setModifyingAdmin(adminId);
    // Filter out any system roles from the initial selection.
    // System roles should not be sent back to the custom role assignment endpoint.
    const assignableRoleIds = currentRoleIds.filter((id) =>
      roles.some((r) => r.id === id),
    );
    setSelectedRoleIds(assignableRoleIds);
    setActiveMenu(null);
  };

  const handleSaveRoles = async () => {
    if (!modifyingAdmin) return;
    setIsSubmitting(true);
    try {
      // Ensure we only send custom role IDs to the backend.
      // Backend forbids passing system roles like 'sub_admin' via this endpoint.
      const payloadRoleIds = selectedRoleIds.filter((id) =>
        roles.some((r) => r.id === id),
      );
      await rbacApi.assignRolesToSubAdmin(modifyingAdmin, {
        roleIds: payloadRoleIds,
      });
      showToast({
        title: "Identity Updated",
        description: "Roles successfully reassigned",
        tone: "success",
      });
      setModifyingAdmin(null);
      refreshAdmins();
    } catch (err: any) {
      showToast({
        title: "Assignment Failed",
        description: err.message,
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id: string, email: string) => {
    if (
      !confirm(
        `Are you sure you want to revoke administrative access for ${email}?`,
      )
    )
      return;
    try {
      await rbacApi.deleteSubAdmin(id);
      showToast({
        title: "Access Revoked",
        description: "Identity purged from back-office",
        tone: "success",
      });
      refreshAdmins();
    } catch (err: any) {
      showToast({
        title: "Revocation Failed",
        description: err.message,
        tone: "error",
      });
    }
  };

  const toggleRoleSelection = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  };

  return (
    <div className="px-6 py-5">
      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          {
            label: "Total Staff",
            value: String(subAdmins.length),
            sub: "Administrative Identities",
            icon: Shield,
            color: "#3b82f6", // blue-500
            bgColor: "#eff6ff", // blue-50
          },
          {
            label: "Active Policies",
            value: String(roles.length),
            sub: "Defined RBAC Scopes",
            icon: Key,
            color: "#8a9e60",
            bgColor: "#f4f7ed",
          },
          {
            label: "Super Admins",
            value: String(
              subAdmins.filter((a) =>
                a.roles.some((r) => r.id === "super_admin"),
              ).length,
            ),
            sub: "Unrestricted Access",
            icon: Crown,
            color: "#f59e0b", // amber-500
            bgColor: "#fffbeb", // amber-50
          },
          {
            label: "Unassigned",
            value: String(subAdmins.filter((a) => a.roles.length === 0).length),
            sub: "Requires Policy Mapping",
            icon: Warning,
            color: "#ef4444", // red-500
            bgColor: "#fef2f2", // red-50
          },
        ].map(({ label, value, sub, icon: Icon, color, bgColor }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 leading-tight">
                {label}
              </span>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: bgColor || color + "18" }}
              >
                <Icon size={16} weight="fill" style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Filter bar + Tabs ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
            <Select
              value={searchBy}
              onChange={(val) =>
                setSearchBy(
                  val as (typeof ADMIN_SEARCH_OPTIONS)[number]["value"],
                )
              }
              options={[...ADMIN_SEARCH_OPTIONS]}
              className="bg-transparent text-gray-700 text-xs font-medium outline-none min-w-[120px]"
              dropdownClassName="w-[180px] -left-2"
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-72">
            <MagnifyingGlass size={14} className="text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                ADMIN_SEARCH_OPTIONS.find((option) => option.value === searchBy)
                  ?.placeholder ?? "Search admins"
              }
              className="bg-transparent text-gray-700 placeholder-gray-400 text-xs flex-1 outline-none"
            />
          </div>

          {/* Onboard Admin Button */}
          <button
            onClick={() => setShowInviteModal(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-opacity hover:opacity-90 shrink-0"
            style={{ backgroundColor: "#8a9e60" }}
          >
            <UserPlus size={16} weight="bold" />
            Onboard Admin
          </button>
        </div>

        {/* Status tabs — pill style */}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {(["All", "Active", "Suspended"] as const).map((tab) => (
            <button
              key={tab}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                tab === "All"
                  ? "bg-[#8a9e60] text-white"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="px-4 py-12 text-center text-sm text-gray-400 italic border-t border-gray-100">
              Decrypting Identity Store...
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-gray-400 border-t border-gray-100">
              No identities found. Adjust your search parameters or onboard a
              new administrator to get started.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3 whitespace-nowrap">
                    Identity
                  </th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3 whitespace-nowrap">
                    Current Assignments
                  </th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3 whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3 whitespace-nowrap">
                    Onboarded
                  </th>
                  <th className="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin, i) => {
                  const isCurrentUser = admin.email === session?.email;
                  const isSuper = admin.roles.some(
                    (r) => r.id === "super_admin",
                  );
                  const avatarColor = getAvatarColor(admin.id);

                  return (
                    <tr
                      key={admin.id}
                      className={`hover:bg-gray-50/50 transition-colors ${i < filteredAdmins.length - 1 ? "border-b border-gray-50" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: avatarColor }}
                          >
                            {(admin.name || admin.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-800">
                                {admin.name || admin.email.split("@")[0]}
                              </p>
                              {isCurrentUser && (
                                <span className="text-[8px] bg-[#8a9e60] text-white px-1.5 py-0.5 rounded font-bold">
                                  YOU
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">
                              {admin.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {admin.roles.length === 0 ? (
                            <span className="text-[9px] font-bold text-red-400 bg-red-50 px-2 py-1 rounded-lg border border-red-100 flex items-center gap-1">
                              <Warning size={10} /> Unassigned
                            </span>
                          ) : (
                            admin.roles.map((role) => (
                              <span
                                key={role.id}
                                className={`text-[9px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 ${
                                  role.id === "super_admin"
                                    ? "bg-amber-50 text-amber-600 border-amber-100"
                                    : "bg-blue-50 text-blue-600 border-blue-100"
                                }`}
                              >
                                {role.id === "super_admin" && (
                                  <Crown size={10} weight="fill" />
                                )}
                                {role.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                            admin.status === "active"
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${admin.status === "active" ? "bg-green-500" : "bg-gray-400"}`}
                          />
                          {admin.status.charAt(0).toUpperCase() +
                            admin.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-800">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          ID: {admin.id.slice(0, 8)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right relative">
                        <button
                          onClick={() =>
                            setActiveMenu(
                              activeMenu === admin.id ? null : admin.id,
                            )
                          }
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                        >
                          <DotsThreeVertical size={16} weight="bold" />
                        </button>

                        {activeMenu === admin.id && (
                          <>
                            <div
                              className="fixed inset-0 z-[40]"
                              onClick={() => setActiveMenu(null)}
                            />
                            <div className="absolute right-6 top-10 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-[50] py-1 text-left animate-in fade-in slide-in-from-top-2 duration-200">
                              <button
                                onClick={() => {
                                  setActiveMenu(null);
                                  openRoleAssignment(
                                    admin.id,
                                    admin.roles.map((r) => r.id),
                                  );
                                }}
                                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                              >
                                <UserGear size={16} className="text-gray-400" />
                                Update Assignments
                              </button>
                              <button
                                className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                                onClick={() => setActiveMenu(null)}
                              >
                                <Lock size={16} className="text-gray-400" />
                                Reset Password
                              </button>
                              <div className="h-px bg-gray-100 my-1" />
                              <button
                                onClick={() => {
                                  setActiveMenu(null);
                                  handleDeleteAdmin(admin.id, admin.email);
                                }}
                                disabled={isCurrentUser}
                                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors disabled:opacity-30"
                              >
                                <Prohibit size={16} />
                                Revoke Access
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Invite Modal ── */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-7 max-w-md w-full border border-white/20 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <UserPlus size={24} className="text-blue-500" weight="bold" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Admin Onboarding
                  </h3>
                  <p className="text-xs text-gray-400">
                    Initialize a new secure identity
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserCircle
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                  />
                  <input
                    autoFocus
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-5 py-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8a9e60]/20 focus:border-[#8a9e60] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  Work Email Address
                </label>
                <div className="relative">
                  <Envelope
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                  />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="firstname.lastname@turfinapp.in"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-5 py-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8a9e60]/20 focus:border-[#8a9e60] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                  Initial Password
                </label>
                <div className="relative">
                  <Key
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                  />
                  <input
                    type="password"
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-5 py-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8a9e60]/20 focus:border-[#8a9e60] transition-all"
                  />
                </div>
                <p className="mt-2 text-[10px] text-gray-400 px-1 leading-relaxed">
                  Sub-admins will use this password for their initial login.
                  They can reset it later from their secure settings.
                </p>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 py-4 rounded-2xl border border-gray-100 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={
                  !inviteEmail.includes("@") ||
                  invitePassword.length < 8 ||
                  isSubmitting
                }
                className="flex-1 py-4 rounded-2xl text-sm font-bold text-white shadow-xl shadow-blue-500/10 hover:opacity-90 transition-all disabled:opacity-40 active:scale-95 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#2563eb" }}
              >
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Authorize Identity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assignment Modal ── */}
      {modifyingAdmin && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-7 max-w-lg w-full border border-white/20 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                  <ShieldCheck
                    size={24}
                    className="text-amber-500"
                    weight="bold"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Policy Assignment
                  </h3>
                  <p className="text-xs text-gray-400">
                    Map security roles to this identity
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModifyingAdmin(null)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-gray-400 bg-gray-50 hover:bg-gray-100 transition-all"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 px-1 py-1">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2">
                Available Security Modules
              </label>
              {roles.map((role) => {
                const isSelected = selectedRoleIds.includes(role.id);
                return (
                  <button
                    key={role.id}
                    onClick={() => toggleRoleSelection(role.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                      isSelected
                        ? "bg-[#8a9e60]/5 border-[#8a9e60] shadow-sm"
                        : "bg-white border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-sm shrink-0 border transition-colors ${
                        isSelected
                          ? "bg-[#8a9e60] border-transparent text-white"
                          : "bg-gray-50 border-gray-100 text-transparent"
                      }`}
                    >
                      <Check size={14} weight="bold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-800">
                          {role.name}
                        </p>
                        {role.id === "super_admin" && (
                          <Crown
                            size={12}
                            weight="fill"
                            className="text-amber-500"
                          />
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5 italic line-clamp-1">
                        {role.description || "No policy summary provided."}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex gap-4 shrink-0">
              <button
                onClick={() => setModifyingAdmin(null)}
                className="flex-1 py-4 rounded-2xl border border-gray-100 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
              >
                Discard
              </button>
              <button
                onClick={handleSaveRoles}
                disabled={isSubmitting}
                className="flex-1 py-4 rounded-2xl text-sm font-bold text-white shadow-xl shadow-[#8a9e60]/10 hover:opacity-90 transition-all disabled:opacity-40 active:scale-95 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#8a9e60" }}
              >
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Apply Policies
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
