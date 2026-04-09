import { api } from "@/lib/api-client";
import {
  Vendor,
  VendorKyc,
  VendorOnboardingResponse,
  KycStatus,
  VendorStatus,
  VendorListParams,
  Address,
  BankingDetails,
} from "./types";
import { useQuery } from "@tanstack/react-query";

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export const vendorsApi = {
  /**
   * Fetches the complete list of vendors for the admin grid.
   */
  listVendors: async (
    params: VendorListParams = {},
  ): Promise<PaginatedResponse<Vendor>> => {
    const searchParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
    });

    if (params.status) searchParams.append("status", params.status);
    if (params.search) searchParams.append("search", params.search);

    return api.get<PaginatedResponse<Vendor>>(
      `/admin/vendors?${searchParams.toString()}`,
    );
  },

  /**
   * Fetches a specific vendor by ID.
   */
  getVendorById: async (vendorId: string): Promise<Vendor> => {
    return api.get<Vendor>(`/admin/vendors/${vendorId}`);
  },

  /**
   * Onboards a new vendor.
   * Aligned with Postman: POST /admin/onboard-vendor
   */
  onboardVendor: async (data: {
    email: string;
    password?: string;
    businessName: string;
    ownerFullName: string;
    businessType: string;
    commissionPct?: number;
    payoutCycle?: string;
    address?: Address;
    bankingDetails?: BankingDetails;
  }): Promise<VendorOnboardingResponse> => {
    return api.post<VendorOnboardingResponse>("/admin/onboard-vendor", {
      email: data.email,
      password: data.password || Math.random().toString(36).slice(-10), // Generate temp pass if none
      vendorProfile: {
        businessName: data.businessName,
        businessType: data.businessType,
        ownerFullName: data.ownerFullName,
        address: data.address,
        bankingDetails: data.bankingDetails,
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
    reviewerNotes?: string,
  ): Promise<VendorKyc> => {
    return api.patch<VendorKyc>(`/admin/vendors/${vendorId}/kyc/review`, {
      status,
      reviewerNotes,
    });
  },

  /**
   * Updates the operational status of a vendor (suspended / inactive).
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
   * Bans a vendor and disables their login identity.
   * Aligned with Postman: POST /admin/vendors/:vendorId/ban
   */
  banVendor: async (vendorId: string): Promise<Vendor> => {
    return api.post<Vendor>(`/admin/vendors/${vendorId}/ban`, {});
  },

  /**
   * Unbans a vendor and restores their identity to active status.
   * Aligned with Postman: POST /admin/vendors/:vendorId/unban
   */
  unbanVendor: async (vendorId: string): Promise<Vendor> => {
    return api.post<Vendor>(`/admin/vendors/${vendorId}/unban`, {});
  },

  /**
   * Soft-deletes a vendor profile.
   * Aligned with Postman: DELETE /admin/vendors/:vendorId
   */
  deleteVendor: async (vendorId: string): Promise<void> => {
    return api.delete(`/admin/vendors/${vendorId}`);
  },

  /**
   * Retrieves the full KYC details for a vendor's application.
   */
  getVendorKyc: async (vendorId: string): Promise<VendorKyc | null> => {
    return api.get<VendorKyc>(`/admin/vendors/${vendorId}/kyc`);
  },

  /**
   * Submits or partially updates vendor KYC documents (Override).
   * Aligned with Postman: POST /admin/vendors/:vendorId/kyc
   */
  uploadVendorKyc: async (
    vendorId: string,
    documents: VendorKyc["documents"],
  ): Promise<void> => {
    return api.post(`/admin/vendors/${vendorId}/kyc`, { documents });
  },
};

export function useVendorsList(params?: VendorListParams) {
  return useQuery({
    queryKey: ["admin", "vendors", params],
    queryFn: () => vendorsApi.listVendors(params),
  });
}
