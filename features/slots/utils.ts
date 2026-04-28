import { SlotConfigDayPricing } from "./types";

/**
 * Converts a time string (HH:mm) to minutes from midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Converts minutes from midnight to a time string (HH:mm)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Generates default pricing for a day based on operating hours and a base price
 */
export function generateDefaultDayPricing(
  dayOfWeek: number,
  openTime: string,
  closeTime: string,
  pricePerHour: number,
  slotDurationMins: number
): SlotConfigDayPricing {
  const startMins = timeToMinutes(openTime);
  let endMins = timeToMinutes(closeTime);

  // Handle case where close time is on the next day (e.g. 02:00)
  if (endMins <= startMins) {
    endMins += 24 * 60;
  }

  const duration = endMins - startMins;
  const slotCount = Math.floor(duration / slotDurationMins);

  const prices = Array(slotCount).fill(pricePerHour);

  return {
    dayOfWeek,
    prices,
  };
}

/**
 * Generates a full weekly pricing config
 */
export function generateDefaultWeeklyPricing(params: {
  weekdayOpen: string;
  weekdayClose: string;
  weekendOpen: string;
  weekendClose: string;
  pricePerHour: number;
  slotDurationMins: number;
}): SlotConfigDayPricing[] {
  const weeklyPricing: SlotConfigDayPricing[] = [];

  for (let day = 0; day < 7; day++) {
    const isWeekend = day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
    const open = isWeekend ? params.weekendOpen : params.weekdayOpen;
    const close = isWeekend ? params.weekendClose : params.weekdayClose;

    weeklyPricing.push(
      generateDefaultDayPricing(
        day,
        open,
        close,
        params.pricePerHour,
        params.slotDurationMins
      )
    );
  }

  return weeklyPricing;
}
