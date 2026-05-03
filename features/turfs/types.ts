import { SportType, SurfaceType, KycStatus } from "../vendors/constants";
import { TurfStatus, AmenityType } from "./constants";

export interface TurfAddress {
  label?: string;
  pinCode: string;
  city: string;
  state: string;
  country: string;
  houseNumber?: string;
  floor?: string;
  towerBlock?: string;
  landmark?: string;
  contactName?: string;
  contactPhone?: string;
  latitude?: number;
  longitude?: number;
  googleMapsLink?: string;
}

export interface TurfRatingSummary {
  avgScore: number;
  totalReviews: number;
}

export interface ReviewUser {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
}

export interface TurfReview {
  id: string;
  userId: string;
  turfId: string;
  bookingId: string;
  score: number;
  comment?: string;
  user?: ReviewUser;
  createdAt: string;
}

export interface Turf {
  id: string;
  arenaId: string;
  name: string;
  sport: SportType;
  amenities: AmenityType[];
  capacity?: number;
  sizeFormat?: string;
  surfaceType: SurfaceType;
  address: TurfAddress;
  weekdayOpen: string;
  weekdayClose: string;
  weekendOpen: string;
  weekendClose: string;
  standardPricePaise: number;
  pricePerHour?: number;
  status: TurfStatus;
  kycStatus?: KycStatus;
  verification?: Record<string, boolean>;
  reviewerNotes?: string;
  
  // Relations/Includes
  vendorId?: string;
  vendorBusinessName?: string;
  vendorPhone?: string;
  vendorWhatsapp?: string;
  turfPhotos?: string[];
  createdAt?: string;
  updatedAt?: string;
  
  vendor?: {
    id: string;
    businessName: string;
    ownerFullName: string;
    phone: string;
    email?: string;
  };
  
  // UI helper fields (calculated or from analytics)
  rating?: number;
  totalReviews?: number;
  ratingSummary?: TurfRatingSummary;
  todayBookings?: number;
  totalBookings?: number;
  totalRevenue?: number;
  totalRevenuePaise?: number;
  listedAt?: string;
  description?: string;
  // Backend returns KYC data nested under 'kyc' key (TurfResponseDto.kyc = TurfDocumentsResponseDto)
  kyc?: {
    id?: string;
    turfId?: string;
    status: KycStatus;
    verification: Record<string, boolean>;
    documents: {
      propertyDocument?: string;
      municipalNoc?: string;
      liabilityInsurance?: string;
      turfPhotos?: string[];
    };
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    submittedAt?: string | null;
  };
  // Legacy / fallback shape (kept for compat)
  documents?: {
    status: KycStatus;
    verification: Record<string, boolean>;
    documents: {
      propertyDocument?: string;
      municipalNoc?: string;
      liabilityInsurance?: string;
      turfPhotos?: string[];
    };
  };
}

export interface CreateTurfDto {
  arenaId: string;
  name: string;
  sport: SportType;
  surfaceType: SurfaceType;
  standardPricePaise: number;
  capacity?: number;
  sizeFormat?: string;
}

export interface UpdateTurfDto extends Partial<CreateTurfDto> {
  status?: TurfStatus;
}

export interface TurfDocumentsDto {
  propertyDocument?: string;
  municipalNoc?: string;
  liabilityInsurance?: string;
  turfPhotos?: string[];
}

export interface SubmitTurfDocumentsDto {
  documents: TurfDocumentsDto;
}

export interface TurfReviewDto {
  status: "active" | "rejected" | "pending-resubmission" | "verified" | "in_review" | "pending";
  reviewerNotes?: string;
  verification?: Record<string, boolean>;
}

export interface TurfListResult {
  items: Turf[];
  total: number;
}
