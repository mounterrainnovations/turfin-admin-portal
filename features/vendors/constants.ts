import {
  CheckCircle,
  ClockCountdown,
  WarningCircle,
  FileText,
  XCircle,
} from "@phosphor-icons/react";

export type VendorStatus = "active" | "pending" | "banned";
export type KycStatus = "not_started" | "pending" | "in_review" | "verified" | "rejected";
export type BusinessType = "individual" | "company" | "partnership";
export type PayoutCycle = "daily" | "weekly" | "monthly";
export type SportType = "football" | "cricket" | "tennis" | "badminton" | "basketball" | "hockey" | "volleyball" | "kabaddi" | "box_cricket" | "futsal" | "pickleball" | "throwball" | "netball" | "handball" | "dodgeball";
export type SurfaceType = "artificial_turf" | "natural_grass" | "concrete" | "wooden" | "synthetic";

export const KYC_CFG: Record<KycStatus, { label: string; cls: string; icon: any; dot: string }> = {
  verified: { label: "Verified", cls: "bg-green-50 text-green-700", icon: CheckCircle, dot: "bg-green-500" },
  in_review: { label: "In Review", cls: "bg-amber-50 text-amber-700", icon: ClockCountdown, dot: "bg-amber-400" },
  pending: { label: "Pending", cls: "bg-gray-100 text-gray-500", icon: WarningCircle, dot: "bg-gray-400" },
  not_started: { label: "Not Started", cls: "bg-gray-50 text-gray-400", icon: FileText, dot: "bg-gray-300" },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-600", icon: XCircle, dot: "bg-red-500" },
};

export const STATUS_CFG: Record<VendorStatus, { label: string; cls: string; dot: string }> = {
  active: { label: "Active", cls: "bg-green-50 text-green-700", dot: "bg-green-500" },
  pending: { label: "Pending", cls: "bg-amber-50 text-amber-700", dot: "bg-amber-400" },
  banned: { label: "Banned", cls: "bg-red-100 text-red-800", dot: "bg-red-700" },
};

export const SPORT_COLOR: Record<string, string> = {
  football: "bg-blue-50 text-blue-600",
  cricket: "bg-orange-50 text-orange-600",
  tennis: "bg-yellow-50 text-yellow-700",
  badminton: "bg-purple-50 text-purple-600",
  basketball: "bg-red-50 text-red-600",
  hockey: "bg-cyan-50 text-cyan-700",
  volleyball: "bg-pink-50 text-pink-600",
  kabaddi: "bg-lime-50 text-lime-700",
};

export const SPORTS_LIST = [
  "football", "cricket", "tennis", "badminton", "basketball", "hockey", "volleyball", "kabaddi",
  "box_cricket", "futsal", "pickleball", "throwball", "netball", "handball", "dodgeball"
];

export const FACILITIES_LIST = [
  "Parking", "Floodlights", "Changing Rooms", "Cafeteria", "Equipment Rental", "First Aid", "WiFi", "CCTV"
];

export const SURFACE_LIST = ["artificial_turf", "natural_grass", "concrete", "wooden", "synthetic"];

export const STATES_LIST = [
  "Maharashtra", "Karnataka", "Delhi", "Gujarat", "Tamil Nadu", "Telangana", "West Bengal", "Rajasthan", "Uttar Pradesh", "Punjab"
];

export const KYC_DOCS = [
  {
    key: "identityProof",
    label: "Identity Proof",
    hint: "Aadhaar / Passport / Driving License",
  },
  {
    key: "addressProof",
    label: "Address Proof",
    hint: "Utility bill / Bank statement",
  },
  {
    key: "businessRegistration",
    label: "Business Registration",
    hint: "Incorporation cert / Partnership deed",
  },
  {
    key: "gstCertificate",
    label: "GST Certificate",
    hint: "If GST registered",
  },
  {
    key: "cancelledCheque",
    label: "Cancelled Cheque",
    hint: "For bank account verification",
  },
] as const;
