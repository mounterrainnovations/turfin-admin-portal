"use client";

import { useState } from "react";
import { Bell, CheckCircle, Storefront, CalendarCheck, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "booking" | "system" | "vendor";
}

export default function NotificationPanel({ disabled }: { disabled?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "booking": return <CalendarCheck size={18} className="text-blue-500" weight="fill" />;
      case "vendor": return <Storefront size={18} className="text-[#8a9e60]" weight="fill" />;
      case "system": return <WarningCircle size={18} className="text-amber-500" weight="fill" />;
    }
  };

  const getIconBg = (type: Notification["type"]) => {
    switch (type) {
      case "booking": return "bg-blue-50";
      case "vendor": return "bg-[#8a9e60]/10";
      case "system": return "bg-amber-50";
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger */}
      <button 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`relative text-gray-400 hover:text-gray-600 transition-colors p-1 ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        title={disabled ? "Notifications disabled" : "Notifications"}
      >
        <Bell size={20} />
        {!disabled && unreadCount > 0 && (
          <span className="absolute -top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {/* Click-away overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 z-50 overflow-hidden origin-top-right animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[10px] font-semibold text-[#8a9e60] hover:text-[#6e8245] flex items-center gap-1 transition-colors"
              >
                <CheckCircle size={12} weight="bold" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-3 flex gap-3 hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-[#8a9e60]/5' : ''}`}
                >
                  <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getIconBg(notif.type)}`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5 w-full">
                      <p className={`text-xs font-semibold truncate pr-2 ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[9px] font-medium text-gray-400 shrink-0 whitespace-nowrap mt-0.5">
                        {notif.time}
                      </span>
                    </div>
                    <p className={`text-[10px] leading-snug line-clamp-2 ${!notif.read ? 'text-gray-600' : 'text-gray-500'}`}>
                      {notif.message}
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="shrink-0 flex items-center pr-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#8a9e60]" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50/50 p-2">
            <Link 
              href="/dashboard/notifications" 
              onClick={() => setIsOpen(false)}
              className="block w-full text-center text-xs font-medium text-gray-600 hover:text-gray-900 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
