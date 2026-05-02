# TurfIn Database Documentation

This document serves as the **Single Source of Truth** for the TurfIn platform's database schema. It contains all enum definitions, table structures, and relationships used by the Backend (NestJS + Drizzle), Frontend, and AI assistants.

> [!WARNING]
> This schema is for architectural reference. The exact order of execution for foreign keys is not guaranteed in this linear document.

---

## Table of Contents

- [Enums & Types](#enums--types)
- [Identities & Access Control](#identities--access-control)
- [User & Vendor Profiles](#user--vendor-profiles)
- [Fields & Inventory Management](#fields--inventory-management)
- [Slots & Bookings](#slots--bookings)
- [Payments & Refunds](#payments--refunds)
- [Audit & Notifications](#audit--notifications)
- [Infrastructure & Support](#infrastructure--support)

---

## Enums & Types

The following custom types and enums are used across the system to ensure data integrity and consistent logic.

```sql
-- Identity & User Status
CREATE TYPE public.identity_status AS ENUM ('active', 'inactive', 'banned', 'under_review');
CREATE TYPE public.user_status AS ENUM ('active', 'inactive', 'banned', 'under_review');
CREATE TYPE public.vendor_status AS ENUM ('active', 'pending', 'suspended', 'banned');
CREATE TYPE public.field_status AS ENUM ('active', 'inactive', 'pending', 'maintenance', 'suspended', 'banned');

-- KYC & Verification
CREATE TYPE public.kyc_status AS ENUM ('not_started', 'pending', 'in_review', 'verified', 'rejected');

-- Commerce & Bookings
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE public.slot_status AS ENUM ('available', 'held', 'booked', 'blocked', 'maintenance');
CREATE TYPE public.block_reason AS ENUM ('maintenance', 'private_event', 'weather', 'vendor_hold', 'other');
CREATE TYPE public.discount_type AS ENUM ('flat', 'percentage');
CREATE TYPE public.coupon_scope_type AS ENUM ('platform', 'vendor', 'field');

-- Business & Identity
CREATE TYPE public.business_type AS ENUM ('individual', 'company', 'partnership');
CREATE TYPE public.payout_cycle AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- Sports & Facilities
CREATE TYPE public.sport_type AS ENUM ('football', 'cricket', 'tennis', 'badminton', 'basketball', 'hockey', 'volleyball', 'kabaddi', 'box_cricket', 'futsal', 'pickleball', 'throwball', 'netball', 'handball', 'dodgeball');
CREATE TYPE public.surface_type AS ENUM ('artificial_turf', 'natural_grass', 'concrete', 'wooden', 'synthetic');
CREATE TYPE public.amenity_type AS ENUM ('parking', 'flood_lights', 'washrooms', 'changing_rooms', 'showers', 'drinking_water', 'cafeteria', 'equipment_rental', 'first_aid', 'wifi', 'cctv', 'power_backup', 'locker_facility', 'seating_area', 'practice_nets', 'scoreboard', 'warm_up_area', 'music_system', 'coaching', 'referee', 'covered_turf', 'indoor_facility', 'outdoor_facility', 'bibs_available', 'prayer_room');

-- Audit & Logging
CREATE TYPE public.audit_category AS ENUM ('auth', 'kyc', 'booking', 'payment', 'slot', 'admin', 'vendor', 'turf', 'user', 'support');
CREATE TYPE public.audit_action AS ENUM ('AUTH_LOGIN', 'AUTH_LOGOUT', 'AUTH_SIGNUP', 'KYC_SUBMIT', 'KYC_VERIFY', 'KYC_REJECT', 'TURF_CREATE', 'TURF_UPDATE', 'TURF_DELETE', 'BOOKING_CREATE', 'BOOKING_CANCEL', 'PAYMENT_REFUND', 'USER_BAN', 'USER_UNBAN', 'VENDOR_CREATED', 'VENDOR_UPDATE', 'VENDOR_BAN', 'VENDOR_UNBAN', 'VENDOR_SUSPEND', 'VENDOR_UNSUSPEND', 'VENDOR_DELETE', 'TURF_DOCS_UPDATE', 'TURF_DOCS_REVIEW', 'FIELD_BAN', 'FIELD_UNBAN', 'FIELD_STATUS_UPDATE', 'SUB_ADMIN_CREATE', 'SUB_ADMIN_DELETE', 'SUB_ADMIN_PASSWORD_UPDATE', 'ROLE_ASSIGN', 'ROLE_REVOKE', 'ROLE_PERMISSIONS_UPDATE', 'USER_ADDRESS_ADD', 'USER_ADDRESS_UPDATE', 'USER_ADDRESS_SET_PRIMARY', 'USER_ADDRESS_DELETE', 'USER_FAVOURITE_ADD', 'USER_FAVOURITE_REMOVE', 'AUTH_PASSWORD_RESET', 'ADMIN_MANUAL_PASSWORD_UPDATE', 'ADMIN_TRIGGER_PASSWORD_RESET', 'REVIEW_CREATE', 'REVIEW_DELETE', 'SUPPORT_TICKET_UPDATE', 'SUPPORT_TICKET_REPLY', 'SLOT_CONFIG_UPDATE', 'SLOT_GENERATE', 'SLOT_BLOCK', 'SLOT_UNBLOCK', 'SLOT_MAINTENANCE_MARK', 'SLOT_MAINTENANCE_CLEAR', 'SLOT_PRICE_OVERRIDE');

-- Notifications
CREATE TYPE public.notification_type AS ENUM ('booking_confirmed', 'booking_cancelled', 'booking_reminder', 'slot_booked', 'slot_cancelled', 'payment_received', 'payment_failed', 'payment_refunded', 'kyc_submitted', 'kyc_verified', 'kyc_rejected', 'field_approved', 'field_rejected', 'account_banned', 'account_reinstated', 'general');
CREATE TYPE public.notification_channel AS ENUM ('push', 'sms', 'email', 'in_app');

-- Infrastructure
CREATE TYPE public.acquisition_source AS ENUM ('organic', 'referral', 'google_ads', 'meta_ads', 'influencer', 'other');
CREATE TYPE public.device_os_type AS ENUM ('ios', 'android', 'web');

-- Support
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.sender_role AS ENUM ('user', 'agent');
```

---

## Identities & Access Control

These tables handle authentication, authorization, and RBAC (Role-Based Access Control).

### `identities`

Central identity table linked to `auth.users`.

```sql
CREATE TABLE public.identities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  status public.identity_status NOT NULL DEFAULT 'active'::identity_status,
  email text NOT NULL,
  whatsapp text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT identities_pkey PRIMARY KEY (id),
  CONSTRAINT fk_identities_auth_user FOREIGN KEY (id) REFERENCES auth.users(id)
);
```

### `roles`

System and custom administrative roles.

```sql
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
```

### `permissions`

Granular permissions (e.g., `slot:write`, `vendor:read`).

```sql
CREATE TABLE public.permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  resource text NOT NULL,
  action text NOT NULL,
  description text,
  CONSTRAINT permissions_pkey PRIMARY KEY (id)
);
```

### `identity_roles`

```sql
CREATE TABLE public.identity_roles (
  identity_id uuid NOT NULL REFERENCES public.identities(id),
  role_id uuid NOT NULL REFERENCES public.roles(id),
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES public.identities(id),
  CONSTRAINT identity_roles_pkey PRIMARY KEY (identity_id, role_id)
);
```

### `role_permissions`

```sql
CREATE TABLE public.role_permissions (
  role_id uuid NOT NULL REFERENCES public.roles(id),
  permission_id uuid NOT NULL REFERENCES public.permissions(id),
  CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id)
);
```

---

## User & Vendor Profiles

Detailed profile information for customers and partners.

### `users`

End-user profiles.

```sql
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL UNIQUE REFERENCES public.identities(id),
  display_name text NOT NULL,
  first_name text,
  middle_name text,
  last_name text,
  avatar_url text,
  date_of_birth date,
  gender public.gender_type,
  addresses jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of Address objects
  city text,
  state text,
  country text NOT NULL DEFAULT 'India'::text,
  preferred_sports public.sport_type[] NOT NULL DEFAULT '{}'::sport_type[],
  favourite_turfs jsonb DEFAULT '{}'::jsonb, -- Map of { turfId: boolean }
  status public.user_status NOT NULL DEFAULT 'active'::user_status,
  ban_reason text,
  banned_at timestamp with time zone,
  banned_by uuid REFERENCES public.identities(id),
  source public.acquisition_source NOT NULL DEFAULT 'organic'::acquisition_source,
  referral_code_used text,
  own_referral_code text UNIQUE,
  device_os public.device_os_type,
  app_version text,
  push_notifications_enabled boolean NOT NULL DEFAULT true,
  onesignal_player_id text,
  last_active_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
```

### `vendors`

Business profiles for turf owners.

```sql
CREATE TABLE public.vendors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  identity_id uuid NOT NULL UNIQUE REFERENCES public.identities(id),
  business_name text NOT NULL,
  business_type public.business_type NOT NULL,
  owner_full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  whatsapp text,
  gst_number text,
  business_registration_number text,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  banking_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  commission_pct numeric NOT NULL DEFAULT 0,
  payout_cycle public.payout_cycle NOT NULL DEFAULT 'monthly'::payout_cycle,
  status public.vendor_status NOT NULL DEFAULT 'pending'::vendor_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT vendors_pkey PRIMARY KEY (id)
);
```

### `vendor_kyc`

```sql
CREATE TABLE public.vendor_kyc (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL UNIQUE REFERENCES public.vendors(id),
  status public.kyc_status NOT NULL DEFAULT 'not_started'::kyc_status,
  documents jsonb NOT NULL DEFAULT '{}'::jsonb, -- Map of { docType: url }
  verification jsonb NOT NULL DEFAULT '{}'::jsonb, -- Detailed verification results
  reviewer_notes text,
  reviewed_by uuid REFERENCES public.identities(id),
  reviewed_at timestamp with time zone,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT vendor_kyc_pkey PRIMARY KEY (id)
);
```

---

## Fields & Inventory Management

Core definitions for venues and their operating configurations.

### `fields`

Venues/Courts listed by vendors.

```sql
CREATE TABLE public.fields (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id),
  name text NOT NULL,
  sports public.sport_type[] NOT NULL DEFAULT '{}'::sport_type[],
  amenities public.amenity_type[] NOT NULL DEFAULT '{}'::amenity_type[],
  capacity integer,
  size_format text,
  surface_type public.surface_type NOT NULL,
  address jsonb NOT NULL DEFAULT '{}'::jsonb,
  weekday_open time without time zone NOT NULL DEFAULT '06:00:00',
  weekday_close time without time zone NOT NULL DEFAULT '23:00:00',
  weekend_open time without time zone NOT NULL DEFAULT '06:00:00',
  weekend_close time without time zone NOT NULL DEFAULT '23:00:00',
  standard_price_paise integer NOT NULL CHECK (standard_price_paise >= 0),
  cancellation_window_hrs integer NOT NULL DEFAULT 24 CHECK (cancellation_window_hrs >= 0),
  status public.field_status NOT NULL DEFAULT 'pending'::field_status,
  rating jsonb NOT NULL DEFAULT '{"avgScore": 0, "totalReviews": 0}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT fields_pkey PRIMARY KEY (id)
);
```

### `field_documents`

```sql
CREATE TABLE public.field_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  field_id uuid NOT NULL UNIQUE REFERENCES public.fields(id),
  status public.kyc_status NOT NULL DEFAULT 'not_started'::kyc_status,
  documents jsonb NOT NULL DEFAULT '{}'::jsonb,
  verification jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewer_notes text,
  reviewed_by uuid REFERENCES public.identities(id),
  reviewed_at timestamp with time zone,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT field_documents_pkey PRIMARY KEY (id)
);
```

### `field_slot_configs`

Inventory generation rules for a field.

```sql
CREATE TABLE public.field_slot_configs (
  field_id uuid NOT NULL PRIMARY KEY REFERENCES public.fields(id),
  slot_duration_mins integer NOT NULL CHECK (slot_duration_mins >= 30),
  weekday_open time without time zone NOT NULL,
  weekday_close time without time zone NOT NULL,
  weekend_open time without time zone NOT NULL,
  weekend_close time without time zone NOT NULL,
  booking_window_days integer NOT NULL DEFAULT 7 CHECK (booking_window_days > 0),
  generation_window_days integer NOT NULL DEFAULT 30,
  hold_duration_minutes integer NOT NULL DEFAULT 10 CHECK (hold_duration_minutes > 0),
  config_version integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### `field_weekly_slot_pricing`

Base pricing grid per day/slot.

```sql
CREATE TABLE public.field_weekly_slot_pricing (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id uuid NOT NULL REFERENCES public.fields(id),
  day_of_week smallint NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  slot_index integer NOT NULL,
  price_paise integer NOT NULL CHECK (price_paise >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

---

## Slots & Bookings

The transactional heart of the system.

### `slots`

Individual bookable instances.

```sql
CREATE TABLE public.slots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id uuid NOT NULL REFERENCES public.fields(id),
  slot_date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  slot_index integer NOT NULL,
  price_paise integer NOT NULL CHECK (price_paise >= 0),
  is_price_overridden boolean NOT NULL DEFAULT false,
  status public.slot_status NOT NULL DEFAULT 'available'::slot_status,
  block_reason public.block_reason,
  held_by_booking_id uuid REFERENCES public.bookings(id),
  hold_expires_at timestamp with time zone,
  config_version integer NOT NULL DEFAULT 1,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### `bookings`

```sql
CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id),
  field_id uuid NOT NULL REFERENCES public.fields(id),
  total_amount_paise integer NOT NULL CHECK (total_amount_paise >= 0),
  discount_amount_paise integer NOT NULL DEFAULT 0 CHECK (discount_amount_paise >= 0),
  coupon_id uuid REFERENCES public.coupons(id),
  status public.booking_status NOT NULL DEFAULT 'pending'::booking_status,
  booked_at timestamp with time zone NOT NULL DEFAULT now(),
  cancelled_at timestamp with time zone,
  cancellation_reason text
);
```

### `booking_slots`

Many-to-many relationship mapping.

```sql
CREATE TABLE public.booking_slots (
  booking_id uuid NOT NULL REFERENCES public.bookings(id),
  slot_id uuid NOT NULL REFERENCES public.slots(id),
  price_paise integer NOT NULL CHECK (price_paise >= 0),
  CONSTRAINT booking_slots_pkey PRIMARY KEY (booking_id, slot_id)
);
```

---

## Payments & Refunds

Financial tracking for all transactions.

### `payments`

```sql
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id),
  provider text NOT NULL, -- e.g. 'razorpay'
  provider_order_id text,
  provider_payment_id text,
  amount_paise integer NOT NULL CHECK (amount_paise >= 0),
  currency text NOT NULL DEFAULT 'INR'::text,
  status text NOT NULL CHECK (status = ANY (ARRAY['created', 'pending', 'authorized', 'captured', 'failed', 'partially_refunded', 'refunded'])),
  metadata jsonb DEFAULT '{}'::jsonb,
  paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### `refunds`

```sql
CREATE TABLE public.refunds (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id uuid NOT NULL REFERENCES public.payments(id),
  provider_refund_id text UNIQUE,
  amount_paise integer NOT NULL CHECK (amount_paise >= 0),
  status text NOT NULL CHECK (status = ANY (ARRAY['pending', 'processed', 'failed'])),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### `payment_events`

Webhook log.

```sql
CREATE TABLE public.payment_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_event_id text NOT NULL UNIQUE,
  provider text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamp with time zone DEFAULT now()
);
```

---

## Audit & Notifications

### `audit_logs`

Centralized request/action logging.

```sql
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id uuid REFERENCES public.identities(id),
  actor_email text,
  actor_role text,
  category public.audit_category NOT NULL,
  event_type public.audit_action NOT NULL,
  target_type text, -- e.g. 'vendor', 'field'
  target_id uuid,
  target_label text, -- Human readable label of target
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'success'::text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### `notifications`

```sql
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id uuid NOT NULL REFERENCES public.identities(id),
  title text NOT NULL,
  body text NOT NULL,
  type public.notification_type NOT NULL,
  channel public.notification_channel NOT NULL,
  is_inbox boolean NOT NULL DEFAULT false,
  read_at timestamp with time zone,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_at timestamp with time zone,
  failed_at timestamp with time zone,
  failure_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

---

## Infrastructure & Support

### `coupons`

```sql
CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  discount_type public.discount_type NOT NULL,
  discount_value integer NOT NULL CHECK (discount_value > 0),
  min_booking_amount integer NOT NULL DEFAULT 0 CHECK (min_booking_amount >= 0),
  max_discount_cap integer CHECK (max_discount_cap > 0),
  max_uses integer CHECK (max_uses > 0),
  uses_count integer NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
  valid_from timestamp with time zone NOT NULL,
  valid_until timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES public.identities(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### `coupon_scopes`

```sql
CREATE TABLE public.coupon_scopes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id uuid NOT NULL REFERENCES public.coupons(id),
  scope_type public.coupon_scope_type NOT NULL,
  scope_ref_id uuid -- vendorId or fieldId
);
```

### `support_tickets`

```sql
CREATE TABLE public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id),
  category text NOT NULL, -- DTO enum: booking, payment, account, technical, general
  subject text NOT NULL,
  description text NOT NULL,
  status public.ticket_status NOT NULL DEFAULT 'open'::ticket_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### `support_messages`

```sql
CREATE TABLE public.support_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id),
  sender_id uuid REFERENCES public.identities(id),
  sender_name text,
  sender_role public.sender_role NOT NULL,
  body text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### `refresh_tokens`

```sql
CREATE TABLE public.refresh_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identity_id uuid NOT NULL REFERENCES public.identities(id),
  token_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  revoked_at timestamp with time zone,
  device_info text,
  ip_address inet,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### `idempotency_keys`

```sql
CREATE TABLE public.idempotency_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  operation text NOT NULL,
  result jsonb,
  created_at timestamp with time zone DEFAULT now()
);
```

### `waitlist`

```sql
CREATE TABLE public.waitlist (
  uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  phone_number text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT waitlist_pkey PRIMARY KEY (uuid, email)
);
```
