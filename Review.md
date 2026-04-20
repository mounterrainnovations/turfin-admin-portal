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

## P0: Misleading Or Non-Operational Admin Surfaces

### 1. Several top-level admin pages are still demo-mode / local-state-only, but they present themselves as live admin tools
Priority: P0

Why it matters:
- Operators can make decisions from fabricated data.
- The UI looks production-ready, but the behavior is not connected to backend state.

Affected areas:
- `app/dashboard/page.tsx:10-79`
  - Dashboard home is entirely seeded with static stats, alerts, KYC lists, chat messages, and turf status.
- `app/dashboard/analytics/page.tsx:10-120`
  - Analytics charts and metrics are hardcoded in the `DATA` object.
- `app/dashboard/bookings/page.tsx:27-120`
  - Bookings page is fully driven by a local `bookings` array and hardcoded email templates.
- `app/dashboard/app-management/page.tsx:42-67`
  - App configs and release history are seeded in `INIT_APPS` and `INIT_HISTORY`.
- `app/dashboard/settings/page.tsx:46-77`
  - Settings page is initialized from local `DEFAULTS`.
- `features/communications/components/notifications-view.tsx:15-19`
  - Notifications history is initialized from local constants and managed only in component state.

Recommendation:
- Mark these pages explicitly as mock/demo until connected, or wire them to backend APIs before treating them as production admin surfaces.

### 2. Field schedule management is simulated, not real
Priority: P0

Why it matters:
- This is especially risky because it looks actionable. An admin could believe they are viewing or managing actual slot occupancy.

Evidence:
- `app/dashboard/fields/page.tsx:201-216`
  - Uses a hardcoded `TODAY = new Date(2026, 2, 21)` and a synthetic `getMockBookedSlots(...)`.
- `app/dashboard/fields/page.tsx:277-318`
  - Schedule state derives from mock slot generation and local blocked-slot state.
- `app/dashboard/fields/page.tsx:760-953`
  - Schedule tab, occupancy summary, and pricing note are all based on simulated values.

Recommendation:
- Either remove/flag the schedule controls until backed by real slot data, or connect them to the slot/availability APIs.

### 3. Audit logging has a split-brain implementation
Priority: P0

Why it matters:
- The portal has one audit UI backed by the backend API and a separate in-memory audit context used by other pages. That creates inconsistent audit history depending on where the action originated.

Evidence:
- `app/dashboard/audit/page.tsx:10-18`
  - Audit page loads from `listAuditLogs`.
- `app/dashboard/audit-log-context.tsx:52-120`
  - Audit context is seeded with local sample entries.
- `app/dashboard/audit-log-context.tsx:219-236`
  - `log(...)` only appends to in-memory React state.
- `app/dashboard/app-management/page.tsx:92-116`
  - App management uses `useAuditLog()` rather than a backend write path.

Recommendation:
- Consolidate on one backend-backed audit pipeline. Local context should not be the system of record.

## P1: Functional Bugs Or Clear Product Gaps

### 4. Turf KYC “Request Resubmit” button is a no-op
Priority: P1

Why it matters:
- The button is visible and styled as active, but it performs nothing.

Evidence:
- `features/turfs/components/TurfKycUpload.tsx:522-527`
  - `onClick={() => {}} // Could add resubmit logic if API supports it`

Recommendation:
- Either implement the action or disable/hide the button until supported.

### 5. Settings “Save” does not persist anything
Priority: P1

Why it matters:
- The user sees a save workflow, but nothing is written anywhere.

Evidence:
- `app/dashboard/settings/page.tsx:140-157`
  - `handleSave()` only sets local `saved` state and clears `dirty`.

Recommendation:
- Treat this as a scope gap if intentional, but document it clearly in the UI until persistence exists.

### 6. Notifications compose/history is local-only and uses simulated sending
Priority: P1

Why it matters:
- The UI strongly implies production push operations, but it is just a local state demo.

Evidence:
- `features/communications/components/notifications-view.tsx:15-32`
  - History is initialized from `INIT_HISTORY`.
- `features/communications/components/notifications-view.tsx:67-90`
  - `handleSend()` uses `setTimeout(...)` and inserts a local record.

Recommendation:
- Either integrate a real send API/history API, or mark the module as mock.

### 7. App Management actions are local-only, despite looking operational
Priority: P1

Why it matters:
- Release controls, force-update toggles, min version changes, and notifications all mutate local state only.

Evidence:
- `app/dashboard/app-management/page.tsx:42-67`
  - Initial app state/history are seeded.
- `app/dashboard/app-management/page.tsx:115-155`
  - Force update and min-version actions mutate local state and local history.
- `app/dashboard/app-management/page.tsx:560-569`
  - The page itself admits integration is still needed for FCM broadcast.

Recommendation:
- Same as above: either integrate or explicitly present as a mock console.

## P2: Correctness / Stability Risks

### 8. Lint baseline is failing badly, which masks real regressions
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

### 9. Authentication state is derived asynchronously in effects, creating avoidable blank/flicker behavior
Priority: P2

Why it matters:
- Auth state is available synchronously from storage, but the app waits for an effect and renders `null` in the meantime.

Evidence:
- `features/auth/components/auth-guard.tsx:8-20`
  - `isAuthorized` starts `false`, then is set inside `useEffect`.
- `features/auth/hooks.ts:8-17`
  - Session is loaded in `useEffect` and then copied into state.

Recommendation:
- Derive initial auth/session synchronously from `getAdminSession()` instead of effect-driven bootstrapping.

### 10. Multiple pages are anchored to hardcoded calendar dates
Priority: P2

Why it matters:
- This causes stale UI and misleading date logic in anything date-sensitive.

Evidence:
- `app/dashboard/layout.tsx:89`
  - Top bar shows `Saturday, March 21, 2026`.
- `app/dashboard/fields/page.tsx:201`
  - Hardcoded `TODAY`.
- `app/dashboard/bookings/page.tsx:235`
  - Hardcoded `today`.

Recommendation:
- Replace with actual current date or backend-provided date context.

### 11. Hook dependency issues can produce stale closures / stale selected entities
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

### 12. API normalization logic is duplicated across user, vendor, and turf modules
Priority: P3

Why it matters:
- The same `handleResponse`, `isRecord`, `extractItems`, and `extractTotal` patterns are duplicated. This increases maintenance cost and inconsistency risk.

Evidence:
- `features/users/api.ts:9-51`
- `features/vendors/api.ts:11-76`
- `features/turfs/api.ts:11-53`

Recommendation:
- Extract shared API helpers into one typed utility module.

### 13. Vendor and turf KYC modals still duplicate a large amount of state and upload logic
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

### 14. Very large page components should be broken down further
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

### 15. Dead code and obsolete helper paths are accumulating
Priority: P3

Why it matters:
- Dead code increases review noise and confuses future maintainers.

Evidence:
- `app/dashboard/fields/page.tsx:1394-1497`
  - Several KYC helper functions are defined but unused after the shared `TurfKycUpload` flow took over.
- Many unused imports and state variables are reported by lint across dashboard pages.

Recommendation:
- Do a cleanup pass after each feature migration instead of leaving legacy helpers in place.

### 16. `any` usage is widespread in exactly the areas where the app translates backend data
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

### 17. Accessibility and lint-purity issues remain in KYC/media flows
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

### 18. Toast/audit IDs still rely on ad hoc ID generation
Priority: P4

Why it matters:
- Not a production blocker, but local ID generation is inconsistent across modules.

Evidence:
- `features/toast/toast-context.tsx:72-83`
  - Uses `crypto.randomUUID()` fallback to `Date.now()` + `Math.random()`.
- `app/dashboard/audit-log-context.tsx:223-230`
  - Uses `Date.now()` and `Math.random()` for in-memory audit records.

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

1. Decide product intent for demo/local-state pages:
   - Dashboard
   - Analytics
   - Bookings
   - Notifications
   - App Management
   - Settings
2. Fix the clearly broken visible behavior:
   - Turf KYC resubmit no-op
   - hardcoded dates
   - audit split-brain
3. Restore lint health enough to make CI meaningful.
4. Refactor duplicated API/KYC logic.

## Notes

This is a best-effort static review. I did not run a live backend-connected QA pass, so there may be additional runtime discrepancies that only appear with real API payloads, auth expiry, or production data volumes.
