"use client";

import {
  Plus, PencilSimple, Trash, Lock,
  Check, UserPlus, Key,
  CircleNotch, EnvelopeSimple, Password, SignOut
} from "@phosphor-icons/react";
import { useState, useMemo } from "react";
import { useRoles, usePermissions, useSubAdmins, rolesApi } from "@/domains/roles/api";
import { useSession } from "@/lib/auth";
import { PermissionListItem, SubAdminListItem } from "@/domains/roles/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────
const COLOR_OPTIONS = ["#dc2626","#2563eb","#8a9e60","#7c3aed","#0891b2","#d97706","#059669","#db2777","#6b7280"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getAbbr(name: string) {
  if (!name) return "??";
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function groupPermissions(permissions: PermissionListItem[]) {
  const grouped: Record<string, PermissionListItem[]> = {};
  permissions.forEach(p => {
    if (!grouped[p.resource]) grouped[p.resource] = [];
    grouped[p.resource].push(p);
  });
  return grouped;
}

// ─── Components ───────────────────────────────────────────────────────────────

export default function RolesPage() {
  const { session } = useSession();
  const queryClient = useQueryClient();

  // API Hooks
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: allPermissions = [], isLoading: permsLoading } = usePermissions();
  const { data: subAdmins = [], isLoading: adminsLoading } = useSubAdmins();

  // State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"permissions" | "users">("permissions");
  const [editMode, setEditMode] = useState(false);
  const [editedPermIds, setEditedPermIds] = useState<string[]>([]);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewRole, setShowNewRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");

  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");

  const [assigningAdmin, setAssigningAdmin] = useState<SubAdminListItem | null>(null);
  const [newRoleIdsForAdmin, setNewRoleIdsForAdmin] = useState<string[]>([]);

  const [showDeleteAdminConfirm, setShowDeleteAdminConfirm] = useState<string | null>(null); // Stores ID of admin to delete


  // Derived
  const selectedRole = roles.find(r => r.id === selectedId) || (roles.length > 0 ? roles[0] : null);
  const effectivelySelectedId = selectedRole?.id;

  const groupedCatalogue = useMemo(() => groupPermissions(allPermissions), [allPermissions]);
  
  // Mutations
  const updatePermsMutation = useMutation({
    mutationFn: (args: { roleId: string; permissionIds: string[] }) => 
      rolesApi.updateRolePermissions(args.roleId, { permissionIds: args.permissionIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      toast.success("Permissions updated");
      setEditMode(false);
    },
    onError: () => toast.error("Failed to update permissions"),
  });

  const createRoleMutation = useMutation({
    mutationFn: (payload: { name: string; description: string }) => 
      rolesApi.createRole(payload),
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      toast.success("Role created");
      setShowNewRole(false);
      setNewRoleName("");
      setNewRoleDesc("");
      setSelectedId(newRole.id);
    },
    onError: () => toast.error("Failed to create role"),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (roleId: string) => rolesApi.deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      toast.success("Role deleted");
      setShowDeleteConfirm(false);
      setSelectedId(null);
    },
    onError: () => toast.error("Failed to delete role"),
  });

  const createAdminMutation = useMutation({
    mutationFn: (payload: { email: string; password?: string }) => 
      rolesApi.createSubAdmin(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "sub-admins"] });
      toast.success("Sub-Admin created");
      setShowCreateAdmin(false);
      setAdminEmail("");
      setAdminPass("");
    },
    onError: () => toast.error("Failed to create sub-admin"),
  });

  const assignRolesMutation = useMutation({
    mutationFn: (payload: { userId: string; roleIds: string[] }) => {
      // Logic: Filter out System Roles from the update payload as the backend
      // only allows managing Custom Roles via this PATCH endpoint.
      const customRoleIds = payload.roleIds.filter(id => {
        const r = roles.find(role => role.id === id);
        return r && !r.isSystem;
      });
      return rolesApi.assignRolesToSubAdmin(payload.userId, { roleIds: customRoleIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "sub-admins"] });
      toast.success("Roles updated");
      setAssigningAdmin(null);
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Failed to assign roles");
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: (id: string) => rolesApi.deleteSubAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "sub-admins"] });
      toast.success("Sub-Admin decommissioned");
      setShowDeleteAdminConfirm(null);
    },
    onError: () => toast.error("Failed to delete sub-admin"),
  });

  // Action helpers
  function startEdit() {
    if (!selectedRole) return;
    setEditedPermIds(selectedRole.permissions.map(p => p.id));
    setEditMode(true);
  }

  function togglePermId(id: string) {
    setEditedPermIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function startAssignRoles(admin: SubAdminListItem) {
    setAssigningAdmin(admin);
    setNewRoleIdsForAdmin(admin.roles.map(r => r.id));
  }

  function toggleRoleIdForAdmin(id: string) {
    setNewRoleIdsForAdmin(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  const isLoading = rolesLoading || permsLoading || adminsLoading;
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <CircleNotch size={40} className="animate-spin text-gray-200" />
      </div>
    );
  }

  const roleUsers = effectivelySelectedId 
    ? subAdmins.filter(u => u.roles.some(r => r.id === effectivelySelectedId))
    : [];

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Security Banner ── */}
      <div className="shrink-0 px-6 pt-5 pb-0">
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <Lock size={14} className="text-red-500" weight="fill" />
          </div>
          <div>
            <p className="text-xs font-bold text-red-700">Restricted — Sub-Admin RBAC</p>
            <p className="text-[11px] text-red-500 mt-0.5">
              Only Super Admins can manage sub-admin roles and dynamic portal permissions.
            </p>
          </div>
          <div className="ml-auto shrink-0 text-right">
            <p className="text-[10px] text-red-400">Logged in as</p>
            <p className="text-xs font-bold text-red-600">
              {session?.email} ({session?.roles.join(", ")})
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex gap-5 p-6 pt-4">

        {/* ── Role List ── */}
        <div className="w-64 shrink-0 flex flex-col gap-3 overflow-y-auto">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Dynamic Roles</p>
            <button
              onClick={() => setShowNewRole(true)}
              className="flex items-center gap-1 text-[11px] font-bold py-1.5 px-2.5 rounded-lg text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#8a9e60" }}
            >
              <Plus size={12} weight="bold" /> New Role
            </button>
          </div>

          <div className="space-y-1.5">
            {roles.map((role, idx) => {
              const count = subAdmins.filter(u => u.roles.some(r => r.id === role.id)).length;
              const isSelected = role.id === effectivelySelectedId;
              return (
                <button
                  key={idx}
                  onClick={() => { setSelectedId(role.id); setEditMode(false); }}
                  className={`w-full text-left rounded-xl p-3 transition-all border ${
                    isSelected ? "bg-white shadow-sm border-gray-200" : "border-transparent hover:bg-white hover:border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                      style={{ backgroundColor: COLOR_OPTIONS[idx % COLOR_OPTIONS.length] }}
                    >
                      {getAbbr(role.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{role.name}</p>
                      <p className="text-[10px] text-gray-400">{count} assigned</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Detail Pane ── */}
        {selectedRole ? (
          <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm min-w-0">
            <div className="shrink-0 px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: COLOR_OPTIONS[roles.indexOf(selectedRole) % COLOR_OPTIONS.length] }}
                >
                  {getAbbr(selectedRole.name)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-800">{selectedRole.name}</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">{selectedRole.description || "Policy settings."}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!editMode ? (
                  <>
                    {!selectedRole.isSystem && (
                      <button onClick={startEdit} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50"><PencilSimple size={14}/></button>
                    )}
                    {!selectedRole.isSystem && (
                      <button onClick={() => setShowDeleteConfirm(true)} className="p-2 rounded-xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-100"><Trash size={14}/></button>
                    )}
                  </>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setEditMode(false)} className="px-3 py-1.5 rounded-lg border text-xs font-bold">Cancel</button>
                    <button 
                      onClick={() => updatePermsMutation.mutate({ roleId: selectedRole.id, permissionIds: editedPermIds })}
                      disabled={updatePermsMutation.isPending}
                      className="px-3 py-1.5 bg-[#8a9e60] text-white rounded-lg text-xs font-bold"
                    >
                       {updatePermsMutation.isPending ? "Saving..." : "Save"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex border-b border-gray-100 px-6 bg-gray-50/10">
              {["permissions", "users"].map(t => (
                <button
                  key={t}
                  onClick={() => setDetailTab(t as "permissions" | "users")}
                  className={`py-3 mr-6 text-xs font-bold capitalize border-b-2 ${detailTab === t ? "border-[#8a9e60] text-[#8a9e60]" : "border-transparent text-gray-400"}`}
                >
                  {t === "users" ? `Assigned Sub-Admins (${roleUsers.length})` : "Capabilities"}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              {detailTab === "permissions" && (
                <div className="p-6 space-y-4">
                  {Object.entries(groupedCatalogue).map(([res, perms]) => (
                    <div key={res} className="p-4 border border-gray-100 rounded-xl">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">{res}</p>
                      <div className="flex flex-wrap gap-2">
                        {perms.map(p => {
                          const active = editMode ? editedPermIds.includes(p.id) : selectedRole.permissions.some(rp => rp.id === p.id);
                          const canToggle = editMode && !selectedRole.isSystem;
                          return (
                            <button
                              key={p.id}
                              disabled={!canToggle}
                              onClick={() => togglePermId(p.id)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                active ? "bg-[#8a9e60] text-white" : "bg-white border border-gray-100 text-gray-400"
                              } ${canToggle ? "cursor-pointer hover:border-[#8a9e60]" : "cursor-default opacity-80"}`}
                            >
                              {p.action}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === "users" && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Policy Enforcement List</p>
                    <button 
                      onClick={() => setShowCreateAdmin(true)}
                      className="flex items-center gap-2 text-[11px] font-bold bg-[#8a9e60] text-white px-3 py-2 rounded-xl"
                    >
                      <UserPlus size={14}/> Create New Sub-Admin
                    </button>
                  </div>

                  <div className="space-y-3">
                    {subAdmins.map(u => (
                      <div key={u.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:bg-gray-50/50">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 border border-gray-100 uppercase">
                          {getAbbr(u.email)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">{u.email}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {u.roles.map(r => (
                              <span key={r.id} className="text-[9px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-100 uppercase">
                                {r.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => startAssignRoles(u)}
                            className="p-2 rounded-xl text-gray-400 hover:text-[#8a9e60] hover:bg-green-50 transition-colors"
                          >
                            <PencilSimple size={16} />
                          </button>
                          <button 
                            onClick={() => setShowDeleteAdminConfirm(u.id)}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-300">
             <Key size={60} weight="thin" />
          </div>
        )}
      </div>

      {/* ── Create Admin Modal ── */}
      {showCreateAdmin && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-7 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-5">Access Provisioning</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Sub-Admin Email</label>
                <div className="relative">
                  <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-900 focus:outline-none focus:border-[#8a9e60] focus:bg-white transition-all font-medium"
                    placeholder="Enter team email"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Portal Password</label>
                <div className="relative">
                  <Password className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="password"
                    value={adminPass}
                    onChange={e => setAdminPass(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-900 focus:outline-none focus:border-[#8a9e60] focus:bg-white transition-all font-medium"
                    placeholder="Provide a temporary password"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowCreateAdmin(false)} className="flex-1 py-3 rounded-2xl font-bold text-xs text-gray-400 hover:bg-gray-50">Cancel</button>
              <button 
                onClick={() => createAdminMutation.mutate({ email: adminEmail, password: adminPass })}
                disabled={!adminEmail || createAdminMutation.isPending}
                className="flex-1 py-3 rounded-2xl bg-[#8a9e60] text-white font-bold text-xs disabled:opacity-50"
              >
                {createAdminMutation.isPending ? "Creating..." : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Roles Modal ── */}
      {assigningAdmin && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-7 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Modify Permissions</h3>
            <p className="text-[11px] text-gray-400 mb-5">Updating access for {assigningAdmin.email}</p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {roles.map(r => {
                const isSystem = r.isSystem;
                const isSelected = newRoleIdsForAdmin.includes(r.id);
                
                return (
                  <button
                    key={r.id}
                    disabled={isSystem}
                    onClick={() => toggleRoleIdForAdmin(r.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isSelected ? "border-[#8a9e60] bg-green-50/30" : "border-gray-50 hover:bg-gray-50 hover:scale-[1.01]"
                    } ${isSystem ? "opacity-60 cursor-not-allowed bg-gray-50 border-transparent shadow-none scale-100" : "active:scale-95 shadow-sm shadow-black/5"}`}
                  >
                    <div className="flex items-center gap-2">
                       {isSystem && <Lock size={12} className="text-gray-400" weight="bold" />}
                       <span className="text-xs font-bold text-gray-700">{r.name}</span>
                       {isSystem && <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400 uppercase tracking-tighter">System</span>}
                    </div>
                    {isSelected && <Check size={14} className="text-[#8a9e60]" weight="bold" />}
                  </button>
                );
              })}
            </div>
            
            <div className="flex gap-3 mt-8">
              <button onClick={() => setAssigningAdmin(null)} className="flex-1 py-3 rounded-2xl font-bold text-xs text-gray-400 hover:bg-gray-50">Discard</button>
              <button 
                onClick={() => assignRolesMutation.mutate({ userId: assigningAdmin.id, roleIds: newRoleIdsForAdmin })}
                className="flex-1 py-3 rounded-2xl bg-[#8a9e60] text-white font-bold text-xs"
              >
                {assignRolesMutation.isPending ? "Updating..." : "Update Roles"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Role Modal ── */}
      {showNewRole && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-7 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-5">Create New Role</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Role Identifier</label>
                <input
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-900 focus:outline-none focus:border-[#8a9e60] focus:bg-white transition-all font-medium"
                  placeholder="e.g. KYC Reviewer"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Functional Scope</label>
                <textarea
                  value={newRoleDesc}
                  onChange={e => setNewRoleDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-gray-900 focus:outline-none focus:border-[#8a9e60] focus:bg-white transition-all resize-none font-medium"
                  placeholder="Briefly describe responsibilities..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowNewRole(false)} className="flex-1 py-3 rounded-2xl font-bold text-xs text-gray-400 hover:bg-gray-50">Cancel</button>
              <button 
                onClick={() => createRoleMutation.mutate({ name: newRoleName, description: newRoleDesc })}
                disabled={!newRoleName || createRoleMutation.isPending}
                className="flex-1 py-3 rounded-2xl bg-[#8a9e60] text-white font-bold text-xs"
              >
                {createRoleMutation.isPending ? "Creating..." : "Define Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Sub-Admin Confirmation ── */}
      {showDeleteAdminConfirm && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-7 max-w-sm w-full text-center border border-gray-100">
             <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SignOut size={24} className="text-red-500" />
             </div>
             <h3 className="text-lg font-bold text-gray-800 mb-2">Revoke Access?</h3>
             <p className="text-[11px] text-gray-400 mb-8 leading-relaxed">
               Decommissioning this sub-admin account will permanently revoke their access to the portal. 
               This action is tracked in the audit log.
             </p>
             
             <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteAdminConfirm(null)} 
                  className="flex-1 py-3 rounded-2xl font-bold text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteAdminMutation.mutate(showDeleteAdminConfirm)}
                  disabled={deleteAdminMutation.isPending}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-200 hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                   {deleteAdminMutation.isPending ? "Revoking..." : "Confirm Revoke"}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-7 max-w-sm w-full text-center">
             <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash size={24} className="text-red-500" />
             </div>
             <h3 className="text-lg font-bold text-gray-800 mb-2">Decommission Role?</h3>
             <p className="text-[11px] text-gray-400 mb-8 leading-relaxed">Removing &ldquo;{selectedRole?.name}&rdquo; will immediately revoke access for all associated sub-admins. This cannot be undone.</p>
             
             <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-2xl font-bold text-xs text-gray-400">Cancel</button>
                <button 
                  onClick={() => deleteRoleMutation.mutate(effectivelySelectedId!)}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-200"
                >
                   {deleteRoleMutation.isPending ? "Deleting..." : "Confirm Delete"}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
