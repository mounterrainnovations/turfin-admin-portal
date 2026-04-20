# Admin Portal Review

Date: 2026-04-21

Scope:
- Static code review across the admin portal front end
- `npm run build`
- `npm run lint`

Summary:
- `npm run build` passes.
- `npm run lint` fails with `196` findings (`111` errors, `85` warnings).
- The codebase is split between real API-backed admin surfaces and several demo/local-state-only surfaces. That is the single biggest product discrepancy in the current portal.

## Scope Notes

The following are intentionally mock / work-in-progress and should not be treated as findings for now:
- Dashboard home
- Analytics page
- Bookings page
- App Management page
- Settings persistence
- Notifications compose/history
- Field schedule / field analytics

The remaining findings below exclude those intentional mock surfaces where applicable.

## P2: Correctness / Stability Risks
### 1. Audit logging had a split-brain implementation; the front-end side has been reduced, but backend audit writes are still missing
Priority: P2

Why it matters:
- The audit page reads real backend audit data, but the portal still has no backend-backed audit write function in this repo.
- The previous in-memory seeded audit history has been removed from the front-end context, which avoids a fake second source of truth, but audit events triggered in the UI still are not persisted to the backend from this codebase.

Evidence:
- `app/dashboard/audit/page.tsx:10-18`
  - Audit page loads from `listAuditLogs`.
- `features/audit/api.ts:284-359`
  - Audit API currently exposes read/export only.
- `app/dashboard/audit-log-context.tsx`
  - Front-end context is now a thin logger stub rather than a seeded in-memory audit store.
- `app/dashboard/app-management/page.tsx:92-116`
  - App management uses `useAuditLog()` rather than a backend write path.

Recommendation:
- Add a real backend write endpoint and front-end client for audit events.

## P2: Correctness / Stability Risks

### 2. Lint baseline is failing badly, which masks real regressions
Priority: P2

Why it matters:
- With `111` lint errors, the team loses signal. New correctness issues can slip in unnoticed because the baseline is already red.

Examples:
- `app/dashboard/analytics/page.tsx:238`
  - React immutability rule violation in render (`cum += d.value`).
- `app/dashboard/app-management/page.tsx:142`
  - React purity rule flags `Date.now()` usage in component code path.
- `features/auth/components/auth-guard.tsx:16`
  - `setState` inside effect flagged by `react-hooks/set-state-in-effect`.
- `features/auth/hooks.ts:15`
  - Same pattern in auth hook.
- `app/dashboard/vendors/page.tsx`, `app/dashboard/fields/page.tsx`, `features/vendors/api.ts`, `features/turfs/api.ts`, `features/users/api.ts`
  - Heavy `any` usage and multiple hook warnings.

Recommendation:
- Establish a staged lint cleanup plan:
  1. React purity / hook correctness
  2. `any` and API typing
  3. dead code and unused imports

### 3. Authentication state was derived asynchronously in effects
Priority: P2

Status:
- Fixed in this pass.

What changed:
- Auth/session now bootstrap synchronously from `getAdminSession()` instead of waiting for effects.

### 4. Multiple pages are anchored to hardcoded calendar dates
Priority: P2

Why it matters:
- This causes stale UI and misleading date logic in anything date-sensitive.

Evidence:
- `app/dashboard/layout.tsx:89`
  - Top bar shows `Saturday, March 21, 2026`.
- `app/dashboard/bookings/page.tsx:235`
  - Hardcoded `today`.

Notes:
- `app/dashboard/fields/page.tsx` still contains hardcoded schedule dates internally, but the non-working tabs are now intentionally unclickable.

Recommendation:
- Replace with actual current date or backend-provided date context.

### 5. Hook dependency issues can produce stale closures / stale selected entities
Priority: P2

Why it matters:
- These are not always immediate bugs, but they are classic sources of “works after refresh” behavior.

Evidence:
- `app/dashboard/vendors/page.tsx:282-286`
  - Effect depends on `vendors` but reads `selectedVendor`.
- `app/dashboard/users/page.tsx:623-625`
  - Effect calls `fetchUsers()` but excludes it from dependencies.
- `app/dashboard/fields/page.tsx:1623-1629`
  - Effect reads `selected` but excludes it.
- `app/dashboard/fields/page.tsx:1681-1687`
  - Effect calls `refreshData()` but excludes it.

Recommendation:
- Stabilize callbacks with `useCallback` where needed and satisfy exhaustive-deps instead of suppressing drift by omission.

## P3: Code Quality / Refactor Debt

### 6. API normalization logic is duplicated across user, vendor, and turf modules
Priority: P3

Why it matters:
- The same `handleResponse`, `isRecord`, `extractItems`, and `extractTotal` patterns are duplicated. This increases maintenance cost and inconsistency risk.

Evidence:
- `features/users/api.ts:9-51`
- `features/vendors/api.ts:11-76`
- `features/turfs/api.ts:11-53`

Recommendation:
- Extract shared API helpers into one typed utility module.

### 7. Vendor and turf KYC modals still duplicate a large amount of state and upload logic
Priority: P3

Why it matters:
- The two KYC review components drift independently. This has already caused UI/state mismatch bugs.

Evidence:
- `features/vendors/components/VendorKycUpload.tsx`
- `features/turfs/components/TurfKycUpload.tsx`

Recommendation:
- Extract shared KYC review primitives:
  - document status mapping
  - signed view logic
  - upload/update flow
  - common footer action handling

### 8. Very large page components should be broken down further
Priority: P3

Why it matters:
- The large monolithic pages make future regressions more likely and reviews harder.

Main hotspots:
- `app/dashboard/vendors/page.tsx`
- `app/dashboard/fields/page.tsx`
- `app/dashboard/users/page.tsx`
- `app/dashboard/bookings/page.tsx`

Recommendation:
- Split by feature area:
  - filters/search header
  - table
  - side panel
  - KYC modal
  - onboard/edit flows

### 9. Dead code and obsolete helper paths are accumulating
Priority: P3

Why it matters:
- Dead code increases review noise and confuses future maintainers.

Evidence:
- `app/dashboard/fields/page.tsx:1394-1497`
  - Several KYC helper functions are defined but unused after the shared `TurfKycUpload` flow took over.
- `features/turfs/components/TurfKycUpload.tsx`
  - Resubmit UI has been removed in this pass, but there is still surrounding dead/unused surface area flagged by lint.
- Many unused imports and state variables are reported by lint across dashboard pages.

Recommendation:
- Do a cleanup pass after each feature migration instead of leaving legacy helpers in place.

### 10. `any` usage is widespread in exactly the areas where the app translates backend data
Priority: P3

Why it matters:
- These are the places where schema drift hurts the most: KYC documents, API normalization, admin tables, and edit forms.

High-density areas:
- `app/dashboard/vendors/page.tsx`
- `app/dashboard/fields/page.tsx`
- `features/vendors/api.ts`
- `features/turfs/api.ts`
- `features/users/api.ts`
- `features/vendors/components/VendorKycUpload.tsx`
- `features/turfs/components/TurfKycUpload.tsx`

Recommendation:
- Introduce typed response-normalization helpers and stop using `Record<string, any>` / `as any` in stateful admin flows.

## P4: Low-Severity Issues / Polish

### 11. Accessibility and lint-purity issues remain in KYC/media flows
Priority: P4

Evidence:
- `features/turfs/components/TurfKycUpload.tsx:399`
  - Image elements are missing `alt`.
- `features/turfs/components/TurfKycUpload.tsx:375`
  - Unescaped apostrophe in JSX.
- `features/vendors/components/VendorKycUpload.tsx:347`
  - Unescaped apostrophe in JSX.

Recommendation:
- Clean these up during the lint pass; low cost, improves baseline quality.

### 12. Toast IDs still rely on ad hoc ID generation
Priority: P4

Why it matters:
- Not a production blocker, but local ID generation is inconsistent across modules.

Evidence:
- `features/toast/toast-context.tsx:72-83`
  - Uses `crypto.randomUUID()` fallback to `Date.now()` + `Math.random()`.

Recommendation:
- Standardize on one UUID utility if these IDs survive outside component memory.

## Refactor Backlog

These are not immediate bugs, but they will reduce future breakage:

1. Extract shared API response parsing and pagination helpers.
2. Extract shared KYC review/upload abstractions for vendor and turf.
3. Split giant dashboard pages into page shell + feature components.
4. Replace effect-driven auth initialization with synchronous storage bootstrapping.
5. Decide which pages are production-backed vs demo-backed, then either connect or explicitly label them.

## Suggested Fix Order

1. Add a real backend audit write endpoint/client.
2. Restore lint health enough to make CI meaningful.
3. Replace remaining hardcoded date displays where the surface is intended to be live.
4. Refactor duplicated API/KYC logic.

## Notes

This is a best-effort static review. I did not run a live backend-connected QA pass, so there may be additional runtime discrepancies that only appear with real API payloads, auth expiry, or production data volumes.
