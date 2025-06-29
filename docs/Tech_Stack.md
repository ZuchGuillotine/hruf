Below is a self-contained reference for engineers new to the repo.  
It focuses on what is actually in use today rather than every transitive package.

────────────────────────────────────────────────────────
1. High-level architecture
────────────────────────────────────────────────────────
• Monorepo (single `package.json`) written in TypeScript.  
• React + Vite SPA served by an Express API (same Node process in production).  
• PostgreSQL (AWS RDS) accessed through Drizzle ORM.  
• Deployed to AWS App Runner; build artifacts are placed in `dist/client` (Vite) and `dist/server` (esbuild-bundled Express).  
• Secrets come from AWS Secrets Manager and SSM at boot; in dev they are read from `.env`.

────────────────────────────────────────────────────────
2. Front-end stack (`client/`)
────────────────────────────────────────────────────────
Framework & tooling
• React 18 with functional components and hooks.  
• Vite 5 for dev server/HMR & production bundling.  
• TypeScript everywhere.  
• Tailwind CSS 3 + tailwind-merge & tailwindcss-animate for utility styling/animations.  
• Radix-UI primitives and Chakra-UI for accessible components.  
• TanStack React-Query 5 for stateful data fetching + global `queryClient` wrapper.  
• Wouter (tiny router) for page routing; files live in `client/src/pages`.

Charts & visualisations
• Recharts 2 and `client/src/types/chart.ts` provide strongly-typed chart data.  
• Embla-Carousel for slider UIs.

Auth & payments on the client
• `@stripe/react-stripe-js` for Checkout / Portal redirections.  
• Passport-based session status is read via cookies; React hooks live in `client/src/hooks/use-auth.tsx`.

────────────────────────────────────────────────────────
3. Back-end stack (`server/`)
────────────────────────────────────────────────────────
Express bootstrap
• Entry: `server/startup.ts` – loads env-vars, then dynamically imports `server/index.ts`.  
• `server/index.ts`   
  – sets up CORS, JSON parsers, rate-limit & slow-down middleware.  
  – configures session storage with `express-session` + `memorystore` (file-store fallback in dev).  
  – registers auth routes (`/auth/*`), API routes (`/api/*`), Stripe web-hooks, and admin endpoints.  
  – in production serves the pre-built SPA assets before API middleware.  
  – starts HTTP server on 8080 (App Runner) or 3001 (local).

Authentication
• Passport 0.7 with:  
  – Local strategy (`username / password`).  
  – Google OAuth2 strategy (`passport-google-oauth20`).  
• Bcrypt-based password hashing in `server/auth/crypto.ts`.  
• Sessions persisted to file system (dev) or memory store (prod container).

Business services (`server/services/`)
• `biomarkerExtractionService.ts` – OCRs lab PDFs, runs regex & LLM extraction.  
• `embeddingService.ts` – calls OpenAI embeddings, stores vectors in Postgres `pgvector`.  
• `advancedSummaryService.ts` – summarises logs/chats; scheduled by cron.  
• Each service exposes an interface consumed by REST controllers.

Routing
• Conventional REST routing under `server/routes/*`, mounted via `registerRoutes()`.  
• Example: `/api/labChartData` aggregates biomarker history across users.

Cron & background jobs (`server/cron/`)
• `summaryManager.ts` – orchestrates daily & weekly summaries (node-cron).  
• `processMissingBiomarkers.ts` – re-parses any failed OCR runs.  
• `updateTrialStatuses.ts` – downgrades expired trials.  
Jobs start async after HTTP server reports “listening”.

────────────────────────────────────────────────────────
4. Database layer (`db/`)
────────────────────────────────────────────────────────
• Postgres 15 on AWS RDS; URL supplied via `DATABASE_URL`.  
• Drizzle ORM + Drizzle-Kit migrations (`npm run db:push`).  
• Table definitions live in `db/schema.ts`; strongly typed via Drizzle & Zod.  
  – Users, health_stats, supplements, lab_results, biomarker_* etc.  
  – `vector()` columns (1536 dims) for semantic search.  
• SSL decisions handled in `db/index.ts`  
  – RDS hostname → strict SSL using `AWS_RDS_CA_CERT_PATH` certificate.  
  – Local dev → `rejectUnauthorized: false`.

────────────────────────────────────────────────────────
5. Third-party integrations
────────────────────────────────────────────────────────
• AWS  
  – Secrets Manager / SSM Parameter Store (`server/config/env.ts`).  
  – App Runner for containerised deployment.  
• OpenAI (chat & embedding models) – `OPENAI_API_KEY`.  
• Google Cloud Vision for OCR of images embedded in PDFs.  
• SendGrid for transactional email (`src/services/emailService.ts`).  
• Stripe for subscriptions; price IDs centralised in `lib/stripe-price-ids.ts`.  
• Tesseract.js (fallback OCR) when Vision API unavailable.  
• PDF-lib & pdf-parse for PDF ingestion.  
• Winston for structured logging.

────────────────────────────────────────────────────────
6. Dependency snapshot (direct runtime deps)
────────────────────────────────────────────────────────
• express 4.21  • drizzle-orm 0.32  • pg 8.15 • pgvector 0.2  
• react 18.3   • vite 5 • tailwindcss 3  
• openai 4.98  • @aws-sdk/client-* 3.83x  
• passport 0.7  • stripe 17.7 • sendgrid/mail 8.1  
(Full list: see `package.json`.)

────────────────────────────────────────────────────────
7. Infrastructure & CI/CD
────────────────────────────────────────────────────────
Build
```
npm run build
# → vite build (SPA) → dist/client
# → esbuild bundle server/startup.ts → dist/server
```
Container
• A multistage `Dockerfile` copies both outputs and installs only `prodDependencies`.  
• Image pushed to ECR by CI (GitHub Actions).  

App Runner
• `apprunner.yaml` defines runtime (Node 20), port 8080, auto-deploy from ECR, health-check path `/health`.

────────────────────────────────────────────────────────
8. Development workflow
────────────────────────────────────────────────────────
• `npm run dev`  
  – concurrently runs `vite` (frontend) and `tsx watch server/startup.ts` (backend).  
• Tests: Jest + ts-jest (`npm run test` / `test:watch`).  
• Lint & format: ESLint / Prettier.  
• Scripts under `scripts/` cover ad-hoc tasks (token counts, biomarker fixes, etc.).

────────────────────────────────────────────────────────
9. Environment variables (most common)
────────────────────────────────────────────────────────
DATABASE_URL               Postgres connection string  
OPENAI_API_KEY             Chat/embedding models  
GOOGLE_APPLICATION_CREDENTIALS GCP Vision service account  
STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET  
SENDGRID_API_KEY  
SESSION_SECRET             Express-session signing key  
CUSTOM_DOMAIN              Allowed CORS origin in prod  
AWS_RDS_CA_CERT_PATH       Mounted CA bundle for RDS SSL

────────────────────────────────────────────────────────
10. File/folder quick map
────────────────────────────────────────────────────────
client/              React SPA source  
server/              Express API, auth, routes, cron  
db/                  Drizzle schema & migrations  
scripts/             One-off utilities & debug helpers  
infra/               CDK stack for local AWS experiments  
docs/                Additional high-level specs & guides

────────────────────────────────────────────────────────
11. Key NPM scripts
────────────────────────────────────────────────────────
dev                 Hot-reload front & back end  
build               Compile & bundle for production  
start               Run bundled code (dist)  
db:push             Generate & run Drizzle migrations  
test / lint / format Quality gates  

────────────────────────────────────────────────────────
12. How everything fits together at runtime
────────────────────────────────────────────────────────
1. App Runner launches container → `node dist/server/startup.js`.  
2. Startup loads secrets (if prod) → validates env → initialises DB pool.  
3. Express server mounts session & auth, API, Stripe & health endpoints.  
4. SPA assets are served (prod) or proxied from Vite dev server (dev).  
5. Background initialiser spins up cron jobs & service singletons.  
6. Front-end issues `/api/*` requests; React-Query caches responses.  
7. Drizzle queries Postgres; vector columns allow semantic search by OpenAI embeddings.  
8. Stripe web-hooks update `users.subscription_*` columns; cron adjusts entitlements.  
9. Logs & biomarker data are summarised nightly; embeddings enable sem-search for AI chat.

────────────────────────────────────────────────────────
For any deeper dive see:
• `docs/PROJECT_OVERVIEW.md` – product vision  
• `docs/AUTH_DEBUGGING.md`   – auth flows  
• `docs/BackendStructures.md` – entity diagrams  
• `db/migrations/`            – historical schema changes

This document should give you both a map and the “why” behind each major dependency and configuration piece.