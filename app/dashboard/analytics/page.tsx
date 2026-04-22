"use client";

import { ChartLineUp } from "@phosphor-icons/react";

export default function AnalyticsPage() {
  return (
    <div className="px-6 py-5 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ backgroundColor: "#8a9e60" + "18" }}>
        <ChartLineUp size={28} style={{ color: "#8a9e60" }} weight="fill" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Analytics</h2>
      <p className="text-sm text-gray-500 max-w-sm">
        Analytics require booking, revenue, and usage data from the backend. This page will
        be enabled once the corresponding backend modules are implemented.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-xs font-semibold text-gray-400">
        <span className="w-2 h-2 rounded-full bg-gray-300" />
        Coming Soon
      </div>
    </div>
  );
}
