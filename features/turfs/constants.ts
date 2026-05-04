import {
  CheckCircle,
  ClockCountdown,
  WarningCircle,
  FileText,
  XCircle,
  Prohibit,
  Wrench,
} from "@phosphor-icons/react";

export type TurfStatus =
  | "active"
  | "inactive"
  | "pending"
  | "maintenance"
  | "suspended"
  | "banned";

export const STATUS_CONFIG: Record<
  TurfStatus,
  { label: string; cls: string; dot: string; icon: any }
> = {
  active: {
    label: "Active",
    cls: "bg-green-50 text-green-700",
    dot: "bg-green-500",
    icon: CheckCircle,
  },
  inactive: {
    label: "Inactive",
    cls: "bg-gray-50 text-gray-600",
    dot: "bg-gray-400",
    icon: XCircle,
  },
  pending: {
    label: "Pending",
    cls: "bg-amber-50 text-amber-700",
    dot: "bg-amber-400",
    icon: ClockCountdown,
  },
  maintenance: {
    label: "Maintenance",
    cls: "bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
    icon: Wrench,
  },
  suspended: {
    label: "Suspended",
    cls: "bg-slate-100 text-slate-700",
    dot: "bg-slate-500",
    icon: Prohibit,
  },
  banned: {
    label: "Banned",
    cls: "bg-red-100 text-red-800",
    dot: "bg-red-700",
    icon: Prohibit,
  },
};

export const AMENITY_LIST = [
  "parking",
  "flood_lights",
  "washrooms",
  "changing_rooms",
  "showers",
  "drinking_water",
  "cafeteria",
  "equipment_rental",
  "first_aid",
  "wifi",
  "cctv",
  "power_backup",
  "locker_facility",
  "seating_area",
  "practice_nets",
  "scoreboard",
  "warm_up_area",
  "music_system",
  "coaching",
  "referee",
  "covered_turf",
  "indoor_facility",
  "outdoor_facility",
  "bibs_available",
  "prayer_room",
] as const;

export type AmenityType = (typeof AMENITY_LIST)[number];
