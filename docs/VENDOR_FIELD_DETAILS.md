# TurfIn Vendors & Fields — Supabase Table Design

This document defines every Supabase table needed for the Vendors tab and Fields tab in the admin portal. The vendor app (Flutter) writes most of this data. The admin portal reads and manages it.

---

## Architecture Overview

```
Flutter Vendor App
  │
  ├── Supabase Auth  (vendor login — phone OTP or email/password)
  │     └── on signup → triggers upsert into `vendors` table
  │
  ├── Writes to `vendors`           (profile, bank details, operating hours)
  ├── Writes to `vendor_kyc_docs`   (document uploads stored in Supabase Storage)
  ├── Writes to `fields`            (creates and manages turf/court listings)
  ├── Writes to `field_kyc_docs`    (field-specific document uploads)
  ├── Writes to `field_slots`       (time slot availability / blocking)
  └── Reads `bookings`              (to see upcoming sessions for their fields)

Flutter Client App
  └── Reads `fields`, `vendors`     (to browse and book)

Admin Portal Backend (service role)
  ├── Reads everything
  ├── Updates vendor status, KYC status, commission rate
  └── Updates field status (suspend, activate, maintenance)
```

---

## Table 2: `vendors`

One row per registered turf/court owner (business).

### Full Column Reference

| Column | Type | Constraints | Description | Written by |
|---|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Internal vendor ID | Auto |
| `auth_id` | `uuid` | UNIQUE, FK → `auth.users(id)` ON DELETE SET NULL | Supabase Auth user linked to this vendor | Supabase Auth |
| `vendor_ref` | `text` | UNIQUE, NOT NULL | Human-readable ID shown in portal: `VND-001` | Auto (trigger) |
| `business_name` | `text` | NOT NULL | Name of the sports complex / venue | Vendor app |
| `business_type` | `text` | NOT NULL, default `'individual'`, CHECK IN ('individual','partnership','pvt_ltd','llp') | Legal structure of the business | Vendor app |
| `owner_name` | `text` | NOT NULL | Full name of the owner / primary contact | Vendor app |
| `email` | `text` | UNIQUE, NOT NULL | Business email | Vendor app |
| `phone` | `text` | NOT NULL | Primary phone with country code | Vendor app |
| `whatsapp` | `text` | nullable | WhatsApp number if different from phone | Vendor app |
| `address_line1` | `text` | NOT NULL | Street address | Vendor app |
| `address_line2` | `text` | nullable | Landmark / area | Vendor app |
| `city` | `text` | NOT NULL | City | Vendor app |
| `state` | `text` | NOT NULL | State | Vendor app |
| `pincode` | `text` | NOT NULL | PIN code | Vendor app |
| `country` | `text` | NOT NULL, default `'India'` | Country | Auto |
| `maps_link` | `text` | nullable | Google Maps URL of the venue | Vendor app |
| `latitude` | `numeric(10,7)` | nullable | GPS latitude | Vendor app |
| `longitude` | `numeric(10,7)` | nullable | GPS longitude | Vendor app |
| `gst_number` | `text` | nullable | GST registration number | Vendor app |
| `business_reg_number` | `text` | nullable | Company / partnership registration number | Vendor app |
| `status` | `text` | NOT NULL, default `'pending'`, CHECK IN ('active','pending','suspended','deactivated') | Account status. `pending` = newly onboarded, awaiting KYC. `active` = verified and live. `suspended` = manually blocked by admin | Admin / System |
| `suspension_reason` | `text` | nullable | Admin's reason for suspending the vendor | Admin |
| `suspended_at` | `timestamptz` | nullable | When suspension was applied | Admin |
| `suspended_by` | `uuid` | nullable | Admin user who suspended | Admin |
| `kyc_status` | `text` | NOT NULL, default `'not-started'`, CHECK IN ('not-started','pending','in-review','verified','rejected') | KYC verification status | Admin (after reviewing docs) |
| `kyc_rejection_reason` | `text` | nullable | Reason if KYC was rejected | Admin |
| `kyc_reviewed_at` | `timestamptz` | nullable | When admin last reviewed KYC | Admin |
| `kyc_reviewed_by` | `uuid` | nullable | Admin who reviewed the KYC | Admin |
| `commission` | `numeric(5,2)` | NOT NULL, default `10` | TurfIn's commission percentage on this vendor's bookings | Admin (can be overridden per vendor) |
| `payout_cycle` | `text` | NOT NULL, default `'weekly'`, CHECK IN ('daily','weekly','monthly') | How often TurfIn transfers earnings to the vendor | Admin / Vendor app |
| `total_fields` | `integer` | NOT NULL, default `0` | Cached count of active fields listed by this vendor | Auto trigger |
| `total_revenue` | `numeric(12,2)` | NOT NULL, default `0` | Cached total revenue from completed bookings across all fields | Auto trigger |
| `total_bookings` | `integer` | NOT NULL, default `0` | Cached total bookings across all fields | Auto trigger |
| `avg_rating` | `numeric(3,2)` | nullable | Average rating across all this vendor's fields | Auto trigger |
| `sports_offered` | `text[]` | nullable | Array of sport types the vendor supports (e.g. `{Football, Cricket}`) | Auto (derived from fields) |
| `surface_types` | `text[]` | nullable | Array of surfaces across all fields (e.g. `{Artificial Turf, Natural Grass}`) | Auto (derived from fields) |
| `facilities` | `text[]` | nullable | Array of amenities at the venue (e.g. `{Parking, Floodlights}`) | Vendor app |
| `weekday_open` | `time` | nullable | Weekday opening time | Vendor app |
| `weekday_close` | `time` | nullable | Weekday closing time | Vendor app |
| `weekend_open` | `time` | nullable | Weekend opening time | Vendor app |
| `weekend_close` | `time` | nullable | Weekend closing time | Vendor app |
| `onesignal_player_id` | `text` | nullable | OneSignal ID for the vendor app (for push notifications) | Vendor app |
| `app_version` | `text` | nullable | Last known version of the Vendor Flutter app | Vendor app |
| `created_at` | `timestamptz` | NOT NULL, default `NOW()` | Onboarding date | Auto |
| `updated_at` | `timestamptz` | NOT NULL, default `NOW()` | Last update | Auto trigger |
| `last_active_at` | `timestamptz` | nullable | Last time vendor opened the app | Vendor app |

### Bank / Payout Details

Keep these in a **separate table** (`vendor_bank_details`) rather than the `vendors` table. This is a security best practice — limit which backend services can access sensitive financial data.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | PK |
| `vendor_id` | `uuid` | FK → `vendors(id)` ON DELETE CASCADE, UNIQUE |
| `bank_name` | `text` | Bank name |
| `account_holder` | `text` | Name as per bank account |
| `account_number` | `text` | Encrypted at rest — use Supabase Vault |
| `ifsc_code` | `text` | IFSC code |
| `upi_id` | `text` | UPI ID (optional) |
| `verified` | `boolean` | default `false` — set to true after admin verifies the cancelled cheque |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

---

### CREATE Statement

```sql
CREATE TYPE vendor_status     AS ENUM ('active', 'pending', 'suspended', 'deactivated');
CREATE TYPE vendor_kyc_status AS ENUM ('not-started', 'pending', 'in-review', 'verified', 'rejected');
CREATE TYPE business_type     AS ENUM ('individual', 'partnership', 'pvt_ltd', 'llp');
CREATE TYPE payout_cycle      AS ENUM ('daily', 'weekly', 'monthly');

CREATE TABLE vendors (
  id                   UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id              UUID           UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_ref           TEXT           UNIQUE NOT NULL,

  -- Business identity
  business_name        TEXT           NOT NULL,
  business_type        business_type  NOT NULL DEFAULT 'individual',
  owner_name           TEXT           NOT NULL,
  email                TEXT           UNIQUE NOT NULL,
  phone                TEXT           NOT NULL,
  whatsapp             TEXT,

  -- Location
  address_line1        TEXT           NOT NULL,
  address_line2        TEXT,
  city                 TEXT           NOT NULL,
  state                TEXT           NOT NULL,
  pincode              TEXT           NOT NULL,
  country              TEXT           NOT NULL DEFAULT 'India',
  maps_link            TEXT,
  latitude             NUMERIC(10,7),
  longitude            NUMERIC(10,7),

  -- Business registration
  gst_number           TEXT,
  business_reg_number  TEXT,

  -- Status
  status               vendor_status  NOT NULL DEFAULT 'pending',
  suspension_reason    TEXT,
  suspended_at         TIMESTAMPTZ,
  suspended_by         UUID,

  -- KYC
  kyc_status           vendor_kyc_status NOT NULL DEFAULT 'not-started',
  kyc_rejection_reason TEXT,
  kyc_reviewed_at      TIMESTAMPTZ,
  kyc_reviewed_by      UUID,

  -- Commercial
  commission           NUMERIC(5,2)   NOT NULL DEFAULT 10,
  payout_cycle         payout_cycle   NOT NULL DEFAULT 'weekly',

  -- Cached stats (updated by triggers)
  total_fields         INTEGER        NOT NULL DEFAULT 0,
  total_revenue        NUMERIC(12,2)  NOT NULL DEFAULT 0,
  total_bookings       INTEGER        NOT NULL DEFAULT 0,
  avg_rating           NUMERIC(3,2),

  -- Venue info (from vendor app)
  sports_offered       TEXT[],
  surface_types        TEXT[],
  facilities           TEXT[],
  weekday_open         TIME,
  weekday_close        TIME,
  weekend_open         TIME,
  weekend_close        TIME,

  -- App / device
  onesignal_player_id  TEXT,
  app_version          TEXT,

  -- Timestamps
  created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  last_active_at       TIMESTAMPTZ
);

CREATE TRIGGER vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Bank details (separate table for security)
CREATE TABLE vendor_bank_details (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id        UUID        UNIQUE NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  bank_name        TEXT        NOT NULL,
  account_holder   TEXT        NOT NULL,
  account_number   TEXT        NOT NULL,  -- store encrypted via Supabase Vault
  ifsc_code        TEXT        NOT NULL,
  upi_id           TEXT,
  verified         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Table 3: `vendor_kyc_docs`

Stores the status of each KYC document uploaded by the vendor. Actual files go in Supabase Storage; this table tracks metadata and review status.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | PK |
| `vendor_id` | `uuid` | FK → `vendors(id)` ON DELETE CASCADE |
| `doc_type` | `text` | CHECK IN ('id_proof','address_proof','business_reg','gst_cert','bank_statement') |
| `file_url` | `text` | Supabase Storage URL of the uploaded file |
| `file_name` | `text` | Original filename |
| `status` | `text` | CHECK IN ('pending','verified','rejected') |
| `rejection_reason` | `text` | nullable — reason if rejected |
| `reviewed_by` | `uuid` | Admin who reviewed |
| `reviewed_at` | `timestamptz` | When reviewed |
| `uploaded_at` | `timestamptz` | When vendor uploaded |
| `UNIQUE` | — | `(vendor_id, doc_type)` — one document per type per vendor |

```sql
CREATE TABLE vendor_kyc_docs (
  id               UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id        UUID       NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  doc_type         TEXT       NOT NULL CHECK (doc_type IN ('id_proof','address_proof','business_reg','gst_cert','bank_statement')),
  file_url         TEXT       NOT NULL,
  file_name        TEXT,
  status           TEXT       NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  rejection_reason TEXT,
  reviewed_by      UUID,
  reviewed_at      TIMESTAMPTZ,
  uploaded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vendor_id, doc_type)
);
```

---

## Table 4: `fields`

One row per individual turf, court, or ground listed on TurfIn. A vendor can have many fields.

### Full Column Reference

| Column | Type | Constraints | Description | Written by |
|---|---|---|---|---|
| `id` | `uuid` | PK | Internal field ID | Auto |
| `field_ref` | `text` | UNIQUE, NOT NULL | Human-readable reference: `FL-001` | Auto (trigger) |
| `vendor_id` | `uuid` | NOT NULL, FK → `vendors(id)` | Which vendor owns this field | Vendor app |
| `name` | `text` | NOT NULL | Field name, e.g. "Turf Arena A" | Vendor app |
| `description` | `text` | nullable | Short description visible to clients | Vendor app |
| `sports` | `text[]` | NOT NULL | Sports playable on this field: `{Football, Cricket}` | Vendor app |
| `status` | `text` | NOT NULL, default `'pending'`, CHECK IN ('active','inactive','pending','maintenance','suspended') | `pending` = newly added, awaiting review. `maintenance` = temporarily unavailable. `suspended` = blocked by admin | Admin / Vendor app |
| `surface` | `text` | NOT NULL, CHECK IN ('Natural Grass','Artificial Turf','Hard Court','Clay','Wooden','Synthetic') | Playing surface type | Vendor app |
| `size` | `text` | nullable | e.g. "5-a-side", "7-a-side", "Full Size" | Vendor app |
| `capacity` | `integer` | nullable | Max players per session | Vendor app |
| `price_per_hour` | `numeric(10,2)` | NOT NULL | Standard hourly rate in INR | Vendor app |
| `peak_price_per_hour` | `numeric(10,2)` | nullable | Price during peak hours (evenings/weekends) | Vendor app |
| `weekday_open` | `time` | nullable | Weekday opening time (inherits from vendor if null) | Vendor app |
| `weekday_close` | `time` | nullable | Weekday closing time | Vendor app |
| `weekend_open` | `time` | nullable | Weekend opening time | Vendor app |
| `weekend_close` | `time` | nullable | Weekend closing time | Vendor app |
| `amenities` | `text[]` | nullable | Facilities at this specific field | Vendor app |
| `address` | `text` | nullable | Field-specific address if different from vendor address | Vendor app |
| `city` | `text` | NOT NULL | City (copied from vendor on creation, can be overridden) | Auto / Vendor app |
| `state` | `text` | NOT NULL | State | Auto / Vendor app |
| `zone` | `text` | nullable | Zone label for admin filtering, e.g. "North Zone" | Admin / Vendor app |
| `maps_link` | `text` | nullable | Google Maps link specific to this field | Vendor app |
| `latitude` | `numeric(10,7)` | nullable | GPS latitude | Vendor app |
| `longitude` | `numeric(10,7)` | nullable | GPS longitude | Vendor app |
| `photos` | `text[]` | nullable | Array of Supabase Storage URLs for field photos | Vendor app |
| `avg_rating` | `numeric(3,2)` | nullable | Average star rating from user reviews (cached) | Auto trigger |
| `total_reviews` | `integer` | NOT NULL, default `0` | Total number of reviews (cached) | Auto trigger |
| `total_bookings` | `integer` | NOT NULL, default `0` | All-time completed bookings (cached) | Auto trigger |
| `today_bookings` | `integer` | NOT NULL, default `0` | Bookings for today (updated daily by cron job) | Cron |
| `total_revenue` | `numeric(12,2)` | NOT NULL, default `0` | All-time revenue from this field (cached) | Auto trigger |
| `kyc_status` | `text` | NOT NULL, default `'not-started'`, CHECK IN ('not-started','pending','verified','rejected') | Field-level KYC: property documents, NOC, insurance | Admin |
| `listed_at` | `timestamptz` | nullable | When the field first went live on the platform | Admin (set when approved) |
| `created_at` | `timestamptz` | NOT NULL, default `NOW()` | Row creation time | Auto |
| `updated_at` | `timestamptz` | NOT NULL, default `NOW()` | Last update | Auto trigger |

### CREATE Statement

```sql
CREATE TYPE field_status AS ENUM ('active', 'inactive', 'pending', 'maintenance', 'suspended');
CREATE TYPE field_surface AS ENUM ('Natural Grass', 'Artificial Turf', 'Hard Court', 'Clay', 'Wooden', 'Synthetic');
CREATE TYPE field_kyc_status AS ENUM ('not-started', 'pending', 'verified', 'rejected');

CREATE TABLE fields (
  id                   UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  field_ref            TEXT             UNIQUE NOT NULL,
  vendor_id            UUID             NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,

  -- Identity
  name                 TEXT             NOT NULL,
  description          TEXT,
  sports               TEXT[]           NOT NULL,
  status               field_status     NOT NULL DEFAULT 'pending',
  surface              field_surface    NOT NULL,
  size                 TEXT,
  capacity             INTEGER,

  -- Pricing
  price_per_hour       NUMERIC(10,2)    NOT NULL,
  peak_price_per_hour  NUMERIC(10,2),

  -- Hours (null = inherit from vendor)
  weekday_open         TIME,
  weekday_close        TIME,
  weekend_open         TIME,
  weekend_close        TIME,

  -- Venue
  amenities            TEXT[],
  address              TEXT,
  city                 TEXT             NOT NULL,
  state                TEXT             NOT NULL,
  zone                 TEXT,
  maps_link            TEXT,
  latitude             NUMERIC(10,7),
  longitude            NUMERIC(10,7),
  photos               TEXT[],

  -- Cached stats (triggers)
  avg_rating           NUMERIC(3,2),
  total_reviews        INTEGER          NOT NULL DEFAULT 0,
  total_bookings       INTEGER          NOT NULL DEFAULT 0,
  today_bookings       INTEGER          NOT NULL DEFAULT 0,
  total_revenue        NUMERIC(12,2)    NOT NULL DEFAULT 0,

  -- KYC
  kyc_status           field_kyc_status NOT NULL DEFAULT 'not-started',

  -- Timestamps
  listed_at            TIMESTAMPTZ,
  created_at           TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE TRIGGER fields_updated_at
  BEFORE UPDATE ON fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Table 5: `field_kyc_docs`

Same pattern as `vendor_kyc_docs` but for field-specific documents.

| Doc type | Description |
|---|---|
| `property_doc` | Ownership certificate or lease agreement for the land |
| `noc` | Municipal No Objection Certificate |
| `insurance` | Active public liability insurance certificate |
| `photos` | High-resolution photos of the facility (stored in Storage) |

```sql
CREATE TABLE field_kyc_docs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id         UUID        NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  doc_type         TEXT        NOT NULL CHECK (doc_type IN ('property_doc','noc','insurance','photos')),
  file_url         TEXT        NOT NULL,
  file_name        TEXT,
  status           TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  rejection_reason TEXT,
  reviewed_by      UUID,
  reviewed_at      TIMESTAMPTZ,
  uploaded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (field_id, doc_type)
);
```

---

## Table 6: `field_slots`

Controls availability. One row per blocked or overridden time slot. If no row exists for a slot, it is assumed to be available at the standard price.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | PK |
| `field_id` | `uuid` | FK → `fields(id)` ON DELETE CASCADE |
| `slot_date` | `date` | Date this rule applies to |
| `slot_start` | `time` | Slot start time |
| `slot_end` | `time` | Slot end time |
| `type` | `text` | CHECK IN ('blocked','booked','maintenance','custom_price') |
| `custom_price` | `numeric(10,2)` | nullable — override price for this slot (for peak/holiday pricing) |
| `booking_id` | `uuid` | nullable, FK → `bookings(id)` — set when type = 'booked' |
| `notes` | `text` | nullable |
| `created_at` | `timestamptz` | |

```sql
CREATE TABLE field_slots (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id      UUID          NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  slot_date     DATE          NOT NULL,
  slot_start    TIME          NOT NULL,
  slot_end      TIME          NOT NULL,
  type          TEXT          NOT NULL CHECK (type IN ('blocked','booked','maintenance','custom_price')),
  custom_price  NUMERIC(10,2),
  booking_id    UUID          REFERENCES bookings(id) ON DELETE SET NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_field_slots_date ON field_slots(field_id, slot_date);
```

---

## Table 7: `field_reviews`

User reviews and ratings for individual fields.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | PK |
| `field_id` | `uuid` | FK → `fields(id)` |
| `user_id` | `uuid` | FK → `users(id)` |
| `booking_id` | `uuid` | FK → `bookings(id)` — ensures review is tied to an actual booking |
| `rating` | `integer` | CHECK (rating BETWEEN 1 AND 5) |
| `comment` | `text` | nullable |
| `is_visible` | `boolean` | default `true` — admin can hide a review |
| `created_at` | `timestamptz` | |

```sql
CREATE TABLE field_reviews (
  id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id    UUID      NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  user_id     UUID      NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  booking_id  UUID      UNIQUE NOT NULL REFERENCES bookings(id),  -- one review per booking
  rating      INTEGER   NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  is_visible  BOOLEAN   NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Complete Relationship Diagram

```
vendors
  │
  ├── vendor_bank_details     (1:1)
  ├── vendor_kyc_docs         (1:many, one per doc type)
  │
  └── fields                  (1:many)
        │
        ├── field_kyc_docs    (1:many, one per doc type)
        ├── field_slots       (1:many — availability calendar)
        ├── field_reviews     (1:many — from users)
        │
        └── bookings          (1:many)
              │
              └── users       (many:1 — who made the booking)
```

---

## What Each App Does

### Flutter Vendor App writes

| Event | Table | Operation |
|---|---|---|
| Vendor signs up | `vendors` | INSERT (via Auth trigger or Edge Function) |
| Vendor completes bank details | `vendor_bank_details` | INSERT or UPDATE |
| Vendor uploads KYC document | `vendor_kyc_docs` + Supabase Storage | INSERT / UPSERT |
| Vendor adds a new field | `fields` | INSERT |
| Vendor updates field details | `fields` | UPDATE |
| Vendor blocks a time slot | `field_slots` | INSERT (type = 'blocked') |
| Vendor unblocks a slot | `field_slots` | DELETE |
| Vendor marks field as maintenance | `fields` | UPDATE status = 'maintenance' |

### Admin Portal writes

| Action | Table | Operation |
|---|---|---|
| Approve KYC | `vendors` | UPDATE kyc_status = 'verified', kyc_reviewed_at, kyc_reviewed_by |
| Reject KYC | `vendors` | UPDATE kyc_status = 'rejected', kyc_rejection_reason |
| Approve individual document | `vendor_kyc_docs` | UPDATE status = 'verified' |
| Reject individual document | `vendor_kyc_docs` | UPDATE status = 'rejected', rejection_reason |
| Suspend vendor | `vendors` | UPDATE status = 'suspended', suspension_reason, suspended_at |
| Activate vendor | `vendors` | UPDATE status = 'active' |
| Change commission rate | `vendors` | UPDATE commission |
| Change payout cycle | `vendors` | UPDATE payout_cycle |
| Suspend a field | `fields` | UPDATE status = 'suspended' |
| Approve field KYC | `field_kyc_docs` | UPDATE status = 'verified' |
| Set field as live | `fields` | UPDATE status = 'active', listed_at = NOW() |
| Hide a review | `field_reviews` | UPDATE is_visible = false |

---

## Triggers for Cached Stats

### Update `vendors` stats when a booking changes

```sql
CREATE OR REPLACE FUNCTION sync_vendor_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_vendor_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_vendor_id := (SELECT vendor_id FROM fields WHERE id = OLD.field_id);
  ELSE
    target_vendor_id := (SELECT vendor_id FROM fields WHERE id = NEW.field_id);
  END IF;

  UPDATE vendors SET
    total_bookings = (
      SELECT COUNT(*) FROM bookings b
      JOIN fields f ON b.field_id = f.id
      WHERE f.vendor_id = target_vendor_id
    ),
    total_revenue = (
      SELECT COALESCE(SUM(b.amount), 0) FROM bookings b
      JOIN fields f ON b.field_id = f.id
      WHERE f.vendor_id = target_vendor_id AND b.status = 'completed'
    )
  WHERE id = target_vendor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_sync_vendor_stats
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION sync_vendor_stats();
```

### Update `fields` stats when a booking or review changes

```sql
CREATE OR REPLACE FUNCTION sync_field_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE fields SET
    total_bookings = (SELECT COUNT(*) FROM bookings WHERE field_id = NEW.field_id AND status = 'completed'),
    total_revenue  = (SELECT COALESCE(SUM(amount), 0) FROM bookings WHERE field_id = NEW.field_id AND status = 'completed')
  WHERE id = NEW.field_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_sync_field_stats
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION sync_field_stats();

CREATE OR REPLACE FUNCTION sync_field_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE fields SET
    avg_rating    = (SELECT ROUND(AVG(rating)::numeric, 2) FROM field_reviews WHERE field_id = NEW.field_id AND is_visible = TRUE),
    total_reviews = (SELECT COUNT(*) FROM field_reviews WHERE field_id = NEW.field_id AND is_visible = TRUE)
  WHERE id = NEW.field_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_sync_field_rating
  AFTER INSERT OR UPDATE OR DELETE ON field_reviews
  FOR EACH ROW EXECUTE FUNCTION sync_field_rating();
```

---

## Indexes

```sql
-- Vendors
CREATE INDEX idx_vendors_status      ON vendors(status);
CREATE INDEX idx_vendors_kyc_status  ON vendors(kyc_status);
CREATE INDEX idx_vendors_city        ON vendors(city);
CREATE INDEX idx_vendors_created_at  ON vendors(created_at DESC);

-- Fields
CREATE INDEX idx_fields_vendor_id    ON fields(vendor_id);
CREATE INDEX idx_fields_status       ON fields(status);
CREATE INDEX idx_fields_city         ON fields(city);
CREATE INDEX idx_fields_sports       ON fields USING gin(sports);
CREATE INDEX idx_fields_location     ON fields(latitude, longitude);

-- Reviews
CREATE INDEX idx_reviews_field_id    ON field_reviews(field_id);

-- KYC docs
CREATE INDEX idx_vendor_kyc_vendor   ON vendor_kyc_docs(vendor_id);
CREATE INDEX idx_field_kyc_field     ON field_kyc_docs(field_id);
```

---

## Row Level Security

```sql
ALTER TABLE vendors           ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_kyc_docs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields             ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_kyc_docs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_slots        ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_reviews      ENABLE ROW LEVEL SECURITY;

-- Vendors: can only see their own row
CREATE POLICY "vendors_own_row" ON vendors
  FOR ALL USING (auth.uid() = auth_id);

-- Vendor bank details: own row only
CREATE POLICY "bank_own_row" ON vendor_bank_details
  FOR ALL USING (
    vendor_id = (SELECT id FROM vendors WHERE auth_id = auth.uid())
  );

-- Vendor KYC docs: own docs only
CREATE POLICY "vendor_kyc_own" ON vendor_kyc_docs
  FOR ALL USING (
    vendor_id = (SELECT id FROM vendors WHERE auth_id = auth.uid())
  );

-- Fields: vendor can manage their own fields
CREATE POLICY "fields_own_vendor" ON fields
  FOR ALL USING (
    vendor_id = (SELECT id FROM vendors WHERE auth_id = auth.uid())
  );

-- Fields: client app users can READ active fields (public browse)
CREATE POLICY "fields_public_read" ON fields
  FOR SELECT USING (status = 'active');

-- Field reviews: users can read all visible reviews, write only their own
CREATE POLICY "reviews_public_read" ON field_reviews
  FOR SELECT USING (is_visible = TRUE);

CREATE POLICY "reviews_own_write" ON field_reviews
  FOR INSERT WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );
```

---

## Admin Portal Query Reference

```sql
-- 1. Vendor list (with filters)
SELECT
  v.id, v.vendor_ref, v.business_name, v.owner_name, v.email, v.phone,
  v.city, v.state, v.status, v.kyc_status, v.commission, v.payout_cycle,
  v.total_fields, v.total_bookings, v.total_revenue, v.avg_rating,
  v.sports_offered, v.facilities, v.created_at
FROM vendors v
WHERE
  ($status = 'all' OR v.status = $status)
  AND ($kyc = 'all' OR v.kyc_status = $kyc)
  AND ($search = '' OR v.business_name ILIKE '%' || $search || '%' OR v.owner_name ILIKE '%' || $search || '%')
ORDER BY v.created_at DESC
LIMIT 20 OFFSET $offset;

-- 2. Vendor detail with KYC docs
SELECT v.*, vbd.bank_name, vbd.account_holder, vbd.ifsc_code, vbd.verified AS bank_verified
FROM vendors v
LEFT JOIN vendor_bank_details vbd ON vbd.vendor_id = v.id
WHERE v.id = $vendor_id;

SELECT * FROM vendor_kyc_docs WHERE vendor_id = $vendor_id;

-- 3. Fields for a vendor
SELECT * FROM fields WHERE vendor_id = $vendor_id ORDER BY created_at DESC;

-- 4. Field list (admin view)
SELECT
  f.id, f.field_ref, f.name, f.status, f.kyc_status,
  f.city, f.surface, f.sports, f.price_per_hour,
  f.avg_rating, f.total_reviews, f.total_bookings, f.total_revenue,
  f.listed_at, f.created_at,
  v.business_name AS vendor_name, v.owner_name
FROM fields f
JOIN vendors v ON f.vendor_id = v.id
WHERE
  ($status = 'all' OR f.status = $status)
  AND ($city = 'all' OR f.city = $city)
ORDER BY f.created_at DESC
LIMIT 20 OFFSET $offset;

-- 5. Suspend a vendor
UPDATE vendors
SET status = 'suspended', suspension_reason = $reason,
    suspended_at = NOW(), suspended_by = $admin_id
WHERE id = $vendor_id;

-- 6. Approve KYC
UPDATE vendors
SET kyc_status = 'verified', kyc_reviewed_at = NOW(), kyc_reviewed_by = $admin_id
WHERE id = $vendor_id;

-- 7. Update commission
UPDATE vendors SET commission = $new_rate WHERE id = $vendor_id;
```

---

## Notes for Flutter Vendor App Integration

1. **On vendor signup** — Use a Supabase Edge Function triggered after `auth.users` insert to create the vendor row with `status = 'pending'`. Never let the app insert directly into `vendors` using the anon key.

2. **Field creation flow** — When a vendor adds a new field, set `status = 'pending'`. The admin reviews and sets it to `active` after verifying field KYC docs. The field only appears in client search after `status = 'active'`.

3. **Slot blocking** — The vendor app should insert rows into `field_slots` with `type = 'blocked'` for any slots they want to mark as unavailable. When the client app searches for availability, it queries: `SELECT slot_start, slot_end FROM field_slots WHERE field_id = ? AND slot_date = ? AND type IN ('blocked','booked')` and excludes those from the available slots grid.

4. **KYC document uploads** — Files go to Supabase Storage bucket `kyc-docs/{vendor_id}/{doc_type}/filename`. The file URL is then saved to `vendor_kyc_docs.file_url`. Use Storage RLS to ensure vendors can only read/write their own folder.

5. **Status check on app open** — The vendor app should check `vendors.status` on each login. If `status = 'suspended'`, show a "Your account has been suspended" screen and block access to the dashboard.

6. **Commission is read-only for vendors** — The `commission` column should never be writable from the vendor app. Only the admin portal backend (service role) can change it.
