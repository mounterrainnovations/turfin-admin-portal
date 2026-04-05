import { api } from "@/lib/api-client";
import {
  Vendor,
  VendorKyc,
  VendorOnboardingResponse,
  KycStatus,
  VendorStatus,
  VendorListParams,
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
    reviewerNotes?: string,
  ): Promise<VendorKyc> => {
    return api.patch<VendorKyc>(`/admin/vendors/${vendorId}/kyc/review`, {
      status,
      reviewerNotes,
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

export function useVendorsList(params?: VendorListParams) {
  return useQuery({
    queryKey: ["admin", "vendors", params],
    queryFn: () => vendorsApi.listVendors(params),
  });
}
