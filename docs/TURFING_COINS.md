# Turfing Coins — Economy Design & Implementation Guide

Turfing Coins are TurfIn's in-app reward currency. Every turf booking earns a user a fixed number of coins tied to that specific field. Coins accumulate in the user's balance and can be redeemed as a real-money discount on future bookings. This document defines the full economy model, database schema, trigger logic, admin controls, and Flutter integration notes.

---

## Table of Contents

1. [Overview & Goals](#1-overview--goals)
2. [How Coins Are Earned](#2-how-coins-are-earned)
3. [How Coins Are Spent](#3-how-coins-are-spent)
4. [Coin Expiry Rules](#4-coin-expiry-rules)
5. [Coin Value & Conversion Rate](#5-coin-value--conversion-rate)
6. [Database Schema](#6-database-schema)
7. [Trigger Logic](#7-trigger-logic)
8. [Admin Portal Controls](#8-admin-portal-controls)
9. [Flutter Integration Notes](#9-flutter-integration-notes)
10. [Edge Cases & Rules](#10-edge-cases--rules)
11. [Fields Table Addition](#11-fields-table-addition)
12. [Admin Query Reference](#12-admin-query-reference)

---

## 1. Overview & Goals

| Property | Value |
|---|---|
| Currency name | Turfing Coins |
| Symbol | TC (display as `🪙 TC` or just `TC` in UI) |
| Conversion rate | **100 TC = ₹10** (i.e. 1 TC = ₹0.10) |
| Default earn rate | Configured per field (`fields.coins_per_booking`), default **50 TC** per completed booking |
| Minimum redemption | 100 TC (= ₹10) |
| Maximum redemption per booking | 500 TC (= ₹50) OR 20% of the booking amount — whichever is lower |
| Coin expiry | 365 days from the date each batch was earned (FIFO basis) |
| Who can adjust | Admin only (grant, deduct, expire early) |

**Design goals:**
- Reward loyalty: the more a user books, the more they save.
- Drive repeat visits: coins expire, creating urgency to return.
- Per-field incentives: admin can set higher coin rates on new or underperforming fields to boost traffic.
- Transparent ledger: every coin movement is logged in `coin_transactions` so users and admins can audit the full history.

---

## 2. How Coins Are Earned

### 2.1 Booking Completion (Primary Channel)

Coins are awarded **only when a booking reaches `status = 'completed'`**. They are never awarded for upcoming, cancelled, or no-show bookings.

The number of coins awarded is read from **`fields.coins_per_booking`** — the fixed coin value the admin has assigned to that specific turf. If the field has no custom value, the platform default (50 TC) is used.

```
coins_awarded = fields.coins_per_booking  (default: 50 TC)
```

This fires via a Postgres trigger on the `bookings` table whenever `status` changes to `'completed'`.

| Event | Coins | Transaction Type |
|---|---|---|
| Booking completed | `fields.coins_per_booking` (min 10, default 50) | `earned` |

### 2.2 Welcome Bonus

Awarded once, on a user's **first-ever completed booking**.

| Event | Coins | Transaction Type |
|---|---|---|
| First booking ever completed | +100 TC | `bonus` |

Condition: `users.completed_bookings = 0` before the trigger fires (i.e. the booking being completed is the first one).

### 2.3 Referral Reward

When a user's referred friend (someone who signed up using their `own_referral_code`) completes their **first booking**, the referrer earns a reward.

| Event | Coins | Transaction Type |
|---|---|---|
| Referred friend completes first booking | +200 TC to the referrer | `referral_reward` |

Implementation: When a booking completes and `users.completed_bookings` for the friend goes from 0 → 1, look up `users.referral_code_used` on the friend's row, find the user with matching `own_referral_code`, and award them 200 TC.

### 2.4 Review Bonus

Awarded when a user submits a rating/review after a completed booking. One review bonus per booking (enforced by `field_reviews.booking_id` UNIQUE constraint).

| Event | Coins | Transaction Type |
|---|---|---|
| Review submitted after completed booking | +10 TC | `bonus` |

### 2.5 Monthly Streak Bonus

Awarded automatically at the end of each calendar month if the user completed 3 or more bookings in that month. Runs as a scheduled backend job (cron), not a real-time trigger.

| Event | Coins | Transaction Type |
|---|---|---|
| 3 completed bookings in a calendar month | +50 TC | `bonus` |
| 5 completed bookings in a calendar month | +150 TC | `bonus` |

### 2.6 Admin Manual Grant

An admin can grant coins to any user directly from the admin portal (for goodwill, compensation, promotions, etc.).

| Event | Coins | Transaction Type |
|---|---|---|
| Admin grants coins manually | Amount set by admin | `admin_adjustment` |

### 2.7 Complete Earning Summary

| Source | Coins | Notes |
|---|---|---|
| Completed booking | 10–500 TC (per field setting) | Primary earning method |
| First booking (welcome) | +100 TC | One-time, lifetime |
| Referral reward | +200 TC | Per successful referral |
| Review submitted | +10 TC | One per booking |
| Monthly streak (3 bookings) | +50 TC | Runs as monthly cron |
| Monthly streak (5 bookings) | +150 TC | Supersedes the 50 TC tier |
| Admin manual grant | Variable | Compensation / promotions |

---

## 3. How Coins Are Spent

Coins are redeemed at checkout as a **partial payment discount**. They reduce the INR amount the user owes — they do not replace the payment method.

### 3.1 Redemption at Booking

When a user chooses to redeem coins at checkout:

1. Flutter sends `coins_to_redeem` in the booking payload.
2. Backend validates the amount (see limits below).
3. Deducts coins from `users.turfing_coins` and increments `users.total_coins_spent`.
4. Inserts a `coin_transactions` row with `type = 'spent'`, `coins = -coins_to_redeem`.
5. The booking's `amount` is reduced by the rupee equivalent of the redeemed coins.
6. The reduced amount is charged to the user's chosen payment method (UPI, card, wallet, etc.).

```
rupee_discount = coins_to_redeem / 100 × 10    -- 100 TC = ₹10
final_charge   = booking_amount - rupee_discount
```

### 3.2 Redemption Limits

| Limit | Rule |
|---|---|
| Minimum redemption | 100 TC (= ₹10) |
| Maximum per booking | 500 TC (= ₹50) |
| Maximum as % of booking | 20% of `bookings.amount` |
| Effective cap | Whichever of the two maximums is lower applies |
| Partial redemption allowed | Yes — user can choose how many coins to use |
| Combined with wallet | Yes — coins discount stacks with wallet payment |
| Combined with promotions | Configurable — admin can restrict per promo |

**Example:** Booking amount = ₹400. User has 800 TC.
- 20% of ₹400 = ₹80 → equivalent to 800 TC, but hard cap is 500 TC (= ₹50).
- User can redeem at most 500 TC → saves ₹50 → pays ₹350.

### 3.3 Refund Behaviour on Cancelled Bookings

If a booking is cancelled **after coins were redeemed on it**, the coins are returned to the user.

| Cancellation scenario | Coin treatment |
|---|---|
| Cancelled before session (within free cancellation window) | Coins fully refunded |
| Cancelled within penalty period | Coins partially refunded (same ratio as INR refund) |
| No-show | Coins NOT refunded |
| Admin-initiated cancellation | Coins fully refunded + goodwill bonus at admin's discretion |

Refunded coins are inserted as a new `coin_transactions` row with `type = 'refund'`.

---

## 4. Coin Expiry Rules

To keep the economy active and prevent indefinite hoarding:

- Every batch of coins earned has its own **expiry date: 365 days from the date earned**.
- Expiry is tracked in `coin_transactions.expires_at`.
- A nightly cron job scans for expired coin batches and deducts them from `users.turfing_coins`, inserting a `coin_transactions` row with `type = 'expired'` and a negative `coins` value.
- Redemption uses **FIFO** (oldest coins spent first) so the user's most-at-risk coins are consumed first, reducing unfair expirations.
- Expired coins are **not refundable** and do not count toward `total_coins_earned` analytics (they already were counted when originally earned).
- Admin can extend a user's coin expiry dates manually (one-time, for goodwill or support reasons).

---

## 5. Coin Value & Conversion Rate

```
1 TC = ₹0.10
100 TC = ₹10
500 TC = ₹50  (max per booking)
```

The conversion rate is **platform-wide and fixed** — it is not per-field. Only the earn rate (`coins_per_booking`) varies per field. The spend rate (100 TC = ₹10) is constant everywhere.

**Why fixed rate?** Changing the rate retroactively would devalue existing balances, which undermines user trust. If the rate ever needs to change, it must be done with a migration and prior notice.

---

## 6. Database Schema

### 6.1 Columns Added to `users`

These three columns are added to the existing `users` table (see `USER_DETAILS.md` for full table):

```sql
-- Turfing Coins
turfing_coins        INTEGER  NOT NULL DEFAULT 0,   -- current spendable balance
total_coins_earned   INTEGER  NOT NULL DEFAULT 0,   -- lifetime earned (never decremented)
total_coins_spent    INTEGER  NOT NULL DEFAULT 0,   -- lifetime spent (never decremented)
```

**Migration (if users table already exists):**
```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS turfing_coins      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_coins_earned INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_coins_spent  INTEGER NOT NULL DEFAULT 0;
```

### 6.2 Column Added to `fields`

The per-turf coin rate is stored directly on the `fields` table (see `VENDOR_FIELD_DETAILS.md`):

```sql
-- Turfing Coins earn rate for this field
coins_per_booking    INTEGER  NOT NULL DEFAULT 50,  -- TC awarded per completed booking
```

**Migration:**
```sql
ALTER TABLE fields
  ADD COLUMN IF NOT EXISTS coins_per_booking INTEGER NOT NULL DEFAULT 50;
```

Admin can override this per field from the admin portal (Fields tab → field detail → Coins Setting). Valid range: 10–500 TC per booking.

### 6.3 New Table: `coin_transactions`

Full audit ledger — one row per coin event. Never delete rows from this table.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Row ID |
| `user_id` | `uuid` | NOT NULL, FK → `users(id)` ON DELETE RESTRICT | The user whose balance changed |
| `booking_id` | `uuid` | nullable, FK → `bookings(id)` ON DELETE SET NULL | The booking that caused this event (null for admin adjustments, streak bonuses, referral rewards) |
| `type` | `text` | NOT NULL, CHECK IN ('earned','spent','refund','expired','bonus','referral_reward','admin_adjustment') | What kind of coin event this is |
| `coins` | `integer` | NOT NULL | Coin delta — **positive** for earned/bonus/refund, **negative** for spent/expired/deduction |
| `balance_after` | `integer` | NOT NULL | Snapshot of `users.turfing_coins` after this transaction was applied. Used for audit reconciliation |
| `description` | `text` | NOT NULL | Human-readable label shown to user and admin. E.g. "Earned 50 TC for booking BK-0041 at Green Turf Arena" |
| `expires_at` | `timestamptz` | nullable | When these specific coins expire (set only on `type = 'earned'` and `'bonus'` rows; null for spent/expired rows) |
| `created_by` | `uuid` | nullable, FK → admin users (future) | Admin ID if `type = 'admin_adjustment'`; null otherwise |
| `created_at` | `timestamptz` | NOT NULL, default `NOW()` | When this event occurred |

#### CREATE Statement

```sql
CREATE TYPE coin_transaction_type AS ENUM (
  'earned',
  'spent',
  'refund',
  'expired',
  'bonus',
  'referral_reward',
  'admin_adjustment'
);

CREATE TABLE coin_transactions (
  id             UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID                   NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  booking_id     UUID                   REFERENCES bookings(id) ON DELETE SET NULL,
  type           coin_transaction_type  NOT NULL,
  coins          INTEGER                NOT NULL,
  balance_after  INTEGER                NOT NULL,
  description    TEXT                   NOT NULL,
  expires_at     TIMESTAMPTZ,
  created_by     UUID,
  created_at     TIMESTAMPTZ            NOT NULL DEFAULT NOW()
);

-- RLS: users can only read their own coin history
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coins_own_rows" ON coin_transactions
  FOR SELECT USING (
    user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
  );
-- INSERT/UPDATE/DELETE only via service role (backend) — no client write policy
```

#### Indexes

```sql
CREATE INDEX idx_coin_txn_user_id    ON coin_transactions(user_id);
CREATE INDEX idx_coin_txn_booking_id ON coin_transactions(booking_id);
CREATE INDEX idx_coin_txn_type       ON coin_transactions(type);
CREATE INDEX idx_coin_txn_created_at ON coin_transactions(created_at DESC);
CREATE INDEX idx_coin_txn_expires_at ON coin_transactions(expires_at) WHERE expires_at IS NOT NULL;
```

---

## 7. Trigger Logic

### 7.1 Award Coins on Booking Completion

Extend the existing `sync_user_booking_stats()` trigger (in `USER_DETAILS.md`) to also handle coins. Alternatively, create a dedicated trigger on `bookings`:

```sql
CREATE OR REPLACE FUNCTION award_booking_coins()
RETURNS TRIGGER AS $$
DECLARE
  field_coins      INTEGER;
  is_first_booking BOOLEAN;
  new_balance      INTEGER;
  referrer_id      UUID;
  referrer_balance INTEGER;
  friend_ref_code  TEXT;
BEGIN
  -- Only fire when status changes TO 'completed'
  IF NOT (NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed')) THEN
    RETURN NEW;
  END IF;

  -- Get coin rate for this field
  SELECT COALESCE(coins_per_booking, 50) INTO field_coins
  FROM fields WHERE id = NEW.field_id;

  -- Check if this is the user's first ever completed booking
  SELECT (completed_bookings = 0) INTO is_first_booking
  FROM users WHERE id = NEW.user_id;

  -- Award booking coins
  UPDATE users
  SET
    turfing_coins      = turfing_coins + field_coins,
    total_coins_earned = total_coins_earned + field_coins
  WHERE id = NEW.user_id
  RETURNING turfing_coins INTO new_balance;

  INSERT INTO coin_transactions (user_id, booking_id, type, coins, balance_after, description, expires_at)
  VALUES (
    NEW.user_id,
    NEW.id,
    'earned',
    field_coins,
    new_balance,
    'Earned ' || field_coins || ' TC for completing booking ' || NEW.booking_ref,
    NOW() + INTERVAL '365 days'
  );

  -- Welcome bonus (first booking only)
  IF is_first_booking THEN
    UPDATE users
    SET
      turfing_coins      = turfing_coins + 100,
      total_coins_earned = total_coins_earned + 100
    WHERE id = NEW.user_id
    RETURNING turfing_coins INTO new_balance;

    INSERT INTO coin_transactions (user_id, booking_id, type, coins, balance_after, description, expires_at)
    VALUES (
      NEW.user_id, NEW.id, 'bonus', 100, new_balance,
      'Welcome bonus — 100 TC for completing your first booking!',
      NOW() + INTERVAL '365 days'
    );
  END IF;

  -- Referral reward: if this is the friend's first booking, credit the referrer
  IF is_first_booking THEN
    SELECT referral_code_used INTO friend_ref_code FROM users WHERE id = NEW.user_id;

    IF friend_ref_code IS NOT NULL THEN
      SELECT id INTO referrer_id FROM users WHERE own_referral_code = friend_ref_code LIMIT 1;

      IF referrer_id IS NOT NULL THEN
        UPDATE users
        SET
          turfing_coins      = turfing_coins + 200,
          total_coins_earned = total_coins_earned + 200
        WHERE id = referrer_id
        RETURNING turfing_coins INTO referrer_balance;

        INSERT INTO coin_transactions (user_id, booking_id, type, coins, balance_after, description, expires_at)
        VALUES (
          referrer_id, NEW.id, 'referral_reward', 200, referrer_balance,
          'Referral reward — your friend completed their first booking!',
          NOW() + INTERVAL '365 days'
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_award_coins
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION award_booking_coins();
```

### 7.2 Refund Coins on Booking Cancellation

```sql
CREATE OR REPLACE FUNCTION refund_booking_coins()
RETURNS TRIGGER AS $$
DECLARE
  spent_coins  INTEGER;
  new_balance  INTEGER;
BEGIN
  -- Only fire when status changes FROM 'upcoming' to 'cancelled'
  IF NOT (NEW.status = 'cancelled' AND OLD.status = 'upcoming') THEN
    RETURN NEW;
  END IF;

  -- Check if coins were spent on this booking (look for a 'spent' transaction)
  SELECT ABS(coins) INTO spent_coins
  FROM coin_transactions
  WHERE booking_id = NEW.id AND type = 'spent'
  LIMIT 1;

  -- No coins were spent on this booking — nothing to refund
  IF spent_coins IS NULL OR spent_coins = 0 THEN
    RETURN NEW;
  END IF;

  -- No-show: do NOT refund coins
  IF NEW.status = 'no-show' THEN
    RETURN NEW;
  END IF;

  -- Refund coins
  UPDATE users
  SET turfing_coins = turfing_coins + spent_coins
  WHERE id = NEW.user_id
  RETURNING turfing_coins INTO new_balance;

  INSERT INTO coin_transactions (user_id, booking_id, type, coins, balance_after, description, expires_at)
  VALUES (
    NEW.user_id, NEW.id, 'refund', spent_coins, new_balance,
    'Coins refunded for cancelled booking ' || NEW.booking_ref,
    NOW() + INTERVAL '365 days'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_refund_coins
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION refund_booking_coins();
```

### 7.3 Nightly Coin Expiry Job (Cron)

This is **not a Postgres trigger** — it runs as a scheduled backend job (Edge Function or server-side cron):

```sql
-- Find all coin batches that have expired and haven't been zeroed out yet.
-- Sum expired coins per user and deduct them.

WITH expired AS (
  SELECT
    user_id,
    SUM(coins) AS expiring_coins
  FROM coin_transactions
  WHERE
    type IN ('earned', 'bonus', 'referral_reward')
    AND expires_at < NOW()
    AND id NOT IN (
      -- Exclude batches already accounted for in an 'expired' row
      SELECT booking_id FROM coin_transactions WHERE type = 'expired' AND booking_id IS NOT NULL
    )
  GROUP BY user_id
)
-- Then for each user: deduct from turfing_coins and insert 'expired' rows
-- (handle this in application logic — the SQL above finds the targets)
```

Recommended implementation: Run as a Supabase Edge Function triggered by `pg_cron` at midnight IST (`0 18 * * *` UTC for IST midnight). The function selects expired batches, deducts from user balances, and inserts audit rows.

---

## 8. Admin Portal Controls

### 8.1 User Detail View — Coins Panel

Add a **Turfing Coins** section to the user detail panel in `/dashboard/users/`:

| UI Element | Data Source | Action |
|---|---|---|
| Current balance | `users.turfing_coins` | Display |
| Lifetime earned | `users.total_coins_earned` | Display |
| Lifetime spent | `users.total_coins_spent` | Display |
| Coin history table | `coin_transactions WHERE user_id = ?` | Paginated list |
| Grant coins (input + reason) | POST to `/admin/coins/grant` | Admin action |
| Deduct coins (input + reason) | POST to `/admin/coins/deduct` | Admin action |

The grant/deduct action calls the backend which:
1. Validates the admin has the right role.
2. Updates `users.turfing_coins`.
3. Inserts a `coin_transactions` row with `type = 'admin_adjustment'`, `created_by = admin_id`, and a description capturing the reason.

### 8.2 Field Detail View — Coins Setting

Add a **Coins Per Booking** field to the field edit form in `/dashboard/fields/`:

```
Coins per Booking: [ 50 ] TC
(Range: 10–500. Users earn this many Turfing Coins when they complete a booking at this field.)
```

Saving this updates `fields.coins_per_booking`. Changes take effect on future bookings only — existing pending bookings use the rate that was set when they were created. To handle this cleanly, denormalize the coin rate into the booking at creation time (store `coins_snapshot` on `bookings`) or simply apply the current rate at completion time (simpler, acceptable drift).

### 8.3 Platform Settings — Coin Economy

In `/dashboard/settings/`, add a **Coins** section:

| Setting | Default | Description |
|---|---|---|
| Coin system enabled | `true` | Master toggle — disabling stops all earning and spending |
| Default coins per booking | `50 TC` | Applied to fields that haven't been customised |
| Conversion rate | `100 TC = ₹10` | Display only — changing this requires a code deploy |
| Max redemption per booking | `500 TC` | Hard cap on coins spent per booking |
| Max redemption as % of booking | `20%` | Percentage-based cap |
| Coin expiry period | `365 days` | Days until a batch of coins expires |
| Welcome bonus | `100 TC` | Coins for first completed booking |
| Referral reward | `200 TC` | Coins credited to referrer |
| Review bonus | `10 TC` | Coins for submitting a post-booking review |
| Monthly streak (3 bookings) | `50 TC` | Monthly bonus tier 1 |
| Monthly streak (5 bookings) | `150 TC` | Monthly bonus tier 2 |

### 8.4 Notifications — Coin Targeting

The Notifications page (`/dashboard/notifications/`) can target users by coin balance:

| Audience Segment | Query |
|---|---|
| High coin holders (500+ TC) | `WHERE turfing_coins >= 500` |
| Coins expiring soon | Join `coin_transactions` where `expires_at BETWEEN NOW() AND NOW() + 30 days` |
| Never earned coins | `WHERE total_coins_earned = 0` |

---

## 9. Flutter Integration Notes

### 9.1 Displaying the Balance

- Read `users.turfing_coins` from the user's own row (RLS allows this).
- Show on the home screen, profile screen, and at checkout.
- Format: `🪙 240 TC` or `240 TC` depending on design.

### 9.2 Redeeming Coins at Checkout

The booking creation payload sent to the backend should include:

```json
{
  "field_id": "...",
  "slot_start": "...",
  "slot_end": "...",
  "payment_method": "upi",
  "coins_to_redeem": 200
}
```

The backend (not Flutter) handles the validation, deduction, and discount calculation. Flutter should never trust its own coin balance calculation for the final amount — always confirm the final charge with the backend before the payment step.

### 9.3 Coin History Screen

Flutter reads from `coin_transactions` with RLS (own rows only):

```sql
SELECT type, coins, balance_after, description, expires_at, created_at
FROM coin_transactions
WHERE user_id = auth.uid()  -- via RLS
ORDER BY created_at DESC
LIMIT 20 OFFSET $page * 20;
```

### 9.4 Coin Expiry Warning

When `coin_transactions` has rows with `expires_at BETWEEN NOW() AND NOW() + 30 days` and `type IN ('earned','bonus','referral_reward')`, Flutter should show a warning banner:

> "You have TC expiring in the next 30 days. Book a turf to use them!"

Pull this data in the coin balance fetch — no separate query needed if you include a `coins_expiring_soon` computed field from the backend.

### 9.5 Checkout Flow

```
User opens booking checkout
  │
  ├── Backend returns: booking_amount, max_redeemable_coins, rupee_value_of_max
  │
  ├── User toggles "Use Turfing Coins" → selects amount (slider or input)
  │
  ├── Backend validates and returns: final_amount_due
  │
  └── User completes payment for final_amount_due via chosen method
        │
        └── On payment success → backend creates booking + deducts coins + logs transaction
```

---

## 10. Edge Cases & Rules

| Scenario | Rule |
|---|---|
| User tries to redeem more coins than balance | Backend rejects with 400 error. Flutter should not allow this in UI. |
| Booking cancelled after partial coin redemption | Redeemed coins are fully refunded to balance. |
| No-show with coins redeemed | Coins are NOT refunded. |
| Admin adjusts coin balance to negative | Backend rejects — balance cannot go below 0. |
| Two bookings completed simultaneously (race condition) | Trigger runs per row; Postgres row-level locking prevents double-credit. |
| User account banned | Coins balance is frozen — cannot earn or spend while banned. Backend enforces this. |
| User account deleted (soft delete) | Coins balance remains in DB for audit purposes. Balance is inaccessible to the user. |
| Field `coins_per_booking` changed after booking made | The new rate applies to future bookings only. Past bookings already earned at the old rate. |
| Coin system master toggle = OFF | Backend rejects all earn/spend operations. Existing balances are preserved. |
| Referral code used but referrer account was deleted | No referral reward issued (referrer lookup returns null). |
| Duplicate review bonus (shouldn't happen) | The UNIQUE constraint on `field_reviews(booking_id)` prevents duplicate reviews. Trigger checks for existing bonus row before awarding. |
| Coins expiry and redemption order (FIFO) | When user spends coins, deduct from the oldest non-expired batches first. Implemented in the spend API endpoint, not via trigger — application logic. |

---

## 11. Fields Table Addition

The following column must be added to the `fields` table (defined in `VENDOR_FIELD_DETAILS.md`):

```sql
-- In the fields CREATE TABLE, under the Pricing section:
coins_per_booking    INTEGER  NOT NULL DEFAULT 50,
  -- Admin-configurable TC awarded to user per completed booking at this field.
  -- Range: 10–500. Default: 50.
  -- Higher values can be set for new or underperforming fields to attract bookings.

-- Migration for existing fields table:
ALTER TABLE fields
  ADD COLUMN IF NOT EXISTS coins_per_booking INTEGER NOT NULL DEFAULT 50;

-- Optional check constraint:
ALTER TABLE fields
  ADD CONSTRAINT fields_coins_range CHECK (coins_per_booking BETWEEN 10 AND 500);
```

**Note for VENDOR_FIELD_DETAILS.md:** Add `coins_per_booking` to the Fields column reference table and CREATE statement under the Pricing section, alongside `price_per_hour` and `peak_price_per_hour`.

---

## 12. Admin Query Reference

```sql
-- 1. User's current coin summary
SELECT
  turfing_coins       AS current_balance,
  total_coins_earned  AS lifetime_earned,
  total_coins_spent   AS lifetime_spent
FROM users
WHERE id = $user_id;

-- 2. User's full coin transaction history
SELECT
  type, coins, balance_after, description,
  expires_at, created_at
FROM coin_transactions
WHERE user_id = $user_id
ORDER BY created_at DESC
LIMIT 20 OFFSET $offset;

-- 3. Coins expiring in the next 30 days for a user
SELECT
  SUM(coins) AS coins_expiring,
  MIN(expires_at) AS earliest_expiry
FROM coin_transactions
WHERE
  user_id = $user_id
  AND type IN ('earned', 'bonus', 'referral_reward')
  AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '30 days';

-- 4. Admin: grant coins to a user
-- (Run via backend service role — not directly in Supabase dashboard for audit trail)
DO $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE users
  SET
    turfing_coins      = turfing_coins + $coins,
    total_coins_earned = total_coins_earned + $coins
  WHERE id = $user_id
  RETURNING turfing_coins INTO new_balance;

  INSERT INTO coin_transactions (user_id, type, coins, balance_after, description, expires_at, created_by)
  VALUES (
    $user_id, 'admin_adjustment', $coins, new_balance,
    $reason,
    NOW() + INTERVAL '365 days',
    $admin_id
  );
END $$;

-- 5. Admin: deduct coins from a user
DO $$
DECLARE
  new_balance INTEGER;
BEGIN
  -- Validate balance won't go negative
  IF (SELECT turfing_coins FROM users WHERE id = $user_id) < $coins THEN
    RAISE EXCEPTION 'Deduction exceeds user balance';
  END IF;

  UPDATE users
  SET turfing_coins = turfing_coins - $coins
  WHERE id = $user_id
  RETURNING turfing_coins INTO new_balance;

  INSERT INTO coin_transactions (user_id, type, coins, balance_after, description, created_by)
  VALUES (
    $user_id, 'admin_adjustment', -$coins, new_balance,
    $reason,
    $admin_id
  );
END $$;

-- 6. Platform-wide coin statistics (for analytics dashboard)
SELECT
  SUM(turfing_coins)      AS total_outstanding_coins,
  SUM(total_coins_earned) AS total_ever_earned,
  SUM(total_coins_spent)  AS total_ever_spent,
  COUNT(*) FILTER (WHERE turfing_coins > 0) AS users_with_balance,
  AVG(turfing_coins) FILTER (WHERE turfing_coins > 0) AS avg_balance_among_holders
FROM users
WHERE deleted_at IS NULL;

-- 7. Top coin earners (leaderboard)
SELECT
  id, display_name, city,
  turfing_coins, total_coins_earned, total_coins_spent
FROM users
WHERE deleted_at IS NULL
ORDER BY total_coins_earned DESC
LIMIT 20;

-- 8. Coins earned by field (which fields drive most coin activity)
SELECT
  f.name AS field_name,
  f.coins_per_booking,
  COUNT(ct.id)   AS times_earned,
  SUM(ct.coins)  AS total_coins_distributed
FROM coin_transactions ct
JOIN bookings b ON ct.booking_id = b.id
JOIN fields   f ON b.field_id = f.id
WHERE ct.type = 'earned'
GROUP BY f.id, f.name, f.coins_per_booking
ORDER BY total_coins_distributed DESC;
```

---

## Summary

| Concept | Short answer |
|---|---|
| What are Turfing Coins? | In-app reward currency, 100 TC = ₹10 |
| How do I earn them? | Complete a booking — earn the field's fixed TC rate (default 50 TC) |
| How do I spend them? | Apply as a discount at checkout — max 500 TC (₹50) or 20% of booking, whichever is lower |
| Do they expire? | Yes — 365 days from when they were earned, FIFO redemption |
| Who controls the earn rate? | Admin sets it per field (`fields.coins_per_booking`) |
| Where is the balance stored? | `users.turfing_coins` column |
| Where is the full history? | `coin_transactions` table, one row per event |
| Can admin adjust manually? | Yes — grant or deduct from the user detail panel |
