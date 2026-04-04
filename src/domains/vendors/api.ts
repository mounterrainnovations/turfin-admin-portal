import { api } from "@/lib/api-client";
import {
  Vendor,
  VendorKyc,
  VendorOnboardingResponse,
  KycStatus,
  VendorStatus,
} from "./types";

export const vendorsApi = {
  /**
   * Fetches the complete list of vendors for the admin grid.
   */
  listVendors: async (): Promise<Vendor[]> => {
    return api.get<Vendor[]>("/admin/vendors");
  },

  /**
   * Onboards a and creates a new vendor profile + user identity.
   */
  onboardVendor: async (data: {
    email: string;
    businessName: string;
    ownerFullName: string;
    businessType: string;
    commissionPct: number;
    payoutCycle: string;
  }): Promise<VendorOnboardingResponse> => {
    return api.post<VendorOnboardingResponse>("/admin/vendors/onboard", {
      identityOptions: { email: data.email },
      vendorData: {
        businessName: data.businessName,
        ownerFullName: data.ownerFullName,
        businessType: data.businessType,
        commissionPct: data.commissionPct,
        payoutCycle: data.payoutCycle,
      },
    });
  },

  /**
   * Reviews the KYC submission for a vendor.
   */
  reviewVendorKyc: async (
    vendorId: string,
    status: KycStatus,
    rejectionReason?: string,
  ): Promise<VendorKyc> => {
    return api.patch<VendorKyc>(`/admin/vendors/${vendorId}/kyc/review`, {
      status,
      rejectionReason,
    });
  },

  /**
   * Updates the operational status of a vendor.
   */
  updateVendorStatus: async (
    vendorId: string,
    status: VendorStatus,
  ): Promise<Vendor> => {
    return api.patch<Vendor>(`/admin/vendors/${vendorId}/status`, {
      status,
    });
  },

  /**
   * Retrieves the full KYC details for a vendor's application.
   */
  getVendorKyc: async (vendorId: string): Promise<VendorKyc | null> => {
    return api.get<VendorKyc>(`/admin/vendors/${vendorId}/kyc`);
  },
};
