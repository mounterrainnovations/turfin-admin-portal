# Backend Integration Documentation

## Purpose

This document is the current integration contract for the TurfIn backend. It is written so a frontend codebase can wire the API using clear TypeScript interface definitions for every request and response, matching the provided Postman collection and backend controllers.

Source of truth:

- `src/modules/**` (Controllers & DTOs)
- `src/common/interceptors/transform.interceptor.ts`
- `turfin_postman_collection.json`

## Runtime Basics

- **Base URL**: `/api/v1`
- **Transport**: JSON over HTTP
- **Auth**: Bearer token using the backend-issued `accessToken`.
- **Token Rotation**: On `401`, perform `POST /auth/refresh` using the stored `refreshToken`.
- **Global API Prefix**: Already included in the Postman collection variable `baseUrl`.

---

## Global Response Wrappers

All successful responses are wrapped by the global transform interceptor.

### Standard Success Wrapper

```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
}
```

### Paginated Success Wrapper

Used on listing endpoints (e.g., `/admin/users`).

```typescript
interface PaginatedSuccessResponse<T> {
  success: true;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}
```

### Audit Log Record

```typescript
interface AuditLogRecord {
  id: string;
  action: string;
  category: string;
  actorId?: string;
  targetId?: string;
  targetType?: string;
  ipAddress?: string;
  userAgent?: string;
  requestBody?: any;
  responseStatus?: number;
  responseTimeMs?: number;
  errorMessage?: string;
  metadata?: any;
  createdAt: string;
}
```

### Error Wrapper

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

---

## Common Interface Definitions

These sub-objects are reused across multiple request and response DTOs.

### `Address` (User/Vendor/Turf)

```typescript
interface Address {
  addressLineOne: string;
  addressLineTwo?: string;
  city: string;
  state: string;
  pinCode: string;
  googleMapsLink?: string;
}
```

### `VendorBankingDetails`

```typescript
interface VendorBankingDetails {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  upiId?: string;
}
```

### `KycDocuments`

```typescript
interface KycDocuments {
  identityProof: string;
  addressProof: string;
  businessRegistration: string;
  gstCertificate: string;
  cancelledCheque: string;
}
```

### `TurfDocuments`

```typescript
interface TurfDocuments {
  propertyDocument?: string;
  municipalNoc?: string;
  liabilityInsurance?: string;
  fieldPhotos?: string[]; // Max 5 photos
}
```

---

## Enums

### Roles

- `end_user`
- `vendor_owner`
- `super_admin`

### Gender

- `male`, `female`, `other`, `prefer_not_to_say`

### Sports

- `football`, `cricket`, `tennis`, `badminton`, `basketball`, `hockey`, `volleyball`, `kabaddi`

### Business Type

- `individual`, `company`, `partnership`

### KYC / Document Status

- `not_started`, `pending`, `in_review`, `verified`, `rejected`

### Vendor / Turf Status

- `active`, `pending`, `suspended`, `inactive`, `maintenance`

### User Status

- `active`, `pending`, `banned`, `inactive`

---

## 1. Auth Endpoints

### `POST /auth/signup`

**Role**: Public
**Purpose**: Register a new `end_user` or `vendor_owner`.

**Request**:

```typescript
interface SignupRequest {
  email: string;
  password: string; // Min 8 chars
  role?: 'end_user' | 'vendor_owner'; // Defaults to end_user
  // Required if role is end_user
  firstName?: string;
  lastName?: string;
  displayName?: string;
  // Required if role is vendor_owner
  vendorProfile?: {
    businessName: string;
    businessType: 'individual' | 'company' | 'partnership';
    ownerFullName: string;
    address: Address;
    bankingDetails: VendorBankingDetails;
    payoutCycle?: string;
    commissionPct?: string;
  };
  // Optional profile fields
  avatarUrl?: string;
  dateOfBirth?: string; // ISO Date
  gender?: string;
  city?: string;
  state?: string;
  preferredSports?: string[];
}
```

**Response**:

```typescript
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  identity: {
    id: string;
    email: string;
    roles: string[];
    profileCompleted: boolean;
  };
}
```

### `POST /auth/signin`

**Role**: Public
**Request**: `{ email, password }`
**Response**: `AuthResponse`

### `POST /auth/refresh`

**Role**: Public (with valid Refresh Token)
**Request**: `{ refreshToken: string }`
**Response**: `AuthResponse`

### `POST /auth/signout`

**Role**: Authenticated
**Request**: (Bearer Token only)
**Response**: `{ message: string }`

---

## 2. User Endpoints

### `GET /users/me`

**Role**: Authenticated
**Response**:

```typescript
interface UserProfileResponse {
  id: string;
  identityId: string;
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  displayName: string;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  city: string | null;
  state: string | null;
  country: string;
  preferredSports: string[];
  ownReferralCode: string | null;
  pushNotificationsEnabled: boolean;
  status: string; // active, pending, banned, inactive
  lastActiveAt: string | null;
  createdAt: string;
}
```

### `PATCH /users/me`

**Role**: Authenticated
**Purpose**: Partial update of profile.
**Request**:

```typescript
interface UpdateUserProfileRequest {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: string;
  city?: string;
  state?: string;
  preferredSports?: string[];
  deviceOs?: 'ios' | 'android' | 'web';
  appVersion?: string;
  pushNotificationsEnabled?: boolean;
  onesignalPlayerId?: string;
  whatsapp?: string;
}
```

### `DELETE /users/me`

**Role**: Authenticated
**Purpose**: Soft-delete account.
**Response**: `{ message: string }`

---

## 3. Vendor Endpoints

### `GET /vendors/me`

**Role**: `vendor_owner`
**Response**:

```typescript
interface VendorProfileResponse {
  id: string;
  identityId: string;
  businessName: string;
  businessType: string;
  ownerFullName: string;
  address: Address;
  commissionPct: string;
  payoutCycle: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
```

### `PATCH /vendors/me`

**Role**: `vendor_owner`
**Request**: `Partial<SignupRequest['vendorProfile']>`
**Response**: `VendorProfileResponse`

---

## 4. Vendor KYC Endpoints

### `PATCH /kyc/me/submit`

**Role**: `vendor_owner`
**Request**: `{ documents: Partial<KycDocuments> }`
**Response**:

```typescript
interface KycResponse {
  id: string;
  vendorId: string;
  status: string;
  documents: KycDocuments;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### `GET /kyc/me`

**Role**: `vendor_owner`
**Response**: `KycResponse`

---

## 5. Turf Endpoints

### `POST /turfs`

**Role**: `vendor_owner`
**Request**:

```typescript
interface CreateTurfRequest {
  name: string;
  sports: string[];
  surfaceType: string;
  address: Address;
  weekdayOpen: string; // HH:MM
  weekdayClose: string;
  weekendOpen: string;
  weekendClose: string;
  standardPricePaise: number;
  amenities?: string[];
  capacity?: number;
  sizeFormat?: string;
  cancellationWindowHrs?: number;
}
```

**Response**: (`TurfResponseDto`)

```typescript
interface TurfResponse {
  id: string;
  vendorId: string;
  name: string;
  sports: string[];
  amenities: string[];
  capacity: number | null;
  sizeFormat: string | null;
  surfaceType: string;
  address: Address;
  weekdayOpen: string;
  weekdayClose: string;
  weekendOpen: string;
  weekendClose: string;
  standardPricePaise: number;
  cancellationWindowHrs: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}
```

### `GET /turfs/my-turfs`

**Role**: `vendor_owner`
**Response**: `TurfResponse[]` (Standard Wrapper)

### `GET /turfs/:id`

**Role**: `vendor_owner`
**Response**: `TurfResponse`

### `PATCH /turfs/:id`

**Role**: `vendor_owner`
**Request**: `Partial<CreateTurfRequest>`
**Response**: `TurfResponse`

### `DELETE /turfs/:id`

**Role**: `vendor_owner`
**Response**: `{ message: string }`

---

## 6. Turf Document Endpoints

### `PATCH /turfs/:turfId/documents`

**Role**: `vendor_owner`
**Request**: `{ documents: Partial<TurfDocuments> }`
**Response**:

```typescript
interface TurfDocumentsResponse {
  id: string;
  fieldId: string;
  status: string;
  documents: TurfDocuments;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### `GET /turfs/:turfId/documents`

**Role**: `vendor_owner`
**Response**: `TurfDocumentsResponse`

---

## 7. Admin Endpoints

All admin endpoints require `super_admin` role.

### Listing Operations (Paginated)

- `GET /admin/users` -> `PaginatedSuccessResponse<UserProfileResponse>`
- `GET /admin/vendors` -> `PaginatedSuccessResponse<VendorProfileResponse & { kyc?: KycResponse }>`
- `GET /admin/turfs` -> `PaginatedSuccessResponse<TurfResponse & { documents?: TurfDocumentsResponse }>`
- `GET /audit` -> `PaginatedSuccessResponse<AuditLogRecord>`

### Delegated Lookup

- `GET /admin/users/:userId` -> `UserProfileResponse`
- `GET /admin/vendors/:vendorId` -> `VendorProfileResponse`
- `GET /admin/turfs/:turfId` -> `TurfResponse`

### Admin Operations

- `DELETE /admin/vendors/:vendorId` -> `{ message: string }`
- `POST /admin/onboard-vendor`
  - Request: `{ email, password, vendorProfile: CreateVendorDto }`
  - Response: `{ vendorId: string, identityId: string }`
- `POST /admin/users/:userId/ban` -> `{ message: string }`
- `POST /admin/users/:userId/unban` -> `{ message: string }`

### Admin Overrides

- `POST /admin/vendors/:vendorId/turfs` -> `TurfResponse`
- `POST /admin/vendors/:vendorId/kyc` -> `KycResponse`
- `PATCH /admin/vendors/:vendorId/kyc/review`
  - Request: `{ status: KycStatus, reviewerNotes?: string }`
  - Response: `KycResponse`
- `PATCH /admin/turfs/:turfId/documents` -> `TurfDocumentsResponse`
- `GET /admin/turfs/:turfId/documents` -> `TurfDocumentsResponse`
- `PATCH /admin/turfs/:turfId/documents/review`
  - Request: `{ status: KycStatus, reviewerNotes?: string }`
  - Response: `TurfDocumentsResponse`

---

## 8. Health Endpoints

### `GET /health/server`

**Role**: Public
**Purpose**: Internal server heartbeat.

### `GET /health/database`

**Role**: Public
**Purpose**: Check database availability.

---

## Important Integration Caveats

1. **Paise Implementation**: All monetary values (`standardPricePaise`) are integer values in Paise. Divide by 100 on FE for display.
2. **Date Strings**: All dates are returned in ISO 8601 strings.
3. **Partial Updates**: All `PATCH` requests support partial updates. Merging logic is handled on the backend.
4. **Validation Errors**: Validation failures return `400` with the `error` wrapper.
5. **Role-Based Access**: FE should guard routes based on `identity.roles` provided in the login/signup response.
