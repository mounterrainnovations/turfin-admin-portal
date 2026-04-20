import {
  BusinessType,
  KycStatus,
  PayoutCycle,
  SportType,
  SurfaceType,
  VendorStatus,
} from "./constants";

export type AddressType = "home" | "work" | "other";

export interface VendorAddress {
  type: AddressType; // Required by DTO
  label?: string;
  pinCode: string;
  houseNumber?: string; // Maps to "Address Line 1" in UI
  floor?: string;
  towerBlock?: string;
  landmark?: string; // Maps to "Address Line 2" in UI
  city: string;
  state: string;
  country: string;
  contactName?: string;
  contactPhone?: string;
  latitude?: number;
  longitude?: number;
  googleMapsLink?: string;
}

export interface BankingDetails {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  upiId?: string;
}

export interface KycDocuments {
  identityProof?: string;
  addressProof?: string;
  businessRegistration?: string;
  gstCertificate?: string;
  cancelledCheque?: string;
}

export interface Vendor {
  id: string;
  businessName: string;
  businessType: BusinessType;
  ownerFullName: string;
  phone: string;
  whatsapp?: string;
  email?: string; // Derived from identity if available
  gstNumber?: string;
  businessRegistrationNumber?: string;
  status: VendorStatus;
  kycStatus: KycStatus;
  verification?: Record<string, boolean>;
  reviewerNotes?: string;
  address: VendorAddress;
  bankingDetails: BankingDetails;
  payoutCycle: PayoutCycle;
  commissionPct: string;
  revenue?: number; // Calculated or from separate endpoint if exists
  joinedAt: string;
  deletedAt?: string;
  kyc?: {
    status: KycStatus;
    verification: Record<string, boolean>;
    documents?: KycDocuments;
  };

  // UI helper fields (not all in backend, but used by UI)
  fields?: any[];
  sports?: string[];
  facilities?: string[];
  weekdayOpen?: string;
  weekdayClose?: string;
  weekendOpen?: string;
  weekendClose?: string;
  surfaceType?: SurfaceType;
}

export interface AdminOnboardVendorDto {
  email: string;
  password: string; // Required by DTO (MinLength 8)
  vendorProfile: {
    businessName: string;
    businessType: BusinessType;
    ownerFullName: string;
    phone: string;
    whatsapp?: string;
    gstNumber?: string;
    businessRegistrationNumber?: string;
    address: VendorAddress;
    bankingDetails: BankingDetails;
    commissionPct?: string;
    payoutCycle?: PayoutCycle;
  };
}

export interface UpdateVendorDto {
  businessName?: string;
  phone?: string;
  whatsapp?: string;
  gstNumber?: string;
  businessRegistrationNumber?: string;
  payoutCycle?: PayoutCycle;
  address?: VendorAddress;
}

export interface KycReviewDto {
  status: KycStatus;
  reviewerNotes?: string;
  verification?: Record<string, boolean>;
}

export interface SubmitKycDto {
  documents: KycDocuments;
}

export interface VendorListResult {
  items: Vendor[];
  total: number;
}
