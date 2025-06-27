────────────────────────────────────────────────────────
0. Why this plan exists
────────────────────────────────────────────────────────
Production runs acceptably but we have:  
• duplicated subsystems (two auth stacks, multiple “debug” servers).  
• >100 MB of stray text/images under `attached_assets/` and large legacy docs.  
• very large monolithic route files (e.g. `server/routes.ts` 1 500 LOC).  
• blocking cron/ETL jobs executed in the API process (OCR / embeddings).  
• heavy startup logging and dynamic CORS checks on every request.  
These add latency, increase collaborator ramp-up time and obscure dead code.

────────────────────────────────────────────────────────
1. Guiding principles
────────────────────────────────────────────────────────
A. “Delete is the best refactor.” Remove code-paths that are proven unused.  
B. Latency = cold-start + request time; optimise both separately.  
C. Keep collaborators oriented: slim docs, surface ADRs (architecture decisions) instead of long narratives.  
D. Every retained component must be covered by either:  
   • an integration test, or  
   • a well-referenced feature ticket.

────────────────────────────────────────────────────────
2. Inventory of likely legacy / duplicate artefacts
────────────────────────────────────────────────────────
Backend duplicates
• `server/auth.ts` (monolithic) vs `server/auth/` modular stack.  
• `server/index-debug.ts`, `server/minimal-server.ts` – pre-migration debug entrypoints.  
• `scripts/*debug*`, `scripts/test-*` labelled “simple” or “legacy”.  
• `src/services/emailService.ts` duplicated under `server/services` (old path).  
• Migrations with overlapping numbers: `0008_sleep_minutes.ts` vs `0008_cleanup_health_stats.ts`.

Frontend duplicates
• Two carousel libs (Embla + Chakra slider) – only Embla used.  
• Multiple background-word animations (`background-words.tsx`, CSS demos) – choose one.

Documentation / assets
• `attached_assets/` – 60+ paste-dump files (screenshots, partially-edited markdown).  
• `docs/progress_summary.md` 70 KB log-style file – superseded by CHANGELOG.  
• `docs/` contains both “BackendStructures.md” and “PROJECT_OVERVIEW.md” with overlapping diagrams.  
• Old `.DS_Store` and PNG/JPGs that are never embedded.

────────────────────────────────────────────────────────
3. Refactor phases
────────────────────────────────────────────────────────
PHASE 1 – Fast wins (1–2 days)
1. Remove debug entrypoints  
   • Delete `server/index-debug.ts`, `server/minimal-server.ts`; ensure Procfile / Docker uses `server/startup.ts`.  
2. Consolidate auth  
   • Migrate consumers to `server/auth/setup.ts` (newer, modular).  
   • Delete `server/auth.ts` after parity tests pass.  
3. Prune attached assets & gigantic docs  
   • Create `docs/legacy/` folder. Move anything not referenced in README or current docs.  
   • Delete `attached_assets/` entirely after git-history backup.  
4. Remove dead NPM deps  
   • Run `npm ls` then `npm prune --production` to list unused; candidates: `@chakra-ui/react` (no longer imported runtime), `cmdk`.  
5. Lock startup logging  
   • Replace console-spam in `db/index.ts` and `server/index.ts` with `debug` or `winston` at “verbose” level gated by `LOG_LEVEL`.

PHASE 2 – Latency & structure (1–2 weeks)
1. Split monolith routes  
   • Break `server/routes.ts` into feature-routers (`/health-stats`, `/lab`, `/payments`).  
   • Use `express-promise-router` to cut boilerplate & implicit `next(err)`.  
2. Move heavy ETL to worker queue  
   • Create `workers/etl-worker.ts` started by Procfile side-process.  
   • Offload OCR (`biomarkerExtractionService`) and embeddings to BullMQ / SQS; API returns job-id.  
3. CORS optimisation  
   • Replace dynamic function that regex-tests every request with static “allow-list string array + includes()”.  
4. Adopt `compression` & `helmet` at app level; keep out of worker process.

PHASE 3 – Size & bundle (2 weeks)
Front-end
• Enable Vite code-splitting for each Wouter route with `React.lazy`.  
• Analyse bundle with `vite build --report` – remove Chakra/Radix packages not used.  
Back-end bundle
• Replace `esbuild` single-bundle with `--splitting` for lazy `require()` of rarely used AWS SDK clients.  
• Tree-shake `@aws-sdk/*` with per-client imports.

PHASE 4 – Documentation & onboarding (continuously)
• Adopt “docs/adr/0001-stack-choices.md”, “adr/0002-auth-approach.md” etc.  
• Archive superseded longform docs into `docs/legacy/`.  
• Keep `CHANGELOG.md` as single running history; delete `progress_summary.md`.  
• Add README section “Removed components” that records what was deleted and why (prevents regressions).

────────────────────────────────────────────────────────
4. Code-base hygiene checklist
────────────────────────────────────────────────────────
▪ [ ] Every top-level TypeScript file imported at runtime is traced by `depcruise --include-only .ts`.  
▪ [ ] `npm run test` passes; CI blocks merges without coverage ≥ 60 %.  
▪ [ ] `npm run db:push` followed by `drizzle-kit introspect` diff is empty.  
▪ [ ] No `.DS_Store`, `.orig`, or backup files in repo – lint with `git ls-files` filter.  
▪ [ ] “DEBUG” env var gates all verbose logging.  
▪ [ ] Running `npx tsc --noEmit` on strict mode is clean.

────────────────────────────────────────────────────────
5. Metrics & acceptance
────────────────────────────────────────────────────────
• p95 cold-start (container boot → first `/health`) < 4 s.  
• p95 API latency `/api/labChartData` < 300 ms (was 1.2 s).  
• Docker image size < 650 MB (was 980 MB with assets).  
• Bundle `dist/client/assets/index.*.js` < 400 kB gzip.  
• “Onboarding time” informal survey: new dev can run tests in < 10 min.

────────────────────────────────────────────────────────
6. Work-tracking template
────────────────────────────────────────────────────────
```yaml
- id: ST-### 
  title: "Delete legacy auth.ts"
  component: backend-auth
  phase: 1
  risk: medium
  acceptance:
    - auth routes still work (e2e test passes)
    - no imports of server/auth.ts found by grep
```
Store tasks in GitHub Projects board labelled `refactor-2025Q3`.

────────────────────────────────────────────────────────
7. Tooling recommendations
────────────────────────────────────────────────────────
• dependency-cruiser – visualise import graphs.  
• `ts-prune` – static scan for unused exports.  
• `hot-node-watch` – restart only changed worker not whole API.  
• Sourcegraph batch-queries for mass renames.

────────────────────────────────────────────────────────
8. Next actions (sequence)
────────────────────────────────────────────────────────
0. Create `refactor-2025Q3` branch, protect `main`.  
1. Run `ts-prune > _reports/unused.txt` and triage.  
2. Delete debug entrypoints + attached assets, push PR; ensure image size drop.  
3. Migrate auth consumers, merge when e2e passes.  
4. Stand up BullMQ + Redis dev container; port ETL code.  
5. Split routes + implement CORS shortcut.  
6. Front-end code-splitting & dependency purge.  
7. Commit new ADRs + prune docs.  
8. Run performance benchmarks; update metrics table in README.

Follow this roadmap and collaborators will quickly see a leaner, faster, and far less confusing repository.
