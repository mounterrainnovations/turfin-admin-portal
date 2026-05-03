import { Vendor } from "../vendors";

export type ArenaStatus = 'active' | 'inactive' | 'pending' | 'maintenance' | 'suspended' | 'banned';
export type KycStatus = 'not_started' | 'pending' | 'in_review' | 'verified' | 'rejected';

export interface Arena {
  id: string;
  vendorId: string;
  name: string;
  address: {
    houseNumber: string;
    landmark: string;
    city: string;
    state: string;
    pinCode: string;
    country: string;
    googleMapsLink: string;
  };
  amenities: string[];
  weekdayOpen: string;
  weekdayClose: string;
  weekendOpen: string;
  weekendClose: string;
  cancellationWindowHrs: number;
  status: ArenaStatus;
  kycStatus: KycStatus;
  rating: {
    avgScore: number;
    totalReviews: number;
  };
  createdAt: string;
  updatedAt: string;
  
  // Relations
  vendor?: Vendor;
  turfCount?: number;
  sports?: { sport: string; count: number }[];
  documents?: Record<string, string | string[]>;
}

export interface ArenaTurfGeneration {
  sport: string;
  count: number;
  capacity?: number;
  sizeFormat?: string;
  surfaceType: string;
  standardPricePaise: number;
}

export interface CreateArenaDto {
  name: string;
  address: Arena['address'];
  amenities?: string[];
  weekdayOpen: string;
  weekdayClose: string;
  weekendOpen: string;
  weekendClose: string;
  cancellationWindowHrs?: number;
  
  // Dynamic Turf Generation
  turfs?: ArenaTurfGeneration[];
}
