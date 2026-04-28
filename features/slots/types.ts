import { KycStatus, SportType } from "../vendors/constants";
import { FieldStatus } from "../turfs/constants";
import { BlockReason, SlotStatus } from "@/features/slots/constants";

export interface SlotConfigDayPricing {
  dayOfWeek: number;
  prices: number[];
}

export interface SlotConfig {
  fieldId: string;
  slotDurationMins: number;
  weekdayOpen: string;
  weekdayClose: string;
  weekendOpen: string;
  weekendClose: string;
  bookingWindowDays: number;
  generationWindowDays: number;
  holdDurationMinutes: number;
  weeklyPricing: SlotConfigDayPricing[];
  configVersion: number;
  updatedAt: string;
}

export interface UpsertSlotConfigPayload {
  slotDurationMins: number;
  weekdayOpen: string;
  weekdayClose: string;
  weekendOpen: string;
  weekendClose: string;
  bookingWindowDays: number;
  generationWindowDays: number;
  holdDurationMinutes: number;
  weeklyPricing: SlotConfigDayPricing[];
}

export interface AdminSlot {
  slotId: string;
  slotIndex: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  pricePaise: number;
  availability: 'available' | 'unavailable';
  status: SlotStatus;
  blockReason: BlockReason | null;
  holdExpiresAt: string | null;
  isPriceOverridden: boolean;
  configVersion: number;
  heldByBookingId: string | null;
  generatedAt: string;
}

export interface AdminSlotPatchPayload {
  status?: SlotStatus;
  priceOverridePaise?: number;
}

export interface SlotGenerateResponse {
  message: string;
  inserted: number;
}
