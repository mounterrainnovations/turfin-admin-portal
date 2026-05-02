# Admin Portal Slot Frontend Integration Plan

## Objective

Integrate the backend slot module into `turfin-admin-portal` so the admin can fully manage field slots from the existing Fields experience without changing the current UI language, layout style, spacing, or interaction model more than necessary.

This plan is intentionally field-centric because the admin portal already treats slot operations as part of field operations:

- admin onboards vendors
- admin creates and edits fields
- admin attaches fields to vendors
- admin should also manage slot configuration, slot generation, slot blocking, maintenance, and per-slot price override for those fields

This plan is for implementation only. No UI redesign is intended.

---

## Non-Negotiable UI Rule

Follow `turfin-admin-portal/Gemini.md`.

That means:

- preserve the current Fields page layout
- preserve the current field detail drawer structure
- preserve the current edit modal visual style
- preserve existing Tailwind classes unless an integration change requires a zero-visual-impact adjustment
- New UI components and elements and sections CAN be made but they must respect existing design and definitely not break existing systems, design and integration
- If new UI elements are required, they must look like they already belong to the current Fields page.
- When updating mocks/mock design, you can follow best practices to make scalable components but you must not break existing design and integration

---

## Current Frontend State

### Existing surfaces already relevant to slots

The current admin portal already has the right UX surfaces:

1. `app/dashboard/fields/page.tsx`
   - contains the field listing
   - opens the field detail panel
   - contains the existing `Schedule` tab UI
   - contains the `Edit Field Details` modal
   - contains the current `Pricing & Schedule` form section

2. Existing field detail schedule UI
   - date navigator with mini calendar
   - grid of time slots
   - quick actions:
     - Block All
     - Block Peak
     - Unblock All
   - summary cards:
     - booked
     - blocked
     - available
     - booked %
   - pricing note / pricing tier visual

3. Existing field edit modal
   - standard price
   - weekday open / close
   - weekend open / close

### What is currently mock / not integrated

The current `Schedule` tab is still prototype logic:

- fixed `TOTAL_SLOTS = 17`
- hardcoded `TODAY`
- mock booked slots via `getMockBookedSlots(...)`
- local `blockedMap`
- no real slot config fetch/save
- no real slot generation
- no real admin slot patching
- no real awareness of slot duration, booking window, generation window, or hold duration

### Existing frontend integration layer status

`features/turfs/api.ts` currently supports:

- turf listing
- turf detail
- turf create/update
- turf status
- turf KYC docs/review
- turf reviews
- ban/unban

It does **not** yet support slot admin APIs.

`features/turfs/types.ts` currently contains turf types only and has no slot config / slot response models.

### Important stale reference

`docs/VENDOR_FIELD_DETAILS.md` is no longer the source of truth for slots. It still references legacy `field_slots` style thinking. The actual backend slot system is now config-driven and inventory-based. Frontend integration must follow the backend code and DTOs, not that old doc.

---

## Backend Source Of Truth

Use the real admin slot APIs that already exist in backend:

### Admin slot APIs

- `GET /admin/turfs/:turfId/slots?date=YYYY-MM-DD`
- `PUT /admin/turfs/:turfId/slot-config`
- `POST /admin/turfs/:turfId/slots/generate`
- `PATCH /admin/slots/:slotId`

### Backend DTO shape to integrate against

#### `GET /admin/turfs/:turfId/slots?date=...`

Returns `AdminSlotResponseDto[]`:

- `slotId`
- `slotIndex`
- `slotDate`
- `startTime`
- `endTime`
- `pricePaise`
- `availability`
- `status`
- `blockReason`
- `holdExpiresAt`
- `isPriceOverridden`
- `configVersion`
- `heldByBookingId`
- `generatedAt`

#### `PUT /admin/turfs/:turfId/slot-config`

Body: `UpsertSlotConfigDto`

- `slotDurationMins`
- `weekdayOpen`
- `weekdayClose`
- `weekendOpen`
- `weekendClose`
- `bookingWindowDays`
- `generationWindowDays`
- `holdDurationMinutes`
- `weeklyPricing`

`weeklyPricing` is an array of 7 entries:

- `dayOfWeek`
- `prices[]`

`prices[]` must match the number of slots generated for that day type.

#### `POST /admin/turfs/:turfId/slots/generate`

Returns:

- `message`
- `inserted`

#### `PATCH /admin/slots/:slotId`

Body: `AdminSlotPatchDto`

Supports:

- `status: "blocked" | "maintenance" | "available"`
- `blockReason`
- `pricePaise`

### Backend constants to respect

Do not hardcode these in JSX. Mirror or centralize them in frontend constants:

- default booking window: `7`
- default generation window: `30`
- default hold duration: `10`
- min slot duration: `30`
- max slot duration: `120`
- slot duration step: `15`

---

## Recommended Frontend Architecture

## Guiding decision

Keep slot integration field-scoped in the UI, but do **not** keep slot logic embedded as mock logic inside `app/dashboard/fields/page.tsx`.

Use the smallest architecture change that removes hardcoding while preserving the rendered UI.

## Recommended structure

Add a dedicated slot integration layer while keeping the Fields page as the consumer.

### Add new slot feature module

Recommended new files:

- `features/slots/api.ts`
- `features/slots/types.ts`
- `features/slots/constants.ts`
- `features/slots/adapters.ts`

Optional if implementation gets large:

- `features/slots/utils.ts`
- `features/slots/hooks/useAdminFieldSlots.ts`
- `features/slots/hooks/useSlotConfigForm.ts`

### Why a separate `features/slots` module is better

- avoids turning `features/turfs/api.ts` into a mixed field + slot transport file
- keeps slot DTOs and adapters isolated
- allows reuse later in vendor portal if admin portal patterns are copied
- lets `app/dashboard/fields/page.tsx` stay mostly UI-focused

### What must remain in the page

The page should keep:

- layout
- tabs
- cards
- buttons
- modal rendering
- visual slot grid
- existing schedule interaction model

The page should lose:

- mock slot generation logic
- fake booked slot logic
- fake blocked state logic
- hardcoded slot count assumptions

---

## UI Integration Strategy

## Primary integration surface

Use the existing `Schedule` tab inside the field detail panel as the main operational slot management surface.

This is the correct place for:

- viewing a date’s slots
- seeing booked / blocked / available status
- blocking a slot
- unblocking a slot
- marking maintenance
- applying price override
- running slot generation for the field

## Secondary integration surface

Use the existing `Pricing & Schedule` tab inside the Edit Field Details modal for field-level schedule defaults only if it remains visually identical.

Recommended split:

1. Keep base field attributes in Edit modal:
   - standard price
   - weekday open / close
   - weekend open / close

2. Move advanced slot config ownership into the field detail `Schedule` tab:
   - slot duration
   - booking window days
   - generation window days
   - hold duration
   - weekly per-slot pricing grid

### Why this split is better

- the edit modal is already dense
- weekly pricing is operationally part of schedule management, not generic field metadata
- the schedule tab already feels like the place where an admin expects slot behavior

## Final UI recommendation

Do **not** create a brand-new top-level dashboard page for slots.

Instead:

- keep slot operations inside the field detail panel
- add a config subsection/card at the top of the existing `Schedule` tab
- keep the current grid, date nav, and summary sections underneath

This yields the cleanest testing flow and stays true to the current admin mental model.

---

## Exact UI Changes Recommended

These are additive changes only and must use the same visual language already present in `fields/page.tsx`.

## 1. Enable the `Schedule` tab for real usage

Right now the tab still behaves as prototype logic. It should become live.

Behavior:

- when the admin opens a field detail panel and clicks `Schedule`
  - fetch slot config state if available
  - fetch slots for selected date
- render current UI immediately with loading states inserted carefully without layout shift

## 2. Add a top `Slot Configuration` card in the Schedule tab

Use the same card styling already used in the drawer.

Recommended content:

- slot duration
- booking window
- generation window
- hold duration
- weekday open-close
- weekend open-close
- config version
- last updated timestamp

Actions:

- `Save Config`
- `Generate Slots`

This card should not feel like a redesign. It should look like another native section inside the Schedule tab.

## 3. Add a collapsible or segmented `Weekly Pricing` editor

This is required because backend config needs `weeklyPricing`.

Recommended presentation:

- keep the same form/input style as current edit modal inputs
- day chips or day headers for Sun to Sat
- per-day slot rows generated from:
  - selected slot duration
  - weekday/weekend timings
- each row shows:
  - slot time range
  - editable price field in rupees

Important:

- no backend call should be made until pricing grid is complete and valid
- generate the grid client-side from config inputs
- translate rupees to paise in API layer, not JSX

## 4. Keep the existing slot grid, but bind it to real slot inventory

Replace the current mock schedule grid logic with real `AdminSlotResponseDto[]`.

Visual mapping:

- `booked` => same booked styling
- `blocked` => same blocked styling
- `maintenance` => visually distinct but same design language
  - use blue-toned variant consistent with maintenance status styling already used in portal
- `held` => render as unavailable for admin but ideally with a subtle distinction if possible without redesign
- `available` => same available styling

Do not invent a radically new legend. Extend the current legend minimally if maintenance / held need explicit representation.

## 5. Add per-slot action affordances without changing layout drastically

Current UX assumes clicking a slot toggles blocked state. With real backend, admin needs slightly richer control.

Recommended interaction:

- single click on available slot => block with default reason flow
- single click on blocked slot => unblock
- small contextual affordance or inline action row for:
  - mark maintenance
  - clear maintenance
  - override price
  - clear price override

Best fit with minimal UI change:

- keep slot tile click behavior for block/unblock
- open a small side action sheet / compact modal only when price override or maintenance action is needed

Do not overload single-click to do too much.

## 6. Keep quick actions, but connect them properly

Existing quick actions:

- Block All
- Block Peak
- Unblock All

Recommended backend behavior:

- these become batched frontend flows that iterate over fetched available slots and call `PATCH /admin/slots/:slotId`
- no new backend bulk API is required for initial integration

Important note:

This is acceptable for now because the slot inventory per day is bounded. If performance later becomes an issue, add a bulk admin slot mutation API separately.

## 7. Keep the day summary, but derive it from backend states

Summary should be computed from fetched slot rows:

- booked count
- blocked count
- available count
- booked percentage
- optionally maintenance count if surfaced in legend

No more `TOTAL_SLOTS` hardcoding.

## 8. Replace the current pricing note with live pricing insight

The current pricing note is partially fake.

Recommended behavior:

- standard pricing line should use slot-config day prices or the field’s standard price fallback where appropriate
- peak pricing line should be inferred from configured evening slots if such slots differ

If pricing insight becomes too brittle, keep the visual section but simplify copy to “Configured Slot Pricing” and show:

- min slot price
- max slot price
- overridden slot count for selected date

That is safer than inventing fake “standard vs peak” tiers if the weekly grid does not map neatly to that language.

---

## Data Model Required In Frontend

Add frontend types that mirror backend contracts closely.

## `features/slots/types.ts`

Include:

- `AdminSlot`
- `SlotConfig`
- `UpsertSlotConfigPayload`
- `AdminSlotPatchPayload`
- `SlotStatus`
- `BlockReason`
- `WeeklyPricingDay`
- `SlotGridRowViewModel`

### Recommended frontend type notes

- keep transport types close to backend response names
- add separate UI view-model types only where formatting is needed
- do not use `any` for slot state

### Recommended enum-like unions

For slot status:

- `available`
- `booked`
- `blocked`
- `maintenance`
- `held`

For block reason:

- `maintenance`
- `private_event`
- `weather`
- `vendor_hold`
- `other`

If backend enum file exposes additional values later, frontend unions must track them centrally.

---

## API Layer Required

## `features/slots/api.ts`

Add:

- `getAdminSlots(turfId: string, date: string)`
- `upsertAdminSlotConfig(turfId: string, payload: UpsertSlotConfigPayload)`
- `generateAdminSlots(turfId: string)`
- `patchAdminSlot(slotId: string, payload: AdminSlotPatchPayload)`

### API rules

- use the existing `authenticatedFetch`
- use the same `getApiUrl()` pattern as `features/turfs/api.ts`
- reuse the same `handleResponse(...)` approach
- keep response normalization in adapters, not in the page

## `features/slots/adapters.ts`

Use adapters to:

- convert paise to rupee display values only for UI
- compute `isBlocked`, `isBooked`, `isMaintenance`, `isHeld`
- map backend slot rows to UI grid tiles
- build weekly pricing payloads from form state
- derive summary counts

This is where backend truth should be translated to the current UI contract.

---

## State Management Plan

Do not introduce a global state library for this.

Local component state is enough if organized cleanly.

## Recommended state ownership

### In field detail panel

Own:

- `scheduleDate`
- `slotConfig`
- `slotConfigDraft`
- `slotsForSelectedDate`
- loading flags
- mutation flags
- transient modal state for maintenance / price override

### Suggested loading flags

- `slotsLoading`
- `slotConfigLoading`
- `slotConfigSaving`
- `slotGenerationRunning`
- `slotPatchLoadingById`

### Suggested dirty state flags

- `isConfigDirty`
- `hasLoadedScheduleForField`

Do not let slot config state leak into unrelated field list state.

---

## Detailed Interaction Flows

## Flow 1: Open field and inspect schedule

1. Admin opens field detail panel.
2. Admin switches to `Schedule`.
3. Frontend fetches selected date slots.
4. Frontend fetches or hydrates slot config.
5. If no slot config exists yet:
   - show same styled empty/config-required state
   - render config form
   - disable slot grid actions until config is saved and slots are generated

## Flow 2: Save slot config

1. Admin edits config card.
2. Frontend validates:
   - slot duration within allowed range
   - multiple of 15
   - open time < close time
   - weekday pricing length matches computed weekday slot count
   - weekend pricing length matches computed weekend slot count
   - all 7 pricing arrays present
3. Submit `PUT /admin/turfs/:turfId/slot-config`.
4. On success:
   - update config state
   - show success toast
   - prompt or auto-trigger slot generation depending on implementation decision

### Recommended decision

Auto-prompt, not silent auto-generate.

Better UX:

- after config save, show success toast
- highlight `Generate Slots`
- optionally ask “Config saved. Generate slots now?”

This is safer operationally and clearer for testing.

## Flow 3: Generate slots

1. Admin clicks `Generate Slots`.
2. Frontend calls `POST /admin/turfs/:turfId/slots/generate`.
3. On success:
   - toast with inserted count
   - refetch selected date slots
   - optionally prefetch today / selected date only

## Flow 4: Block / unblock a slot

1. Admin clicks a tile.
2. If slot is `available`:
   - patch with `status: "blocked"`
   - send default `blockReason: "other"` unless admin explicitly chooses another reason
3. If slot is `blocked`:
   - patch with `status: "available"`
4. Refetch or optimistically update local row.

### Recommendation

Use optimistic update only after initial version works reliably. First implementation can safely refetch the date after mutation.

## Flow 5: Mark maintenance

1. Admin opens slot actions for a row/tile.
2. Choose `Mark Maintenance`.
3. PATCH with:
   - `status: "maintenance"`
   - optional `blockReason: "maintenance"`
4. Refresh selected date.

## Flow 6: Override slot price

1. Admin opens price override action for a slot.
2. Enter rupee amount.
3. Frontend converts to paise.
4. PATCH with `pricePaise`.
5. Refresh selected date.

## Flow 7: Quick actions

### Block All

- identify all `available` slots for selected date
- patch each to blocked
- after all settle, refetch

### Block Peak

- identify all selected-date slots whose start time is `>= 17:00`
- patch each to blocked
- refetch

### Unblock All

- identify all `blocked` slots for selected date
- patch each to available
- refetch

---

## How To Handle The Existing Edit Modal

The current edit modal already edits:

- `standardPricePaise`
- `weekdayOpen`
- `weekdayClose`
- `weekendOpen`
- `weekendClose`

This now overlaps conceptually with slot config.

## Recommended rule

Treat field-level timing and base price as field metadata, but treat slot config as authoritative for slot operations.

### Implementation guidance

1. Keep the edit modal for field metadata because it already exists.
2. When opening Schedule tab:
   - initialize config defaults from current field values only if no slot config exists yet
3. Once slot config exists:
   - schedule behavior should follow slot config, not raw turf timing fields
4. If the edit modal later changes base timings:
   - do not silently mutate slot config
   - instead surface a soft warning in Schedule tab that config may differ from field timings

### Better long-term option

Eventually, slot config should probably become the single operational source of truth for timings. But for current integration, do not force a redesign or cross-module rewrite. Keep the distinction explicit.

---

## Validation Rules

Frontend must validate before hitting backend.

## Config validation

- `slotDurationMins`
  - required
  - integer
  - between 30 and 120
  - multiple of 15

- open/close times
  - required
  - `HH:MM`
  - open must be before close

- windows
  - booking window >= 1
  - generation window >= 1
  - hold duration >= 1

- weekly pricing
  - must contain exactly 7 day entries
  - each day must have prices for every computed slot
  - every price must be >= 0

## Slot mutation validation

- block requires a valid reason if reason selection is exposed
- price override requires numeric non-negative rupee input
- do not allow patch interaction while slot is already being mutated

---

## Error Handling

Use the same toast / inline messaging approach already used in the portal.

## Required error cases

- no slot config exists
- config invalid
- generate failed
- slot fetch failed
- slot patch failed
- selected field inactive or maintenance
- permission denied on slot endpoints

## UX rule

Error handling should not redesign the page.

Prefer:

- inline card state
- disabled action buttons
- concise toasts

Avoid:

- full-screen interruption
- new modal patterns not already used in the portal

---

## Permissions And Role Assumptions

Admin frontend must assume backend permission checks remain authoritative.

Relevant backend permission family:

- `slot:read`
- `slot:write`

Frontend behavior:

- if admin lacks slot permission, do not crash the field drawer
- show a clean access-denied or unavailable state inside the schedule surface

Do not hardcode role assumptions in JSX if auth context already exposes permission helpers elsewhere in the app.

---

## Testing Plan For UI

This is what should be testable after integration.

## Test prerequisites

Need:

- admin portal running against the correct backend base URL
- authenticated admin account with slot permissions
- at least one vendor
- at least one field attached to a vendor
- field in usable status, ideally `active`
- slot config not yet present for at least one field, so first-time flow can be tested

## Core UI test sequence

1. Open Fields page.
2. Open a field detail panel.
3. Open `Schedule` tab.
4. Confirm config-empty state or existing config loads correctly.
5. Save a valid slot config.
6. Generate slots.
7. Load a date and confirm slot grid renders real inventory.
8. Block one slot.
9. Unblock that slot.
10. Mark one slot maintenance.
11. Clear maintenance.
12. Override one slot price.
13. Change date and confirm fetch changes accordingly.
14. Use `Block Peak`.
15. Use `Unblock All`.
16. Confirm summary cards update correctly after refetch.

## Validation-specific tests

1. Invalid slot duration.
2. Open time after close time.
3. Missing weekly pricing values.
4. Negative price.
5. Generate slots before saving config.

## State-specific tests

1. Field inactive.
2. Field maintenance.
3. No permission.
4. Empty slot day.
5. Slow API response.

---

## Implementation Phases

Keep implementation small and incremental so the UI does not regress.

## Phase 1: Data layer

- add `features/slots/types.ts`
- add `features/slots/constants.ts`
- add `features/slots/api.ts`
- add `features/slots/adapters.ts`
- centralize slot-related constants
- no UI behavior changes yet

## Phase 2: Real schedule read integration

- replace mock slot fetch logic with `GET /admin/turfs/:turfId/slots`
- replace hardcoded summary calculations
- bind selected date to real data
- keep visuals unchanged

## Phase 3: Slot config integration

- add slot config section inside Schedule tab
- add config form state and validation
- wire `PUT /admin/turfs/:turfId/slot-config`
- wire `POST /admin/turfs/:turfId/slots/generate`

## Phase 4: Slot mutations

- wire block / unblock
- wire maintenance
- wire price override
- wire quick actions

## Phase 5: Hardening

- loading states
- error states
- access-denied handling
- config drift messaging versus field timings
- build verification

---

## Explicit Implementation Instructions For The Next AI Run

1. Do not redesign the Fields page.
2. Read `turfin-admin-portal/Gemini.md` first and obey it strictly.
3. Treat backend slot DTOs and controllers as the source of truth.
4. Do not use `docs/VENDOR_FIELD_DETAILS.md` for slot contracts.
5. Introduce a dedicated `features/slots` integration layer instead of stuffing all slot logic directly into `page.tsx`.
6. Preserve the existing `Schedule` tab as the primary slot management UI.
7. Keep the existing visual structure of the edit modal intact.
8. Do not hardcode slot counts, peak assumptions, or default windows in JSX.
9. Put constants in a proper frontend constants file.
10. Convert rupees <-> paise in adapters / API helpers, not inside random UI branches.
11. Prefer refetch-after-mutation first; optimize later.
12. Use explicit TypeScript types, no `any` for slot transport/state.
13. Run build at the end and fix all issues.
14. Do not change unrelated frontend surfaces.

---

## Final Recommendation

The cleanest integration is:

- keep slots inside the existing field detail experience
- make the current Schedule tab the real slot operations surface
- add slot config and weekly pricing there
- use the edit modal only for generic field metadata
- add a small `features/slots` integration layer
- preserve the current UI exactly as much as possible

That gives the admin a complete end-to-end slot workflow in the place where it already belongs, while keeping the portal visually unchanged and making the UI genuinely testable against the real backend.
