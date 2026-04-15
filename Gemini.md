# Gemini Operating Instructions For This Repo

## Primary Objective

This admin portal currently has strong UI/UX but relies heavily on hardcoded values. The objective is to progressively replace hardcoded data and prototype logic with backend/API-backed data while preserving the existing UI exactly.

## Non-Negotiable Rule

Do not change the UI.

That means:

- Do not change layout structure.
- Do not change spacing.
- Do not change alignment.
- Do not change typography.
- Do not change colors.
- Do not change icons.
- Do not change borders, shadows, radii, or gradients.
- Do not change copy unless required to bind real backend data.
- Do not change the visual order of elements.
- Do not change interaction design unless the current interaction is impossible to support with real data.
- Do not change even a single Tailwind class unless it is absolutely required for a backend/data integration and has zero visual impact.
- Do not change schema or contract shape arbitrarily if existing frontend behavior depends on it.

If a task risks changing the UI, stop and preserve the current UI exactly as implemented.

## Allowed Changes

Allowed work is limited to:

- Replacing hardcoded arrays, objects, and seeded values with backend/API responses.
- Introducing service layers, API clients, adapters, transformers, hooks, or utility functions.
- Moving hardcoded data from page files into integration layers as an intermediate step.
- Refactoring code for maintainability only if the rendered UI remains pixel-equivalent.
- Adding loading, empty, and error handling only when it can be done without altering the current UI structure or styling expectations.
- Wiring forms, buttons, toggles, tables, filters, and dashboards to real endpoints.
- Preserving current labels and formatting unless backend truth requires a value change.

## Forbidden Changes

The following are explicitly forbidden unless the user gives direct approval:

- Redesigning any screen.
- Cleaning up UI code just for style.
- Replacing components for aesthetic reasons.
- Renaming classes, design tokens, or component structure in ways that affect rendering.
- Introducing a new design system.
- Changing Tailwind utility classes because they seem redundant.
- Adjusting responsive behavior unless a backend integration strictly requires it and the visual output remains unchanged.
- Changing table columns, cards, sections, or page layout to fit a different API shape.

## Migration Strategy

Work incrementally, one area at a time.

Recommended order:

1. Map each page’s hardcoded data and current UI contract.
2. Identify the matching backend endpoint for that page or widget.
3. Add the smallest possible integration layer.
4. Replace hardcoded values with API-backed values.
5. Verify the rendered UI is unchanged.
6. Move to the next page or widget.

## Implementation Standard

When integrating backend data:

- Keep existing JSX structure intact whenever possible.
- Keep existing class names intact whenever possible.
- Preserve formatting of dates, currency, counts, badges, statuses, and labels unless backend truth requires different values.
- Prefer adapting backend responses to the current UI contract rather than reshaping the UI to match the backend.
- If backend data is missing fields needed by the UI, add an adapter/fallback layer instead of changing the UI first.

## Decision Rule

When choosing between:

- changing the UI to fit the backend, or
- adapting the frontend data layer to fit the current UI,

always choose adapting the data layer to fit the current UI.

## Scope Rule

Unless explicitly requested otherwise, every task in this repo should be treated as:

"Keep the UI exactly as it is. Only remove hardcoding and connect to the real backend progressively."
