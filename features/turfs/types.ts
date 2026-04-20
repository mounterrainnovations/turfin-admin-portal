import { SportType, SurfaceType, KycStatus } from "../vendors/constants";
import { FieldStatus, AmenityType } from "./constants";

export interface TurfAddress {
  type: "home" | "work" | "other";  // Required by TurfAddressDto
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

export interface Turf {
  id: string;
  name: string;
  sports: SportType[];
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
  status: FieldStatus;
  kycStatus?: KycStatus;
  verification?: Record<string, boolean>;
  reviewerNotes?: string;
  
  // Relations/Includes
  vendorId?: string;
  vendorBusinessName?: string;
  vendorPhone?: string;
  vendorWhatsapp?: string;
  fieldPhotos?: string[];
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
  todayBookings?: number;
  totalBookings?: number;
  totalRevenue?: number;
  totalRevenuePaise?: number;
  listedAt?: string;
  description?: string;
  // Backend returns KYC data nested under 'kyc' key (TurfResponseDto.kyc = TurfDocumentsResponseDto)
  kyc?: {
    id?: string;
    fieldId?: string;
    status: KycStatus;
    verification: Record<string, boolean>;
    documents: {
      propertyDocument?: string;
      municipalNoc?: string;
      liabilityInsurance?: string;
      fieldPhotos?: string[];
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
      fieldPhotos?: string[];
    };
  };
}

export interface CreateTurfDto {
  name: string;
  sports: SportType[];
  surfaceType: SurfaceType;
  address: TurfAddress;
  weekdayOpen: string;
  weekdayClose: string;
  weekendOpen: string;
  weekendClose: string;
  standardPricePaise: number;
  cancellationWindowHrs?: number;
  amenities?: AmenityType[];
  capacity?: number;
  sizeFormat?: string;
}

export interface UpdateTurfDto extends Partial<CreateTurfDto> {
  status?: FieldStatus;
}

export interface TurfDocumentsDto {
  propertyDocument?: string;
  municipalNoc?: string;
  liabilityInsurance?: string;
  fieldPhotos?: string[];
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
