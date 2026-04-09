export type TurfStatus =
  | "active"
  | "inactive"
  | "pending"
  | "suspended"
  | "maintenance"
  | "banned";

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

  documents?: {
    id: string;
    fieldId: string;
    status: "not_started" | "pending" | "verified" | "rejected";
    documents: {
      fieldPhotos?: string[];
      municipalNoc?: string;
      propertyDocument?: string;
      liabilityInsurance?: string;
    };
    reviewedBy?: string | null;
    reviewedAt?: string | null;
    submittedAt?: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface TurfListParams {
  page?: number;
  limit?: number;
  status?: TurfStatus;
  search?: string;
}
