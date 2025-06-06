description: "StackTracker – General development & architecture rules for AI collaborators"
globs:

* "\*\*/\*"
  alwaysApply: true

---

# StackTracker Cursor Rules

These rules apply to every file in the repository and are always injected into the AI's context. They encode our core conventions so that automated edits stay aligned with human expectations.

## Core Principles

* **Plan → Act**: Before making code changes, generate a short plan (bullet list, MECE). Revise it if the human asks, then implement.
* **Minimal disruption**: Prefer additive edits; avoid large rewrites unless explicitly requested.
* **Context awareness**: Read referenced files and reuse existing patterns. Do not introduce redundant libraries.

## Front‑end Standards

* React 18 + TypeScript, functional components, named exports.
* TanStack Query for data, shadcn/ui + TailwindCSS for styling, Framer Motion for animations.
* Keep components ≤200 LOC; split if larger.
* Place UI in `/client/src/components`, pages in `/client/src/pages`.

## Back‑end Standards

* Express + TypeScript with ESM imports (`import x from 'y';`), `.js` extensions in compiled imports.
* Reuse OpenAI wrapper in `/server/openai.ts`; never instantiate the SDK elsewhere.
* All new endpoints must include input validation with Zod and integration tests.

## Testing

* Jest for all unit/integration tests.
* New features must raise global coverage (target ≥ 80 %).
* Tests live in `server/tests` and use the helpers in `test/setup.ts`.

## Database & Migrations

* Drizzle ORM over Postgres (Neon for prod, local for dev).
* Each migration: single concern, file pattern `YYYYMMDD_<description>.ts`.
* Use `npx tsx` to run migrations; clean up connections with `await client.end()` in `finally`.
* Rollback logic is mandatory.

### Drizzle Type Conventions

* Table definitions use camelCase (e.g., `labResults`, `biomarkerResults`).
* Type definitions use PascalCase with prefixes:
  * `Select` prefix for types used when selecting records (e.g., `SelectLabResult`)
  * `Insert` prefix for types used when inserting records (e.g., `InsertBiomarkerResult`)
* Import types explicitly: `import type { SelectLabResult, InsertBiomarkerResult } from '../../db/schema'`
* Never use pluralized table names as types (e.g., avoid `LabResults`, use `SelectLabResult` instead)

## AI / LLM Integration

* Keep requests within token and rate limits; prefer GPT‑4o‑mini unless overridden.
* Strip PII before sending user data.
* Update context–building tests when adding new sources.

## Security

* Never commit `.env`; update `.env.example` instead.
* Use Helmet and CORS middleware defaults.
* All secrets accessed via `process.env`.

## Style Guide

* TypeScript strict mode must pass.
* Use Prettier default config; 100‑char line width.
* CamelCase for variables, PascalCase for components, snake\_case for SQL identifiers.

## Example — Adding a biomarker feature

1. Write migration and update Drizzle schema.
2. Add service & route in `/server`.
3. Create React chart component in `/components/charts`.
4. Add hook with TanStack Query.
5. Write unit + integration tests.
6. Document in `docs/biomarkers.md`.

@development.md
@db/migrations/migration_template.ts
@client/src/components/component_template.tsx