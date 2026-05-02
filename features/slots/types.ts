import { KycStatus, SportType } from "../vendors/constants";
import { FieldStatus } from "../turfs/constants";
import { BlockReason, SlotStatus } from "@/features/slots/constants";

export interface SlotDayConfig {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  pricePaise: number;
}

export interface SlotConfig {
  fieldId: string;
  slotDurationMins: number;
  bookingWindowDays: number;
  generationWindowDays: number;
  holdDurationMinutes: number;
  dailyConfigs: SlotDayConfig[];
  configVersion: number;
  updatedAt: string;
}

export interface UpsertSlotConfigPayload {
  slotDurationMins: number;
  dailyConfigs: SlotDayConfig[];
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
  lastCancelledBooking?: {
    bookingId: string;
    cancelledAt: string;
    reason: string | null;
  } | null;
}

export interface AdminSlotPatchPayload {
  status?: SlotStatus;
  blockReason?: BlockReason;
  pricePaise?: number;
}

export interface SlotGenerateResponse {
  message: string;
  inserted: number;
}
