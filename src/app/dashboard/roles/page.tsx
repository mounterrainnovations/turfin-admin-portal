"use client";

import {
  ShieldCheck, Users, Plus, PencilSimple, Trash, Lock,
  Crown, Check, X, Warning, UserPlus, Key,
} from "@phosphor-icons/react";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type PermGroup   = Record<string, boolean>;
type Permissions = Record<string, PermGroup>;

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  abbr: string;
  isSystem: boolean;
  permissions: Permissions;
}

interface PortalUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  roleId: string;
  lastActive: string;
  status: "active" | "inactive";
  joinedAt: string;
}

// ─── Permission Schema ────────────────────────────────────────────────────────
const PERM_SCHEMA: Record<string, { label: string; superOnly?: boolean; actions: string[] }> = {
  dashboard: { label: "Dashboard",     actions: ["View Overview", "View Alerts"] },
  bookings:  { label: "Bookings",      actions: ["View", "Edit", "Cancel Booking", "Issue Refund", "Export"] },
  fields:    { label: "Fields",        actions: ["View", "Approve New", "Edit Details", "Block Slots", "Suspend"] },
  users:     { label: "Users",         actions: ["View", "Edit Profile", "Suspend User", "Delete User"] },
  vendors:   { label: "Vendors",       actions: ["View", "Approve KYC", "Edit Details", "Suspend Vendor"] },
  analytics: { label: "Analytics",     actions: ["View Reports", "Export Data"] },
  settings:  { label: "Settings",      actions: ["View", "Edit"] },
  roles:     { label: "Roles & RBAC",  superOnly: true, actions: ["View", "Create", "Edit", "Delete", "Assign Users"] },
};

// ─── Roles Data ───────────────────────────────────────────────────────────────
const INITIAL_ROLES: Role[] = [
  {
    id: "super_admin", name: "Super Admin", abbr: "SA", color: "#dc2626", isSystem: true,
    description: "Full unrestricted access to all modules including RBAC management. Cannot be modified.",
    permissions: {
      dashboard: { "View Overview": true,  "View Alerts": true  },
      bookings:  { View: true, Edit: true, "Cancel Booking": true, "Issue Refund": true,  Export: true  },
      fields:    { View: true, "Approve New": true, "Edit Details": true, "Block Slots": true, Suspend: true  },
      users:     { View: true, "Edit Profile": true,  "Suspend User": true,  "Delete User": true  },
      vendors:   { View: true, "Approve KYC": true,  "Edit Details": true,  "Suspend Vendor": true  },
      analytics: { "View Reports": true,  "Export Data": true  },
      settings:  { View: true, Edit: true  },
      roles:     { View: true, Create: true, Edit: true, Delete: true, "Assign Users": true },
    },
  },
  {
    id: "admin", name: "Admin", abbr: "AD", color: "#2563eb", isSystem: true,
    description: "Full operational access across all modules. Cannot manage roles or edit platform settings.",
    permissions: {
      dashboard: { "View Overview": true,  "View Alerts": true  },
      bookings:  { View: true, Edit: true, "Cancel Booking": true, "Issue Refund": true,  Export: true  },
      fields:    { View: true, "Approve New": true, "Edit Details": true, "Block Slots": true, Suspend: true  },
      users:     { View: true, "Edit Profile": true,  "Suspend User": true,  "Delete User": false },
      vendors:   { View: true, "Approve KYC": true,  "Edit Details": true,  "Suspend Vendor": true  },
      analytics: { "View Reports": true,  "Export Data": true  },
      settings:  { View: true, Edit: false },
      roles:     { View: false, Create: false, Edit: false, Delete: false, "Assign Users": false },
    },
  },
  {
    id: "ops_manager", name: "Operations Manager", abbr: "OM", color: "#8a9e60", isSystem: false,
    description: "Manages day-to-day bookings, turf field operations, and vendor relationships.",
    permissions: {
      dashboard: { "View Overview": true,  "View Alerts": true  },
      bookings:  { View: true, Edit: true, "Cancel Booking": true, "Issue Refund": false, Export: true  },
      fields:    { View: true, "Approve New": false, "Edit Details": true, "Block Slots": true, Suspend: false },
      users:     { View: true, "Edit Profile": false, "Suspend User": false, "Delete User": false },
      vendors:   { View: true, "Approve KYC": false, "Edit Details": true,  "Suspend Vendor": false },
      analytics: { "View Reports": true,  "Export Data": false },
      settings:  { View: false, Edit: false },
      roles:     { View: false, Create: false, Edit: false, Delete: false, "Assign Users": false },
    },
  },
  {
    id: "support_agent", name: "Support Agent", abbr: "SP", color: "#7c3aed", isSystem: false,
    description: "Handles client and vendor queries. Read-mostly with limited action capabilities.",
    permissions: {
      dashboard: { "View Overview": true,  "View Alerts": true  },
      bookings:  { View: true, Edit: false, "Cancel Booking": false, "Issue Refund": false, Export: false },
      fields:    { View: true, "Approve New": false, "Edit Details": false, "Block Slots": false, Suspend: false },
      users:     { View: true, "Edit Profile": false, "Suspend User": false, "Delete User": false },
      vendors:   { View: true, "Approve KYC": false, "Edit Details": false, "Suspend Vendor": false },
      analytics: { "View Reports": false, "Export Data": false },
      settings:  { View: false, Edit: false },
      roles:     { View: false, Create: false, Edit: false, Delete: false, "Assign Users": false },
    },
  },
  {
    id: "analyst", name: "Analyst", abbr: "AN", color: "#0891b2", isSystem: false,
    description: "Read-only access to analytics and reports. No operational actions permitted.",
    permissions: {
      dashboard: { "View Overview": true,  "View Alerts": false },
      bookings:  { View: true, Edit: false, "Cancel Booking": false, "Issue Refund": false, Export: false },
      fields:    { View: true, "Approve New": false, "Edit Details": false, "Block Slots": false, Suspend: false },
      users:     { View: false, "Edit Profile": false, "Suspend User": false, "Delete User": false },
      vendors:   { View: false, "Approve KYC": false, "Edit Details": false, "Suspend Vendor": false },
      analytics: { "View Reports": true,  "Export Data": true  },
      settings:  { View: false, Edit: false },
      roles:     { View: false, Create: false, Edit: false, Delete: false, "Assign Users": false },
    },
  },
];

// ─── Portal Users ─────────────────────────────────────────────────────────────
const INITIAL_USERS: PortalUser[] = [
  { id: "u1", name: "Arjun Mehta",  email: "arjun@turfin.com",  avatar: "AM", roleId: "super_admin",  lastActive: "Just now",   status: "active",   joinedAt: "Oct 1, 2024"  },
  { id: "u2", name: "Priya Sharma", email: "priya@turfin.com",  avatar: "PS", roleId: "admin",        lastActive: "2h ago",     status: "active",   joinedAt: "Nov 5, 2024"  },
  { id: "u3", name: "Rahul Kumar",  email: "rahul@turfin.com",  avatar: "RK", roleId: "admin",        lastActive: "Yesterday",  status: "active",   joinedAt: "Jan 12, 2025" },
  { id: "u4", name: "Sneha Patel",  email: "sneha@turfin.com",  avatar: "SP", roleId: "ops_manager",  lastActive: "2 days ago", status: "active",   joinedAt: "Feb 3, 2025"  },
  { id: "u5", name: "Vikram Singh", email: "vikram@turfin.com", avatar: "VS", roleId: "ops_manager",  lastActive: "Just now",   status: "active",   joinedAt: "Mar 1, 2025"  },
  { id: "u6", name: "Ananya Das",   email: "ananya@turfin.com", avatar: "AD", roleId: "support_agent",lastActive: "1h ago",     status: "active",   joinedAt: "Apr 10, 2025" },
  { id: "u7", name: "Mohammed Ali", email: "mali@turfin.com",   avatar: "MA", roleId: "support_agent",lastActive: "3 days ago", status: "inactive", joinedAt: "Jun 20, 2025" },
  { id: "u8", name: "Deepa Nair",   email: "deepa@turfin.com",  avatar: "DN", roleId: "analyst",      lastActive: "Yesterday",  status: "active",   joinedAt: "Aug 15, 2025" },
];

const CURRENT_USER_ID = "u1"; // Arjun Mehta — Super Admin (logged in)

// ─── Helpers ──────────────────────────────────────────────────────────────────
function permSummary(perms: Permissions) {
  const all     = Object.values(perms).flatMap(g => Object.values(g));
  const enabled = all.filter(Boolean).length;
  return { enabled, total: all.length };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RolesPage() {
  const [roles, setRoles]           = useState<Role[]>(INITIAL_ROLES);
  const [users]                     = useState<PortalUser[]>(INITIAL_USERS);
  const [selectedId, setSelectedId] = useState<string>("super_admin");
  const [detailTab, setDetailTab]   = useState<"permissions" | "users">("permissions");
  const [editMode, setEditMode]     = useState(false);
  const [editedPerms, setEditedPerms]       = useState<Permissions | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewRole, setShowNewRole]             = useState(false);
  const [newRoleName, setNewRoleName]             = useState("");
  const [newRoleDesc, setNewRoleDesc]             = useState("");

  const selected   = roles.find(r => r.id === selectedId)!;
  const roleUsers  = users.filter(u => u.roleId === selectedId);
  const activePerms = editMode && editedPerms ? editedPerms : selected.permissions;
  const { enabled: permCount, total: totalPerms } = permSummary(selected.permissions);

  function selectRole(id: string) {
    setSelectedId(id);
    setEditMode(false);
    setEditedPerms(null);
    setDetailTab("permissions");
  }

  function startEdit() {
    setEditedPerms(JSON.parse(JSON.stringify(selected.permissions)));
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
    setEditedPerms(null);
  }

  function saveEdit() {
    if (!editedPerms) return;
    setRoles(prev => prev.map(r => r.id === selectedId ? { ...r, permissions: editedPerms } : r));
    setEditMode(false);
    setEditedPerms(null);
  }

  function togglePerm(resource: string, action: string) {
    if (!editedPerms) return;
    setEditedPerms(prev => prev
      ? { ...prev, [resource]: { ...prev[resource], [action]: !prev[resource][action] } }
      : prev
    );
  }

  function deleteRole() {
    setRoles(prev => prev.filter(r => r.id !== selectedId));
    setSelectedId("super_admin");
    setShowDeleteConfirm(false);
  }

  function addRole() {
    if (!newRoleName.trim()) return;
    const id = newRoleName.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
    const blank: Permissions = Object.fromEntries(
      Object.entries(PERM_SCHEMA).map(([k, { actions }]) => [k, Object.fromEntries(actions.map(a => [a, false]))])
    );
    setRoles(prev => [...prev, {
      id, name: newRoleName.trim(), description: newRoleDesc.trim() || "Custom role.",
      color: "#6b7280", abbr: newRoleName.trim().slice(0, 2).toUpperCase(),
      isSystem: false, permissions: blank,
    }]);
    setSelectedId(id);
    setNewRoleName("");
    setNewRoleDesc("");
    setShowNewRole(false);
    setDetailTab("permissions");
  }

  // Role color options
  const COLOR_OPTIONS = ["#dc2626","#2563eb","#8a9e60","#7c3aed","#0891b2","#d97706","#059669","#db2777","#6b7280"];

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Super Admin Guard Banner ── */}
      <div className="shrink-0 px-6 pt-5 pb-0">
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <Lock size={14} className="text-red-500" weight="fill" />
          </div>
          <div>
            <p className="text-xs font-bold text-red-700">Restricted — Super Admin Only</p>
            <p className="text-[11px] text-red-500 mt-0.5">
              This section controls who can see and do what across the entire portal. Misconfigured roles can expose sensitive operations.
            </p>
          </div>
          <div className="ml-auto shrink-0 text-right">
            <p className="text-[10px] text-red-400">Viewing as</p>
            <p className="text-xs font-bold text-red-600">Arjun Mehta (Super Admin)</p>
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="flex-1 overflow-hidden flex gap-5 p-6 pt-4">

        {/* ── Left: Role list ── */}
        <div className="w-64 shrink-0 flex flex-col gap-3 overflow-y-auto">

          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Portal Roles</p>
            <button
              onClick={() => setShowNewRole(true)}
              className="flex items-center gap-1 text-[11px] font-bold py-1.5 px-2.5 rounded-lg text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#8a9e60" }}
            >
              <Plus size={12} weight="bold" /> New Role
            </button>
          </div>

          <div className="space-y-1.5">
            {roles.map(role => {
              const usersCount = users.filter(u => u.roleId === role.id).length;
              const { enabled, total } = permSummary(role.permissions);
              const isSelected = role.id === selectedId;
              return (
                <button
                  key={role.id}
                  onClick={() => selectRole(role.id)}
                  className={`w-full text-left rounded-xl p-3 transition-all border ${
                    isSelected
                      ? "bg-white shadow-sm border-gray-200"
                      : "border-transparent hover:bg-white hover:border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                      style={{ backgroundColor: role.color }}
                    >
                      {role.abbr}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-bold text-gray-800 truncate">{role.name}</p>
                        {role.id === "super_admin" && (
                          <Crown size={11} weight="fill" className="text-amber-400 shrink-0" />
                        )}
                        {role.isSystem && (
                          <span className="text-[8px] bg-gray-100 text-gray-400 px-1 py-0.5 rounded font-bold uppercase leading-none shrink-0">SYS</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">{usersCount} user{usersCount !== 1 ? "s" : ""}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-2.5">
                      <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                        <span>Permissions</span>
                        <span>{enabled}/{total}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1">
                        <div
                          className="h-1 rounded-full transition-all"
                          style={{ width: `${(enabled / total) * 100}%`, backgroundColor: role.color }}
                        />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Users summary card */}
          <div className="bg-white rounded-xl border border-gray-100 p-3.5 mt-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">All Portal Users</p>
            <div className="flex -space-x-1.5 mb-2.5">
              {users.slice(0, 7).map(u => (
                <div
                  key={u.id}
                  className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                  style={{ backgroundColor: roles.find(r => r.id === u.roleId)?.color ?? "#8a9e60" }}
                  title={`${u.name} (${roles.find(r => r.id === u.roleId)?.name})`}
                >
                  {u.avatar}
                </div>
              ))}
              {users.length > 7 && (
                <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-400">
                  +{users.length - 7}
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-500">
              {users.length} users across {roles.length} roles
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {users.filter(u => u.status === "active").length} active · {users.filter(u => u.status === "inactive").length} inactive
            </p>
          </div>
        </div>

        {/* ── Right: Role detail ── */}
        <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm min-w-0">

          {/* Role header */}
          <div className="shrink-0 px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ backgroundColor: selected.color }}
              >
                {selected.abbr}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-gray-800">{selected.name}</h2>
                  {selected.id === "super_admin" && <Crown size={15} weight="fill" className="text-amber-400" />}
                  {selected.isSystem && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold uppercase">System Role</span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 max-w-lg leading-relaxed">{selected.description}</p>
                <div className="flex items-center gap-4 mt-1.5 text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users size={11} /> {roleUsers.length} user{roleUsers.length !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Key size={11} /> {permCount}/{totalPerms} permissions enabled
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {!editMode ? (
                <>
                  {selected.isSystem ? (
                    <span className="flex items-center gap-1.5 text-[11px] text-gray-400 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                      <Lock size={11} /> Cannot modify system role
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={startEdit}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <PencilSimple size={13} /> Edit Permissions
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-500 hover:bg-red-100 transition-colors"
                      >
                        <Trash size={13} /> Delete
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <X size={13} /> Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#8a9e60" }}
                  >
                    <Check size={13} weight="bold" /> Save Changes
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 shrink-0 px-6">
            {(["permissions", "users"] as const).map(t => (
              <button
                key={t}
                onClick={() => setDetailTab(t)}
                className={`py-3 mr-6 text-xs font-bold capitalize border-b-2 transition-colors ${
                  detailTab === t
                    ? "border-[#8a9e60] text-[#8a9e60]"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {t === "users" ? `Assigned Users (${roleUsers.length})` : "Permissions"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">

            {/* ── PERMISSIONS TAB ── */}
            {detailTab === "permissions" && (
              <div className="p-6 space-y-3">

                {editMode && (
                  <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-1">
                    <Warning size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      Editing <span className="font-bold">{selected.name}</span>.
                      Changes apply immediately to all {roleUsers.length} user{roleUsers.length !== 1 ? "s" : ""} with this role.
                      Click permission tags to toggle them.
                    </p>
                  </div>
                )}

                {Object.entries(PERM_SCHEMA).map(([resource, { label, superOnly, actions }]) => {
                  const resourcePerms = activePerms[resource] ?? {};
                  const enabledCount  = actions.filter(a => resourcePerms[a]).length;

                  return (
                    <div
                      key={resource}
                      className={`rounded-xl border p-4 ${
                        superOnly
                          ? "border-red-100 bg-red-50/40"
                          : "border-gray-100 bg-gray-50/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-gray-700">{label}</p>
                          {superOnly && (
                            <span className="text-[9px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded font-bold uppercase leading-none">
                              Super Admin Only
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {enabledCount}/{actions.length} enabled
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {actions.map(action => {
                          const enabled   = !!resourcePerms[action];
                          const canToggle = editMode && !selected.isSystem;
                          return (
                            <button
                              key={action}
                              disabled={!canToggle}
                              onClick={() => togglePerm(resource, action)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all select-none ${
                                enabled
                                  ? "text-white"
                                  : canToggle
                                  ? "bg-white border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600"
                                  : "bg-white border border-gray-100 text-gray-300"
                              } ${canToggle ? "cursor-pointer hover:scale-105" : "cursor-default"}`}
                              style={enabled ? { backgroundColor: selected.color } : {}}
                            >
                              {enabled
                                ? <Check size={10} weight="bold" />
                                : <X size={10} className="opacity-50" />
                              }
                              {action}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── USERS TAB ── */}
            {detailTab === "users" && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    {roleUsers.length} user{roleUsers.length !== 1 ? "s" : ""} assigned
                  </p>
                  <button
                    className="flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#8a9e60" }}
                  >
                    <UserPlus size={13} weight="bold" /> Assign User
                  </button>
                </div>

                {roleUsers.length === 0 ? (
                  <div className="py-20 text-center">
                    <Users size={36} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-400">No users assigned yet</p>
                    <p className="text-xs text-gray-300 mt-1">Use &ldquo;Assign User&rdquo; to add someone to this role</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {roleUsers.map(user => {
                      const isCurrentUser = user.id === CURRENT_USER_ID;
                      const roleInfo = roles.find(r => r.id === user.roleId);
                      return (
                        <div
                          key={user.id}
                          className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                            isCurrentUser
                              ? "border-[#8a9e60]/25 bg-[#8a9e60]/5"
                              : "border-gray-100 bg-gray-50/30 hover:bg-white hover:border-gray-200"
                          }`}
                        >
                          {/* Avatar */}
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                            style={{ backgroundColor: roleInfo?.color ?? "#8a9e60" }}
                          >
                            {user.avatar}
                          </div>

                          {/* Name + email */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                              {isCurrentUser && (
                                <span
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
                                  style={{ backgroundColor: "#8a9e60" }}
                                >
                                  YOU
                                </span>
                              )}
                              <span className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-green-400" : "bg-gray-300"}`} />
                              <span className={`text-[10px] font-medium ${user.status === "active" ? "text-green-500" : "text-gray-400"}`}>
                                {user.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400">{user.email}</p>
                          </div>

                          {/* Last active + joined */}
                          <div className="text-right shrink-0">
                            <p className="text-[11px] font-medium text-gray-600">{user.lastActive}</p>
                            <p className="text-[10px] text-gray-400">Joined {user.joinedAt}</p>
                          </div>

                          {/* Actions */}
                          {isCurrentUser ? (
                            <span title="Cannot change your own role" className="shrink-0">
                              <Lock size={14} className="text-gray-300" />
                            </span>
                          ) : (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Change role"
                              >
                                <PencilSimple size={13} />
                              </button>
                              {selected.id !== "super_admin" && (
                                <button
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors"
                                  title="Remove from role"
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* All users not in this role */}
                {roleUsers.length < users.length && (
                  <div className="mt-6">
                    <p className="text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-3">Other Portal Users</p>
                    <div className="space-y-1.5">
                      {users.filter(u => u.roleId !== selectedId).map(user => {
                        const roleInfo = roles.find(r => r.id === user.roleId);
                        return (
                          <div key={user.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                              style={{ backgroundColor: roleInfo?.color ?? "#8a9e60" }}
                            >
                              {user.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-600 truncate">{user.name}</p>
                              <p className="text-[10px] text-gray-400">{roleInfo?.name}</p>
                            </div>
                            <button
                              className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-[#8a9e60] hover:text-[#8a9e60] transition-colors"
                            >
                              + Assign
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Delete Confirm Modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash size={22} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-gray-800 text-center mb-2">Delete &ldquo;{selected.name}&rdquo;?</h3>
            <p className="text-xs text-gray-500 text-center leading-relaxed mb-2">
              This role will be permanently removed.
            </p>
            {roleUsers.length > 0 && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4">
                <Warning size={13} className="text-red-400 shrink-0" />
                <p className="text-[11px] text-red-600 font-medium">
                  {roleUsers.length} user{roleUsers.length > 1 ? "s" : ""} will lose their role and may lose portal access.
                </p>
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteRole}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                Delete Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Role Modal ── */}
      {showNewRole && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-800">Create New Role</h3>
              <button onClick={() => setShowNewRole(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Role Name</label>
                <input
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  placeholder="e.g. Field Inspector"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                  placeholder="Briefly describe what this role can do..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#8a9e60] transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Badge Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c} className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 mt-4 bg-gray-50 rounded-lg p-2.5">
              The new role will start with <span className="font-semibold">zero permissions</span>. You can configure them after creation.
            </p>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowNewRole(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addRole}
                disabled={!newRoleName.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40"
                style={{ backgroundColor: "#8a9e60" }}
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
