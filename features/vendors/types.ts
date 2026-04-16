import {
  BusinessType,
  KycStatus,
  PayoutCycle,
  SportType,
  SurfaceType,
  VendorStatus,
} from "./constants";

export interface VendorAddress {
  type?: string;
  label?: string;
  pinCode: string;
  houseNumber?: string;
  floor?: string;
  towerBlock?: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  contactName?: string;
  contactPhone?: string;
  latitude?: number;
  longitude?: number;
  googleMapsLink?: string;
  address1?: string;
  address2?: string;
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
  address: VendorAddress;
  bankingDetails: BankingDetails;
  payoutCycle: PayoutCycle;
  commissionPct: string;
  revenue?: number; // Calculated or from separate endpoint if exists
  joinedAt: string;
  deletedAt?: string;
  
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
  password?: string; // Optional if backend generates it or if admin provides it
  firstName?: string;
  lastName?: string;
  displayName?: string;
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

export interface VendorListResult {
  items: Vendor[];
  total: number;
}
