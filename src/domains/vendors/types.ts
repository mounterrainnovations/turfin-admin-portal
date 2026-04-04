export type BusinessType =
  | "PROPRIETORSHIP"
  | "PARTNERSHIP"
  | "PRIVATE_LIMITED"
  | "INDIVIDUAL";
export type VendorStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "PENDING_ONBOARDING";
export type KycStatus = "PENDING" | "APPROVED" | "REJECTED" | "NOT_SUBMITTED";

export interface Vendor {
  id: string;
  identityId: string;
  businessName: string;
  businessType: BusinessType;
  ownerFullName: string;
  addressLineOne: string;
  addressLineTwo?: string;
  city: string;
  state: string;
  pinCode: string;
  googleMapsLink?: string;
  commissionPct: number;
  payoutCycle: "WEEKLY" | "FORTNIGHTLY" | "MONTHLY";
  status: VendorStatus;
  createdAt: string;
  updatedAt: string;

  // Computed or Joined fields (preparation for future backend enhancements)
  revenue?: number;
  fieldsCount?: number;
  kycStatus?: KycStatus;
}

export interface VendorKyc {
  id: string;
  vendorId: string;
  panNumber: string;
  gstNumber?: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  status: KycStatus;
  rejectionReason?: string;
  verifiedAt?: string;
}

export interface VendorOnboardingResponse {
  vendor: Vendor;
  credentials: {
    tempPassword: string;
  };
}
