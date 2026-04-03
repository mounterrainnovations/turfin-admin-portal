# Backend Integration Documentation

## Purpose

This document is the current integration contract for the TurfIn backend. It is written so a frontend codebase or code-generation LLM can wire the API without reading controller and service internals.

Source of truth used for this document:

- controllers under `src/modules/**`
- DTOs under `src/modules/**/dto`
- response envelope and exception filter in `src/common`
- global API prefix in `src/main.ts`

## Runtime Basics

- Base URL: `/api/v1`
- Local default base URL: `http://localhost:3000/api/v1`
- Transport: JSON over HTTP
- Auth: Bearer token using the backend-issued `accessToken`
- Token refresh: explicit `POST /auth/refresh`
- API prefix is already included in the Postman collection variable `baseUrl`

## Global Response Shape

All successful responses are wrapped by the global transform interceptor:

```json
{
  "success": true,
  "data": {}
}
```

Paginated list responses include `meta`:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42
  }
}
```

All failures are wrapped by the global exception filter:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "errors": []
    }
  }
}
```

## Auth Model

- The backend uses Supabase Auth for identity verification.
- The backend issues its own JWT access and refresh tokens.
- The authenticated identity id is `user.sub` in backend code and maps to `identity.id`.
- Route authorization is role-based.

### Roles

- `end_user`
- `vendor_owner`
- `super_admin`

## Integration Rules For Frontend

- Always send `Authorization: Bearer <accessToken>` for protected endpoints.
- On `401`, try `POST /auth/refresh` once using the stored `refreshToken`, then retry the original request.
- On refresh success, replace both `accessToken` and `refreshToken` in storage.
- For paginated admin lists, read items from `data` and pagination from `meta`.
- Do not assume raw controller return values; the app always wraps them in `{ success, data }`.
- Vendor self-service routes derive `vendorId` from the logged-in identity. Do not send a vendor id for those routes.
- Admin delegated routes require explicit ids in the path. Do not try to reuse self-service paths for admin tooling.

## Common Enums Used By FE

### Roles

- `end_user`
- `vendor_owner`
- `super_admin`

### Gender

- `male`
- `female`
- `other`
- `prefer_not_to_say`

### Sports

- `football`
- `cricket`
- `tennis`
- `badminton`
- `basketball`
- `hockey`
- `volleyball`
- `kabaddi`

### Business Type

- `individual`
- `company`
- `partnership`

### KYC Status

- `not_started`
- `pending`
- `in_review`
- `verified`
- `rejected`

### Vendor Status

- `active`
- `pending`
- `suspended`

### Turf Surface Type

- `artificial_turf`
- `natural_grass`
- `concrete`
- `wooden`
- `synthetic`

### Turf Amenity Type

- `parking`
- `flood_lights`
- `changing_room`
- `cafeteria`
- `equipment_rental`
- `first_aid`
- `wifi`
- `cctv`
- `drinking_water`

### Turf Field Status

- `active`
- `inactive`
- `pending`
- `maintenance`
- `suspended`

## Auth Endpoints

### `POST /auth/signup`

Purpose:
- Register either an `end_user` or `vendor_owner`.

Important behavior:
- `role` defaults to `end_user`.
- `super_admin` signup is forbidden.
- Vendor signup creates vendor profile and an empty KYC record.
- End-user signup creates the user profile immediately.

Request shape for `end_user`:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "end_user",
  "firstName": "John",
  "lastName": "Doe",
  "displayName": "JohnD",
  "gender": "male",
  "dateOfBirth": "1995-05-15",
  "city": "Kochi",
  "state": "Kerala",
  "preferredSports": ["football", "cricket"]
}
```

Request shape for `vendor_owner`:

```json
{
  "email": "vendor@example.com",
  "password": "password123",
  "role": "vendor_owner",
  "vendorProfile": {
    "businessName": "Acme Turf Fields",
    "businessType": "company",
    "ownerFullName": "John Vendor",
    "address": {
      "addressLineOne": "123 Stadium Drive",
      "addressLineTwo": "Near Central Park",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pinCode": "400001",
      "googleMapsLink": "https://maps.google.com/?q=123+Stadium+Drive"
    },
    "bankingDetails": {
      "bankName": "HDFC Bank",
      "accountHolderName": "John Vendor",
      "accountNumber": "123456789012",
      "ifsc": "HDFC0001234",
      "upiId": "john@upi"
    }
  }
}
```

Success payload inside `data`:

```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt",
  "identity": {
    "id": "identity-id",
    "email": "user@example.com",
    "roles": ["end_user"],
    "profileCompleted": true
  }
}
```

### `POST /auth/signin`

Purpose:
- Sign in using email and password.

Request:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
- Same shape as signup.

### `POST /auth/refresh`

Purpose:
- Rotate access and refresh tokens.

Request:

```json
{
  "refreshToken": "existing-refresh-token"
}
```

Response:
- Same shape as signup.

### `POST /auth/signout`

Purpose:
- Revoke refresh tokens for the authenticated identity.

Notes:
- Requires bearer token.
- Returns a message in `data`.

## User Endpoints

### `GET /users/me`

Role:
- any authenticated user with a completed end-user profile

Purpose:
- Fetch the current end-user profile.

Response fields in `data`:

```json
{
  "id": "user-id",
  "identityId": "identity-id",
  "email": "user@example.com",
  "firstName": "John",
  "middleName": null,
  "lastName": "Doe",
  "displayName": "JohnD",
  "avatarUrl": null,
  "dateOfBirth": null,
  "gender": null,
  "city": "Kochi",
  "state": "Kerala",
  "country": "India",
  "preferredSports": ["football"],
  "ownReferralCode": null,
  "pushNotificationsEnabled": false,
  "lastActiveAt": null,
  "createdAt": "2026-04-03T10:00:00.000Z"
}
```

### `PATCH /users/me`

Purpose:
- Partial update of end-user profile fields.

Supported request fields:

- `firstName`
- `middleName`
- `lastName`
- `displayName`
- `avatarUrl`
- `dateOfBirth`
- `gender`
- `city`
- `state`
- `preferredSports`
- `deviceOs`
- `appVersion`
- `pushNotificationsEnabled`
- `onesignalPlayerId`
- `whatsapp`

Important behavior:
- `whatsapp` is stored on the identity layer, not the `users` table.
- Missing fields are ignored.

### `DELETE /users/me`

Purpose:
- Soft-delete the current user account.

Important behavior:
- Marks the user as deleted.
- Sets the identity status to `inactive`.
- FE should treat this as a terminal action and log the user out locally.

### `GET /users/:id`

Role:
- `super_admin`

Purpose:
- Fetch any user by user id.

## Vendor Endpoints

### `GET /vendors/me`

Role:
- `vendor_owner`

Purpose:
- Fetch the current vendor profile using the authenticated identity.

Response fields in `data`:

```json
{
  "id": "vendor-id",
  "identityId": "identity-id",
  "businessName": "Acme Turf Fields",
  "businessType": "company",
  "ownerFullName": "John Vendor",
  "address": {
    "addressLineOne": "123 Stadium Drive",
    "addressLineTwo": null,
    "city": "Mumbai",
    "state": "Maharashtra",
    "pinCode": "400001",
    "googleMapsLink": null
  },
  "commissionPct": "0.00",
  "payoutCycle": "monthly",
  "status": "pending",
  "createdAt": "2026-04-03T10:00:00.000Z",
  "updatedAt": "2026-04-03T10:00:00.000Z"
}
```

Notes:
- `bankingDetails` is excluded from the standard response DTO. Do not assume it is returned.

### `PATCH /vendors/me`

Role:
- `vendor_owner`

Purpose:
- Partial update of vendor profile fields.

Supported request fields:
- `businessName`
- `businessType`
- `ownerFullName`
- `address`
- `bankingDetails`

## Vendor KYC Endpoints

### `POST /kyc/me/submit`

Role:
- `vendor_owner`

Purpose:
- Submit or replace the vendor KYC document set.

Request:

```json
{
  "documents": {
    "identityProof": "https://storage.example.com/docs/id.pdf",
    "addressProof": "https://storage.example.com/docs/addr.pdf",
    "businessRegistration": "https://storage.example.com/docs/biz.pdf",
    "gstCertificate": "https://storage.example.com/docs/gst.pdf",
    "cancelledCheque": "https://storage.example.com/docs/cheque.pdf"
  }
}
```

Important behavior:
- If the KYC record is already `verified`, further updates are rejected.
- Complete submissions move status toward `pending`.
- Vendor signup already creates an empty KYC record with status `not_started`.

### `GET /kyc/me`

Role:
- `vendor_owner`

Purpose:
- Get current vendor KYC status and stored documents.

Response fields in `data`:

```json
{
  "id": "kyc-id",
  "vendorId": "vendor-id",
  "status": "pending",
  "documents": {
    "identityProof": "https://...",
    "addressProof": "https://...",
    "businessRegistration": "https://...",
    "gstCertificate": "https://...",
    "cancelledCheque": "https://..."
  },
  "reviewedBy": null,
  "reviewedAt": null,
  "submittedAt": "2026-04-03T10:00:00.000Z",
  "createdAt": "2026-04-03T10:00:00.000Z",
  "updatedAt": "2026-04-03T10:00:00.000Z"
}
```

Notes:
- `reviewerNotes` is excluded from the standard DTO response.

## Turf Endpoints

### `POST /turfs`

Role:
- `vendor_owner`

Purpose:
- Create a turf for the authenticated vendor.

Request:

```json
{
  "name": "Champions Arena",
  "sports": ["football", "cricket"],
  "surfaceType": "artificial_turf",
  "address": {
    "addressLineOne": "Stadium Complex",
    "city": "Kochi",
    "state": "Kerala",
    "pinCode": "682001"
  },
  "weekdayOpen": "06:00",
  "weekdayClose": "23:00",
  "weekendOpen": "05:00",
  "weekendClose": "23:59",
  "standardPricePaise": 150000,
  "amenities": ["parking", "changing_room"],
  "capacity": 14,
  "sizeFormat": "7v7",
  "cancellationWindowHrs": 24
}
```

Validation notes:
- Time fields must be valid `HH:MM` or `HH:MM:SS`.
- `standardPricePaise` is integer paise, not decimal currency.

Important behavior:
- Turf creation also creates an empty turf document record.
- New turf status starts as `pending`.

### `GET /turfs/my-turfs`

Role:
- `vendor_owner`

Purpose:
- Fetch all turfs owned by the current vendor.

### `GET /turfs/:id`

Role:
- `vendor_owner`

Purpose:
- Fetch one turf owned by the current vendor.

Important behavior:
- Ownership is enforced. A vendor cannot read another vendor's turf.

### `PATCH /turfs/:id`

Role:
- `vendor_owner`

Purpose:
- Partially update turf fields.

Supported request fields:
- any field from create turf payload

### `DELETE /turfs/:id`

Role:
- `vendor_owner`

Purpose:
- Soft-delete the turf.

## Turf Document Endpoints

### `PATCH /turfs/:turfId/documents`

Role:
- `vendor_owner`

Purpose:
- Submit or partially update turf verification documents.

Request:

```json
{
  "documents": {
    "propertyDocument": "https://storage.com/docs/prop.pdf",
    "municipalNoc": "https://storage.com/docs/noc.pdf",
    "liabilityInsurance": "https://storage.com/docs/insurance.pdf",
    "fieldPhotos": [
      "https://storage.com/img1.jpg",
      "https://storage.com/img2.jpg"
    ]
  }
}
```

Validation notes:
- All document URLs must be valid URLs.
- `fieldPhotos` max length is 5.

Important behavior:
- Partial updates are merged with existing document values.
- If the full set becomes complete, status can move to `pending`.
- Verified turf documents cannot be updated again.

### `GET /turfs/:turfId/documents`

Role:
- `vendor_owner`

Purpose:
- Fetch current turf document status and stored document URLs.

Response fields in `data`:

```json
{
  "id": "field-doc-id",
  "fieldId": "turf-id",
  "status": "pending",
  "documents": {
    "propertyDocument": "https://...",
    "municipalNoc": "https://...",
    "liabilityInsurance": "https://...",
    "fieldPhotos": ["https://..."]
  },
  "reviewedBy": null,
  "reviewedAt": null,
  "submittedAt": "2026-04-03T10:00:00.000Z",
  "createdAt": "2026-04-03T10:00:00.000Z",
  "updatedAt": "2026-04-03T10:00:00.000Z"
}
```

Notes:
- `reviewerNotes` is excluded from the standard DTO response.

## Admin Endpoints

All admin endpoints require:

- bearer token
- `super_admin` role

### Admin Listing

#### `GET /admin/users?page=1&limit=10`

Purpose:
- List end-user profiles.

Response:
- paginated response with `data[]` and `meta`

#### `GET /admin/vendors?page=1&limit=10`

Purpose:
- List vendor profiles.

Response:
- paginated response with `data[]` and `meta`

Pagination notes:
- `page` minimum is `1`
- `limit` minimum is `1`
- `limit` maximum is `100`

### Admin Vendor Onboarding

#### `POST /admin/onboard-vendor`

Purpose:
- Create a vendor directly from admin tooling.

Request:
- same vendor profile shape as vendor signup, plus top-level `email` and `password`

Important behavior:
- creates auth identity
- assigns `vendor_owner` role
- creates vendor profile
- creates empty KYC record
- returns:

```json
{
  "vendorId": "vendor-id",
  "identityId": "identity-id"
}
```

### Admin KYC Delegated Operations

#### `POST /admin/vendors/:vendorId/kyc`

Purpose:
- Upload vendor KYC documents on behalf of a vendor.

Request:
- same as `POST /kyc/me/submit`

#### `PATCH /admin/vendors/:vendorId/kyc/review`

Purpose:
- Review vendor KYC.

Request:

```json
{
  "status": "verified",
  "reviewerNotes": "Approved by Admin."
}
```

Important behavior:
- if status is `verified`, vendor status becomes `active`
- if status is `rejected` or `in_review`, vendor status becomes `pending`

### Admin Turf Delegated Operations

#### `POST /admin/vendors/:vendorId/turfs`

Purpose:
- Create a turf for a specific vendor.

Request:
- same as `POST /turfs`

#### `GET /admin/turfs/:turfId`

Purpose:
- Fetch any turf by id without vendor self-scope restrictions.

#### `PATCH /admin/turfs/:turfId/documents`

Purpose:
- Upload or merge turf documents on behalf of the turf owner.

Request:
- same as `PATCH /turfs/:turfId/documents`

#### `GET /admin/turfs/:turfId/documents`

Purpose:
- Fetch current turf document status by turf id.

#### `PATCH /admin/turfs/:turfId/documents/review`

Purpose:
- Review turf verification documents.

Request:

```json
{
  "status": "verified",
  "reviewerNotes": "Turf docs look solid."
}
```

Important behavior:
- if status is `verified`, turf field status becomes `active`
- if status is `rejected` or `in_review`, turf field status becomes `pending`

## Health Endpoints

### `GET /health/server`

Purpose:
- Public server heartbeat endpoint.

### `GET /health/database`

Purpose:
- Public database connectivity check.

## Recommended Frontend Flows

### End User Auth Flow

1. Call `POST /auth/signup` or `POST /auth/signin`.
2. Store `accessToken`, `refreshToken`, and `identity.roles`.
3. Use `GET /users/me` to hydrate the end-user profile.
4. Use `PATCH /users/me` for profile edits.

### Vendor Onboarding Flow

1. Call `POST /auth/signup` with `role: "vendor_owner"` and nested `vendorProfile`.
2. Store tokens from the auth response.
3. Call `GET /vendors/me` to hydrate vendor profile state.
4. Call `GET /kyc/me` to inspect current KYC status.
5. Call `POST /kyc/me/submit` when the full KYC document set is ready.
6. Poll or refetch `GET /kyc/me` after submission until status changes.

### Turf Creation And Verification Flow

1. Call `POST /turfs`.
2. Read created turf id from `data.id`.
3. Upload documents using `PATCH /turfs/:turfId/documents`.
4. Fetch document status using `GET /turfs/:turfId/documents`.
5. Show turf activation state from turf `status` and document `status`.

### Admin Review Flow

1. Use admin list endpoints to fetch users and vendors.
2. Use delegated admin routes with explicit path ids.
3. For vendor review:
   - upload docs with `POST /admin/vendors/:vendorId/kyc` if needed
   - review with `PATCH /admin/vendors/:vendorId/kyc/review`
4. For turf review:
   - inspect turf with `GET /admin/turfs/:turfId`
   - upload docs with `PATCH /admin/turfs/:turfId/documents` if needed
   - review with `PATCH /admin/turfs/:turfId/documents/review`

## Important FE Caveats

- The Postman collection now reflects the controller paths. Use it as the quickest executable reference.
- Earlier collection paths like `/kyc/:vendorId/review` and `/turfs/:turfId/documents/review` without the `/admin` prefix were not valid controller routes.
- Review note fields are accepted in admin review payloads, but standard DTO responses exclude `reviewerNotes`.
- Vendor profile responses exclude `bankingDetails` by default.
