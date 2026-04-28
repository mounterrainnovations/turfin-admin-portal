import React, { useState, useEffect } from "react";
import { 
  Clock, 
  CurrencyInr, 
  Calendar, 
  Check, 
  PencilSimple, 
  Trash, 
  Plus,
  CaretLeft,
  CaretRight,
  Warning
} from "@phosphor-icons/react";
import { SlotConfigDayPricing, UpsertSlotConfigPayload } from "../types";
import { DAY_NAMES } from "../constants";
import { minutesToTime, timeToMinutes } from "../utils";

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

  const currentDayPricing = config.weeklyPricing.find(p => p.dayOfWeek === activeDay) || {
    dayOfWeek: activeDay,
    prices: []
  };

  const isWeekend = activeDay === 0 || activeDay === 6;
  const openTime = isWeekend ? config.weekendOpen : config.weekdayOpen;
  const closeTime = isWeekend ? config.weekendClose : config.weekdayClose;

  const handlePriceChange = (index: number, value: string) => {
    const newPrice = parseInt(value) || 0;
    const newWeeklyPricing = config.weeklyPricing.map(dayPricing => {
      if (dayPricing.dayOfWeek === activeDay) {
        const newPrices = [...dayPricing.prices];
        newPrices[index] = newPrice;
        return { ...dayPricing, prices: newPrices };
      }
      return dayPricing;
    });

    onChange({ ...config, weeklyPricing: newWeeklyPricing });
  };

  const handleBulkPriceApply = () => {
    const price = parseInt(bulkPrice);
    if (isNaN(price)) return;

    const newWeeklyPricing = config.weeklyPricing.map(dayPricing => {
      if (dayPricing.dayOfWeek === activeDay) {
        return { ...dayPricing, prices: dayPricing.prices.fill(price) };
      }
      return dayPricing;
    });

    onChange({ ...config, weeklyPricing: newWeeklyPricing });
    setBulkPrice("");
  };

  const getSlotTimes = (index: number) => {
    const startMins = timeToMinutes(openTime) + index * config.slotDurationMins;
    const endMins = startMins + config.slotDurationMins;
    return {
      start: minutesToTime(startMins % (24 * 60)),
      end: minutesToTime(endMins % (24 * 60))
    };
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
              <h4 className="text-sm font-bold text-gray-800">{DAY_NAMES[activeDay]}</h4>
              <p className="text-[10px] text-gray-500 font-medium">
                {openTime} to {closeTime} • {currentDayPricing.prices.length} slots
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">₹</span>
              <input
                type="number"
                placeholder="Bulk Price"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                className="w-24 pl-5 pr-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#8a9e60]"
              />
            </div>
            <button
              onClick={handleBulkPriceApply}
              disabled={!bulkPrice}
              className="px-3 py-1.5 bg-[#8a9e60] text-white text-[10px] font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              APPLY ALL
            </button>
          </div>
        </div>

        {/* Slots Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
          {currentDayPricing.prices.length > 0 ? (
            currentDayPricing.prices.map((price, idx) => {
              const { start, end } = getSlotTimes(idx);
              return (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/30 hover:border-[#8a9e60]/30 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Slot {idx + 1}</span>
                    <span className="text-xs font-bold text-gray-700">{start} - {end}</span>
                  </div>
                  <div className="relative w-24">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => handlePriceChange(idx, e.target.value)}
                      className="w-full pl-5 pr-2 py-1.5 text-xs font-bold text-gray-800 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#8a9e60]"
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-10 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Warning size={32} className="mb-2 opacity-20" />
              <p className="text-xs font-medium">No operating hours defined for this day</p>
              <p className="text-[10px] opacity-60">Slots will appear once you set opening/closing times.</p>
            </div>
          )}
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
