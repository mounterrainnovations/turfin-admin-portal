"use client";

import {
  UserPlus, UserCircle, Envelope, Shield,
  MagnifyingGlass, DotsThreeVertical, X, Check,
  Warning, Trash, Lock, Key, Prohibit,
  ArrowCounterClockwise, ShieldCheck, Crown,
  UserGear, Info
} from "@phosphor-icons/react";
import { useState, useMemo } from "react";
import { useSubAdmins, useRoles } from "@/features/rbac/hooks";
import * as rbacApi from "@/features/rbac/api";
import { useToast } from "@/features/toast/toast-context";
import { getAdminSession } from "@/features/auth/session";

// ── Components & Helpers ──────────────────────────────────────────────────────

function getAvatarColor(id: string) {
  const colors = ["#8a9e60", "#6e8245", "#2563eb", "#7c3aed", "#d97706", "#059669", "#db2777"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function IdentityManagementPage() {
  const { showToast } = useToast();
  const session = getAdminSession();
  
  const { subAdmins, isLoading, refresh: refreshAdmins } = useSubAdmins();
  const { roles, isLoading: rolesLoading } = useRoles();

  const [search, setSearch] = useState("");
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
    return subAdmins.filter(admin => 
      admin.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [subAdmins, search]);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || invitePassword.length < 8) return;
    setIsSubmitting(true);
    try {
      await rbacApi.createSubAdmin({ 
        email: inviteEmail, 
        password: invitePassword,
        name: inviteName.trim() || undefined
      });
      showToast({ title: "Invitation Sent", description: `Administrative identity created for ${inviteEmail}`, tone: "success" });
      setInviteEmail("");
      setInviteName("");
      setInvitePassword("");
      setShowInviteModal(false);
      refreshAdmins();
    } catch (err: any) {
      showToast({ title: "Invite Failed", description: err.message, tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRoleAssignment = (adminId: string, currentRoleIds: string[]) => {
    setModifyingAdmin(adminId);
    // Filter out any system roles from the initial selection.
    // System roles should not be sent back to the custom role assignment endpoint.
    const assignableRoleIds = currentRoleIds.filter(id => roles.some(r => r.id === id));
    setSelectedRoleIds(assignableRoleIds);
    setActiveMenu(null);
  };

  const handleSaveRoles = async () => {
    if (!modifyingAdmin) return;
    setIsSubmitting(true);
    try {
      // Ensure we only send custom role IDs to the backend.
      // Backend forbids passing system roles like 'sub_admin' via this endpoint.
      const payloadRoleIds = selectedRoleIds.filter(id => roles.some(r => r.id === id));
      await rbacApi.assignRolesToSubAdmin(modifyingAdmin, { roleIds: payloadRoleIds });
      showToast({ title: "Identity Updated", description: "Roles successfully reassigned", tone: "success" });
      setModifyingAdmin(null);
      refreshAdmins();
    } catch (err: any) {
      showToast({ title: "Assignment Failed", description: err.message, tone: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to revoke administrative access for ${email}?`)) return;
    try {
      await rbacApi.deleteSubAdmin(id);
      showToast({ title: "Access Revoked", description: "Identity purged from back-office", tone: "success" });
      refreshAdmins();
    } catch (err: any) {
      showToast({ title: "Revocation Failed", description: err.message, tone: "error" });
    }
  };

  const toggleRoleSelection = (roleId: string) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden">
      
      {/* Header section */}
      <div className="flex items-end justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Identity Management</h2>
          <p className="text-sm text-gray-400 mt-1">Manage back-office personnel and their security associations.</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white font-bold text-sm shadow-lg shadow-[#8a9e60]/20 hover:opacity-90 transition-all active:scale-95"
          style={{ backgroundColor: "#8a9e60" }}
        >
          <UserPlus size={18} weight="bold" />
          Onboard Admin
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Staff</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Shield size={16} className="text-blue-500" weight="fill" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{subAdmins.length}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Administrative Identities</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Policies</span>
            <div className="w-8 h-8 rounded-xl bg-[#8a9e60]/5 flex items-center justify-center">
              <Key size={16} className="text-[#8a9e60]" weight="fill" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{roles.length}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Defined RBAC Scopes</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Super Admins</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Crown size={16} className="text-amber-500" weight="fill" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {subAdmins.filter(a => a.roles.some(r => r.id === 'super_admin')).length}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">Unrestricted Access</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unassigned</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <Warning size={16} className="text-red-500" weight="fill" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {subAdmins.filter(a => a.roles.length === 0).length}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">Requires Policy Mapping</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm">
        
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 flex-1 max-w-sm">
            <MagnifyingGlass size={18} className="text-gray-400" />
            <input 
              placeholder="Search by email or identity hash..."
              className="bg-transparent border-none outline-none text-sm text-gray-700 w-full placeholder:text-gray-400 font-medium"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">Filtering</span>
            {['All', 'Active', 'Suspended'].map(filter => (
               <button key={filter} className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${filter === 'All' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}>{filter}</button>
            ))}
          </div>
        </div>

        {/* Table/Grid Container */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
               <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-[#8a9e60]/20 border-t-[#8a9e60] rounded-full animate-spin" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Decrypting Identity Store...</p>
               </div>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-12">
               <UserCircle size={64} weight="light" className="text-gray-100 mb-4" />
               <h3 className="text-lg font-bold text-gray-800">No identities found</h3>
               <p className="text-sm text-gray-400 max-w-xs text-center mt-2">Adjust your search parameters or onboard a new administrator to get started.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50 sticky top-0 bg-white/80 backdrop-blur-md z-10 font-bold text-[10px] text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-4">Identity</th>
                  <th className="px-6 py-4">Current Assignments</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Onboarded</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredAdmins.map(admin => {
                  const isCurrentUser = admin.email === session?.email;
                  const isSuper = admin.roles.some(r => r.id === 'super_admin');
                  const avatarColor = getAvatarColor(admin.id);

                  return (
                    <tr key={admin.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-lg shadow-gray-100 shrink-0"
                            style={{ backgroundColor: avatarColor }}
                          >
                            {(admin.name || admin.email)[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                               <p className="text-sm font-bold text-gray-800">{admin.name || admin.email.split('@')[0]}</p>
                               {isCurrentUser && <span className="text-[8px] bg-[#8a9e60] text-white px-1.5 py-0.5 rounded font-black">SELF</span>}
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium">{admin.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-1.5">
                          {admin.roles.length === 0 ? (
                            <span className="text-[9px] font-bold text-red-400 bg-red-50 px-2 py-1 rounded-lg border border-red-100 flex items-center gap-1">
                               <Warning size={10} /> Unassigned
                            </span>
                          ) : (
                            admin.roles.map(role => (
                               <span key={role.id} className={`text-[9px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 ${
                                 role.id === 'super_admin' 
                                 ? 'bg-amber-50 text-amber-600 border-amber-100' 
                                 : 'bg-blue-50 text-blue-600 border-blue-100'
                               }`}>
                                 {role.id === 'super_admin' && <Crown size={10} weight="fill" />}
                                 {role.name}
                               </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                         <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                           admin.status === 'active' 
                           ? 'bg-green-50 text-green-600 border-green-100' 
                           : 'bg-gray-50 text-gray-500 border-gray-100'
                         }`}>
                           <span className={`w-1.5 h-1.5 rounded-full ${admin.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                           {admin.status.toUpperCase()}
                         </span>
                      </td>
                      <td className="px-6 py-5">
                         <p className="text-xs text-gray-500 font-medium">{new Date(admin.createdAt).toLocaleDateString()}</p>
                         <p className="text-[9px] text-gray-300 font-mono">ID: {admin.id.slice(0, 8)}</p>
                      </td>
                      <td className="px-6 py-5 text-right relative">
                         <button 
                           onClick={() => setActiveMenu(activeMenu === admin.id ? null : admin.id)}
                           className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all active:scale-90"
                         >
                            <DotsThreeVertical size={20} weight="bold" />
                         </button>

                         {activeMenu === admin.id && (
                           <>
                             <div className="fixed inset-0 z-20" onClick={() => setActiveMenu(null)} />
                             <div className="absolute right-6 top-14 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 z-30 overflow-hidden py-1.5 text-left animate-in fade-in slide-in-from-top-2 duration-200">
                               <button 
                                 onClick={() => openRoleAssignment(admin.id, admin.roles.map(r => r.id))}
                                 className="w-full px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                               >
                                 <UserGear size={16} className="text-blue-500" />
                                 Update Assignments
                               </button>
                               <button 
                                 className="w-full px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                                 onClick={() => setActiveMenu(null)}
                               >
                                 <Lock size={16} className="text-amber-500" />
                                 Reset Password
                               </button>
                               <div className="h-px bg-gray-50 my-1.5" />
                               <button 
                                 onClick={() => {
                                   setActiveMenu(null);
                                   handleDeleteAdmin(admin.id, admin.email);
                                 }}
                                 disabled={isCurrentUser}
                                 className="w-full px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors disabled:opacity-30"
                               >
                                 <Prohibit size={16} />
                                 Revoke Access
                               </button>
                             </div>
                           </>
                         )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* FOOTER INFO */}
      <div className="flex items-center gap-2 px-1">
        <Info size={14} className="text-[#8a9e60]" weight="fill" />
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
           Sub-Admins must be assigned at least one role to access restricted dashboard segments.
        </p>
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
                   <h3 className="text-lg font-bold text-gray-800">Admin Onboarding</h3>
                   <p className="text-xs text-gray-400">Initialize a new secure identity</p>
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
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Full Name</label>
                <div className="relative">
                  <UserCircle size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    autoFocus
                    type="text"
                    value={inviteName}
                    onChange={e => setInviteName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-5 py-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8a9e60]/20 focus:border-[#8a9e60] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Work Email Address</label>
                <div className="relative">
                  <Envelope size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="firstname.lastname@turfinapp.in"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-5 py-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8a9e60]/20 focus:border-[#8a9e60] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Initial Password</label>
                <div className="relative">
                  <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input
                    type="password"
                    value={invitePassword}
                    onChange={e => setInvitePassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-5 py-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8a9e60]/20 focus:border-[#8a9e60] transition-all"
                  />
                </div>
                <p className="mt-2 text-[10px] text-gray-400 px-1 leading-relaxed">
                  Sub-admins will use this password for their initial login. They can reset it later from their secure settings.
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
                disabled={!inviteEmail.includes('@') || invitePassword.length < 8 || isSubmitting}
                className="flex-1 py-4 rounded-2xl text-sm font-bold text-white shadow-xl shadow-blue-500/10 hover:opacity-90 transition-all disabled:opacity-40 active:scale-95 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#2563eb" }}
              >
                {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
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
                   <ShieldCheck size={24} className="text-amber-500" weight="bold" />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-gray-800">Policy Assignment</h3>
                   <p className="text-xs text-gray-400">Map security roles to this identity</p>
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
               <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2">Available Security Modules</label>
               {roles.map(role => {
                 const isSelected = selectedRoleIds.includes(role.id);
                 return (
                   <button
                    key={role.id}
                    onClick={() => toggleRoleSelection(role.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                      isSelected 
                      ? 'bg-[#8a9e60]/5 border-[#8a9e60] shadow-sm' 
                      : 'bg-white border-gray-100 hover:border-gray-200'
                    }`}
                   >
                     <div className={`w-6 h-6 rounded-lg flex items-center justify-center shadow-sm shrink-0 border transition-colors ${
                       isSelected ? 'bg-[#8a9e60] border-transparent text-white' : 'bg-gray-50 border-gray-100 text-transparent'
                     }`}>
                        <Check size={14} weight="bold" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2">
                         <p className="text-sm font-bold text-gray-800">{role.name}</p>
                         {role.id === 'super_admin' && <Crown size={12} weight="fill" className="text-amber-500" />}
                       </div>
                       <p className="text-[10px] text-gray-500 mt-0.5 italic line-clamp-1">{role.description || "No policy summary provided."}</p>
                     </div>
                   </button>
                 )
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
                {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Apply Policies
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
