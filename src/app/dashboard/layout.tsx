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
  MagnifyingGlass,
  Key,
  BellRinging,
  Scroll,
  DeviceMobile,
} from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import NotificationPanel from "./components/NotificationPanel";
import { AuditLogProvider } from "./audit-log-context";
import { useSession } from "@/lib/auth";

const disabledItems = [
  "Dashboard",
  "Bookings",
  "Analytics",
  "Notifications",
  "App Management",
  "Settings",
];

const navItems = [
  {
    label: "Audit Log",
    icon: Scroll,
    href: "/dashboard/audit",
    permission: "audit:read",
  },
  { label: "Dashboard", icon: House, href: "/dashboard" }, // Dashboard usually visible to all admins
  {
    label: "Bookings",
    icon: CalendarBlank,
    href: "/dashboard/bookings",
    permission: "booking:read",
  },
  {
    label: "Vendors",
    icon: Handshake,
    href: "/dashboard/vendors",
    permission: "vendor:read",
  },
  {
    label: "Fields",
    icon: MapPin,
    href: "/dashboard/fields",
    permission: "turf:read",
  },
  {
    label: "Users",
    icon: Users,
    href: "/dashboard/users",
    permission: "user:read",
  },
  {
    label: "Analytics",
    icon: ChartLineUp,
    href: "/dashboard/analytics",
    permission: "report:read",
  },
  {
    label: "Notifications",
    icon: BellRinging,
    href: "/dashboard/notifications",
    permission: "notification:read",
  },
  {
    label: "App Management",
    icon: DeviceMobile,
    href: "/dashboard/app-management",
    permission: "app:write",
  },
  { label: "Roles", icon: Key, href: "/dashboard/roles", restricted: true }, // Restricted to super_admin usually
  { label: "Settings", icon: Gear, href: "/dashboard/settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading, signOut, can } = useSession();
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  // Route Protection
  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/");
    }
  }, [session, isLoading, router]);

  if (isLoading || !session) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-[#8a9e60] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Filter nav items based on roles if needed (though only super_admin enters here)
  const filteredNav = navItems.filter((item) => {
    if (item.restricted && !session.roles.includes("super_admin")) return false;
    if (item.permission) {
      const [resource, action] = item.permission.split(":");
      if (!can(resource, action)) return false;
    }
    return true;
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <AuditLogProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
        {/* Sidebar */}
        <aside
          className="flex flex-col transition-all duration-300 shrink-0 shadow-2xl z-20"
          style={{
            width: open ? 240 : 80,
            background: "linear-gradient(180deg,#8a9e60 0%,#6e8245 100%)",
          }}
        >
          <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
            <button
              onClick={() => setOpen(!open)}
              className="text-white/80 hover:text-white shrink-0 transition-transform active:scale-95"
            >
              {open ? (
                <X size={22} weight="bold" />
              ) : (
                <List size={22} weight="bold" />
              )}
            </button>
            {open && (
              <span className="text-white font-black tracking-[0.2em] text-lg uppercase drop-shadow-sm">
                Turfin
              </span>
            )}
          </div>

          <nav className="flex-1 py-6 flex flex-col gap-1.5 px-3 overflow-y-auto custom-scrollbar">
            {filteredNav.map(({ label, icon: Icon, href }) => {
              const active = pathname === href;
              const disabled = disabledItems.includes(label);
              return (
                <button
                  key={href}
                  onClick={() => !disabled && router.push(href)}
                  disabled={disabled}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 w-full text-left group
                  ${active ? "bg-white/15 text-white shadow-lg shadow-black/5" : "text-white/60 hover:bg-white/10 hover:text-white"}
                  ${disabled ? "opacity-40 cursor-not-allowed grayscale" : ""}`}
                >
                  <Icon
                    size={20}
                    weight={active ? "fill" : "regular"}
                    className={`shrink-0 transition-transform ${!disabled && "group-hover:scale-110"} ${active ? "text-white" : "text-white/60"}`}
                  />
                  {open && <span className="tracking-wide">{label}</span>}
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-white/10">
            <button
              onClick={signOut}
              className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-white/60 hover:bg-red-500/10 hover:text-red-300 w-full transition-all group"
            >
              <SignOut
                size={20}
                className="shrink-0 transition-transform group-hover:-translate-x-1"
              />
              {open && <span className="tracking-wide">Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* Content shell */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top bar */}
          <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 shrink-0 shadow-sm z-10">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                {pathname === "/dashboard/audit"
                  ? "Audit Log"
                  : (navItems.find((n) => n.href === pathname)?.label ??
                    "Dashboard")}
              </h1>
              <p className="text-[11px] font-medium text-gray-400 mt-0.5 tracking-wider uppercase">
                {dateStr}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-400 w-64 opacity-50 cursor-not-allowed transition-all">
                <MagnifyingGlass size={16} weight="bold" />
                <input
                  type="text"
                  placeholder="Quick search..."
                  disabled
                  className="bg-transparent border-none outline-none w-full text-gray-700 placeholder:text-gray-300 cursor-not-allowed"
                />
              </div>

              <div className="w-[1px] h-6 bg-gray-200/60" />

              <NotificationPanel disabled />

              <div className="w-[1px] h-6 bg-gray-200/60" />

              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end hidden sm:flex">
                  <p className="text-sm font-bold text-gray-900 leading-tight">
                    {session.email}
                  </p>
                  <p className="text-[10px] font-bold text-[#8a9e60] uppercase tracking-tighter">
                    {session.roles[0] || "User"}
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-lg shadow-[#8a9e60]/20 transition-transform hover:scale-105 cursor-pointer ring-2 ring-white"
                  style={{ backgroundColor: "#8a9e60" }}
                >
                  {session.email.split("@")[0].slice(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto bg-gray-50/50 p-8 custom-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </AuditLogProvider>
  );
}
