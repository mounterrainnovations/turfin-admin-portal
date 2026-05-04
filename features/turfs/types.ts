import { SportType, SurfaceType } from "../vendors/constants";
import { TurfStatus } from "./constants";

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
  capacity?: number;
  sizeFormat?: string;
  surfaceType: SurfaceType;
  address: TurfAddress;
  weekdayOpen: string;
  weekdayClose: string;
  weekendOpen: string;
  weekendClose: string;
  standardPricePaise: number;
  cancellationWindowHrs?: number;
  pricePerHour?: number;
  status: TurfStatus;

  // Relations/Includes
  vendorId: string;
  arenaName?: string;
  arenaStatus?: TurfStatus;
  arenaKycStatus?: string;
  vendorBusinessName?: string;
  vendorPhone?: string;
  vendorWhatsapp?: string;
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
}

export interface CreateTurfDto {
  arenaId: string;
  name: string;
  sport: SportType;
  surfaceType: SurfaceType;
  standardPricePaise: number;
  capacity?: number;
  sizeFormat?: string;
  weekdayOpen?: string;
  weekdayClose?: string;
  weekendOpen?: string;
  weekendClose?: string;
  cancellationWindowHrs?: number;
}

export interface UpdateTurfDto extends Partial<CreateTurfDto> {
  status?: TurfStatus;
}

export interface TurfListResult {
  items: Turf[];
  total: number;
}
