import { SportType, SurfaceType } from "../vendors/constants";
import { FieldStatus, AmenityType } from "./constants";

export interface TurfAddress {
  type: string;
  pinCode: string;
  city: string;
  state: string;
  country: string;
  houseNumber?: string;
  floor?: string;
  towerBlock?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  googleMapsLink?: string;
  contactName?: string;
  contactPhone?: string;
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
  totalRevenuePaise?: number;
  listedAt?: string;
  description?: string;
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
  amenities?: AmenityType[];
  capacity?: number;
  sizeFormat?: string;
  documents?: {
    propertyDocument?: string;
    municipalNoc?: string;
    liabilityInsurance?: string;
    fieldPhotos?: string[];
  };
}

export interface UpdateTurfDto extends Partial<CreateTurfDto> {
  status?: FieldStatus;
}

export interface TurfReviewDto {
  status: "active" | "rejected" | "pending-resubmission";
  reviewerNotes?: string;
  verification?: Record<string, boolean>;
}

export interface TurfListResult {
  items: Turf[];
  total: number;
}
