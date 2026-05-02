# Admin Portal Frontend Refactor Roadmap

This document outlines the architectural shortcomings of the current Admin Portal and provides a prioritized, non-breaking strategy to improve scalability, readability, and LLM-friendliness.

## 🎯 Primary Directives
1. **Zero UI Change:** Every refactor must result in a pixel-perfect equivalent of the current UI.
2. **LLM-Friendliness:** Reduce file sizes and isolate logic so coding agents can traverse and modify the codebase with high precision.
3. **Incremental Migration:** No "big bang" rewrites. Functional areas must remain operational throughout.

---

## 🏗️ Architectural Shortcomings

### 1. "God Files" (The 2000+ Line Page Pattern)
*   **Issue:** Pages like `app/dashboard/vendors/page.tsx` (>2,600 lines) handle state, API fetching, complex form logic, and massive JSX trees in one file.
*   **Impact:** LLMs lose context; high risk of regression during minor edits; difficult to test logic in isolation.

### 2. Duplicated API Boilerplate
*   **Issue:** Every `api.ts` re-implements response handling (`handleResponse`), URL parsing, and pagination normalization.
*   **Impact:** Inconsistent error handling; backend contract changes require updates across multiple feature folders.

### 3. Tight Coupling of State & View
*   **Issue:** Business logic (e.g., the 4-step vendor onboarding) is hardcoded into UI event handlers.
*   **Impact:** Impossible to reuse logic or change "how" things work without touching "how they look."

### 4. Fragmented Domain Types
*   **Issue:** Types are often redefined or extended locally within pages rather than being driven by a central domain model.
*   **Impact:** "Type drift" where the frontend expects fields that the backend doesn't provide, or vice versa.

### 5. Redundant UI Utilities
*   **Issue:** Formatting for dates, currency, and avatars is redefined across multiple dashboard pages.
*   **Impact:** Inconsistent data presentation and harder maintenance.

---

## 🛠️ Refactor Phases (Ordered by Priority)

### Phase 1: Infrastructure & Core Utilities (Low Risk)
*Goal: Centralize the "plumbing" to eliminate duplication.*
- [ ] **Base API Client:** Create `src/lib/api-client.ts` using `authenticatedFetch`. Handle JSON parsing, standardized error mapping, and pagination normalization here.
- [ ] **Standardized API Layers:** Refactor `features/*/api.ts` to use the new base client.
- [ ] **Global UI Helpers:** Move `avatarColor`, `formatDate`, and `formatCurrency` to `src/utils/ui-helpers.ts`.

### Phase 2: State Extraction (Custom Hooks)
*Goal: Move "Brain" logic out of the "Body" (JSX).*
- [ ] **Feature Hooks:** For each functional page, extract state management into a custom hook (e.g., `features/vendors/hooks/use-vendor-management.ts`).
- [ ] **Form Logic Extraction:** Move complex multi-step form logic (like Vendor Onboarding) into dedicated hooks.

### Phase 3: Component Atomization
*Goal: Break down massive JSX trees into manageable parts.*
- [ ] **Table Decoupling:** Move table row and header logic into sub-components within the feature folder.
- [ ] **Modal/Drawer Isolation:** Extract large modals (e.g., `VendorDetailDrawer`) into standalone components.
- [ ] **Prop Drilling Cleanup:** Use Context or well-defined props to pass state from the hook to these new components.

### Phase 4: Domain Type Strengthening
*Goal: Ensure the frontend strictly follows the DTO/Contract.*
- [ ] **Centralized Types:** Ensure `features/*/types.ts` is the single source of truth for every domain entity.
- [ ] **API Response Typing:** Use Generics in the API client to ensure every fetch returns the correct Domain Type.

---

## 📝 Best Practices for Future Work

### For Human Developers
- Keep pages under 300 lines by delegating to hooks and sub-components.
- If you copy-paste a formatting function, it belongs in `src/utils`.

### For LLM Agents
- **Read the Hook First:** Always look for the `useFeature` hook to understand logic before touching the `page.tsx`.
- **Surgical Edits:** When adding a field, update the Type, then the API, then the Hook, and finally the Component.
- **Maintain Tailwind:** Never "clean up" or "optimize" Tailwind classes unless requested; preserve the visual contract.

---
*Created: May 2026 | Objective: Scalable Admin Architecture*
