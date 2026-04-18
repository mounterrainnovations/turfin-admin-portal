"use client";

import {
  ShieldCheck, Users, Plus, PencilSimple, Trash, Lock,
  Crown, Check, X, Warning, UserPlus, Key, MagnifyingGlass
} from "@phosphor-icons/react";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoles, usePermissions, useSubAdmins } from "@/features/rbac/hooks";
import * as rbacApi from "@/features/rbac/api";
import { Permission, Role, SubAdmin } from "@/features/rbac/types";
import { useToast } from "@/features/toast/toast-context";
import { getAdminSession } from "@/features/auth/session";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COLOR_OPTIONS = ["#dc2626", "#2563eb", "#8a9e60", "#7c3aed", "#0891b2", "#d97706", "#059669", "#db2777", "#6b7280"];

function getRoleAbbr(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function getRoleColor(id: string, name: string) {
  if (id === "super_admin") return "#dc2626";
  if (id === "sub_admin") return "#2563eb";
  if (name.toLowerCase().includes("ops")) return "#8a9e60";
  if (name.toLowerCase().includes("support")) return "#7c3aed";
  
  // Deterministic color based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLOR_OPTIONS[Math.abs(hash) % COLOR_OPTIONS.length];
}

// ── RBAC Policy Dependencies ────────────────────────────────────────────────

/**
 * Cross-resource dependency map.
 * Format: { [resource]: [required_resource:action] }
 * 
 * If any permission in [resource] is selected, the list of required permissions
 * will be automatically checked and enforced.
 */
const CROSS_RESOURCE_DEPENDENCIES: Record<string, string[]> = {
  turf: ["vendor:read"],
  kyc: ["vendor:read"],
  audit: ["user:read", "vendor:read"],
  turf_docs: ["turf:read"],
  reviews: ["turf:read"],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const session = getAdminSession();
  
  const { roles, isLoading: rolesLoading, refresh: refreshRoles } = useRoles();
  const { permissions, isLoading: permsLoading } = usePermissions();
  const { subAdmins, isLoading: adminsLoading, refresh: refreshAdmins } = useSubAdmins();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"permissions" | "users">("permissions");
  const [editMode, setEditMode] = useState(false);
  const [editedPermIds, setEditedPermIds] = useState<string[]>([]);
  const [permSearch, setPermSearch] = useState("");
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewRole, setShowNewRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default selected role once loaded
  useEffect(() => {
    if (roles.length > 0 && !selectedId) {
      setSelectedId(roles[0].id);
    }
  }, [roles, selectedId]);

  const selected = roles.find(r => r.id === selectedId);
  const roleAdmins = subAdmins.filter(admin => admin.roles.some(r => r.id === selectedId));

  // Group permissions by resource
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    permissions.forEach(p => {
      if (!groups[p.resource]) groups[p.resource] = [];
      groups[p.resource].push(p);
    });
    return groups;
  }, [permissions]);

  // Filtering grouped permissions based on search
  const filteredGroups = useMemo(() => {
    if (!permSearch.trim()) return groupedPermissions;
    const search = permSearch.toLowerCase();
    const filtered: Record<string, Permission[]> = {};
    
    Object.entries(groupedPermissions).forEach(([resource, perms]) => {
      const matching = perms.filter(p => 
        p.action.toLowerCase().includes(search) || 
        resource.toLowerCase().includes(search) ||
        (p.description?.toLowerCase().includes(search))
      );
      if (matching.length > 0) filtered[resource] = matching;
    });
    return filtered;
  }, [groupedPermissions, permSearch]);

  const activePermIds = editMode ? editedPermIds : (selected?.permissions?.map(p => p.id) || []);

  const selectRole = (id: string) => {
    setSelectedId(id);
    setEditMode(false);
    setDetailTab("permissions");
  };

  const startEdit = () => {
    if (!selected) return;
    setEditedPermIds(selected.permissions?.map(p => p.id) || []);
    setEditMode(true);
  };

  const togglePermission = (id: string) => {
    const targetPerm = permissions.find((p) => p.id === id);
    if (!targetPerm) return;

    const isCurrentlyEnabled = editedPermIds.includes(id);
    let newIds = new Set(editedPermIds);
    let addedTags = new Set<string>();

    if (!isCurrentlyEnabled) {
      // --- ENABLING ---
      const toAdd = [id];

      while (toAdd.length > 0) {
        const currentId = toAdd.shift()!;
        if (newIds.has(currentId)) continue;

        newIds.add(currentId);
        const perm = permissions.find(p => p.id === currentId);
        if (!perm) continue;

        // 1. Horizontal Hierarchy (Predecessors within same resource)
        const resourcePerms = permissions
          .filter((p) => p.resource === perm.resource)
          .sort((a, b) => a.action.localeCompare(b.action));
        const targetIndex = resourcePerms.findIndex((p) => p.id === currentId);
        resourcePerms.slice(0, targetIndex).forEach(p => toAdd.push(p.id));

        // 2. Cross-Resource Dependencies
        const deps = CROSS_RESOURCE_DEPENDENCIES[perm.resource] || [];
        deps.forEach(depTag => {
          const [res, act] = depTag.split(":");
          const depPerm = permissions.find(p => p.resource === res && p.action.toLowerCase() === act.toLowerCase());
          if (depPerm && !newIds.has(depPerm.id)) {
            toAdd.push(depPerm.id);
            addedTags.add(`${res}:${act}`);
          }
        });
      }

    } else {
      // --- DISABLING ---
      const toRemove = [id];
      while (toRemove.length > 0) {
        const currentId = toRemove.shift()!;
        if (!newIds.has(currentId)) continue;

        newIds.delete(currentId);
        const perm = permissions.find(p => p.id === currentId);
        if (!perm) continue;

        // 1. Horizontal Hierarchy (Successors within same resource)
        const resourcePerms = permissions
          .filter((p) => p.resource === perm.resource)
          .sort((a, b) => a.action.localeCompare(b.action));
        const targetIndex = resourcePerms.findIndex((p) => p.id === currentId);
        resourcePerms.slice(targetIndex + 1).forEach(p => toRemove.push(p.id));

        // 2. Cross-Resource Dependents (Anything that depends on this permission)
        Object.entries(CROSS_RESOURCE_DEPENDENCIES).forEach(([res, deps]) => {
          const tag = `${perm.resource}:${perm.action.toLowerCase()}`;
          if (deps.includes(tag)) {
            // If we removed a dependency, remove ALL permissions of dependent resource
            permissions.filter(p => p.resource === res).forEach(p => toRemove.push(p.id));
          }
        });
      }
    }

    setEditedPermIds(Array.from(newIds));

    // Toast must be called outside the state updater to avoid setState-in-render
    if (addedTags.size > 0) {
      showToast({
        title: "Policy Dependency Detected",
        description: `Automatically included ${Array.from(addedTags).join(", ")} as required access nodes.`,
        tone: "info"
      });
    }
  };

  const handleSavePermissions = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await rbacApi.updateRolePermissions(selected.id, { permissionIds: editedPermIds });
      showToast({ title: "Permissions Updated", description: `Successfully updated permissions for ${selected.name}`, tone: "success" });
      await refreshRoles();
      setEditMode(false);
    } catch (err: any) {
      showToast({ title: "Failed to update permissions", description: err.message, tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await rbacApi.createRole({ name: newRoleName, description: newRoleDesc });
      showToast({ title: "Role Created", description: `Role "${created.name}" has been created.`, tone: "success" });
      await refreshRoles();
      setSelectedId(created.id);
      setShowNewRole(false);
      setNewRoleName("");
      setNewRoleDesc("");
    } catch (err: any) {
      showToast({ title: "Role Creation Failed", description: err.message, tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await rbacApi.deleteRole(selected.id);
      showToast({ title: "Role Deleted", description: `Role "${selected.name}" has been removed.`, tone: "success" });
      await refreshRoles();
      setSelectedId(roles[0]?.id || null);
      setShowDeleteConfirm(false);
    } catch (err: any) {
      showToast({ title: "Deletion Failed", description: err.message, tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (rolesLoading && roles.length === 0) {
    return <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#8a9e60]/20 border-t-[#8a9e60] rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-400">Syncing RBAC policies...</p>
      </div>
    </div>;
  }

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
              Role-Based Access Control defines security boundaries. Any change here affects platform integrity.
            </p>
          </div>
          <div className="ml-auto shrink-0 text-right">
            <p className="text-[10px] text-red-400">Viewing as</p>
            <p className="text-xs font-bold text-red-600">{session?.email ?? "Administrator"}</p>
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="flex-1 overflow-hidden flex gap-5 p-6 pt-4">

        {/* ── Left: Role list ── */}
        <div className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
          <div className="flex items-center justify-between sticky top-0 bg-[#f8f9fa] z-10 pb-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Portal Roles</p>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/dashboard/roles/identities')}
                className="flex items-center gap-1 text-[11px] font-bold py-1.5 px-2.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-all"
              >
                <Users size={12} weight="bold" /> Identities
              </button>
              <button
                onClick={() => setShowNewRole(true)}
                className="flex items-center gap-1 text-[11px] font-bold py-1.5 px-2.5 rounded-lg text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#8a9e60" }}
              >
                <Plus size={12} weight="bold" /> New Role
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            {roles.map(role => {
              const usersCount = subAdmins.filter(admin => admin.roles.some(r => r.id === role.id)).length;
              const isSelected = role.id === selectedId;
              const roleColor = getRoleColor(role.id, role.name);
              const abbr = getRoleAbbr(role.name);
              const totalPerms = permissions.length;
              const enabledPerms = role.permissions?.length || 0;

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
                      style={{ backgroundColor: roleColor }}
                    >
                      {abbr}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-bold text-gray-800 truncate">{role.name}</p>
                        {role.id === "super_admin" && (
                          <Crown size={11} weight="fill" className="text-amber-400 shrink-0" />
                        )}
                        {role.isSystem && (
                          <span className="text-[8px] bg-gray-100 text-gray-400 px-1 py-0.5 rounded font-bold uppercase leading-none shrink-0 border border-gray-200/50">SYS</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">{usersCount} user{usersCount !== 1 ? "s" : ""}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-2.5">
                      <div className="flex justify-between text-[9px] text-gray-400 mb-1 font-medium">
                        <span>Capabilities</span>
                        <span>{enabledPerms}/{totalPerms}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1">
                        <div
                          className="h-1 rounded-full transition-all duration-500"
                          style={{ width: `${(enabledPerms / totalPerms) * 100}%`, backgroundColor: roleColor }}
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
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Active Back-Office</p>
            <div className="flex -space-x-1.5 mb-2.5">
              {subAdmins.slice(0, 7).map(u => (
                <div
                  key={u.id}
                  className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold shrink-0"
                  style={{ backgroundColor: getRoleColor(u.roles[0]?.id || "", u.roles[0]?.name || "None") }}
                  title={`${u.email}`}
                >
                  {u.email[0].toUpperCase()}
                </div>
              ))}
              {subAdmins.length > 7 && (
                <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-400">
                  +{subAdmins.length - 7}
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-500 font-semibold">
              {subAdmins.length} identities managed
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {subAdmins.filter(u => u.status === "active").length} active admin sessions
            </p>
          </div>
        </div>

        {/* ── Right: Role detail ── */}
        <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm min-w-0">
          {selected ? (
            <>
              {/* Role header */}
              <div className="shrink-0 px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-lg shadow-gray-100"
                    style={{ backgroundColor: getRoleColor(selected.id, selected.name) }}
                  >
                    {getRoleAbbr(selected.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-gray-800">{selected.name}</h2>
                      {selected.id === "super_admin" && <Crown size={15} weight="fill" className="text-amber-400" />}
                      {selected.isSystem && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold uppercase border border-gray-200/50">Core Identity</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 max-w-lg leading-relaxed italic">{selected.description || "No description provided for this role."}</p>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Users size={11} className="text-gray-400" /> {roleAdmins.length} user{roleAdmins.length !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Key size={11} className="text-gray-400" /> {selected.permissions?.length || 0}/{permissions.length} nodes enabled
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {!editMode ? (
                    <>
                      {selected.isSystem ? (
                        <span className="flex items-center gap-1.5 text-[11px] text-gray-400 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 font-medium">
                          <Lock size={11} weight="fill" /> System Protected
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={startEdit}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
                          >
                            <PencilSimple size={13} weight="bold" /> Configure Policy
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 border border-red-100 text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-95"
                          >
                            <Trash size={13} weight="bold" /> Purge
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditMode(false)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
                      >
                        <X size={13} weight="bold" /> Discard
                      </button>
                      <button
                        onClick={handleSavePermissions}
                        disabled={isSubmitting}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all disabled:opacity-50 active:scale-95"
                        style={{ backgroundColor: "#8a9e60" }}
                      >
                        {isSubmitting ? (
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Check size={13} weight="bold" />
                        )}
                        Commit Changes
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100 shrink-0 px-6 bg-gray-50/50">
                {(["permissions", "users"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setDetailTab(t)}
                    className={`py-3 mr-6 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all ${
                      detailTab === t
                        ? "border-[#8a9e60] text-[#8a9e60]"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {t === "users" ? `Identities (${roleAdmins.length})` : "Policy Nodes"}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto">

                {/* ── PERMISSIONS TAB ── */}
                {detailTab === "permissions" && (
                  <div className="p-6">
                    {/* Search bar inside tab */}
                    <div className="relative mb-6">
                      <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input 
                        type="text"
                        placeholder="Search for specific permissions or resources..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8a9e60]/20 focus:border-[#8a9e60] transition-all"
                        value={permSearch}
                        onChange={(e) => setPermSearch(e.target.value)}
                      />
                    </div>

                    <div className="space-y-4">
                      {editMode && (
                        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 shadow-sm shadow-amber-900/5">
                          <Warning size={14} className="text-amber-500 shrink-0 mt-0.5" weight="fill" />
                          <p className="text-xs text-amber-700 font-medium">
                            Configuring Access Matrix for <span className="font-bold underline">{selected.name}</span>.
                            Sub-admins assigned to this role will inherit these changes immediately upon sync.
                          </p>
                        </div>
                      )}

                      {permsLoading ? (
                         <div className="py-12 text-center">
                            <div className="w-8 h-8 border-2 border-[#8a9e60]/20 border-t-[#8a9e60] rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-[11px] font-medium text-gray-400">Loading catalogue...</p>
                         </div>
                      ) : Object.entries(filteredGroups).length === 0 ? (
                        <div className="py-20 text-center">
                          <MagnifyingGlass size={32} className="text-gray-200 mx-auto mb-3" />
                          <p className="text-sm font-semibold text-gray-400">No matching permissions found</p>
                          <p className="text-xs text-gray-300 mt-1">Try searching for resources like &quot;turf&quot;, &quot;user&quot;, or &quot;kyc&quot;</p>
                        </div>
                      ) : Object.entries(filteredGroups).sort(([a], [b]) => a.localeCompare(b)).map(([resource, perms]) => {
                        const enabledInResource = perms.filter(p => activePermIds.includes(p.id)).length;
                        const resourceColor = getRoleColor(resource, resource);

                        return (
                          <div
                            key={resource}
                            className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden"
                          >
                            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/70 border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: resourceColor }} />
                                <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">{resource}</p>
                              </div>
                              <span className="text-[9px] text-gray-400 font-bold bg-white px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">
                                {enabledInResource} / {perms.length} ACTIVE
                              </span>
                            </div>

                            <div className="p-4 flex flex-wrap gap-2">
                              {perms.sort((a, b) => a.action.localeCompare(b.action)).map(p => {
                                const isEnabled = activePermIds.includes(p.id);
                                const canToggle = editMode && !selected.isSystem;
                                
                                return (
                                  <button
                                    key={p.id}
                                    disabled={!canToggle}
                                    onClick={() => togglePermission(p.id)}
                                    title={p.description || ""}
                                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                                      isEnabled
                                        ? "text-white border-transparent"
                                        : canToggle
                                        ? "bg-white border-dashed border-gray-200 text-gray-400 hover:border-[#8a9e60] hover:text-[#8a9e60] hover:bg-[#8a9e60]/5"
                                        : "bg-gray-50/50 border-gray-100 text-gray-300 italic"
                                    } ${canToggle ? "cursor-pointer active:scale-95 shadow-sm" : "cursor-default"}`}
                                    style={isEnabled ? { backgroundColor: getRoleColor(selected.id, selected.name) } : {}}
                                  >
                                    <div className={`p-0.5 rounded-md ${isEnabled ? "bg-white/20" : "bg-gray-100 text-gray-300"}`}>
                                      {isEnabled ? <Check size={10} weight="bold" /> : <X size={10} weight="bold" />}
                                    </div>
                                    {p.action.toUpperCase()}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── USERS TAB (SUB-ADMINS) ── */}
                {detailTab === "users" && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        {roleAdmins.length} identities inherit this role
                      </p>
                      {/* We could add an Assign User modal here later */}
                    </div>

                    {adminsLoading ? (
                       <div className="py-12 text-center">
                          <div className="w-8 h-8 border-2 border-[#8a9e60]/20 border-t-[#8a9e60] rounded-full animate-spin mx-auto mb-3" />
                          <p className="text-[11px] font-medium text-gray-400">Fetching sub-admins...</p>
                       </div>
                    ) : roleAdmins.length === 0 ? (
                      <div className="py-20 text-center bg-gray-50/30 rounded-2xl border border-dashed border-gray-100">
                        <Users size={36} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-semibold text-gray-400">No users assigned yet</p>
                        <p className="text-xs text-gray-300 mt-1">Visit identity management to link users to this role</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {roleAdmins.map(admin => {
                          const isCurrentUser = admin.email === session?.email;
                          return (
                            <div
                              key={admin.id}
                              className={`flex flex-col p-4 rounded-2xl border transition-all ${
                                isCurrentUser
                                  ? "border-[#8a9e60]/25 bg-[#8a9e60]/5 ring-1 ring-[#8a9e60]/10"
                                  : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-md hover:shadow-gray-100"
                              }`}
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-inner"
                                  style={{ backgroundColor: getRoleColor(selected.id, selected.name) }}
                                >
                                  {admin.email[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-gray-800 truncate">{admin.email.split('@')[0]}</p>
                                    {isCurrentUser && (
                                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#8a9e60] text-white">YOU</span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-400 truncate">{admin.email}</p>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${admin.status === 'active' ? 'bg-green-400' : 'bg-gray-300'}`} />
                              </div>
                              
                              <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-[9px] text-gray-400 font-medium uppercase tracking-tight">Joined {new Date(admin.createdAt).toLocaleDateString()}</span>
                                <div className="flex gap-1.5">
                                  <div className="text-[8px] bg-gray-100 text-gray-400 px-2 py-1 rounded font-bold uppercase">ID: {admin.id.slice(0, 8)}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <ShieldCheck size={64} className="text-gray-100 mb-4" weight="light" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">Select a Role</h3>
              <p className="text-sm text-gray-400 max-w-xs">
                Pick a role from the sidebar to view assigned permissions and sub-admins.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── New Role Modal ── */}
      {showNewRole && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-7 max-w-md w-full border border-white/20 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#8a9e60]/10 flex items-center justify-center">
                   <Plus size={20} className="text-[#8a9e60]" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Identify New Role</h3>
              </div>
              <button onClick={() => setShowNewRole(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Role Identifier</label>
                <input
                  autoFocus
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  placeholder="e.g. Regional Field Manager"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8a9e60]/20 focus:border-[#8a9e60] transition-all bg-gray-50/50"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Composition Description</label>
                <textarea
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                  placeholder="Define the scope and responsibilities of this role..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8a9e60]/20 focus:border-[#8a9e60] transition-all bg-gray-50/50 resize-none"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
              <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                 <Key size={12} className="text-blue-500" />
              </div>
              <p className="text-[10px] text-blue-700 font-medium leading-normal">
                New roles are initialized with <span className="font-bold">zero permissions</span>. You must configure its access matrix after creation.
              </p>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowNewRole(false)}
                className="flex-1 py-3 rounded-2xl border border-gray-100 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all font-sans"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleAddRole}
                disabled={!newRoleName.trim() || isSubmitting}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white hover:opacity-90 shadow-lg shadow-[#8a9e60]/20 transition-all disabled:opacity-40 disabled:shadow-none active:scale-95 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#8a9e60" }}
              >
                {isSubmitting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Instantiate Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {showDeleteConfirm && selected && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-7 max-w-sm w-full border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <Trash size={28} className="text-red-500" weight="bold" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Decommission Policy?</h3>
            <p className="text-xs text-gray-500 text-center leading-relaxed mb-6 px-4">
              Are you sure you want to permanently delete the <span className="font-bold text-gray-900">&ldquo;{selected.name}&rdquo;</span> role profile?
            </p>
            
            {roleAdmins.length > 0 && (
              <div className="flex items-center gap-3 bg-red-50/70 border border-red-100 rounded-2xl px-4 py-3 mb-6 ring-1 ring-red-200/50">
                <Warning size={18} className="text-red-500 shrink-0" weight="fill" />
                <p className="text-[11px] text-red-700 font-bold leading-tight">
                  {roleAdmins.length} active identit{roleAdmins.length > 1 ? "ies" : "y"} will immediately lose all associated node capabilities.
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-2xl border border-gray-100 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
                disabled={isSubmitting}
              >
                No, Keep it
              </button>
              <button
                onClick={handleDeleteRole}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmitting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Yes, Purge Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
