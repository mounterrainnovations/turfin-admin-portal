export type BusinessType = "individual" | "company" | "partnership";

export type VendorStatus = "active" | "inactive" | "pending" | "suspended" | "maintenance" | "banned";

export type KycStatus =
  | "pending"
  | "verified"
  | "rejected"
  | "not_submitted"
  | "in_review";

export interface Address {
  addressLineOne: string;
  addressLineTwo?: string;
  city: string;
  state: string;
  pinCode: string;
  googleMapsLink?: string;
}

export interface BankingDetails {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  upiId?: string;
}

export interface VendorKyc {
  id: string;
  vendorId: string;
  status: KycStatus;
  documents: {
    identityProof?: string;
    addressProof?: string;
    businessRegistration?: string;
    gstCertificate?: string;
    cancelledCheque?: string;
  };
  reviewerNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  identityId: string;
  businessName: string;
  businessType: BusinessType;
  ownerFullName: string;
  address: Address;
  commissionPct: string;
  payoutCycle: string;
  status: VendorStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  // Joined fields from backend (as per doc 483)
  kyc?: VendorKyc;
}

export interface VendorOnboardingResponse {
  vendor: Vendor;
  credentials: {
    tempPassword: string;
  };
}

export interface VendorListParams {
  page?: number;
  limit?: number;
  status?: VendorStatus;
  excludeStatus?: VendorStatus;
  search?: string;
}
