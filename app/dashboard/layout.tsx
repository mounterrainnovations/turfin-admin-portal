"use client";

import {
  House,
  CalendarBlank,
  Users,
  ChartLineUp,
  Gear,
  MapPin,
  Handshake,
  SignOut,
  List,
  X,
  Bell,
  MagnifyingGlass,
  Key,
  BellRinging,
  DeviceMobile,
  Scroll,
  ShieldCheck,
  Ticket,
} from "@phosphor-icons/react";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import NotificationPanel from "./components/NotificationPanel";
import { AuditLogProvider } from "./audit-log-context";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { useAuth } from "@/features/auth/hooks";

const navItems: any[] = [
  {
    label: "Audit Log",
    icon: Scroll,
    href: "/dashboard/audit",
    requiredPermission: "audit:read",
  },
  { label: "Dashboard", icon: House, href: "/dashboard" },
  {
    label: "Bookings",
    icon: CalendarBlank,
    href: "/dashboard/bookings",
    requiredPermission: "booking:read",
  },
  {
    label: "Vendors",
    icon: Handshake,
    href: "/dashboard/vendors",
    requiredPermission: "vendor:read",
  },
  {
    label: "Fields",
    icon: MapPin,
    href: "/dashboard/fields",
    requiredPermission: "turf:read",
  },
  {
    label: "Users",
    icon: Users,
    href: "/dashboard/users",
    requiredPermission: "user:read",
  },
  {
    label: "Analytics",
    icon: ChartLineUp,
    href: "/dashboard/analytics",
    requiredPermission: "analytics:read",
  },
  {
    label: "Notifications",
    icon: BellRinging,
    href: "/dashboard/notifications",
    requiredPermission: "notification:read",
  },
  {
    label: "App Management",
    icon: DeviceMobile,
    href: "/dashboard/app-management",
    requiredPermission: "app:write",
  },
  { label: "Roles", icon: Key, href: "/dashboard/roles", restricted: true },
  {
    label: "Admins",
    icon: ShieldCheck,
    href: "/dashboard/roles/identities",
    restricted: true,
  },
  {
    label: "Support",
    icon: Ticket,
    href: "/dashboard/support",
    requiredPermission: "support:read",
  },
  {
    label: "Settings",
    icon: Gear,
    href: "/dashboard/settings",
    disabled: true,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAuth();

  return (
    <AuthGuard>
      <AuditLogProvider>
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          {/* Sidebar */}
          <aside
            className="flex flex-col transition-all duration-300 shrink-0"
            style={{
              width: open ? 220 : 64,
              background: "linear-gradient(180deg,#8a9e60 0%,#6e8245 100%)",
            }}
          >
            <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
              <button
                onClick={() => setOpen(!open)}
                className="text-white/80 hover:text-white shrink-0"
              >
                {open ? <X size={20} /> : <List size={20} />}
              </button>
              {open && (
                <span className="text-white font-bold tracking-widest text-sm uppercase">
                  Turfin
                </span>
              )}
            </div>

            <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto scrollbar-hide min-h-0">
              {navItems
                .filter((item) => {
                  // Super admins see everything
                  if (session?.role === "super_admin") return true;

                  // Restricted items are only for super admins
                  if (item.restricted) return false;

                  // If no permission is required, show it
                  if (!item.requiredPermission) return true;

                  // Check if sub-admin has the required permission
                  const userPermissions =
                    (session?.raw as any)?.identity?.permissions || [];
                  return userPermissions.includes(item.requiredPermission);
                })
                .map(({ label, icon: Icon, href, disabled }) => {
                  const active = pathname === href;
                  return (
                    <button
                      key={href}
                      disabled={disabled}
                      onClick={() => !disabled && router.push(href)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left
                  ${disabled ? "opacity-40 cursor-not-allowed" : active ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                    >
                      <Icon
                        size={18}
                        weight={active ? "fill" : "regular"}
                        className="shrink-0"
                      />
                      {open && <span className="truncate">{label}</span>}
                    </button>
                  );
                })}
            </nav>

            <div className="p-2 border-t border-white/10">
              <button
                onClick={logout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/10 hover:text-white w-full transition-colors"
              >
                <SignOut size={18} className="shrink-0" />
                {open && <span>Sign Out</span>}
              </button>
            </div>
          </aside>

          {/* Content shell */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Top bar */}
            <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shrink-0">
              <div>
                <h1 className="text-lg font-semibold text-gray-800 capitalize">
                  {pathname === "/dashboard/audit"
                    ? "Audit Log"
                    : (navItems.find((n) => n.href === pathname)?.label ??
                      "Dashboard")}
                </h1>
                <p className="text-xs text-gray-400">
                  Saturday, March 21, 2026
                </p>
              </div>
              <div className="flex items-center gap-4">
                <NotificationPanel />
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: "#8a9e60" }}
                  >
                    {(session?.displayName ||
                      session?.email ||
                      "A")[0].toUpperCase()}
                  </div>
                  <div className="text-xs leading-tight">
                    <p className="font-semibold text-gray-700">
                      {session?.displayName || session?.email || "Admin"}
                    </p>
                    <p className="text-gray-400">
                      {session?.role === "super_admin"
                        ? "Super Admin"
                        : "System Admin"}
                    </p>
                  </div>
                </div>
              </div>
            </header>

            {/* Page content */}
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </AuditLogProvider>
    </AuthGuard>
  );
}
