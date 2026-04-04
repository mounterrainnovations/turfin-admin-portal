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

export interface VendorDocument {
  id: string;
  vendorId: string;
  documentType: "pan" | "gst" | "canceledCheck" | "aadhaarFront" | "aadhaarBack" | "businessReg";
  documentUrl: string;
  status: "pending" | "verified" | "rejected";
  rejectionReason?: string;
  verifiedAt?: string;
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

export interface Address {
  addressLineOne: string;
  addressLineTwo?: string;
  city: string;
  state: string;
  pinCode: string;
  googleMapsLink?: string;
}

export interface Vendor {
  id: string;
  identityId: string;
  businessName: string;
  businessType: "individual" | "company" | "partnership";
  ownerFullName: string;
  address: Address;
  commissionPct: string;
  payoutCycle: string;
  status: VendorStatus;
  createdAt: string;
  updatedAt: string;

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
  search?: string;
}
