1. Shared Components Strategy
The shared components directory appears to be a mix of web and native (React Native) components, with many having invalid identifiers (using hyphens). Here's my proposed approach:
A. Component Organization:
Each component should have:
index.tsx - Web version
native.tsx - React Native version
types.ts - Shared types
styles.ts - Shared styles (if needed)
B. Naming Convention Fix:
Convert all hyphenated names to PascalCase:
landing-header → LandingHeader
mobile-nav → MobileNav
supplement-list → SupplementList
etc.
C. Component Audit:
Review each component to determine if it's:
Actually needed (some might be duplicates)
Should be web-only, native-only, or both
Has proper TypeScript types
Follows the new naming convention
D. Implementation Plan:
Fix components in batches, starting with most critical ones:
Layout components (header, nav)
Auth components
Core feature components (supplements, biomarkers)
Utility components (cookie-consent, etc.)

### Components to Address:

*   **other**:
    *   `profile-progress` ✅ (Renamed to ProfileProgress)
    *   `llm-chat` ✅ (Renamed to LlmChat)
    *   `profile-completion-notification` ✅ (Renamed to ProfileCompletionNotification)
    *   `lab-upload` ✅ (Renamed to LabUpload)
    *   `cookie-consent` ✅ (Renamed to CookieConsent)
    *   `background-words` ✅ (Renamed to BackgroundWords)
    *   `SupplementStreakCard` (PascalCase, needs review for types/implementation)
    *   `ValueProposition` (PascalCase, needs review for types/implementation)
    *   `SummaryTrigger` (PascalCase, needs review for types/implementation)
    *   `LimitReachedNotification` (PascalCase, needs review for types/implementation)
    *   `ErrorBoundary` (PascalCase, needs review for types/implementation)
*   **layout**:
    *   `mobile-nav` ✅ (Renamed to MobileNav)
    *   `landing-header` ✅ (Renamed to LandingHeader)
    *   `header` ✅ (Renamed to Header)
    *   `footer` ✅ (Renamed to Footer)
*   **subscription**:
    *   `PaymentOptionsModal` (PascalCase, needs review for types/implementation)
    *   `SubscriptionCheck` (PascalCase, needs review for types/implementation)
*   **supplements**:
    *   `supplement-list` ✅ (Renamed to SupplementList)
    *   `supplement-search` ✅ (Renamed to SupplementSearch)
    *   `supplement-form` ✅ (Renamed to SupplementForm)
*   **biomarkers**:
    *   `BiomarkerFilter` ✅ (Verified, PascalCase, seems OK)
    *   `BiomarkerHistoryChart` ✅ (Verified, PascalCase, seems OK)
*   **auth**:
    *   `SignupForm` ✅ (Verified, PascalCase, seems OK)
    *   `AccountInfo` ✅ (Verified, PascalCase, seems OK)
2. Stripe Dynamic Imports Strategy
For the Stripe middleware issues, we need to:
Find all instances of dynamic imports starting with '/'
Replace them with proper path aliases using the new monorepo structure
Update the build configuration to handle these imports correctly
Proposed Implementation Order:
Document all components that need fixing ✅ (Initial list generated)
Create a proper component migration plan ✅ (This document)
Phase 2 - Component Migration:
Start with layout components ✅
Move to auth components ✅
Then core feature components ✅ (Supplements and Biomarkers done)
Finally utility components ✅ (Hyphenated ones from 'other' category done)

**Progress Update (Phase 2):**
*   All identified hyphenated components in `layout`, `supplements`, and `other` categories have been renamed to PascalCase.
*   Corresponding web components in `apps/web/client/src/components/` have also been renamed.
*   Internal file structures (props, state, component names, `index.d.ts` files) for these renamed components have been updated.
*   Export files (`index.ts`, `index.d.ts`) for these categories have been updated.
*   Auth and Biomarker components were already PascalCase and their structure has been verified.
*   Next steps for Phase 2 involve reviewing the remaining PascalCase components (mostly in `other` and `subscription`) for proper typing and web/native implementation as per points C and D of the initial strategy.

Each component will be:
Renamed to PascalCase ✅ (Largely done for problematic components)
Properly typed (Ongoing - for remaining components)
Implemented for web/native as needed (Ongoing - for remaining components)
Tested in isolation (To be done)
Phase 3 - Stripe Import Fixes:
Update dynamic imports to use proper path aliases
Update build configuration
Test all Stripe-related functionality
Phase 4 - Cleanup:
Run full type check
Update documentation
Add component stories/documentation

## Monorepo TypeScript Consolidation (June 2025)

### 1 · Shared `tsconfig.base.json`
We introduced a **single source-of-truth** for compiler options and path aliases at the repo root.

Key points:
* Declares every workspace alias
  * `@core/*` → `packages/core/src/*`
  * `@core/db` → `packages/core/db`
  * `@backend/*` → `packages/backend/src/*`
  * `@ui/*` and `@stacktracker/ui/*` → `packages/ui/src/*`
  * `@stacktracker/mobile-ui/*` → `packages/mobile-ui/src/*`
  * Catch-all `@/*` points to the major source directories.
* Removes `composite`, `incremental`, `declaration`, and `.tsbuildinfo` from the root so individual packages own their own incremental builds.
* Excludes RN code for now: `apps/mobile/**/*`, `packages/mobile-ui/**/*`.
* All sub-projects now simply `extends "../../tsconfig.base.json"` (or `./tsconfig.base.json` for root).

Run-anywhere sanity check:
```bash
npm run check:imports         # → tsc -p tsconfig.base.json --noEmit
```
This catches broken path aliases in <1 s.

### 2 · Remaining Type Errors – Triage Roadmap (420 → 0)

| Group | TS Code | Root Cause | Main Files | Fix Strategy |
|-------|---------|-----------|-----------|--------------|
| **A** | TS2307 | Legacy relative imports to `../db`, `../server/*` | `scripts/*.ts`, some backend services | Switch to aliases (`@core/db`, `@backend/utils/logger`). Add `scripts/tsconfig.json`.
| **B** | TS2308 | Duplicate re-exports in UI barrel | `packages/ui/src/index.ts` | Make explicit exports or rename type.
| **C** | TS7006/7019 | Implicit `any` params & rest args | `scripts/*.ts`, route files | Quick type annotations or `@ts-expect-error` when low-value.
| **D** | – | Copy-pasted duplicate import blocks | `packages/backend/src/services/*` | Remove second import region.
| **E** | – | JS-style Express route files missing typings | `apps/web/server/routes/*` | Wrap in `Request, Response` handler or `@ts-nocheck`.
| **F** | – | One-off migration scripts | `packages/core/db/migrations/*.ts` | Add `// @ts-nocheck` header.
| **G** | TS-generics | Chart/UI typing tweaks | `apps/web/client/src/components/ui/*` | Refactor later, non-blocking.

Proposed execution order:
1. Fix Group B (single edit)
2. Batch-replace paths for Group A (>200 errors gone)
3. Delete duplicate imports (Group D)
4. Silence migrations (Group F)
5. Sweep Groups C & E (small manual typing)
6. Refactor chart generics (Group G)

After Group F the compile should be ❌< 50 errors, making the last mile manageable.