# TurfIn Users — Supabase Table Design

This document defines every Supabase table needed to power the Users tab in the admin portal. All data originates from the Flutter client app. The admin portal reads this data and can update specific fields (status, ban reason, profile corrections).

---

## Architecture Overview

```
Flutter Client App
  │
  ├── Supabase Auth  (handles login — phone OTP or email/password)
  │     └── on signup → triggers upsert into `users` table
  │
  ├── Writes to `users`          (profile, last active, device info)
  ├── Writes to `bookings`       (create, cancel, complete)
  ├── Writes to `user_devices`   (FCM/OneSignal token per device)
  └── Reads from `users`         (own profile only — RLS enforced)

Admin Portal Backend (service role — bypasses RLS)
  ├── Reads all rows from `users`, `bookings`, `user_devices`
  └── Updates `users.status`, `users.ban_reason`, profile corrections
```

---

## Table 1: `users`

The primary user profile table. One row per registered user.

### Full Column Reference

| Column | Type | Constraints | Description | Written by |
|---|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Internal unique user ID | Auto |
| `auth_id` | `uuid` | UNIQUE, FK → `auth.users(id)` ON DELETE SET NULL | Supabase Auth user ID — links login to profile | Supabase Auth |
| `display_name` | `text` | NOT NULL | Full name as entered by the user | Flutter |
| `email` | `text` | UNIQUE, nullable | Email address. Nullable because some users sign up via phone only | Flutter / Auth |
| `phone` | `text` | UNIQUE, nullable | Phone number with country code. Nullable for email-only signups | Flutter / Auth |
| `avatar_url` | `text` | nullable | URL to profile photo stored in Supabase Storage | Flutter |
| `date_of_birth` | `date` | nullable | User's date of birth (optional in profile) | Flutter |
| `gender` | `text` | nullable, CHECK IN ('male','female','other','prefer_not_to_say') | Gender (optional) | Flutter |
| `city` | `text` | nullable | City the user is based in | Flutter |
| `state` | `text` | nullable | State | Flutter |
| `country` | `text` | default `'India'` | Country | Flutter |
| `status` | `text` | NOT NULL, default `'active'`, CHECK IN ('active','inactive','banned','deleted') | Account status. `inactive` = no bookings in 30+ days (computed). `banned` = manually set by admin. `deleted` = soft delete | Admin / System |
| `ban_reason` | `text` | nullable | Plain text reason for the ban, set by admin at time of banning | Admin |
| `banned_at` | `timestamptz` | nullable | Timestamp when the ban was applied | Admin |
| `banned_by` | `uuid` | nullable, FK → admin users table (future) | ID of the admin who applied the ban | Admin |
| `email_verified` | `boolean` | default `false` | Whether the user has verified their email address | Supabase Auth / Flutter |
| `phone_verified` | `boolean` | default `false` | Whether the user has verified their phone number via OTP | Supabase Auth / Flutter |
| `source` | `text` | default `'organic'`, CHECK IN ('google','apple','facebook','instagram','referral','organic') | Acquisition channel — how the user found and signed up for TurfIn | Flutter (set at registration) |
| `referral_code_used` | `text` | nullable | The referral code this user entered when signing up | Flutter (set once at registration) |
| `own_referral_code` | `text` | UNIQUE, nullable | The referral code this user can share with others | Auto-generated on signup |
| `wallet_balance` | `numeric(10,2)` | default `0` | TurfIn wallet credits in INR | Backend (updated on payments/refunds) |
| `turfing_coins` | `integer` | NOT NULL, default `0` | Current Turfing Coins balance — earned on completed bookings, spent on discounts. See `TURFING_COINS.md` | Backend trigger |
| `total_coins_earned` | `integer` | NOT NULL, default `0` | Lifetime coins earned across all bookings and bonuses (never decremented — analytics only) | Backend trigger |
| `total_coins_spent` | `integer` | NOT NULL, default `0` | Lifetime coins spent on redemptions (never decremented — analytics only) | Backend trigger |
| `fav_sport` | `text` | nullable | User's most frequently booked sport — updated by backend trigger after each booking | Backend trigger |
| `fav_vendor_id` | `uuid` | nullable, FK → `vendors(id)` | Vendor the user has booked most often — updated by backend trigger | Backend trigger |
| `total_bookings` | `integer` | default `0` | Cached count of all bookings ever made | Backend trigger |
| `completed_bookings` | `integer` | default `0` | Cached count of bookings with status = completed | Backend trigger |
| `cancelled_bookings` | `integer` | default `0` | Cached count of bookings cancelled by the user | Backend trigger |
| `no_show_bookings` | `integer` | default `0` | Cached count of no-show bookings | Backend trigger |
| `total_spent` | `numeric(10,2)` | default `0` | Cumulative INR spent on completed bookings (cached) | Backend trigger |
| `is_vip` | `boolean` | default `false` | Derived flag: true when total_bookings >= 25 OR total_spent >= 40000. Updated by trigger | Backend trigger |
| `cancellation_rate` | `numeric(5,2)` | default `0` | Percentage: (cancelled + no_shows) / total_bookings × 100. Cached | Backend trigger |
| `app_version` | `text` | nullable | Last known Flutter app version the user was on | Flutter (sent on each app open) |
| `device_os` | `text` | nullable, CHECK IN ('android','ios') | Primary device OS | Flutter |
| `push_notifications_enabled` | `boolean` | default `true` | Whether the user has opted in to push notifications. Set by Flutter from device permission status | Flutter |
| `onesignal_player_id` | `text` | nullable | OneSignal subscription ID for the last active device. Used for targeted push notifications | Flutter / OneSignal SDK |
| `created_at` | `timestamptz` | default `NOW()` | Account creation timestamp | Auto |
| `updated_at` | `timestamptz` | default `NOW()` | Last profile update — maintained by trigger | Auto trigger |
| `last_active_at` | `timestamptz` | nullable | Last time the user opened the app. Flutter pings this on each app open | Flutter |
| `deleted_at` | `timestamptz` | nullable | Soft delete timestamp. Non-null means the account is deleted | Admin / Flutter (account deletion request) |

### CREATE Statement

```sql
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'banned', 'deleted');
CREATE TYPE acquisition_source AS ENUM ('google', 'apple', 'facebook', 'instagram', 'referral', 'organic');
CREATE TYPE device_os_type AS ENUM ('android', 'ios');

CREATE TABLE users (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id              UUID        UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Identity
  display_name         TEXT        NOT NULL,
  email                TEXT        UNIQUE,
  phone                TEXT        UNIQUE,
  avatar_url           TEXT,
  date_of_birth        DATE,
  gender               TEXT        CHECK (gender IN ('male','female','other','prefer_not_to_say')),

  -- Location
  city                 TEXT,
  state                TEXT,
  country              TEXT        NOT NULL DEFAULT 'India',

  -- Account status
  status               user_status NOT NULL DEFAULT 'active',
  ban_reason           TEXT,
  banned_at            TIMESTAMPTZ,
  banned_by            UUID,

  -- Verification
  email_verified       BOOLEAN     NOT NULL DEFAULT FALSE,
  phone_verified       BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Acquisition
  source               acquisition_source NOT NULL DEFAULT 'organic',  -- 'google','apple','facebook','instagram','referral','organic'
  referral_code_used   TEXT,
  own_referral_code    TEXT        UNIQUE,

  -- Financials
  wallet_balance       NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Turfing Coins (see TURFING_COINS.md for full economy design)
  turfing_coins        INTEGER       NOT NULL DEFAULT 0,   -- current spendable balance
  total_coins_earned   INTEGER       NOT NULL DEFAULT 0,   -- lifetime earned (read-only analytics)
  total_coins_spent    INTEGER       NOT NULL DEFAULT 0,   -- lifetime spent (read-only analytics)

  -- Preferences (updated by triggers)
  fav_sport            TEXT,
  fav_vendor_id        UUID        REFERENCES vendors(id) ON DELETE SET NULL,

  -- Cached booking stats (updated by triggers after each booking change)
  total_bookings       INTEGER     NOT NULL DEFAULT 0,
  completed_bookings   INTEGER     NOT NULL DEFAULT 0,
  cancelled_bookings   INTEGER     NOT NULL DEFAULT 0,
  no_show_bookings     INTEGER     NOT NULL DEFAULT 0,
  total_spent          NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_vip               BOOLEAN     NOT NULL DEFAULT FALSE,
  cancellation_rate    NUMERIC(5,2) NOT NULL DEFAULT 0,

  -- App / device
  app_version                  TEXT,
  device_os                    device_os_type,
  push_notifications_enabled   BOOLEAN     NOT NULL DEFAULT TRUE,
  onesignal_player_id          TEXT,

  -- Timestamps
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at       TIMESTAMPTZ,
  deleted_at           TIMESTAMPTZ
);

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Important: Implement in Two Phases

**Phase 1 (auth + profile):** Implement only `users` and `user_devices`. A user can exist with zero bookings — all the cached stat columns (`total_bookings`, `total_spent`, etc.) just default to `0`. Do NOT create the `bookings` table yet.

**Phase 2 (bookings — separate task):** The `bookings` table is defined below for reference. Implement it only when building the booking flow. It depends on `vendors` and `fields` tables being created first (defined in `VENDOR_FIELD_DETAILS.md`). The cached stat columns on `users` are automatically maintained by the `sync_user_booking_stats` trigger whenever a booking is inserted, updated, or deleted — you do not update them manually.

---

## Table 2: `bookings`

Stores every booking made through the Flutter app. The Users tab reads this table for per-user booking history.

| Column | Type | Constraints | Description | Written by |
|---|---|---|---|---|
| `id` | `uuid` | PK | Internal booking ID | Auto |
| `booking_ref` | `text` | UNIQUE, NOT NULL | Human-readable reference shown in UI: `BK-0041` | Auto (sequence or trigger) |
| `user_id` | `uuid` | NOT NULL, FK → `users(id)` | The user who made the booking | Flutter |
| `vendor_id` | `uuid` | NOT NULL, FK → `vendors(id)` | The vendor whose field was booked | Flutter |
| `field_id` | `uuid` | NOT NULL, FK → `fields(id)` | The specific field booked | Flutter |
| `sport` | `text` | NOT NULL | Sport played: Football, Cricket, Tennis, etc. | Flutter |
| `booking_date` | `date` | NOT NULL | Date of the session | Flutter |
| `slot_start` | `time` | NOT NULL | Session start time | Flutter |
| `slot_end` | `time` | NOT NULL | Session end time | Flutter |
| `duration_mins` | `integer` | nullable | Duration in minutes (derived: slot_end - slot_start) | Auto / Flutter |
| `amount` | `numeric(10,2)` | NOT NULL | Total amount charged to the user in INR | Flutter |
| `platform_fee` | `numeric(10,2)` | default `0` | TurfIn's cut from this booking | Backend |
| `vendor_earnings` | `numeric(10,2)` | nullable | Amount owed to vendor (amount - platform_fee) | Backend |
| `status` | `text` | NOT NULL, default `'upcoming'`, CHECK IN ('upcoming','completed','cancelled','no-show') | Current booking status | Flutter / Backend |
| `payment_status` | `text` | NOT NULL, default `'pending'`, CHECK IN ('pending','paid','refunded','failed') | Payment status | Backend / Payment gateway |
| `payment_method` | `text` | nullable, CHECK IN ('upi','card','wallet','cash') | How the user paid | Flutter |
| `payment_ref` | `text` | nullable | Payment gateway transaction ID | Backend / Payment gateway |
| `cancellation_reason` | `text` | nullable | Reason if cancelled | Flutter / Admin |
| `cancelled_by` | `text` | nullable, CHECK IN ('user','vendor','admin') | Who initiated the cancellation | Flutter / Admin |
| `refund_amount` | `numeric(10,2)` | nullable | Refund issued if any | Backend |
| `refund_at` | `timestamptz` | nullable | When refund was processed | Backend |
| `notes` | `text` | nullable | Any internal admin notes | Admin |
| `created_at` | `timestamptz` | default `NOW()` | When booking was created | Auto |
| `updated_at` | `timestamptz` | default `NOW()` | Last update | Auto trigger |

### CREATE Statement

```sql
CREATE TYPE booking_status  AS ENUM ('upcoming', 'completed', 'cancelled', 'no-show');
CREATE TYPE payment_status  AS ENUM ('pending', 'paid', 'refunded', 'failed');
CREATE TYPE payment_method  AS ENUM ('upi', 'card', 'wallet', 'cash');
CREATE TYPE cancellation_actor AS ENUM ('user', 'vendor', 'admin');

CREATE TABLE bookings (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref          TEXT          UNIQUE NOT NULL,
  user_id              UUID          NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  vendor_id            UUID          NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  field_id             UUID          NOT NULL REFERENCES fields(id) ON DELETE RESTRICT,
  sport                TEXT          NOT NULL,
  booking_date         DATE          NOT NULL,
  slot_start           TIME          NOT NULL,
  slot_end             TIME          NOT NULL,
  duration_mins        INTEGER       GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (slot_end - slot_start)) / 60) STORED,
  amount               NUMERIC(10,2) NOT NULL,
  platform_fee         NUMERIC(10,2) NOT NULL DEFAULT 0,
  vendor_earnings      NUMERIC(10,2),
  status               booking_status NOT NULL DEFAULT 'upcoming',
  payment_status       payment_status NOT NULL DEFAULT 'pending',
  payment_method       payment_method,
  payment_ref          TEXT,
  cancellation_reason  TEXT,
  cancelled_by         cancellation_actor,
  refund_amount        NUMERIC(10,2),
  refund_at            TIMESTAMPTZ,
  notes                TEXT,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Table 3: `user_devices`

One row per device a user has logged in on. Used for push notifications — stores the OneSignal player ID and FCM token per device.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK | Row ID |
| `user_id` | `uuid` | NOT NULL, FK → `users(id)` ON DELETE CASCADE | Which user |
| `device_id` | `text` | NOT NULL | Unique hardware/app identifier from Flutter (`Platform.environment` or `device_info_plus` package) |
| `device_os` | `text` | CHECK IN ('android','ios') | OS |
| `device_model` | `text` | nullable | e.g. "Samsung Galaxy S23", "iPhone 15 Pro" |
| `app_version` | `text` | nullable | Flutter app version on this device |
| `onesignal_player_id` | `text` | nullable | OneSignal subscription ID for this specific device |
| `fcm_token` | `text` | nullable | Firebase Cloud Messaging token (used if not using OneSignal) |
| `is_active` | `boolean` | default `true` | False when the user logs out from this device |
| `last_seen_at` | `timestamptz` | default `NOW()` | Last time this device was active |
| `created_at` | `timestamptz` | default `NOW()` | When device first registered |

### CREATE Statement

```sql
CREATE TABLE user_devices (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id            TEXT        NOT NULL,
  device_os            device_os_type,
  device_model         TEXT,
  app_version          TEXT,
  onesignal_player_id  TEXT,
  fcm_token            TEXT,
  is_active            BOOLEAN     NOT NULL DEFAULT TRUE,
  last_seen_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, device_id)
);
```

---

## Relationship Diagram

```
auth.users (Supabase built-in)
  │
  └── users (1:1 via auth_id)
        │
        ├── bookings (1:many via user_id)
        │     ├── vendors (many:1 via vendor_id)
        │     └── fields  (many:1 via field_id)
        │
        ├── user_devices (1:many via user_id)
        │
        ├── coin_transactions (1:many via user_id)  ← full coin ledger (see TURFING_COINS.md)
        │
        └── vendors (many:1 via fav_vendor_id)  ← favourite vendor reference
```

---

## What Flutter Writes vs What the Admin Portal Does

### Flutter writes (on behalf of the user)

| Event | Table | Operation |
|---|---|---|
| User signs up | `users` | INSERT (via Edge Function or Auth trigger) |
| User updates profile | `users` | UPDATE display_name, avatar_url, city, state, date_of_birth, gender |
| App opens | `users` | UPDATE last_active_at, app_version, device_os |
| User registers device / logs in | `user_devices` | UPSERT on (user_id, device_id) |
| User logs out of device | `user_devices` | UPDATE is_active = false |
| User creates booking | `bookings` | INSERT |
| User cancels booking | `bookings` | UPDATE status = 'cancelled', cancelled_by = 'user', cancellation_reason |
| Booking is completed | `bookings` | UPDATE status = 'completed' (triggered by vendor app or time-based job) |
| No-show recorded | `bookings` | UPDATE status = 'no-show' (triggered by vendor app) |

### Admin portal reads / writes

| Action in admin portal | Table | Operation |
|---|---|---|
| View user list | `users` | SELECT all (with pagination, search, filters) |
| View user detail | `users` | SELECT single row |
| View user's recent bookings | `bookings` | SELECT WHERE user_id = ? ORDER BY created_at DESC LIMIT 10 |
| Ban user | `users` | UPDATE status = 'banned', ban_reason, banned_at, banned_by |
| Unban / restore user | `users` | UPDATE status = 'active', ban_reason = NULL |
| Send email to user | External email service (Resend / SendGrid) — no DB write needed |
| View booking stats | `users` | Read cached stat columns (total_bookings, total_spent, etc.) |

---

## Cached Stats — How to Keep Them Updated

The columns `total_bookings`, `completed_bookings`, `cancelled_bookings`, `no_show_bookings`, `total_spent`, `is_vip`, and `cancellation_rate` on the `users` table are **cached aggregates**. They need to be updated whenever a booking changes.

Use a Postgres trigger on the `bookings` table:

```sql
-- After any INSERT, UPDATE, or DELETE on bookings,
-- recalculate and update the cached stats on the related user row.

CREATE OR REPLACE FUNCTION sync_user_booking_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Determine which user to update
  IF TG_OP = 'DELETE' THEN
    target_user_id := OLD.user_id;
  ELSE
    target_user_id := NEW.user_id;
  END IF;

  UPDATE users SET
    total_bookings      = (SELECT COUNT(*)    FROM bookings WHERE user_id = target_user_id),
    completed_bookings  = (SELECT COUNT(*)    FROM bookings WHERE user_id = target_user_id AND status = 'completed'),
    cancelled_bookings  = (SELECT COUNT(*)    FROM bookings WHERE user_id = target_user_id AND status = 'cancelled' AND cancelled_by = 'user'),
    no_show_bookings    = (SELECT COUNT(*)    FROM bookings WHERE user_id = target_user_id AND status = 'no-show'),
    total_spent         = (SELECT COALESCE(SUM(amount), 0) FROM bookings WHERE user_id = target_user_id AND status = 'completed' AND payment_status = 'paid'),
    cancellation_rate   = (
      SELECT CASE WHEN COUNT(*) = 0 THEN 0
             ELSE ROUND((COUNT(*) FILTER (WHERE status IN ('cancelled','no-show'))::numeric / COUNT(*)) * 100, 2)
             END
      FROM bookings WHERE user_id = target_user_id
    ),
    is_vip = (
      SELECT (COUNT(*) >= 25 OR COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) >= 40000)
      FROM bookings WHERE user_id = target_user_id
    )
  WHERE id = target_user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_sync_user_stats
  AFTER INSERT OR UPDATE OR DELETE ON bookings
  FOR EACH ROW EXECUTE FUNCTION sync_user_booking_stats();
```

---

## Row Level Security (RLS) Policies

Enable RLS on all tables. The Flutter app uses the **anon/authenticated role** and can only access its own data. The admin portal backend uses the **service role key** and bypasses RLS entirely.

```sql
-- Enable RLS
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Users: can only read/update their own profile
CREATE POLICY "users_own_row" ON users
  FOR ALL USING (auth.uid() = auth_id);

-- Bookings: can only read/write their own bookings
CREATE POLICY "bookings_own_rows" ON bookings
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Devices: can only manage their own devices
CREATE POLICY "devices_own_rows" ON user_devices
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );
```

The admin portal backend never uses these policies — it always uses the **service role key** from your backend server (never from the Flutter app or admin portal frontend).

---

## Indexes to Create

For admin portal query performance (filtering, sorting, searching):

```sql
-- Frequently filtered/sorted columns
CREATE INDEX idx_users_status         ON users(status);
CREATE INDEX idx_users_city           ON users(city);
CREATE INDEX idx_users_created_at     ON users(created_at DESC);
CREATE INDEX idx_users_last_active    ON users(last_active_at DESC);
CREATE INDEX idx_users_total_spent    ON users(total_spent DESC);
CREATE INDEX idx_users_is_vip         ON users(is_vip) WHERE is_vip = TRUE;

-- Search by name/email/phone (use pg_trgm extension for ILIKE performance)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_users_name_trgm      ON users USING gin(display_name gin_trgm_ops);
CREATE INDEX idx_users_email_trgm     ON users USING gin(email gin_trgm_ops);
CREATE INDEX idx_users_phone          ON users(phone);  -- exact lookup by phone number

-- Bookings lookup per user
CREATE INDEX idx_bookings_user_id     ON bookings(user_id);
CREATE INDEX idx_bookings_date        ON bookings(booking_date DESC);
CREATE INDEX idx_bookings_status      ON bookings(status);

-- Devices lookup
CREATE INDEX idx_devices_user_id      ON user_devices(user_id);
```

---

## Admin Portal Query Reference

These are the exact queries the backend should run for each view in the Users tab:

```sql
-- 1. User list (with search + filter)
SELECT
  id, display_name, email, phone, city, state,
  status, email_verified, phone_verified, source,
  total_bookings, completed_bookings, cancelled_bookings,
  no_show_bookings, total_spent, cancellation_rate,
  fav_sport, is_vip, created_at, last_active_at
FROM users
WHERE
  deleted_at IS NULL
  AND ($search = '' OR display_name ILIKE '%' || $search || '%' OR email ILIKE '%' || $search || '%')
  AND ($status = 'all' OR status = $status)
  AND ($city = 'all' OR city = $city)
ORDER BY created_at DESC
LIMIT 20 OFFSET $offset;

-- 2. Single user detail
SELECT u.*, v.name AS fav_vendor_name
FROM users u
LEFT JOIN vendors v ON u.fav_vendor_id = v.id
WHERE u.id = $user_id AND u.deleted_at IS NULL;

-- 3. User's recent bookings
SELECT
  b.id, b.booking_ref, b.booking_date, b.slot_start, b.slot_end,
  b.sport, b.amount, b.status, b.payment_status,
  f.name AS field_name, v.name AS vendor_name
FROM bookings b
JOIN fields f ON b.field_id = f.id
JOIN vendors v ON b.vendor_id = v.id
WHERE b.user_id = $user_id
ORDER BY b.created_at DESC
LIMIT 10;

-- 4. Ban a user
UPDATE users
SET status = 'banned', ban_reason = $reason, banned_at = NOW(), banned_by = $admin_id
WHERE id = $user_id;

-- 5. Restore a user
UPDATE users
SET status = 'active', ban_reason = NULL, banned_at = NULL, banned_by = NULL
WHERE id = $user_id;
```

---

## Notes for Flutter Integration

1. **On first signup** — Create a row in `users` with `auth_id` = the Supabase Auth UID. Use a Postgres trigger on `auth.users` or a Supabase Edge Function to automate this so the app doesn't need to manually insert.

2. **Sending `last_active_at`** — Call `PATCH /users/me` with `{ last_active_at: new Date().toISOString() }` every time the Flutter app comes to the foreground. Keep it debounced — once per session, not on every interaction.

3. **OneSignal player ID** — After the OneSignal SDK initialises in Flutter, send the player ID to your backend: `PATCH /users/me` with `{ onesignal_player_id: playerId }`. Also upsert into `user_devices` for the current device.

4. **Source tracking** — Set the `source` field once at registration, never update it. Determine it from: whether the user logged in with Google/Apple (set accordingly), came via a referral code (set `referral`), or signed up organically.

5. **Status changes from admin** — When the admin bans or unbans a user, the Flutter app should check the user's `status` field on each app open. If `status = 'banned'`, log the user out and show a "Your account has been suspended" screen.

6. **Location fields (`city`, `state`, `country`)** — Flutter should auto-populate these on signup using reverse geocoding from the device's GPS coordinates (`geolocator` + `geocoding` packages). The user can also manually edit them in their profile. Do NOT store raw `latitude`/`longitude` for users — city/state is sufficient for the admin portal's filtering and analytics.

7. **Push notification opt-out** — After requesting notification permission on first launch, write `push_notifications_enabled = true/false` to Supabase based on what the user granted. Re-check on each app open and sync if it changed. Before sending any targeted OneSignal push, filter out users where `push_notifications_enabled = false`.

8. **Related schema** — This document covers `users`, `bookings`, and `user_devices` only. The `vendors` and `fields` tables (which `bookings` references via `vendor_id` and `field_id`) are defined in `VENDOR_FIELD_DETAILS.md`. The Flutter agent must implement both documents together — you cannot create `bookings` without `vendors` and `fields` existing first.
