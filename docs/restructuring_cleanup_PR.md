

Draft change set (no files changed yet) – please review / adjust.
+
+# Restructuring & Clean-Up Pull-Request – Progress Tracker (June 01 2025)
+
+This PR documents the incremental refactor that converts our Replit-era codebase into a clean Turbo monorepo ready for AWS deployment and mobile expansion.
+
+## ✅  Completed in this PR
+
+1. **Created workspace `packages/backend`**  
+   – Moved `services/`, `cron/`, `utils/`, `types/`, `lib/`, `config/` out of `apps/web/server`.  
+   – Added barrel export `packages/backend/src/index.ts`.
+
+2. **Hoisted path-alias architecture**  
+   – Root `tsconfig.json` now exposes `@core/*`, `@core/db/*`, `@backend/*`, `@services/*`.  
+   – All package tsconfigs inherit these aliases; `apps/web` references backend.
+
+3. **Build & dev script updates**  
+   – `tsx -r tsconfig-paths/register` for dev server.  
+   – `esbuild` production bundle now supplied `--tsconfig`.
+
+4. **Code-mod import migration**  
+   – Rewrote `../services/*` → `@services/*`.  
+   – Fixed stray `from /module'` typos after regex passes.
+
+5. **Repository hygiene**  
+   – Deleted committed `apps/mobile/node_modules`, `package.json.backup`, misc artefacts.  
+   – Removed obsolete root `src/`.
+
+6. **TypeScript fixes**  
+   – Exported `AuthState` in mobile auth slice.  
+   – Re-implemented `LimitReachedNotification` with internal UI library rather than Chakra.
+
+## 🚧  Still to address (will be follow-up commits)
+
+1. Replace or exclude placeholder stub components in `packages/shared-components/src/components/**` that currently break `tsc`.
+2. Update remaining dynamic `await import('/stripe')` style strings in middleware/routes.
+3. Re-enable full `npm run check` once the above compile blockers are cleared.
+4. Rebuild CI pipeline to include new backend workspace.
+
+---
+
+> **Reviewer Tips**  
+> • Focus your review on alias correctness (`@services/*` should always originate from backend).  
+> • Ignore the stub component compilation errors for now – they'll disappear once the components are finished or excluded.  
+> • End-to-end test: `npm run dev` starts server; web UI should load; unit tests under `packages/backend` pass with `npm run test:services`.

