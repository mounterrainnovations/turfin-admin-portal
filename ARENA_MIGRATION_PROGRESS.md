# Arena Migration Progress — Admin Portal Frontend

## Overview
Migrating from `Fields` UI to `Arenas → Turfs` hierarchical UI.

---

## Phase 3: Frontend Admin Portal

### Navigation
- [ ] Update `layout.tsx`: "Fields" → "Arenas", href `/dashboard/fields` → `/dashboard/arenas`

### Feature Layer
- [ ] Create `features/arenas/` (types, api, constants, index)
- [ ] Update `features/turfs/types.ts` (add arenaId, sport singular, remove arena-level fields)
- [ ] Update `features/turfs/api.ts` (update CreateTurfDto shape)
- [ ] Update `features/turfs/constants.ts` if needed

### Arenas Page
- [ ] Create `app/dashboard/arenas/page.tsx` (copy from fields/page.tsx)
- [ ] Update listing to show Arenas (name, address, vendor, sport counts, turf count)
- [ ] Update detail panel for Arena (overview, turfs tab, reviews, schedule)
- [ ] Update onboarding modal:
  - [ ] Remove Pricing & Hours step from arena onboard
  - [ ] Replace sports multi-select with counter UI ([-] N [+] per sport)
  - [ ] Submit creates arena with sports array [{sport, count}]
- [ ] Add "Onboard Turf" modal (for manually adding turfs to an arena later)
- [ ] Add turf management within arena detail panel

### Cleanup
- [ ] Delete `app/dashboard/fields/page.tsx`
- [ ] Remove all "field" references from UI labels
- [ ] ✅ `npm run build` passes
