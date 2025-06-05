Proposed clean-up & restructuring plan
────────────────────────────────────────
(High-level – exact file moves listed in next section.)
Phase 1 – Fix build without changing behaviour
Keep database schema single-sourced in packages/core/db.
Replace all relative imports of '../../db/schema' with @db/schema (or @stacktracker/core/db/schema).
Add an esbuild plugin (or switch to ts-up bundling) so server build honours the TS path mappings defined in apps/web/tsconfig.json.
Add --tsconfig-paths to tsx in the dev script (or use tsx -r tsconfig-paths/register).
Remove duplicate workspace line for packages/mobile-ui.
Delete empty agent/ folder for now (or add README explaining future use).
Move orphan root/src code into packages/core (or delete if unused) and update imports.
Phase 2 – Consolidate UI libraries
Decide on ONE web component package: either packages/ui or packages/shared-components.
Run the existing migration scripts in /scripts to move remaining pieces, then delete the redundant package.
For mobile, either (a) keep packages/mobile-ui separate, or (b) create a cross-platform design system using React Native Web.
Phase 3 – Project hygiene
Purge backup & binary artefacts (.DS_Store, .dump, generated-icon.png, ORIG_HEAD.lock, AWSCLIV2.pkg).
Add root-level ESLint + Prettier, share via workspace.
Add a GitHub Actions pipeline (install, lint, test, build) and/or AWS CodeBuild spec.
Document local development commands in README.
────────────────────────────────────────
Concrete file moves / edits (Phase-1)
────────────────────────────────────────

Update imports (code-mod search-replace):
'../../db/schema' → @db/schema
apps/web/tsconfig.json – keep alias for @db/* (already present).
root package.json
scripts.dev: "tsx -r tsconfig-paths/register apps/web/server/index.ts"
scripts.build: add --tsconfig-path=../../tsconfig.json plugin or use esbuild-register-ts-paths.
No other behavioural changes are required for the build to pass.


A. Agreed conventions
────────────────────────────────────────
Single-source schema path alias
New alias: @core/db → packages/core/db (and @core/db/*).
@core/* will point to packages/core/src/*.
Root node_modules only
Keep one install at repo root.
Each workspace keeps its own package.json for scripts & metadata, but relies on the hoisted deps created by npm workspaces.
Action: delete committed apps/mobile/node_modules/ from VCS and add /node_modules lines to each package’s .gitignore (mobile already ignores). No other per-package installs needed; Expo CLI and Jest will resolve packages through Node’s resolution upwards.
Component libraries
packages/ui = generic, cross-app, web-oriented components
packages/mobile-ui = generic, cross-app, mobile components
packages/shared-components = application-specific, must be consumable by both web and mobile
We will audit the three libraries after build is green, decide which components belong where, and extract any cross-platform code (React Native Web etc.) into ui/mobile-ui as appropriate.
Server-side code reuse
Much of apps/web/server/{services,cron,routes,utils} is business logic that mobile will call.
Long-term plan: move that logic into a new workspace packages/backend (or expand packages/core) exposing pure TS functions / handlers.
Express-specific adapters stay in apps/web/server. Mobile can import the shared modules or talk to REST endpoints; we’ll decide later.
────────────────────────────────────────
B. Current TODO list before next build attempt
────────────────────────────────────────
Path-alias refactor
Root tsconfig.json – add
Apply to AddSupplemen...
}
Add the same mapping (via "extends": "../../tsconfig.json") to every package tsconfig that needs it (web, mobile, core, tests).
Code-mod all imports:
../../db/schema, @db/*, @stacktracker/core/db/* → @core/db/*
Tooling to respect aliases at runtime
Dev script: "tsx -r tsconfig-paths/register apps/web/server/index.ts"
Build script: use esbuild with --tsconfig=tsconfig.json or add @esbuild-plugins/tsconfig-paths.
Vite already respects tsconfig paths for client code.
Remove duplicate artefacts
Commit removal of apps/mobile/node_modules/ (and any others accidentally checked-in).
Purge lingering .DS_Store, *.dump, ORIG_HEAD.lock, etc.
Commit new location of the former root/src files (now inside packages/core/src/...). Update any imports to @core/....
Verify scripts
npm run dev should start server with alias resolution.
npm run build should bundle successfully.
npm run test green.
────────────────────────────────────────
C. Next-phase (after build passes)
────────────────────────────────────────
Component-library audit
Produce matrix of all components in ui, mobile-ui, shared-components with platform & dependency notes.
Decide moves or duplication removal (e.g. a Chart component that is pure React can live in ui and be re-exported by mobile-ui with RN-Web).
Shared backend extraction
Identify pure business-logic folders under apps/web/server (services, cron jobs, types).
Create packages/backend (or extend core) and move them.
Web server imports remain same path via alias; mobile can now import directly or consume via API.
CI / CD hygiene
Add GitHub Actions (install, lint, test, build).
Ensure AWS CDK deploy references new build artifacts.