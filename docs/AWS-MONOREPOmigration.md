# StackTracker AWS Migration & Monorepo Transition Plan (High‑Level)

> **Goal** – Move the live StackTracker web app from Replit to AWS (Elastic Beanstalk + RDS PostgreSQL), while restructuring the codebase into a Turbo/Nx monorepo that will later power iOS & Android builds via Expo. The cut‑over must avoid user‑visible downtime and preserve all current functionality.

---

## 0 · Prerequisites & Assumptions

* Small active user base (<100) ⇒ brief read‑only window is acceptable but strive for 0‑downtime.
* AWS account, Route 53, and Apple/Google developer accounts are already provisioned.
* Current Postgres data on Replit can be exported with `pg_dump`.
* CI provider is GitHub Actions (can be swapped later).

---

## 1 · Branch Strategy

1. **Create long‑lived branch** `migration/aws-monorepo` off `main`.
2. Protect `main`; all prod deploys continue via Replit until final cut‑over.
3. Periodically merge `main` → `migration` to stay up to date.

---

## 2 · Infrastructure as Code (IaC)

> **Folder:** `/infra`
> \| Stack | Service | Notes |
> \|-------|---------|-------|
> \| **VPC** | 2 public + 2 private subnets | One AZ minimum; two preferred. |
> \| **DB** | **RDS PostgreSQL 15** | db.t3.medium, gp3 storage, Multi‑AZ disabled initially. |
> \| **Compute** | **Elastic Beanstalk (EB)** | Docker platform. Load‑balanced, min 1 instance. |
> \| **Storage** | S3 bucket `stacktracker‑uploads‑<env>` | Pre‑signed uploads; versioning on. |
> \| **Secrets** | AWS Secrets Manager | DB creds, Stripe, SendGrid, OpenAI, GCP Vision. |
> \| **Monitoring** | CloudWatch Logs + Alarms | EB log streaming; alarms on 5xx & CPU. |

Use **CloudFormation or AWS CDK** to template the above. Ship a `staging` stack first, followed by `prod`.

---

## 3 · Monorepo Scaffolding

```
/
├ apps/
│  ├ web/        # existing Vite/Express app
│  └ mobile/     # Expo placeholder
├ packages/
│  ├ ui/         # shared RN + web components
│  └ core/       # api clients, hooks, utils
├ infra/         # IaC code
├ turbo.json
├ package.json   # workspaces
└ tsconfig.json
```

1. Enable **pnpm or Yarn workspaces**.
2. Add Turbo tasks: `build`, `lint`, `test`, `deploy:web`.
3. Move current code into `apps/web`; fix paths.

---

## 4 · Containerization & EB

1. Add multi‑stage **Dockerfile** in `apps/web` (Node 20 Alpine).
2. `Dockerrun.aws.json` for EB or set platform to *Docker*.
3. EB environment variables map → Secrets Manager.
4. Configure EB health check to `/_health`.

---

## 5 · CI/CD Pipeline (GitHub Actions)

| Job            | Trigger                | Key Steps                                           |
| -------------- | ---------------------- | --------------------------------------------------- |
| `build-web`    | push → `migration/*`   | Turbo cache → Docker build → push to ECR `staging`. |
| `deploy-web`   | success of `build-web` | Update EB environment via CLI; wait for green.      |
| `db-migrate`   | after deploy           | Run `drizzle-kit push` against RDS.                 |
| `promote-prod` | tag `v*` on `main`     | Same build, deploy to **prod** EB.                  |
| `mobile-build` | on‑demand              | `eas build --platform all` (later phase).           |

---

## 6 · Data Migration

1. Put Replit DB in **read‑only** mode.
2. `pg_dump` → `pg_restore` into RDS.
3. Update EB env vars to RDS endpoint; restart.
4. Smoke‑test staging.
5. Re‑enable writes.

---

## 7 · Cut‑Over / Production Switch

1. Lower DNS TTL to 60 seconds (24 h prior).
2. Merge `migration` → `main`; pipeline deploys to **prod** EB.
3. Validate ALB health checks, Stripe webhooks.
4. Switch Route 53 record to EB ALB.
5. Monitor logs & metrics for 30 minutes; rollback via previous EB version if needed.

---

## 8 · Mobile Roll‑Out (Post‑Migration)

1. Scaffold `apps/mobile` via **Expo TS** template.
2. Consume `packages/ui` components.
3. Configure `.env.*` for API base URL & publishable keys.
4. Integrate Apple/Google sign‑in (if required).
5. Build with **EAS Build**; TestFlight & internal testing.
6. Submit to App Store & Play Store.
7. Link store listings to privacy policy (hosted on website).

---

## 9 · Risk Mitigation & Rollback

* Keep Replit deployment live until DNS cut‑over.
* Automated snapshots on RDS pre & post‑migration.
* Use EB blue/green deployments for zero‑downtime swap.
* Feature‑flag any new code paths touching S3 or Redis.

---

## 10 · Post‑Migration Hardening

* Enable RDS Multi‑AZ & backups.
* Add WAF to ALB, rate‑limit auth routes.
* Set up daily ECS/EB image scans.
* Expand synthetic monitoring (Pingdom) to global POPs.

---

## 📋 Kan‑Ban / Checklist

| Backlog ➡                 | In Progress ➡       | Code Review ➡          | Staging Ready ➡      | Prod Done            |
| ------------------------- | ------------------- | ---------------------- | -------------------- | -------------------- |
| Create `migration` branch | IaC VPC + RDS       | ☐ Terraform review     | DB import dry‑run    | DNS cut‑over         |
| Monorepo skeleton         | Dockerfile build OK | ☐ Turbo tasks lint     | Smoke tests pass     | Remove Replit env    |
| Secrets Manager entries   | EB staging env      | ☐ EB config 🎯         | Blue/green swap plan | Submit iOS build     |
| GitHub Actions pipeline   | S3 upload refactor  | ☐ Drizzle migration CI | User UAT feedback    | Submit Android build |
| Postgres `pg_dump` script |                     |                        |                      |                      |

*(Move each card rightward as tasks advance.)*

---

### Suggested Timeline (aggressive)

| Day  | Milestone                                 |
| ---- | ----------------------------------------- |
| 0‑1  | Branch + IaC skeleton                     |
| 2‑4  | Monorepo restructure, Docker build passes |
| 5‑6  | EB staging green, data migrated           |
| 7    | QA & load test                            |
| 8    | Prod cut‑over                             |
| 9‑14 | Mobile app bootstrap, TestFlight *alpha*  |

— End of Plan —
