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

export const SLOT_STATUS_COLORS: Record<
  SlotStatus,
  { bg: string; text: string; dot: string; label: string }
> = {
  available: {
    bg: "bg-gray-50 border-gray-100",
    text: "text-gray-500",
    dot: "bg-gray-400",
    label: "Available",
  },
  booked: {
    bg: "bg-[#8a9e60]",
    text: "text-white",
    dot: "bg-white",
    label: "Booked",
  },
  blocked: {
    bg: "bg-red-50 border-red-200",
    text: "text-red-500",
    dot: "bg-red-500",
    label: "Blocked",
  },
  maintenance: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-600",
    dot: "bg-amber-500",
    label: "Maintenance",
  },
  held: {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-600",
    dot: "bg-blue-500",
    label: "Held",
  },
  reserved: {
    bg: "bg-purple-50 border-purple-200",
    text: "text-purple-600",
    dot: "bg-purple-500",
    label: "Reserved",
  },
};
