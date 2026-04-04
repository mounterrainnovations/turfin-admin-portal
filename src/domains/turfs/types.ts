export type TurfStatus = "active" | "pending" | "suspended";

export interface TurfDocumentsResponse {
  id: string;
  turfId: string;
  documentUrl: string;
  status: "pending" | "verified" | "rejected";
  rejectionReason?: string;
  verifiedAt?: string;
}

export interface TurfResponse {
  id: string;
  vendorId: string;
  name: string;
  sports: string[];
  amenities: string[];
  capacity: number | null;
  sizeFormat: string | null;
  surfaceType: string;
  address: {
    addressLineOne: string;
    addressLineTwo?: string;
    city: string;
    state: string;
    pinCode: string;
    googleMapsLink?: string;
  };
  weekdayOpen: string;
  weekdayClose: string;
  weekendOpen: string;
  weekendClose: string;
  standardPricePaise: number;
  cancellationWindowHrs: number;
  status: TurfStatus;
  createdAt: string;
  updatedAt: string;
  
  // Joined documents (as per doc 484)
  documents?: TurfDocumentsResponse;
}

export interface TurfListParams {
  page?: number;
  limit?: number;
  status?: TurfStatus;
  search?: string;
}
