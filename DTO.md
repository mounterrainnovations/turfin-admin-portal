# Turfin Backend DTO & Enum Reference

This document serves as the **Single Source of Truth** for the backend data structures. It is intended for both backend maintenance and frontend integration.

---

## 1. Global Enums
These enums are used across multiple modules and are defined in `src/common/types/enums.ts`.

### Identity & Account
| Enum | Values |
| :--- | :--- |
| **UserRole** | `super_admin`, `sub_admin`, `vendor_owner`, `end_user` |
| **IdentityStatus** | `active`, `inactive`, `banned`, `under_review` |
| **UserStatus** | `active`, `inactive`, `banned`, `under_review` |
| **VendorStatus** | `active`, `pending`, `suspended`, `banned` |
| **KycStatus** | `not_started`, `pending`, `in_review`, `verified`, `rejected` |

### Profile Details
| Enum | Values |
| :--- | :--- |
| **GenderType** | `male`, `female`, `other`, `prefer_not_to_say` |
| **AddressType** | `home`, `work`, `other` |
| **AcquisitionSource** | `organic`, `referral`, `google_ads`, `meta_ads`, `influencer`, `other` |
| **DeviceOsType** | `ios`, `android`, `web` |

### Sports & Business
| Enum | Values |
| :--- | :--- |
| **SportType** | `football`, `cricket`, `tennis`, `badminton`, `basketball`, `hockey`, `volleyball`, `kabaddi`, `box_cricket`, `futsal`, `pickleball`, `throwball`, `netball`, `handball`, `dodgeball` |
| **AmenityType** | `parking`, `flood_lights`, `changing_room`, `cafeteria`, `equipment_rental`, `first_aid`, `wifi`, `cctv`, `drinking_water` |
| **SurfaceType** | `artificial_turf`, `natural_grass`, `concrete`, `wooden`, `synthetic` |
| **BusinessType** | `individual`, `company`, `partnership` |
| **PayoutCycle** | `daily`, `weekly`, `monthly` |

### Operations & Lifecycle
| Enum | Values |
| :--- | :--- |
| **FieldStatus** | `active`, `inactive`, `pending`, `maintenance`, `suspended`, `banned` |
| **SlotStatus** | `available`, `booked`, `blocked`, `maintenance` |
| **BookingStatus** | `pending`, `confirmed`, `cancelled`, `completed`, `no_show` |
| **PaymentStatus** | `created`, `pending`, `authorized`, `captured`, `failed`, `refunded`, `partially_refunded` |
| **BlockReason** | `maintenance`, `private_event`, `weather`, `vendor_hold`, `other` |

### Marketing & Finance
| Enum | Values |
| :--- | :--- |
| **DiscountType** | `flat`, `percentage` |
| **CouponScopeType** | `platform`, `vendor`, `field` |

---

## 2. Authentication & Signup

### SignupDto
Used for creating new accounts. The structure changes based on the `role`.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | String | Yes | Unique user email. |
| `password` | String | Yes | Min 8 chars. |
| `role` | UserRole | Optional | Default: `end_user`. |
| `firstName` | String | Role=User | User's first name. (Optional for Vendor) |
| `lastName` | String | Role=User | User's last name. (Optional for Vendor) |
| `displayName`| String | Role=User | Profile display name. (Optional for Vendor) |
| `vendorProfile`| CreateVendorDto | Role=Vendor | Required if role is `vendor_owner`. |

---

## 3. Vendor DTOs

### CreateVendorDto / UpdateVendorDto
| Field | Type | Status | Mapping |
| :--- | :--- | :--- | :--- |
| `businessName` | String (100) | Required | Table: `vendors.business_name` |
| `businessType` | BusinessType | Required | Table: `vendors.business_type` |
| `ownerFullName` | String (100) | Required | Table: `vendors.owner_full_name` |
| `address` | VendorAddressDto | Required | Table: `vendors.address` (JSONB) |
| `bankingDetails`| BankingDto | Required | Table: `vendors.banking_details` (JSONB) |
| `commissionPct` | String | Optional | Stored as string to preserve precision. |
| `payoutCycle` | PayoutCycle | Optional | Default: `monthly`. |

### AdminOnboardVendorDto
Used by Admins to create a vendor. Mirrors `SignupDto` capabilities.
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | String | Yes | Identity email. |
| `password` | String | Yes | Identity password. |
| `vendorProfile`| CreateVendorDto | Yes | Business details. |
| `firstName` | String | No | Optional owner first name. |
| `lastName` | String | No | Optional owner last name. |
| `displayName` | String | No | Optional identity display name. |
| `gender` | GenderType | No | Optional. |
| `city` / `state` | String | No | Optional. |

### VendorAddressDto / UserAddressDto / TurfAddressDto
All address structures in the system are now unified to use these fields.

| Field | Type | Note |
| :--- | :--- | :--- |
| `type` | AddressType | Enum |
| `label` | String (50) | Descriptive label (e.g., "Office"). |
| `pinCode` | String (20) | Required. |
| `houseNumber` | String (50) | Optional. |
| `floor` | String (20) | Optional. |
| `towerBlock` | String (50) | Optional. |
| `landmark` | String (100) | Optional. |
| `city` / `state` / `country` | String (50) | Required. |
| `latitude` / `longitude` | Number | Optional. |
| `googleMapsLink` | URL String | Optional. |

### KYC Submission (SubmitKycDto)
| Field | Type | Description |
| :--- | :--- | :--- |
| `documents` | Object | Nested `KycDocumentsDto`. |
| `documents.identityProof` | String (URL) | |
| `documents.addressProof` | String (URL) | |
| `documents.businessRegistration` | String (URL) | |
| `documents.gstCertificate` | String (URL) | |
| `documents.cancelledCheque` | String (URL) | |

---

## 4. Turf (Field) DTOs

### CreateTurfDto / UpdateTurfDto
| Field | Type | Status | Note |
| :--- | :--- | :--- | :--- |
| `name` | String | Required | Turf name. |
| `sports` | SportType[] | Required | Min 1 sport. |
| `amenities` | AmenityType[] | Optional | |
| `capacity` | Integer | Optional | Min 0. |
| `sizeFormat` | String | Optional | e.g. "7x7", "11x11". |
| `surfaceType` | SurfaceType | Required | |
| `address` | TurfAddressDto | Required | Unified address structure. |
| `weekdayOpen` | Time "HH:MM" | Required | 24h format. |
| `weekdayClose` | Time "HH:MM" | Required | 24h format. |
| `weekendOpen` | Time "HH:MM" | Required | 24h format. |
| `weekendClose` | Time "HH:MM" | Required | 24h format. |
| `standardPricePaise`| Integer | Required | Price in Paise (INR * 100). |

---

## 5. User DTOs

### UpdateUserDto
Used for updating own profile.
| Field | Type | Note |
| :--- | :--- | :--- |
| `firstName` / `lastName` | String | |
| `displayName` | String | |
| `avatarUrl` | URL String | |
| `dateOfBirth` | ISO Date String| |
| `gender` | GenderType | Enum |
| `preferredSports` | SportType[] | Set of sports. |
| `whatsapp` | String | Updated in `identities` table. |
| `addresses` | UserAddressDto[]| Array of saved addresses. |

---

## 6. Audit & Notifications (Reference)
For a complete list of `AuditAction` and `NotificationType` values, refer to `src/common/types/enums.ts`. These are primarily consumed for display and historical tracking.

