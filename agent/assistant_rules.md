
# Assistant Rules for StackTracker Project

This document contains persistent instructions for collaborators to maintain feature continuity throughout the project.

## Database Schema Protection Rules

1. Database schema files (`neon-schema.ts`, `rds-schema.ts`) are critical infrastructure and require explicit user permission before any modifications:
   - Do NOT modify any schema files without direct user authorization
   - If schema changes seem necessary, MUST first ask user's permission
   - This applies to both structural changes and field additions/removals
   - Schema files affected by this rule:
     - `db/neon-schema.ts`
     - `db/rds-schema.ts`
     - Any new schema files added to the project

## Violation Prevention

- Before suggesting any schema changes, the assistant must:
  1. Explicitly ask for permission
  2. Explain the proposed changes
  3. Wait for user confirmation
  4. Document the approved changes in the changelog
