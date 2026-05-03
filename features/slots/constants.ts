export type SlotStatus =
  | "available"
  | "booked"
  | "blocked"
  | "maintenance"
  | "held"
  | "reserved";

export type BlockReason = string;

export const SLOT_CONFIG_LIMITS = {
  MIN_DURATION: 30,
  MAX_DURATION: 120,
  DURATION_STEP: 15,
  DEFAULT_BOOKING_WINDOW: 7,
  DEFAULT_GENERATION_WINDOW: 30,
  DEFAULT_HOLD_DURATION: 10,
};

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const SLOT_STATUS_LABELS: Record<SlotStatus, string> = {
  available: "Available",
  booked: "Booked",
  blocked: "Blocked",
  maintenance: "Maintenance",
  held: "Held",
  reserved: "Reserved",
};

export const SLOT_STATUS_COLORS: Record<SlotStatus, string> = {
  available: "bg-gray-50 border-gray-100 text-gray-500",
  booked: "bg-[#8a9e60] text-white",
  blocked: "bg-red-50 border-red-200 text-red-500",
  maintenance: "bg-amber-50 border-amber-200 text-amber-600",
  held: "bg-blue-50 border-blue-200 text-blue-600",
  reserved: "bg-purple-50 border-purple-200 text-purple-600",
};
