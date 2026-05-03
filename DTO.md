# DTO Reference

This document auto-generates all DTO specifications across the system.

## Global Enums Context

The following are the available enums parsed across the codebase:

- **IdentityStatus**: `active, inactive, banned, under_review`
- **UserStatus**: `active, inactive, banned, under_review`
- **UserRole**: `super_admin, sub_admin, vendor_owner, end_user`
- **GenderType**: `male, female, other, prefer_not_to_say`
- **AcquisitionSource**: `organic, referral, google_ads, meta_ads, influencer, other`
- **DeviceOsType**: `ios, android, web`
- **SportType**: `football, cricket, tennis, badminton, basketball, hockey, volleyball, kabaddi, box_cricket, futsal, pickleball, throwball, netball, handball, dodgeball`
- **VendorStatus**: `active, pending, suspended, banned`
- **BusinessType**: `individual, company, partnership`
- **KycStatus**: `not_started, pending, in_review, verified, rejected`
- **SurfaceType**: `artificial_turf, natural_grass, concrete, wooden, synthetic`
- **AmenityType**: `parking, flood_lights, washrooms, changing_rooms, showers, drinking_water, cafeteria, equipment_rental, first_aid, wifi, cctv, power_backup, locker_facility, seating_area, practice_nets, scoreboard, warm_up_area, music_system, coaching, referee, covered_turf, indoor_facility, outdoor_facility, bibs_available, prayer_room`
- **TurfStatus**: `active, inactive, pending, maintenance, suspended, banned`
- **PayoutCycle**: `daily, weekly, monthly`
- **BookingStatus**: `pending, confirmed, cancelled, completed, no_show`
- **SlotStatus**: `available, booked, blocked, maintenance`
- **PaymentStatus**: `created, pending, authorized, captured, failed, refunded, partially_refunded`
- **AuditCategory**: `auth, kyc, booking, payment, slot, admin, vendor, turf, user`
- **AuditAction**: `AUTH_LOGIN, AUTH_LOGOUT, AUTH_SIGNUP, KYC_SUBMIT, KYC_VERIFY, KYC_REJECT, TURF_CREATE, TURF_UPDATE, TURF_DELETE, BOOKING_CREATE, BOOKING_CANCEL, PAYMENT_REFUND, USER_BAN, USER_UNBAN, VENDOR_CREATED, VENDOR_UPDATE, VENDOR_BAN, VENDOR_UNBAN, TURF_DOCS_UPDATE, TURF_DOCS_REVIEW, TURF_BAN, TURF_UNBAN, TURF_STATUS_UPDATE, SUB_ADMIN_CREATE, SUB_ADMIN_DELETE, SUB_ADMIN_PASSWORD_UPDATE, ROLE_ASSIGN, ROLE_REVOKE, USER_ADDRESS_ADD, USER_ADDRESS_UPDATE, USER_ADDRESS_SET_PRIMARY, USER_ADDRESS_DELETE, USER_FAVOURITE_ADD, USER_FAVOURITE_REMOVE, AUTH_PASSWORD_RESET, ADMIN_MANUAL_PASSWORD_UPDATE, ADMIN_TRIGGER_PASSWORD_RESET`
- **NotificationType**: `booking_confirmed, booking_cancelled, booking_reminder, slot_booked, slot_cancelled, payment_received, payment_failed, payment_refunded, kyc_submitted, kyc_verified, kyc_rejected, turf_approved, turf_rejected, account_banned, account_reinstated, general`
- **NotificationChannel**: `push, sms, email, in_app`
- **BlockReason**: `maintenance, private_event, weather, vendor_hold, other`
- **DiscountType**: `flat, percentage`
- **CouponScopeType**: `platform, vendor, turf`
- **AddressType**: `home, work, other`

---

## Reviews (New)

### CreateReviewDto

**File**: `src/modules/reviews/dto/create-review.dto.ts`

| Field       | Type     | Required | Description                     | Constraints/Decorators              |
| ----------- | -------- | -------- | ------------------------------- | ----------------------------------- |
| `turfId`    | `string` | Yes      | UUID of the turf being reviewed | `@IsUUID()`                         |
| `bookingId` | `string` | Yes      | UUID of the verified booking    | `@IsUUID()`                         |
| `score`     | `number` | Yes      | Rating from 0.0 to 5.0          | `@IsNumber()`, `@Min(0)`, `@Max(5)` |
| `comment`   | `string` | No       | Optional text feedback          | `@IsString()`                       |
|
| ### ReviewResponseDto
|
| **File**: `src/modules/reviews/dto/review-response.dto.ts`
|
| | Field       | Type            | Required | Description                     |
| ----------- | --------------- | -------- | ------------------------------- |
| `id`        | `string`        | Yes      | Unique review ID                |
| `userId`    | `string`        | Yes      | Author's internal user ID       |
| `turfId`    | `string`        | Yes      | Target turf ID                  |
| `bookingId` | `string`        | Yes      | Linked booking ID               |
| `score`     | `number`        | Yes      | Numeric score (float)           |
| `comment`   | `string`        | No       | Feedback text                   |
| `user`      | `ReviewUserDto` | No       | Nested author profile (summary) |
| `createdAt` | `Date`          | Yes      | Review creation timestamp       |

### ReviewUserDto

**File**: `src/modules/reviews/dto/review-response.dto.ts`

| Field       | Type             | Description       |
| ----------- | ---------------- | ----------------- |
| `firstName` | `string`         | User's first name |
| `lastName`  | `string`         | User's last name  |
| `avatarUrl` | `string \| null` | Profile image URL |

### TurfRatingDto

**File**: `src/modules/turfs/dto/turf-rating.dto.ts`

| Field          | Type     | Required | Description                    |
| -------------- | -------- | -------- | ------------------------------ |
| `avgScore`     | `number` | Yes      | Calculated average score (0-5) |
| `totalReviews` | `number` | Yes      | Count of verified reviews      |

---

## Common

### PaginationQueryDto

**File**: `src/common/dto/pagination-query.dto.ts`

| Field    | Type                   | Required         | Constraints/Decorators                         |
| -------- | ---------------------- | ---------------- | ---------------------------------------------- | --------------------------------------- |
| `page`   | `number = 1`           | No               | `@Type(()`, `@IsInt()`, `@Min(1)`              |
| `limit`  | `number = 10`          | No               | `@Type(()`, `@IsInt()`, `@Min(1)`, `@Max(100)` |
| `sortBy` | `string = 'createdAt'` | No               | `@IsString()`                                  |
| `order`  | `'asc'                 | 'desc' = 'desc'` | No                                             | `@IsString()`, `@IsIn(['asc', 'desc'])` |

## Admin

### AdminOnboardVendorDto

**File**: `src/modules/admin/dto/onboard-vendor.dto.ts`

| Field           | Type              | Required | Constraints/Decorators                                                                    |
| --------------- | ----------------- | -------- | ----------------------------------------------------------------------------------------- |
| `email`         | `string`          | Yes      | `@IsEmail()`                                                                              |
| `password`      | `string`          | Yes      | `@IsString()`, `@MinLength(8)`                                                            |
| `firstName`     | `string`          | No       | `@IsString()`, `@MaxLength(50)`                                                           |
| `lastName`      | `string`          | No       | `@IsString()`, `@MaxLength(50)`                                                           |
| `displayName`   | `string`          | No       | `@IsString()`, `@MaxLength(50)`                                                           |
| `avatarUrl`     | `string`          | No       | `@IsString()`                                                                             |
| `dateOfBirth`   | `string`          | No       | `@IsDateString()`                                                                         |
| `gender`        | `GenderType`      | No       | `@IsEnum(GenderType)`<br><br>**Allowed values:** `male, female, other, prefer_not_to_say` |
| `city`          | `string`          | No       | `@IsString()`                                                                             |
| `state`         | `string`          | No       | `@IsString()`                                                                             |
| `vendorProfile` | `CreateVendorDto` | Yes      | `@ValidateNested()`, `@Type(()`                                                           |

### UpdateUserPasswordDto

**File**: `src/modules/admin/dto/update-password.dto.ts`

| Field         | Type     | Required | Constraints/Decorators                                                                     |
| ------------- | -------- | -------- | ------------------------------------------------------------------------------------------ |
| `newPassword` | `string` | Yes      | `@IsString()`, `@MinLength(8, { message: 'Password must be at least 8 characters long' })` |

### UpdateTurfStatusDto

**File**: `src/modules/admin/dto/update-turf-status.dto.ts`

| Field    | Type          | Required | Constraints/Decorators                                                                                        |
| -------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `status` | `TurfStatus` | Yes      | `@IsEnum(TurfStatus)`<br><br>**Allowed values:** `active, inactive, pending, maintenance, suspended, banned` |

### UserFilterQueryDto

**File**: `src/modules/admin/dto/user-filter-query.dto.ts`

| Field    | Type         | Required | Constraints/Decorators                                                                    |
| -------- | ------------ | -------- | ----------------------------------------------------------------------------------------- |
| `status` | `UserStatus` | No       | `@IsEnum(UserStatus)`<br><br>**Allowed values:** `active, inactive, banned, under_review` |

### VendorFilterQueryDto

**File**: `src/modules/admin/dto/vendor-filter-query.dto.ts`

| Field           | Type           | Required | Constraints/Decorators                                                                  |
| --------------- | -------------- | -------- | --------------------------------------------------------------------------------------- |
| `status`        | `VendorStatus` | No       | `@IsEnum(VendorStatus)`<br><br>**Allowed values:** `active, pending, suspended, banned` |
| `excludeStatus` | `VendorStatus` | No       | `@IsEnum(VendorStatus)`<br><br>**Allowed values:** `active, pending, suspended, banned` |

## Audit

### AuditQueryDto

**File**: `src/modules/audit/dto/audit-query.dto.ts`

| Field       | Type                | Required | Constraints/Decorators                              |
| ----------- | ------------------- | -------- | --------------------------------------------------- |
| `category`  | `AuditCategoryType` | No       | `@IsString()`, `@IsIn(Object.values(AuditCategory)` |
| `eventType` | `AuditActionType`   | No       | `@IsString()`, `@IsIn(Object.values(AuditAction)`   |
| `actorId`   | `string`            | No       | `@IsString()`                                       |

## Auth

### AuthResponseDto

**File**: `src/modules/auth/dto/auth-response.dto.ts`

| Field              | Type       | Required | Constraints/Decorators |
| ------------------ | ---------- | -------- | ---------------------- |
| `accessToken`      | `string`   | Yes      |                        |
| `refreshToken`     | `string`   | Yes      |                        |
| `id`               | `string`   | Yes      |                        |
| `email`            | `string`   | Yes      |                        |
| `roles`            | `string[]` | Yes      |                        |
| `permissions`      | `string[]` | Yes      |                        |
| `profileCompleted` | `boolean`  | Yes      |                        |

### VendorAddressDto

**File**: `src/modules/auth/dto/create-vendor.dto.ts`

| Field            | Type               | Required | Constraints/Decorators                                                |
| ---------------- | ------------------ | -------- | --------------------------------------------------------------------- |
| `type`           | `AddressType`      | Yes      | `@IsEnum(AddressType)`<br><br>**Allowed values:** `home, work, other` |
| `label`          | `string`           | No       | `@IsString()`, `@MaxLength(50)`                                       |
| `pinCode`        | `string`           | Yes      | `@IsString()`, `@MaxLength(20)`                                       |
| `houseNumber`    | `string`           | No       | `@IsString()`, `@MaxLength(50)`                                       |
| `floor`          | `string`           | No       | `@IsString()`, `@MaxLength(20)`                                       |
| `towerBlock`     | `string`           | No       | `@IsString()`, `@MaxLength(50)`                                       |
| `landmark`       | `string`           | No       | `@IsString()`, `@MaxLength(100)`                                      |
| `city`           | `string`           | Yes      | `@IsString()`, `@MaxLength(50)`                                       |
| `state`          | `string`           | Yes      | `@IsString()`, `@MaxLength(50)`                                       |
| `country`        | `string = 'India'` | Yes      | `@IsString()`, `@MaxLength(50)`                                       |
| `contactName`    | `string`           | No       | `@IsString()`, `@MaxLength(100)`                                      |
| `contactPhone`   | `string`           | No       | `@IsString()`, `@MaxLength(20)`                                       |
| `latitude`       | `number`           | No       | `@IsNumber()`                                                         |
| `longitude`      | `number`           | No       | `@IsNumber()`                                                         |
| `googleMapsLink` | `string`           | No       | `@IsUrl()`                                                            |

### VendorBankingDetailsDto

**File**: `src/modules/auth/dto/create-vendor.dto.ts`

| Field               | Type     | Required | Constraints/Decorators           |
| ------------------- | -------- | -------- | -------------------------------- |
| `bankName`          | `string` | Yes      | `@IsString()`, `@MaxLength(100)` |
| `accountHolderName` | `string` | Yes      | `@IsString()`, `@MaxLength(100)` |
| `accountNumber`     | `string` | Yes      | `@IsString()`, `@MaxLength(50)`  |
| `ifsc`              | `string` | Yes      | `@IsString()`, `@MaxLength(20)`  |
| `upiId`             | `string` | No       | `@IsString()`, `@MaxLength(50)`  |

### CreateVendorDto

**File**: `src/modules/auth/dto/create-vendor.dto.ts`

| Field                        | Type                      | Required | Constraints/Decorators                                                                |
| ---------------------------- | ------------------------- | -------- | ------------------------------------------------------------------------------------- |
| `businessName`               | `string`                  | Yes      | `@IsString()`, `@MaxLength(100)`                                                      |
| `businessType`               | `BusinessType`            | Yes      | `@IsEnum(BusinessType)`<br><br>**Allowed values:** `individual, company, partnership` |
| `ownerFullName`              | `string`                  | Yes      | `@IsString()`, `@MaxLength(100)`                                                      |
| `address`                    | `VendorAddressDto`        | Yes      | `@ValidateNested()`, `@Type(()`                                                       |
| `bankingDetails`             | `VendorBankingDetailsDto` | Yes      | `@ValidateNested()`, `@Type(()`                                                       |
| `email`                      | `string`                  | No       | `@IsEmail()`                                                                          |
| `phone`                      | `string`                  | Yes      | `@IsString()`, `@MaxLength(20)`                                                       |
| `whatsapp`                   | `string`                  | No       | `@IsString()`, `@MaxLength(20)`                                                       |
| `gstNumber`                  | `string`                  | No       | `@IsString()`, `@MaxLength(50)`                                                       |
| `businessRegistrationNumber` | `string`                  | No       | `@IsString()`, `@MaxLength(50)`                                                       |
| `commissionPct`              | `string`                  | No       | `@IsString()`                                                                         |
| `payoutCycle`                | `PayoutCycle`             | No       | `@IsEnum(PayoutCycle)`<br><br>**Allowed values:** `daily, weekly, monthly`            |

### RefreshTokenDto

**File**: `src/modules/auth/dto/refresh-token.dto.ts`

| Field          | Type     | Required | Constraints/Decorators |
| -------------- | -------- | -------- | ---------------------- |
| `refreshToken` | `string` | Yes      | `@IsString()`          |

### SigninDto

**File**: `src/modules/auth/dto/signin.dto.ts`

| Field      | Type     | Required | Constraints/Decorators         |
| ---------- | -------- | -------- | ------------------------------ |
| `email`    | `string` | Yes      | `@IsEmail()`                   |
| `password` | `string` | Yes      | `@IsString()`, `@MinLength(1)` |

### SignupDto

**File**: `src/modules/auth/dto/signup.dto.ts`

| Field             | Type                         | Required | Constraints/Decorators                                                                                                                                                                                                                  |
| ----------------- | ---------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `email`           | `string`                     | Yes      | `@IsEmail()`                                                                                                                                                                                                                            |
| `password`        | `string`                     | Yes      | `@IsString()`, `@MinLength(8, { message: 'Password must be at least 8 characters long' })`                                                                                                                                              |
| `role`            | `string = UserRole.END_USER` | No       |                                                                                                                                                                                                                                         |
| `firstName`       | `string`                     | No       | `@MinLength(2)`, `@MaxLength(50)`                                                                                                                                                                                                       |
| `middleName`      | `string`                     | No       | `@MaxLength(50)`                                                                                                                                                                                                                        |
| `lastName`        | `string`                     | No       | `@MinLength(2)`, `@MaxLength(50)`                                                                                                                                                                                                       |
| `displayName`     | `string`                     | No       | `@IsString()`, `@MinLength(2)`, `@MaxLength(50)`                                                                                                                                                                                        |
| `avatarUrl`       | `string`                     | No       | `@IsString()`                                                                                                                                                                                                                           |
| `dateOfBirth`     | `string`                     | No       | `@IsDateString()`                                                                                                                                                                                                                       |
| `gender`          | `GenderType`                 | No       | `@IsEnum(GenderType)`<br><br>**Allowed values:** `male, female, other, prefer_not_to_say`                                                                                                                                               |
| `city`            | `string`                     | No       | `@IsString()`                                                                                                                                                                                                                           |
| `state`           | `string`                     | No       | `@IsString()`                                                                                                                                                                                                                           |
| `preferredSports` | `SportType[]`                | No       | `@IsArray()`, `@IsEnum(SportType, { each: true })`<br><br>**Allowed values:** `football, cricket, tennis, badminton, basketball, hockey, volleyball, kabaddi, box_cricket, futsal, pickleball, throwball, netball, handball, dodgeball` |
| `vendorProfile`   | `CreateVendorDto`            | No       | `@ValidateIf((o: Record<string, unknown>)`, `@ValidateNested()`, `@Type(()`                                                                                                                                                             |

## Kyc

### KycResponseDto

**File**: `src/modules/kyc/dto/kyc-response.dto.ts`

| Field           | Type                      | Required | Constraints/Decorators                                                                       |
| --------------- | ------------------------- | -------- | -------------------------------------------------------------------------------------------- | ------------ |
| `id`            | `string`                  | Yes      | `@Expose()`                                                                                  |
| `vendorId`      | `string`                  | Yes      | `@Expose()`                                                                                  |
| `status`        | `KycStatus`               | Yes      | `@Expose()`<br><br>**Allowed values:** `not_started, pending, in_review, verified, rejected` |
| `documents`     | `KycDocumentsDto`         | Yes      | `@Expose()`, `@Type(()`                                                                      |
| `verification`  | `Record<string, boolean>` | Yes      | `@Expose()`                                                                                  |
| `reviewerNotes` | `string                   | null`    | No                                                                                           | `@Exclude()` |
| `reviewedBy`    | `string                   | null`    | No                                                                                           | `@Expose()`  |
| `reviewedAt`    | `Date                     | null`    | No                                                                                           | `@Expose()`  |
| `submittedAt`   | `Date                     | null`    | No                                                                                           | `@Expose()`  |
| `createdAt`     | `Date`                    | Yes      | `@Expose()`                                                                                  |
| `updatedAt`     | `Date`                    | Yes      | `@Expose()`                                                                                  |

### KycDocumentsDto

**File**: `src/modules/kyc/dto/kyc.dto.ts`

| Field                  | Type     | Required | Constraints/Decorators |
| ---------------------- | -------- | -------- | ---------------------- |
| `identityProof`        | `string` | No       | `@IsString()`          |
| `addressProof`         | `string` | No       | `@IsString()`          |
| `businessRegistration` | `string` | No       | `@IsString()`          |
| `gstCertificate`       | `string` | No       | `@IsString()`          |
| `cancelledCheque`      | `string` | No       | `@IsString()`          |

### SubmitKycDto

**File**: `src/modules/kyc/dto/kyc.dto.ts`

| Field       | Type              | Required | Constraints/Decorators          |
| ----------- | ----------------- | -------- | ------------------------------- |
| `documents` | `KycDocumentsDto` | Yes      | `@ValidateNested()`, `@Type(()` |

### ReviewKycDto

**File**: `src/modules/kyc/dto/kyc.dto.ts`

| Field           | Type                      | Required | Constraints/Decorators                                                                                |
| --------------- | ------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `status`        | `KycStatus`               | Yes      | `@IsEnum(KycStatus)`<br><br>**Allowed values:** `not_started, pending, in_review, verified, rejected` |
| `reviewerNotes` | `string`                  | No       | `@IsString()`                                                                                         |
| `verification`  | `Record<string, boolean>` | No       |                                                                                                       |

## Sub-admin

### CreateSubAdminDto

**File**: `src/modules/sub-admin/dto/sub-admin.dto.ts`

| Field      | Type     | Required | Constraints/Decorators         |
| ---------- | -------- | -------- | ------------------------------ |
| `email`    | `string` | Yes      | `@IsEmail()`                   |
| `password` | `string` | Yes      | `@IsString()`, `@MinLength(8)` |
| `name`     | `string` | No       | `@IsString()`                  |

### CreateRoleDto

**File**: `src/modules/sub-admin/dto/sub-admin.dto.ts`

| Field           | Type       | Required | Constraints/Decorators                       |
| --------------- | ---------- | -------- | -------------------------------------------- |
| `name`          | `string`   | Yes      | `@IsString()`, `@MinLength(2)`               |
| `description`   | `string`   | No       | `@IsString()`                                |
| `permissionIds` | `string[]` | No       | `@IsArray()`, `@IsUUID('4', { each: true })` |

### UpdateRolePermissionsDto

**File**: `src/modules/sub-admin/dto/sub-admin.dto.ts`

| Field           | Type       | Required | Constraints/Decorators                                           |
| --------------- | ---------- | -------- | ---------------------------------------------------------------- |
| `permissionIds` | `string[]` | Yes      | `@IsArray()`, `@IsUUID('4', { each: true })`, `@ArrayMinSize(0)` |

### AssignRoleDto

**File**: `src/modules/sub-admin/dto/sub-admin.dto.ts`

| Field    | Type     | Required | Constraints/Decorators |
| -------- | -------- | -------- | ---------------------- |
| `roleId` | `string` | Yes      | `@IsUUID('4')`         |

### AssignRolesToSubAdminDto

**File**: `src/modules/sub-admin/dto/sub-admin.dto.ts`

| Field     | Type       | Required | Constraints/Decorators                                           |
| --------- | ---------- | -------- | ---------------------------------------------------------------- |
| `roleIds` | `string[]` | Yes      | `@IsArray()`, `@IsUUID('4', { each: true })`, `@ArrayMinSize(1)` |

## Turfs

### CreateTurfDto

**File**: `src/modules/turfs/dto/create-turf.dto.ts`

| Field                   | Type             | Required | Constraints/Decorators                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------- | ---------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                  | `string`         | Yes      | `@IsString()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sports`                | `SportType[]`    | Yes      | `@IsArray()`, `@IsEnum(SportType, { each: true })`<br><br>**Allowed values:** `football, cricket, tennis, badminton, basketball, hockey, volleyball, kabaddi, box_cricket, futsal, pickleball, throwball, netball, handball, dodgeball`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `amenities`             | `AmenityType[]`  | No       | `@IsArray()`, `@IsEnum(AmenityType, { each: true })`<br><br>**Allowed values:** `parking, flood_lights, changing_room, cafeteria, equipment_rental, first_aid, wifi, cctv, drinking_water, indoor_facility, outdoor_facility, covered_turf, ground_size, sport_type_supported, proper_markings, multi_sport_facility, practice_nets, court_quality, floodlights_night_play, power_backup, day_night_availability, washrooms, changing_rooms, showers, seating_dugout, locker_facility, clean_environment, easy_location_access, nearby_public_transport, security_presence, verified_safe_turf, equipment_available, referee_umpire, scoreboard, warm_up_area, coaching_available, tournament_hosting, event_hosting, music_system, night_ambiance_lighting, snacks_cafe, energy_drinks, online_booking, real_time_availability, digital_payments_upicard, booking_confirmation_reminders, ratings_reviews, open_matches, player_matching, team_bookings, membership_plans, corporate_bookings` |
| `capacity`              | `number`         | No       | `@IsInt()`, `@Min(0)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `sizeFormat`            | `string`         | No       | `@IsString()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `surfaceType`           | `SurfaceType`    | Yes      | `@IsEnum(SurfaceType)`<br><br>**Allowed values:** `artificial_turf, natural_grass, concrete, wooden, synthetic`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `address`               | `TurfAddressDto` | Yes      | `@ValidateNested()`, `@Type(()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `weekdayOpen`           | `string`         | Yes      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `weekdayClose`          | `string`         | Yes      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `weekendOpen`           | `string`         | Yes      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `weekendClose`          | `string`         | Yes      |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `standardPricePaise`    | `number`         | Yes      | `@IsInt()`, `@Min(0)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `cancellationWindowHrs` | `number`         | No       | `@IsInt()`, `@Min(0)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

### ReviewTurfDocumentsDto

**File**: `src/modules/turfs/dto/review-turf-documents.dto.ts`

| Field           | Type                      | Required | Constraints/Decorators                                                                                |
| --------------- | ------------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `status`        | `KycStatus`               | Yes      | `@IsEnum(KycStatus)`<br><br>**Allowed values:** `not_started, pending, in_review, verified, rejected` |
| `reviewerNotes` | `string`                  | No       | `@IsString()`                                                                                         |
| `verification`  | `Record<string, boolean>` | No       |                                                                                                       |

### SubmitTurfDocumentsDto

**File**: `src/modules/turfs/dto/submit-turf-documents.dto.ts`

| Field       | Type               | Required | Constraints/Decorators          |
| ----------- | ------------------ | -------- | ------------------------------- |
| `documents` | `TurfDocumentsDto` | Yes      | `@ValidateNested()`, `@Type(()` |

### TurfAddressDto

**File**: `src/modules/turfs/dto/turf-address.dto.ts`

| Field            | Type               | Required | Constraints/Decorators                                                |
| ---------------- | ------------------ | -------- | --------------------------------------------------------------------- |
| `label`          | `string`           | No       | `@IsString()`, `@MaxLength(50)`                                       |
| `pinCode`        | `string`           | Yes      | `@IsString()`, `@MaxLength(20)`                                       |
| `houseNumber`    | `string`           | No       | `@IsString()`, `@MaxLength(50)`                                       |
| `floor`          | `string`           | No       | `@IsString()`, `@MaxLength(20)`                                       |
| `towerBlock`     | `string`           | No       | `@IsString()`, `@MaxLength(50)`                                       |
| `landmark`       | `string`           | No       | `@IsString()`, `@MaxLength(100)`                                      |
| `city`           | `string`           | Yes      | `@IsString()`, `@MaxLength(50)`                                       |
| `state`          | `string`           | Yes      | `@IsString()`, `@MaxLength(50)`                                       |
| `country`        | `string = 'India'` | Yes      | `@IsString()`, `@MaxLength(50)`                                       |
| `contactName`    | `string`           | No       | `@IsString()`, `@MaxLength(100)`                                      |
| `contactPhone`   | `string`           | No       | `@IsString()`, `@MaxLength(20)`                                       |
| `latitude`       | `number`           | No       | `@IsNumber()`                                                         |
| `longitude`      | `number`           | No       | `@IsNumber()`                                                         |
| `googleMapsLink` | `string`           | No       | `@IsUrl()`                                                            |

### TurfDocumentsResponseDto

**File**: `src/modules/turfs/dto/turf-documents-response.dto.ts`

| Field           | Type                      | Required | Constraints/Decorators                                                                       |
| --------------- | ------------------------- | -------- | -------------------------------------------------------------------------------------------- | ------------ |
| `id`            | `string`                  | Yes      | `@Expose()`                                                                                  |
| `turfId`        | `string`                  | Yes      | `@Expose()`                                                                                  |
| `status`        | `KycStatus`               | Yes      | `@Expose()`<br><br>**Allowed values:** `not_started, pending, in_review, verified, rejected` |
| `documents`     | `TurfDocumentsDto`        | Yes      | `@Expose()`, `@Type(()`                                                                      |
| `verification`  | `Record<string, boolean>` | Yes      | `@Expose()`                                                                                  |
| `reviewerNotes` | `string                   | null`    | No                                                                                           | `@Exclude()` |
| `reviewedBy`    | `string                   | null`    | No                                                                                           | `@Expose()`  |
| `reviewedAt`    | `Date                     | null`    | No                                                                                           | `@Expose()`  |
| `submittedAt`   | `Date                     | null`    | No                                                                                           | `@Expose()`  |
| `createdAt`     | `Date`                    | Yes      | `@Expose()`                                                                                  |
| `updatedAt`     | `Date`                    | Yes      | `@Expose()`                                                                                  |

### TurfDocumentsDto

**File**: `src/modules/turfs/dto/turf-documents.dto.ts`

| Field                | Type       | Required | Constraints/Decorators                                        |
| -------------------- | ---------- | -------- | ------------------------------------------------------------- |
| `propertyDocument`   | `string`   | No       | `@IsString()`                                                 |
| `municipalNoc`       | `string`   | No       | `@IsString()`                                                 |
| `liabilityInsurance` | `string`   | No       | `@IsString()`                                                 |
| `turfPhotos`         | `string[]` | No       | `@IsArray()`, `@ArrayMaxSize(5)`, `@IsString({ each: true })` |

### TurfFilterQueryDto

**File**: `src/modules/turfs/dto/turf-filter-query.dto.ts`

| Field       | Type          | Required | Constraints/Decorators                                                                                                                                                                                    |
| ----------- | ------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status`    | `TurfStatus` | No       | `@IsEnum(TurfStatus)`<br><br>**Allowed values:** `active, inactive, pending, maintenance, suspended, banned`                                                                                             |
| `sportType` | `SportType`   | No       | `@IsEnum(SportType)`<br><br>**Allowed values:** `football, cricket, tennis, badminton, basketball, hockey, volleyball, kabaddi, box_cricket, futsal, pickleball, throwball, netball, handball, dodgeball` |
| `city`      | `string`      | No       | `@IsString()`                                                                                                                                                                                             |

### TurfResponseDto

**File**: `src/modules/turfs/dto/turf-response.dto.ts`

| Field                   | Type                       | Required | Constraints/Decorators                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------- | -------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| `id`                    | `string`                   | Yes      | `@Expose()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `vendorId`              | `string`                   | Yes      | `@Expose()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `name`                  | `string`                   | Yes      | `@Expose()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `sports`                | `SportType[]`              | Yes      | `@Expose()`<br><br>**Allowed values:** `football, cricket, tennis, badminton, basketball, hockey, volleyball, kabaddi, box_cricket, futsal, pickleball, throwball, netball, handball, dodgeball`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `amenities`             | `AmenityType[]`            | Yes      | `@Expose()`<br><br>**Allowed values:** `parking, flood_lights, changing_room, cafeteria, equipment_rental, first_aid, wifi, cctv, drinking_water, indoor_facility, outdoor_facility, covered_turf, ground_size, sport_type_supported, proper_markings, multi_sport_facility, practice_nets, court_quality, floodlights_night_play, power_backup, day_night_availability, washrooms, changing_rooms, showers, seating_dugout, locker_facility, clean_environment, easy_location_access, nearby_public_transport, security_presence, verified_safe_turf, equipment_available, referee_umpire, scoreboard, warm_up_area, coaching_available, tournament_hosting, event_hosting, music_system, night_ambiance_lighting, snacks_cafe, energy_drinks, online_booking, real_time_availability, digital_payments_upicard, booking_confirmation_reminders, ratings_reviews, open_matches, player_matching, team_bookings, membership_plans, corporate_bookings` |
| `capacity`              | `number                    | null`    | Yes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `@Expose()` |
| `sizeFormat`            | `string                    | null`    | Yes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `@Expose()` |
| `surfaceType`           | `SurfaceType`              | Yes      | `@Expose()`<br><br>**Allowed values:** `artificial_turf, natural_grass, concrete, wooden, synthetic`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `address`               | `TurfAddressDto`           | Yes      | `@Expose()`, `@Type(()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `weekdayOpen`           | `string`                   | Yes      | `@Expose()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `weekdayClose`          | `string`                   | Yes      | `@Expose()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `weekendOpen`           | `string`                   | Yes      | `@Expose()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `weekendClose`          | `string`                   | Yes      | `@Expose()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `standardPricePaise`    | `number`                   | Yes      | `@Expose()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `cancellationWindowHrs` | `number`                   | Yes      | `@Expose()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `status`                | `TurfStatus`              | Yes      | `@Expose()`<br><br>**Allowed values:** `active, inactive, pending, maintenance, suspended, banned`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `vendorBusinessName`    | `string`                   | No       | `@Expose()`, `@Expose()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `vendorPhone`           | `string`                   | No       | `@Expose()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `vendorWhatsapp`        | `string`                   | No       | `@Expose()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `fieldPhotos`           | `string[]`                 | No       | `@Expose()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `kyc`                   | `TurfDocumentsResponseDto` | No       | `@Expose()`, `@Type(()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `rating`                | `TurfRatingDto`            | No       | `@Expose()`, `@Type(()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `createdAt`             | `Date`                     | Yes      | `@Expose()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `updatedAt`             | `Date`                     | Yes      | `@Expose()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

### UpdateTurfStatusDto

**File**: `src/modules/turfs/dto/update-turf-status.dto.ts`

| Field    | Type          | Required | Constraints/Decorators                                                                                        |
| -------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `status` | `TurfStatus` | Yes      | `@IsEnum(TurfStatus)`<br><br>**Allowed values:** `active, inactive, pending, maintenance, suspended, banned` |

### UpdateTurfDto

**File**: `src/modules/turfs/dto/update-turf.dto.ts`

| Field  | Type | Required | Constraints/Decorators |
| ------ | ---- | -------- | ---------------------- |
| (none) |      |          |                        |

## Users

### AddFavouriteDto

**File**: `src/modules/users/dto/add-favourite.dto.ts`

| Field    | Type     | Required | Constraints/Decorators |
| -------- | -------- | -------- | ---------------------- |
| `turfId` | `string` | Yes      | `@IsString()`          |

### UpdateUserDto

**File**: `src/modules/users/dto/update-user.dto.ts`

| Field                      | Type               | Required | Constraints/Decorators                                                                                                                                                                                                                  |
| -------------------------- | ------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `firstName`                | `string`           | No       | `@MinLength(2)`, `@MaxLength(50)`                                                                                                                                                                                                       |
| `middleName`               | `string`           | No       | `@MaxLength(50)`                                                                                                                                                                                                                        |
| `lastName`                 | `string`           | No       | `@MinLength(2)`, `@MaxLength(50)`                                                                                                                                                                                                       |
| `displayName`              | `string`           | No       | `@IsString()`, `@MinLength(2)`, `@MaxLength(50)`                                                                                                                                                                                        |
| `avatarUrl`                | `string`           | No       | `@IsString()`                                                                                                                                                                                                                           |
| `dateOfBirth`              | `string`           | No       | `@IsDateString()`                                                                                                                                                                                                                       |
| `gender`                   | `GenderType`       | No       | `@IsEnum(GenderType)`<br><br>**Allowed values:** `male, female, other, prefer_not_to_say`                                                                                                                                               |
| `city`                     | `string`           | No       | `@IsString()`                                                                                                                                                                                                                           |
| `state`                    | `string`           | No       | `@IsString()`                                                                                                                                                                                                                           |
| `country`                  | `string`           | No       | `@IsString()`                                                                                                                                                                                                                           |
| `preferredSports`          | `SportType[]`      | No       | `@IsArray()`, `@IsEnum(SportType, { each: true })`<br><br>**Allowed values:** `football, cricket, tennis, badminton, basketball, hockey, volleyball, kabaddi, box_cricket, futsal, pickleball, throwball, netball, handball, dodgeball` |
| `deviceOs`                 | `DeviceOsType`     | No       | `@IsEnum(DeviceOsType)`<br><br>**Allowed values:** `ios, android, web`                                                                                                                                                                  |
| `appVersion`               | `string`           | No       | `@IsString()`                                                                                                                                                                                                                           |
| `pushNotificationsEnabled` | `boolean`          | No       | `@IsBoolean()`                                                                                                                                                                                                                          |
| `onesignalPlayerId`        | `string`           | No       | `@IsString()`                                                                                                                                                                                                                           |
| `whatsapp`                 | `string`           | No       | `@IsString()`                                                                                                                                                                                                                           |
| `addresses`                | `UserAddressDto[]` | No       | `@IsArray()`, `@Type(()`                                                                                                                                                                                                                |

### UserAddressDto

**File**: `src/modules/users/dto/user-address.dto.ts`

| Field            | Type               | Required | Constraints/Decorators                                                |
| ---------------- | ------------------ | -------- | --------------------------------------------------------------------- |
| `id`             | `string`           | No       | `@IsUUID()`                                                           |
| `type`           | `AddressType`      | Yes      | `@IsEnum(AddressType)`<br><br>**Allowed values:** `home, work, other` |
| `label`          | `string`           | No       | `@IsString()`, `@MaxLength(50)`                                       |
| `pinCode`        | `string`           | Yes      | `@IsString()`, `@MaxLength(20)`                                       |
| `houseNumber`    | `string`           | No       | `@IsString()`, `@MaxLength(50)`                                       |
| `floor`          | `string`           | No       | `@IsString()`, `@MaxLength(20)`                                       |
| `towerBlock`     | `string`           | No       | `@IsString()`, `@MaxLength(50)`                                       |
| `landmark`       | `string`           | No       | `@IsString()`, `@MaxLength(100)`                                      |
| `city`           | `string`           | Yes      | `@IsString()`, `@MaxLength(50)`                                       |
| `state`          | `string`           | Yes      | `@IsString()`, `@MaxLength(50)`                                       |
| `country`        | `string = 'India'` | Yes      | `@IsString()`, `@MaxLength(50)`                                       |
| `contactName`    | `string`           | No       | `@IsString()`, `@MaxLength(100)`                                      |
| `contactPhone`   | `string`           | No       | `@IsString()`, `@MaxLength(20)`                                       |
| `latitude`       | `number`           | No       | `@IsNumber()`                                                         |
| `longitude`      | `number`           | No       | `@IsNumber()`                                                         |
| `googleMapsLink` | `string`           | No       | `@IsUrl()`                                                            |

### UserResponseDto

**File**: `src/modules/users/dto/user-response.dto.ts`

| Field                      | Type                      | Required | Constraints/Decorators                                                                                                                                                        |
| -------------------------- | ------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `id`                       | `string`                  | Yes      |                                                                                                                                                                               |
| `identityId`               | `string`                  | Yes      |                                                                                                                                                                               |
| `email`                    | `string`                  | Yes      |                                                                                                                                                                               |
| `firstName`                | `string`                  | Yes      |                                                                                                                                                                               |
| `middleName`               | `string                   | null`    | Yes                                                                                                                                                                           |     |
| `lastName`                 | `string`                  | Yes      |                                                                                                                                                                               |
| `displayName`              | `string`                  | Yes      |                                                                                                                                                                               |
| `avatarUrl`                | `string                   | null`    | Yes                                                                                                                                                                           |     |
| `dateOfBirth`              | `string                   | null`    | Yes                                                                                                                                                                           |     |
| `gender`                   | `GenderType               | null`    | Yes                                                                                                                                                                           |     |
| `city`                     | `string                   | null`    | Yes                                                                                                                                                                           |     |
| `state`                    | `string                   | null`    | Yes                                                                                                                                                                           |     |
| `country`                  | `string`                  | Yes      |                                                                                                                                                                               |
| `preferredSports`          | `SportType[]`             | Yes      | **Allowed values:** `football, cricket, tennis, badminton, basketball, hockey, volleyball, kabaddi, box_cricket, futsal, pickleball, throwball, netball, handball, dodgeball` |
| `addresses`                | `UserAddressDto[]`        | No       |                                                                                                                                                                               |
| `favouriteTurfs`           | `Record<string, boolean>` | No       |                                                                                                                                                                               |
| `ownReferralCode`          | `string                   | null`    | Yes                                                                                                                                                                           |     |
| `pushNotificationsEnabled` | `boolean`                 | Yes      |                                                                                                                                                                               |
| `status`                   | `UserStatus`              | Yes      | **Allowed values:** `active, inactive, banned, under_review`                                                                                                                  |
| `lastActiveAt`             | `string                   | null`    | Yes                                                                                                                                                                           |     |
| `createdAt`                | `string`                  | Yes      |                                                                                                                                                                               |

## Vendors

### UpdateVendorDto

**File**: `src/modules/vendors/dto/update-vendor.dto.ts`

| Field  | Type | Required | Constraints/Decorators |
| ------ | ---- | -------- | ---------------------- |
| (none) |      |          |                        |

### VendorResponseDto

**File**: `src/modules/vendors/dto/vendor-response.dto.ts`

| Field                        | Type                      | Required | Constraints/Decorators                                                      |
| ---------------------------- | ------------------------- | -------- | --------------------------------------------------------------------------- |
| `id`                         | `string`                  | Yes      | `@Expose()`                                                                 |
| `identityId`                 | `string`                  | Yes      | `@Expose()`                                                                 |
| `businessName`               | `string`                  | Yes      | `@Expose()`                                                                 |
| `businessType`               | `BusinessType`            | Yes      | `@Expose()`<br><br>**Allowed values:** `individual, company, partnership`   |
| `ownerFullName`              | `string`                  | Yes      | `@Expose()`                                                                 |
| `address`                    | `VendorAddressDto`        | Yes      | `@Expose()`, `@Type(()`                                                     |
| `bankingDetails`             | `VendorBankingDetailsDto` | Yes      | `@Expose()`, `@Type(()`                                                     |
| `commissionPct`              | `string`                  | Yes      | `@Expose()`                                                                 |
| `payoutCycle`                | `PayoutCycle`             | Yes      | `@Expose()`<br><br>**Allowed values:** `daily, weekly, monthly`             |
| `email`                      | `string`                  | Yes      | `@Expose()`                                                                 |
| `phone`                      | `string`                  | Yes      | `@Expose()`                                                                 |
| `whatsapp`                   | `string`                  | No       | `@Expose()`                                                                 |
| `gstNumber`                  | `string`                  | No       | `@Expose()`                                                                 |
| `businessRegistrationNumber` | `string`                  | No       | `@Expose()`                                                                 |
| `status`                     | `VendorStatus`            | Yes      | `@Expose()`<br><br>**Allowed values:** `active, pending, suspended, banned` |
| `kyc`                        | `KycResponseDto`          | No       | `@Expose()`, `@Type(()`                                                     |
| `createdAt`                  | `Date`                    | Yes      | `@Expose()`                                                                 |
| `updatedAt`                  | `Date`                    | Yes      | `@Expose()`                                                                 |
## Slots

### SlotQueryDto

**File**: `src/modules/slots/dto/slot-query.dto.ts`

| Field  | Type     | Required | Description                        | Constraints/Decorators |
| ------ | -------- | -------- | ---------------------------------- | ---------------------- |
| `date` | `string` | No       | Date for slots in YYYY-MM-DD (IST) | `@IsOptional()`, `@IsDateString()` |

### UpsertSlotConfigDto

**File**: `src/modules/slots/dto/upsert-slot-config.dto.ts`

| Field | Type | Required | Description | Constraints/Decorators |
| --- | --- | --- | --- | --- |
| `slotDurationMins` | `number` | Yes | Duration of each slot in minutes | `@Min(30)`, `@Max(1440)` |
| `weekdayOpen` | `string` | Yes | Opening time on weekdays (HH:MM) | `@Matches(/^\d{2}:\d{2}$/)` |
| `weekdayClose` | `string` | Yes | Closing time on weekdays (HH:MM) | `@Matches(/^\d{2}:\d{2}$/)` |
| `weekendOpen` | `string` | Yes | Opening time on weekends (HH:MM) | `@Matches(/^\d{2}:\d{2}$/)` |
| `weekendClose` | `string` | Yes | Closing time on weekends (HH:MM) | `@Matches(/^\d{2}:\d{2}$/)` |
| `advanceBookingDays` | `number` | No | Days ahead users can book (default: 30) | `@IsOptional()`, `@Min(1)`, `@Max(90)` |
| `weeklyPricing` | `SlotConfigDayPricingDto[]` | Yes | Pricing grid for each day of week | `@ArrayMaxSize(7)`, `@ValidateNested()` |

### SlotConfigDayPricingDto

**File**: `src/modules/slots/dto/slot-config-day-pricing.dto.ts`

| Field | Type | Required | Description | Constraints/Decorators |
| --- | --- | --- | --- | --- |
| `dayOfWeek` | `number` | Yes | 0 (Sun) to 6 (Sat) | `@IsInt()`, `@Min(0)`, `@Max(6)` |
| `prices` | `number[]` | Yes | Array of prices in paise for each slot | `@IsArray()`, `@IsInt({each:true})` |

### VendorSlotPatchDto

**File**: `src/modules/slots/dto/vendor-slot-patch.dto.ts`

| Field | Type | Required | Description | Constraints/Decorators |
| --- | --- | --- | --- | --- |
| `status` | `SlotStatus` | No | status override | `@IsOptional()`, `@IsEnum(SlotStatus)` |
| `priceOverridePaise` | `number` | No | manual price override | `@IsOptional()`, `@IsInt()`, `@Min(0)` |

### AdminSlotPatchDto

**File**: `src/modules/slots/dto/admin-slot-patch.dto.ts`

| Field | Type | Required | Description | Constraints/Decorators |
| --- | --- | --- | --- | --- |
| `status` | `SlotStatus` | No | status override | `@IsOptional()`, `@IsEnum(SlotStatus)` |
| `priceOverridePaise` | `number` | No | manual price override | `@IsOptional()`, `@IsInt()`, `@Min(0)` |

### SlotResponseDto

**File**: `src/modules/slots/dto/slot-response.dto.ts`

| Field | Type | Description |
| --- | --- | --- |
| `slotId` | `string` | Unique slot UUID |
| `slotIndex` | `number` | Position within the day grid |
| `slotDate` | `string` | Slot date in `YYYY-MM-DD` |
| `startTime` | `string` | Slot start time in `HH:MM:SS` |
| `endTime` | `string` | Slot end time in `HH:MM:SS` |
| `pricePaise` | `number` | effective price |
| `availability` | `'available' \| 'unavailable'` | user-facing availability state |

### VendorSlotResponseDto

**File**: `src/modules/slots/dto/slot-response.dto.ts`

Inherits from `SlotResponseDto` and adds:

| Field | Type | Description |
| --- | --- | --- |
| `status` | `string` | internal slot state |
| `blockReason` | `string \| null` | operational block reason |
| `holdExpiresAt` | `string \| null` | hold expiry timestamp |
| `isPriceOverridden` | `boolean` | manual override flag |
| `configVersion` | `number` | source config version |

### AdminSlotResponseDto

**File**: `src/modules/slots/dto/slot-response.dto.ts`

Inherits from `VendorSlotResponseDto` and adds:

| Field | Type | Description |
| --- | --- | --- |
| `heldByBookingId` | `string \| null` | linked booking hold reference |
| `generatedAt` | `string` | generation timestamp |

### SlotConfigResponseDto

**File**: `src/modules/slots/dto/slot-response.dto.ts`

Matches `UpsertSlotConfigDto` structure plus:

| Field | Type | Description |
| --- | --- | --- |
| `turfId` | `string` | parent turf UUID |
| `configVersion` | `number` | config version |
| `updatedAt` | `string` | last update timestamp |
