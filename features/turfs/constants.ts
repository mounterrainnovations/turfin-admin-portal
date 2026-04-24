import {
  CheckCircle,
  ClockCountdown,
  WarningCircle,
  FileText,
  XCircle,
  Prohibit,
  Wrench,
} from "@phosphor-icons/react";

export type FieldStatus =
  | "active"
  | "inactive"
  | "pending"
  | "maintenance"
  | "suspended"
  | "banned";

export const STATUS_CONFIG: Record<
  FieldStatus,
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
  "changing_room",
  "cafeteria",
  "equipment_rental",
  "first_aid",
  "wifi",
  "cctv",
  "drinking_water",
  "indoor_facility",
  "outdoor_facility",
  "covered_turf",
  "ground_size",
  "sport_type_supported",
  "proper_markings",
  "multi_sport_facility",
  "practice_nets",
  "court_quality",
  "floodlights_night_play",
  "power_backup",
  "day_night_availability",
  "washrooms",
  "changing_rooms",
  "showers",
  "seating_dugout",
  "locker_facility",
  "clean_environment",
  "easy_location_access",
  "nearby_public_transport",
  "security_presence",
  "verified_safe_turf",
  "equipment_available",
  "referee_umpire",
  "scoreboard",
  "warm_up_area",
  "coaching_available",
  "tournament_hosting",
  "event_hosting",
  "music_system",
  "night_ambiance_lighting",
  "snacks_cafe",
  "energy_drinks",
  "online_booking",
  "real_time_availability",
  "digital_payments_upicard",
  "booking_confirmation_reminders",
  "ratings_reviews",
  "open_matches",
  "player_matching",
  "team_bookings",
  "membership_plans",
  "corporate_bookings",
] as const;

export type AmenityType = (typeof AMENITY_LIST)[number];
