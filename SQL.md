# TurfIn Database Documentation

This document provides a comprehensive overview of the Supabase database schema for the TurfIn platform. It includes enum definitions, table structures, and relationships to serve as a reference for both backend DTO verification and frontend integration.

## Table of Contents

- [Enums](#enums)
- [Tables](#tables)
  - [Identities & Roles](#identities--roles)
  - [Users](#users)
  - [Vendors & KYC](#vendors--kyc)
  - [Fields & Documents](#fields--documents)
  - [Slots & Bookings](#slots--bookings)
  - [Payments & Refunds](#payments--refunds)
  - [Audit & Notifications](#audit--notifications)
  - [Infrastructure](#infrastructure)

---

## Enums

| Enum Name              | Values                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `identity_status`      | `active`, `inactive`, `banned`, `under_review`                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `user_status`          | `active`, `inactive`, `banned`, `under_review`                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `vendor_status`        | `active`, `pending`, `suspended`, `banned`                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `field_status`         | `active`, `inactive`, `pending`, `maintenance`, `suspended`, `banned`                                                                                                                                                                                                                                                                                                                                                                                                            |
| `kyc_status`           | `not_started`, `pending`, `in_review`, `verified`, `rejected`                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `payment_status`       | `created`, `pending`, `authorized`, `captured`, `failed`, `refunded`, `partially_refunded`                                                                                                                                                                                                                                                                                                                                                                                       |
| `booking_status`       | `pending`, `confirmed`, `cancelled`, `completed`, `no_show`                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `slot_status`          | `available`, `booked`, `blocked`, `maintenance`                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `block_reason`         | `maintenance`, `private_event`, `weather`, `vendor_hold`, `other`                                                                                                                                                                                                                                                                                                                                                                                                                |
| `business_type`        | `individual`, `company`, `partnership`                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `payout_cycle`         | `daily`, `weekly`, `monthly`                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `gender_type`          | `male`, `female`, `other`, `prefer_not_to_say`                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `sport_type`           | `football`, `cricket`, `tennis`, `badminton`, `basketball`, `hockey`, `volleyball`, `kabaddi`                                                                                                                                                                                                                                                                                                                                                                                    |
| `amenity_type`         | `parking`, `flood_lights`, `changing_room`, `cafeteria`, `equipment_rental`, `first_aid`, `wifi`, `cctv`, `drinking_water`                                                                                                                                                                                                                                                                                                                                                       |
| `surface_type`         | `artificial_turf`, `natural_grass`, `concrete`, `wooden`, `synthetic`                                                                                                                                                                                                                                                                                                                                                                                                            |
| `discount_type`        | `flat`, `percentage`                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `coupon_scope_type`    | `platform`, `vendor`, `field`                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `audit_category`       | `auth`, `kyc`, `booking`, `payment`, `slot`, `admin`, `vendor`, `turf`                                                                                                                                                                                                                                                                                                                                                                                                           |
| `audit_action`         | `AUTH_LOGIN`, `AUTH_LOGOUT`, `AUTH_SIGNUP`, `KYC_SUBMIT`, `KYC_VERIFY`, `KYC_REJECT`, `TURF_CREATE`, `TURF_UPDATE`, `TURF_DELETE`, `BOOKING_CREATE`, `BOOKING_CANCEL`, `PAYMENT_REFUND`, `USER_BAN`, `USER_UNBAN`, `VENDOR_CREATED`, `VENDOR_UPDATE`, `VENDOR_BAN`, `VENDOR_UNBAN`, `TURF_DOCS_UPDATE`, `TURF_DOCS_REVIEW`, `FIELD_BAN`, `FIELD_UNBAN`, `FIELD_STATUS_UPDATE`, `SUB_ADMIN_CREATE`, `SUB_ADMIN_DELETE`, `SUB_ADMIN_PASSWORD_UPDATE`, `ROLE_ASSIGN`, `ROLE_REVOKE` |
| `notification_type`    | `booking_confirmed`, `booking_cancelled`, `booking_reminder`, `slot_booked`, `slot_cancelled`, `payment_received`, `payment_failed`, `payment_refunded`, `kyc_submitted`, `kyc_verified`, `kyc_rejected`, `field_approved`, `field_rejected`, `account_banned`, `account_reinstated`, `general`                                                                                                                                                                                  |
| `notification_channel` | `push`, `sms`, `email`, `in_app`                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `acquisition_source`   | `organic`, `referral`, `google_ads`, `meta_ads`, `influencer`, `other`                                                                                                                                                                                                                                                                                                                                                                                                           |
| `device_os_type`       | `ios`, `android`, `web`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `system_role`          | `super_admin`, `sub_admin`, `vendor_owner`, `end_user`                                                                                                                                                                                                                                                                                                                                                                                                                           |

---

## Tables

### Identities & Roles

#### `public.identities`

Central identity table linked to Supabase Auth.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key, FK: `auth.users.id` |
| `status` | `identity_status` | `'active'` | |
| `email` | `text` | | Unique |
| `whatsapp` | `text` | | Nullable |
| `created_at` | `timestamptz` | `now()` | |
| `updated_at` | `timestamptz` | `now()` | |

#### `public.roles`

System and custom roles.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `name` | `text` | | Unique |
| `description` | `text` | | Nullable |
| `is_system` | `boolean` | `false` | |
| `created_at` | `timestamptz` | `now()` | |

#### `public.permissions`

Individual permissions for resources and actions.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `resource` | `text` | | |
| `action` | `text` | | |
| `description` | `text` | | Nullable |

#### `public.identity_roles`

Mapping of identities to roles.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `identity_id` | `uuid` | | PK, FK: `identities.id` |
| `role_id` | `uuid` | | PK, FK: `roles.id` |
| `assigned_at` | `timestamptz` | `now()` | |
| `assigned_by` | `uuid` | | Nullable, FK: `identities.id` |

#### `public.role_permissions`

Mapping of roles to permissions.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `role_id` | `uuid` | | PK, FK: `roles.id` |
| `permission_id` | `uuid` | | PK, FK: `permissions.id` |

---

### Users

#### `public.users`

End-user profiles.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `identity_id` | `uuid` | | Unique, FK: `identities.id` |
| `display_name` | `text` | | |
| `first_name` | `text` | | Nullable |
| `middle_name` | `text` | | Nullable |
| `last_name` | `text` | | Nullable |
| `avatar_url` | `text` | | Nullable |
| `date_of_birth` | `date` | | Nullable |
| `gender` | `gender_type` | | Nullable |
| `addresses` | `jsonb` | `'[]'` | |
| `city` | `text` | | Nullable |
| `state` | `text` | | Nullable |
| `country` | `text` | `'India'` | |
| `preferred_sports` | `sport_type[]` | `'{}'` | |
| `status` | `user_status` | `'active'` | |
| `ban_reason` | `text` | | Nullable |
| `banned_at` | `timestamptz` | | Nullable |
| `banned_by` | `uuid` | | Nullable, FK: `identities.id` |
| `source` | `acquisition_source` | `'organic'` | |
| `referral_code_used`| `text` | | Nullable |
| `own_referral_code` | `text` | | Unique, Nullable |
| `device_os` | `device_os_type` | | Nullable |
| `app_version` | `text` | | Nullable |
| `push_notifications_enabled` | `boolean` | `true` | |
| `onesignal_player_id` | `text` | | Nullable |
| `last_active_at` | `timestamptz` | | Nullable |
| `created_at` | `timestamptz` | `now()` | |
| `updated_at` | `timestamptz` | `now()` | |
| `deleted_at` | `timestamptz` | | Nullable |

---

### Vendors & KYC

#### `public.vendors`

Vendor account details.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `identity_id` | `uuid` | | Unique, FK: `identities.id` |
| `business_name` | `text` | | |
| `business_type` | `business_type` | | |
| `owner_full_name` | `text` | | |
| `address` | `jsonb` | `'{}'` | |
| `banking_details` | `jsonb` | `'{}'` | |
| `commission_pct` | `numeric` | `0` | |
| `payout_cycle` | `payout_cycle` | `'monthly'` | |
| `status` | `vendor_status` | `'pending'` | |
| `created_at` | `timestamptz` | `now()` | |
| `updated_at` | `timestamptz` | `now()` | |
| `deleted_at` | `timestamptz` | | Nullable |

#### `public.vendor_kyc`

KYC verification status and documents for vendors.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `vendor_id` | `uuid` | | Unique, FK: `vendors.id` |
| `status` | `kyc_status` | `'not_started'` | |
| `documents` | `jsonb` | `'{}'` | |
| `reviewer_notes` | `text` | | Nullable |
| `reviewed_by` | `uuid` | | Nullable, FK: `identities.id` |
| `reviewed_at` | `timestamptz` | | Nullable |
| `submitted_at` | `timestamptz` | | Nullable |
| `created_at` | `timestamptz` | `now()` | |
| `updated_at` | `timestamptz` | `now()` | |

---

### Fields & Documents

#### `public.fields`

Turf/Court definitions.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `vendor_id` | `uuid` | | FK: `vendors.id` |
| `name` | `text` | | |
| `sports` | `sport_type[]` | `'{}'` | |
| `amenities` | `amenity_type[]` | `'{}'` | |
| `capacity` | `integer` | | Nullable |
| `size_format` | `text` | | Nullable |
| `surface_type` | `surface_type` | | |
| `address` | `jsonb` | `'{}'` | |
| `weekday_open` | `time` | `'06:00:00'` | |
| `weekday_close` | `time` | `'23:00:00'` | |
| `weekend_open` | `time` | `'06:00:00'` | |
| `weekend_close` | `time` | `'23:00:00'` | |
| `standard_price_paise` | `integer` | | Check: `>= 0` |
| `cancellation_window_hrs` | `integer` | `24` | Check: `>= 0` |
| `status` | `field_status` | `'pending'` | |
| `created_at` | `timestamptz` | `now()` | |
| `updated_at` | `timestamptz` | `now()` | |
| `deleted_at` | `timestamptz` | | Nullable |

#### `public.field_documents`

Validation documents for specific fields.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `field_id` | `uuid` | | Unique, FK: `fields.id` |
| `status` | `kyc_status` | `'not_started'` | |
| `documents` | `jsonb` | `'{}'` | |
| `reviewer_notes` | `text` | | Nullable |
| `reviewed_by` | `uuid` | | Nullable, FK: `identities.id` |
| `reviewed_at` | `timestamptz` | | Nullable |
| `submitted_at` | `timestamptz` | | Nullable |
| `created_at` | `timestamptz` | `now()` | |
| `updated_at` | `timestamptz` | `now()` | |

---

### Slots & Bookings

#### `public.slots`

Individual bookable time slots for a field.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `field_id` | `uuid` | | FK: `fields.id` |
| `slot_date` | `date` | | |
| `start_time` | `time` | | |
| `end_time` | `time` | | |
| `price_paise` | `integer` | | Check: `>= 0` |
| `status` | `slot_status` | `'available'` | |
| `block_reason` | `block_reason` | | Nullable |
| `created_at` | `timestamptz` | `now()` | |
| `updated_at` | `timestamptz` | `now()` | |

#### `public.bookings`

User bookings for one or more slots.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | | FK: `users.id` |
| `field_id` | `uuid` | | FK: `fields.id` |
| `total_amount_paise` | `integer` | | Check: `>= 0` |
| `discount_amount_paise` | `integer` | `0` | Check: `>= 0` |
| `coupon_id` | `uuid` | | Nullable, FK: `coupons.id` |
| `status` | `booking_status` | `'pending'` | |
| `booked_at` | `timestamptz` | `now()` | |
| `cancelled_at` | `timestamptz` | | Nullable |
| `cancellation_reason` | `text` | | Nullable |

#### `public.booking_slots`

Many-to-many relationship between bookings and slots.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `booking_id` | `uuid` | | PK, FK: `bookings.id` |
| `slot_id` | `uuid` | | PK, FK: `slots.id` |
| `price_paise` | `integer` | | Check: `>= 0` |

---

### Payments & Refunds

#### `public.payments`

Transaction records associated with bookings.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `booking_id` | `uuid` | | FK: `bookings.id` |
| `provider` | `text` | | e.g., 'razorpay' |
| `provider_order_id`| `text` | | Nullable |
| `provider_payment_id`| `text` | | Nullable |
| `amount_paise` | `integer` | | Check: `>= 0` |
| `currency` | `text` | `'INR'` | |
| `status` | `text` | | Check: status in [created, pending, authorized, captured, failed, partially_refunded, refunded] |
| `metadata` | `jsonb` | `'{}'` | |
| `paid_at` | `timestamptz` | | Nullable |
| `created_at` | `timestamptz` | `now()` | |
| `updated_at` | `timestamptz` | `now()` | |

#### `public.refunds`

Refund records for payments.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `payment_id` | `uuid` | | FK: `payments.id` |
| `provider_refund_id`| `text` | | Unique, Nullable |
| `amount_paise` | `integer` | | Check: `>= 0` |
| `status` | `text` | | Check: status in [pending, processed, failed] |
| `metadata` | `jsonb` | `'{}'` | |
| `created_at` | `timestamptz` | `now()` | |
| `updated_at` | `timestamptz` | `now()` | |

#### `public.payment_events`

Webhook events from payment providers.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `provider_event_id`| `text` | | Unique |
| `provider` | `text` | | |
| `event_type` | `text` | | |
| `payload` | `jsonb` | | |
| `processed_at` | `timestamptz` | `now()` | |

---

### Audit & Notifications

#### `public.audit_logs`

Activity logs for administrative and critical actions.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `actor_id` | `uuid` | | Nullable, FK: `identities.id` |
| `actor_role` | `text` | | |
| `category` | `audit_category` | | |
| `event_type` | `audit_action` | | |
| `payload` | `jsonb` | `'{}'` | |
| `metadata` | `jsonb` | `'{}'` | |
| `target_type` | `text` | | Nullable (e.g., 'vendor', 'field') |
| `target_id` | `uuid` | | Nullable |
| `status` | `text` | `'success'` | |
| `ip_address` | `inet` | | Nullable |
| `user_agent` | `text` | | Nullable |
| `created_at` | `timestamptz` | `now()` | |

#### `public.notifications`

Messages sent to identities.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `recipient_id` | `uuid` | | FK: `identities.id` |
| `title` | `text` | | |
| `body` | `text` | | |
| `type` | `notification_type` | | |
| `channel` | `notification_channel` | | |
| `is_inbox` | `boolean` | `false` | |
| `read_at` | `timestamptz` | | Nullable |
| `data` | `jsonb` | `'{}'` | |
| `sent_at` | `timestamptz` | | Nullable |
| `failed_at` | `timestamptz` | | Nullable |
| `failure_reason` | `text` | | Nullable |
| `created_at` | `timestamptz` | `now()` | |

---

### Infrastructure

#### `public.coupons`

Promotional codes and discounts.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `code` | `text` | | Unique |
| `discount_type` | `discount_type` | | |
| `discount_value` | `integer` | | Check: `> 0` |
| `min_booking_amount`| `integer` | `0` | Check: `>= 0` |
| `max_discount_cap` | `integer` | | Nullable, Check: `> 0` |
| `max_uses` | `integer` | | Nullable, Check: `> 0` |
| `uses_count` | `integer` | `0` | Check: `>= 0` |
| `valid_from` | `timestamptz` | | |
| `valid_until` | `timestamptz` | | Nullable |
| `is_active` | `boolean` | `true` | |
| `created_by` | `uuid` | | FK: `identities.id` |
| `created_at` | `timestamptz` | `now()` | |
| `updated_at` | `timestamptz` | `now()` | |

#### `public.coupon_scopes`

Restrictions on where coupons can be used.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `coupon_id` | `uuid` | | FK: `coupons.id` |
| `scope_type` | `coupon_scope_type` | | |
| `scope_ref_id` | `uuid` | | Nullable (id of vendor/field) |

#### `public.refresh_tokens`

Session management tokens.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `identity_id` | `uuid` | | FK: `identities.id` |
| `token_hash` | `text` | | |
| `expires_at` | `timestamptz` | | |
| `revoked_at` | `timestamptz` | | Nullable |
| `device_info` | `text` | | Nullable |
| `ip_address` | `inet` | | Nullable |
| `created_at` | `timestamptz` | `now()` | |

#### `public.idempotency_keys`

Prevents duplicate processing of requests.
| Column | Type | Default | Options |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `gen_random_uuid()` | Primary Key |
| `key` | `text` | | Unique |
| `operation` | `text` | | |
| `result` | `jsonb` | | Nullable |
| `created_at` | `timestamptz` | `now()` | |

#### `public.waitlist`

Initial signup interest.
| Column | Type | Default | Options |
| :--- | :--- | : :--- | :--- |
| `uuid` | `uuid` | `gen_random_uuid()` | Primary Key |
| `email` | `text` | | Primary Key, Unique |
| `name` | `text` | | Nullable |
| `phone_number` | `text` | | Nullable |
| `created_at` | `timestamptz` | `now()` | |
