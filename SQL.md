-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.audit_logs (
id uuid NOT NULL DEFAULT gen_random_uuid(),
actor_id uuid,
category USER-DEFINED NOT NULL,
event_type USER-DEFINED NOT NULL,
payload jsonb NOT NULL DEFAULT '{}'::jsonb,
ip_address inet,
user_agent text,
created_at timestamp with time zone NOT NULL DEFAULT now(),
actor_role text,
target_type text,
target_id uuid,
status text DEFAULT 'success'::text,
metadata jsonb DEFAULT '{}'::jsonb,
CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.identities(id)
);
CREATE TABLE public.booking_slots (
booking_id uuid NOT NULL,
slot_id uuid NOT NULL,
price_paise integer NOT NULL CHECK (price_paise >= 0),
CONSTRAINT booking_slots_pkey PRIMARY KEY (booking_id, slot_id),
CONSTRAINT booking_slots_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
CONSTRAINT booking_slots_slot_id_fkey FOREIGN KEY (slot_id) REFERENCES public.slots(id)
);
CREATE TABLE public.bookings (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id uuid NOT NULL,
field_id uuid NOT NULL,
total_amount_paise integer NOT NULL CHECK (total_amount_paise >= 0),
discount_amount_paise integer NOT NULL DEFAULT 0 CHECK (discount_amount_paise >= 0),
coupon_id uuid,
status USER-DEFINED NOT NULL DEFAULT 'pending'::booking_status,
booked_at timestamp with time zone NOT NULL DEFAULT now(),
cancelled_at timestamp with time zone,
cancellation_reason text,
CONSTRAINT bookings_pkey PRIMARY KEY (id),
CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
CONSTRAINT bookings_field_id_fkey FOREIGN KEY (field_id) REFERENCES public.fields(id),
CONSTRAINT bookings_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id)
);
CREATE TABLE public.coupon_scopes (
id uuid NOT NULL DEFAULT gen_random_uuid(),
coupon_id uuid NOT NULL,
scope_type USER-DEFINED NOT NULL,
scope_ref_id uuid,
CONSTRAINT coupon_scopes_pkey PRIMARY KEY (id),
CONSTRAINT coupon_scopes_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id)
);
CREATE TABLE public.coupons (
id uuid NOT NULL DEFAULT gen_random_uuid(),
created_by uuid NOT NULL,
code text NOT NULL UNIQUE,
discount_type USER-DEFINED NOT NULL,
discount_value integer NOT NULL CHECK (discount_value > 0),
min_booking_amount integer NOT NULL DEFAULT 0 CHECK (min_booking_amount >= 0),
max_discount_cap integer CHECK (max_discount_cap > 0),
max_uses integer CHECK (max_uses > 0),
uses_count integer NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
valid_from timestamp with time zone NOT NULL,
valid_until timestamp with time zone,
is_active boolean NOT NULL DEFAULT true,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT coupons_pkey PRIMARY KEY (id),
CONSTRAINT coupons_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.identities(id)
);
CREATE TABLE public.field_documents (
id uuid NOT NULL DEFAULT gen_random_uuid(),
field_id uuid NOT NULL UNIQUE,
status USER-DEFINED NOT NULL DEFAULT 'not_started'::kyc_status,
documents jsonb NOT NULL DEFAULT '{}'::jsonb,
reviewer_notes text,
reviewed_by uuid,
reviewed_at timestamp with time zone,
submitted_at timestamp with time zone,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT field_documents_pkey PRIMARY KEY (id),
CONSTRAINT field_documents_field_id_fkey FOREIGN KEY (field_id) REFERENCES public.fields(id),
CONSTRAINT field_documents_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.identities(id)
);
CREATE TABLE public.fields (
id uuid NOT NULL DEFAULT gen_random_uuid(),
vendor_id uuid NOT NULL,
name text NOT NULL,
sports ARRAY NOT NULL DEFAULT '{}'::sport_type[],
amenities ARRAY NOT NULL DEFAULT '{}'::amenity_type[],
capacity integer,
size_format text,
surface_type USER-DEFINED NOT NULL,
address jsonb NOT NULL DEFAULT '{}'::jsonb,
weekday_open time without time zone NOT NULL DEFAULT '06:00:00'::time without time zone,
weekday_close time without time zone NOT NULL DEFAULT '23:00:00'::time without time zone,
weekend_open time without time zone NOT NULL DEFAULT '06:00:00'::time without time zone,
weekend_close time without time zone NOT NULL DEFAULT '23:00:00'::time without time zone,
standard_price_paise integer NOT NULL CHECK (standard_price_paise >= 0),
cancellation_window_hrs integer NOT NULL DEFAULT 24 CHECK (cancellation_window_hrs >= 0),
status USER-DEFINED NOT NULL DEFAULT 'pending'::field_status,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
deleted_at timestamp with time zone,
CONSTRAINT fields_pkey PRIMARY KEY (id),
CONSTRAINT fields_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id)
);
CREATE TABLE public.identities (
id uuid NOT NULL DEFAULT gen_random_uuid(),
status USER-DEFINED NOT NULL DEFAULT 'active'::identity_status,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
whatsapp text,
email text NOT NULL,
CONSTRAINT identities_pkey PRIMARY KEY (id),
CONSTRAINT fk_identities_auth_user FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.identity_roles (
identity_id uuid NOT NULL,
role_id uuid NOT NULL,
assigned_at timestamp with time zone NOT NULL DEFAULT now(),
assigned_by uuid,
CONSTRAINT identity_roles_pkey PRIMARY KEY (identity_id, role_id),
CONSTRAINT identity_roles_identity_id_fkey FOREIGN KEY (identity_id) REFERENCES public.identities(id),
CONSTRAINT identity_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
CONSTRAINT identity_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.identities(id)
);
CREATE TABLE public.notifications (
id uuid NOT NULL DEFAULT gen_random_uuid(),
recipient_id uuid NOT NULL,
title text NOT NULL,
body text NOT NULL,
type USER-DEFINED NOT NULL,
channel USER-DEFINED NOT NULL,
is_inbox boolean NOT NULL DEFAULT false,
read_at timestamp with time zone,
data jsonb NOT NULL DEFAULT '{}'::jsonb,
sent_at timestamp with time zone,
failed_at timestamp with time zone,
failure_reason text,
created_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT notifications_pkey PRIMARY KEY (id),
CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.identities(id)
);
CREATE TABLE public.payments (
id uuid NOT NULL DEFAULT gen_random_uuid(),
booking_id uuid NOT NULL UNIQUE,
amount_paise integer NOT NULL CHECK (amount_paise >= 0),
status USER-DEFINED NOT NULL DEFAULT 'pending'::payment_status,
gateway_name text,
gateway_order_id text,
gateway_payment_id text,
gateway_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
paid_at timestamp with time zone,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT payments_pkey PRIMARY KEY (id),
CONSTRAINT payments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);
CREATE TABLE public.permissions (
id uuid NOT NULL DEFAULT gen_random_uuid(),
resource text NOT NULL,
action text NOT NULL,
description text,
CONSTRAINT permissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.refresh_tokens (
id uuid NOT NULL DEFAULT gen_random_uuid(),
identity_id uuid NOT NULL,
token_hash text NOT NULL,
expires_at timestamp with time zone NOT NULL,
revoked_at timestamp with time zone,
device_info text,
ip_address inet,
created_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id),
CONSTRAINT refresh_tokens_identity_id_fkey FOREIGN KEY (identity_id) REFERENCES public.identities(id)
);
CREATE TABLE public.role_permissions (
role_id uuid NOT NULL,
permission_id uuid NOT NULL,
CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id),
CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id)
);
CREATE TABLE public.roles (
id uuid NOT NULL DEFAULT gen_random_uuid(),
name text NOT NULL UNIQUE,
description text,
is_system boolean NOT NULL DEFAULT false,
created_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.slots (
id uuid NOT NULL DEFAULT gen_random_uuid(),
field_id uuid NOT NULL,
slot_date date NOT NULL,
start_time time without time zone NOT NULL,
end_time time without time zone NOT NULL,
price_paise integer NOT NULL CHECK (price_paise >= 0),
status USER-DEFINED NOT NULL DEFAULT 'available'::slot_status,
block_reason USER-DEFINED,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT slots_pkey PRIMARY KEY (id),
CONSTRAINT slots_field_id_fkey FOREIGN KEY (field_id) REFERENCES public.fields(id)
);
CREATE TABLE public.users (
id uuid NOT NULL DEFAULT gen_random_uuid(),
identity_id uuid NOT NULL UNIQUE,
addresses jsonb NOT NULL DEFAULT '[]'::jsonb,
status USER-DEFINED NOT NULL DEFAULT 'active'::user_status,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
display_name text NOT NULL,
avatar_url text,
date_of_birth date,
gender USER-DEFINED,
city text,
state text,
country text NOT NULL DEFAULT 'India'::text,
preferred_sports ARRAY NOT NULL DEFAULT '{}'::sport_type[],
ban_reason text,
banned_at timestamp with time zone,
banned_by uuid,
source USER-DEFINED NOT NULL DEFAULT 'organic'::acquisition_source,
referral_code_used text,
own_referral_code text UNIQUE,
device_os USER-DEFINED,
app_version text,
push_notifications_enabled boolean NOT NULL DEFAULT true,
onesignal_player_id text,
last_active_at timestamp with time zone,
deleted_at timestamp with time zone,
first_name text,
middle_name text,
last_name text,
CONSTRAINT users_pkey PRIMARY KEY (id),
CONSTRAINT users_identity_id_fkey FOREIGN KEY (identity_id) REFERENCES public.identities(id),
CONSTRAINT users_banned_by_fkey FOREIGN KEY (banned_by) REFERENCES public.identities(id)
);
CREATE TABLE public.vendor_kyc (
id uuid NOT NULL DEFAULT gen_random_uuid(),
vendor_id uuid NOT NULL UNIQUE,
status USER-DEFINED NOT NULL DEFAULT 'not_started'::kyc_status,
documents jsonb NOT NULL DEFAULT '{}'::jsonb,
reviewer_notes text,
reviewed_by uuid,
reviewed_at timestamp with time zone,
submitted_at timestamp with time zone,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT vendor_kyc_pkey PRIMARY KEY (id),
CONSTRAINT vendor_kyc_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id),
CONSTRAINT vendor_kyc_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.identities(id)
);
CREATE TABLE public.vendors (
id uuid NOT NULL DEFAULT gen_random_uuid(),
identity_id uuid NOT NULL UNIQUE,
business_name text NOT NULL,
business_type USER-DEFINED NOT NULL,
owner_full_name text NOT NULL,
address jsonb NOT NULL DEFAULT '{}'::jsonb,
banking_details jsonb NOT NULL DEFAULT '{}'::jsonb,
commission_pct numeric NOT NULL DEFAULT 0,
payout_cycle USER-DEFINED NOT NULL DEFAULT 'monthly'::payout_cycle,
status USER-DEFINED NOT NULL DEFAULT 'pending'::vendor_status,
created_at timestamp with time zone NOT NULL DEFAULT now(),
updated_at timestamp with time zone NOT NULL DEFAULT now(),
deleted_at timestamp with time zone,
CONSTRAINT vendors_pkey PRIMARY KEY (id),
CONSTRAINT vendors_identity_id_fkey FOREIGN KEY (identity_id) REFERENCES public.identities(id)
);
CREATE TABLE public.waitlist (
uuid uuid NOT NULL DEFAULT gen_random_uuid(),
email text NOT NULL UNIQUE,
name text,
phone_number text,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT waitlist_pkey PRIMARY KEY (uuid, email)
);
