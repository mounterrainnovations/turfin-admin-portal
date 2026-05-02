import React, { useState } from "react";
import { 
  Clock, 
  Calendar, 
  Warning
} from "@phosphor-icons/react";
import { UpsertSlotConfigPayload } from "../types";
import { DAY_NAMES } from "../constants";

interface SlotConfigEditorProps {
  config: UpsertSlotConfigPayload;
  onChange: (config: UpsertSlotConfigPayload) => void;
  isLoading?: boolean;
}

export const SlotConfigEditor: React.FC<SlotConfigEditorProps> = ({
  config,
  onChange,
  isLoading
}) => {
  const [activeDay, setActiveDay] = useState<number>(new Date().getDay()); // Default to today
  const [bulkPrice, setBulkPrice] = useState<string>("");

  const currentDayConfig = config.dailyConfigs?.find(p => p.dayOfWeek === activeDay) || {
    dayOfWeek: activeDay,
    openTime: "06:00",
    closeTime: "22:00",
    pricePaise: 0
  };

  const handleDayChange = (field: "openTime" | "closeTime" | "pricePaise", value: string | number) => {
    const newDailyConfigs = config.dailyConfigs.map(dayConfig => {
      if (dayConfig.dayOfWeek === activeDay) {
        return { ...dayConfig, [field]: value };
      }
      return dayConfig;
    });
    onChange({ ...config, dailyConfigs: newDailyConfigs });
  };



  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Header with Slot Duration */}
      <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-[#8a9e60]" />
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Slot Configuration</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Duration:</label>
          <select 
            value={config.slotDurationMins}
            onChange={(e) => onChange({ ...config, slotDurationMins: parseInt(e.target.value) })}
            className="text-xs font-bold text-[#8a9e60] bg-transparent focus:outline-none cursor-pointer"
          >
            <option value={30}>30 mins</option>
            <option value={45}>45 mins</option>
            <option value={60}>60 mins</option>
            <option value={90}>90 mins</option>
            <option value={120}>120 mins</option>
          </select>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="flex border-b border-gray-100 overflow-x-auto">
        {DAY_NAMES.map((day, index) => (
          <button
            key={day}
            onClick={() => setActiveDay(index)}
            className={`flex-1 min-w-[80px] py-3 text-[11px] font-bold uppercase tracking-tight transition-all border-b-2 ${
              activeDay === index 
                ? "text-[#8a9e60] border-[#8a9e60] bg-[#8a9e60]/5" 
                : "text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Bulk Edit & Day Info */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#8a9e60]/10 p-2 rounded-lg">
              <Calendar size={20} className="text-[#8a9e60]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-800">{DAY_NAMES[activeDay]} Pricing</h4>
              <p className="text-[10px] text-gray-500 font-medium">
                Flat price for the entire day
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Bulk Price"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                className="w-24 pl-5 pr-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#8a9e60]"
              />
            </div>
            <button
              onClick={() => {
                const price = parseFloat(bulkPrice);
                if (isNaN(price)) return;
                const newDailyConfigs = config.dailyConfigs.map(dayConfig => ({
                  ...dayConfig,
                  pricePaise: Math.round(price * 100)
                }));
                onChange({ ...config, dailyConfigs: newDailyConfigs });
                setBulkPrice("");
              }}
              disabled={!bulkPrice}
              className="px-3 py-1.5 bg-[#8a9e60] text-white text-[10px] font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              APPLY ALL DAYS
            </button>
          </div>
        </div>

        {/* Day Config Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Open Time</label>
            <input
              type="time"
              value={currentDayConfig.openTime}
              onChange={(e) => handleDayChange("openTime", e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#8a9e60]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Close Time</label>
            <input
              type="time"
              value={currentDayConfig.closeTime}
              onChange={(e) => handleDayChange("closeTime", e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#8a9e60]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Day Price (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={currentDayConfig.pricePaise / 100}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  handleDayChange("pricePaise", isNaN(val) ? 0 : Math.round(val * 100));
                }}
                className="w-full pl-6 pr-3 py-2 text-xs font-bold text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#8a9e60]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 bg-amber-50 border-t border-amber-100/50 flex items-start gap-2">
        <Warning size={14} className="text-amber-600 mt-0.5 shrink-0" />
        <p className="text-[10px] text-amber-700 leading-relaxed">
          Changes here only update the <b>Slot Configuration</b>. To generate physical slots for booking, visit the <b>Schedule</b> tab after onboarding.
        </p>
      </div>
    </div>
  );
};

