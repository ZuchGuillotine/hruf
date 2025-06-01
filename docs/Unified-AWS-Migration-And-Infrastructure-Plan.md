# StackTracker AWS Migration & Monorepo Transition Plan

> **Goal** – Move the live StackTracker web app from its previous hosting to AWS (Elastic Beanstalk + RDS PostgreSQL), while restructuring the codebase into a Turbo/Nx monorepo that will later power iOS & Android builds via Expo. The cut‑over aims to preserve all current functionality.

---

## Implementation Status (Reflecting Current State as of Recent Redeployment)

### Completed & Current ✅
1.  **AWS Account Setup**
    *   IAM user with custom policy for infrastructure deployment configured.
    *   AWS CLI credentials configured.
    *   CDK environment bootstrapped.

2.  **Infrastructure as Code (IaC) - Current Active Stack: `StackTrackerInfraStackV3`**
    *   CDK project in `/infra` directory.
    *   **VPC Infrastructure (`vpc-0028b3c9845c20985`):**
        *   CIDR: `10.0.0.0/16`
        *   Public Subnets (e.g., `subnet-0fc4f88a966ccc3b1`, `subnet-07d1bc08a9a0dfc6a`) for load balancers and NAT Gateway.
        *   Private Subnets (e.g., `subnet-05d67bc6ea9521956`, `subnet-037109f45cec36809`) for application servers.
        *   Isolated Subnets (also defined by CDK, though current RDS uses a mixed group).
        *   NAT Gateway for private subnet internet access.
        *   VPC endpoints for S3, Secrets Manager, and RDS.
    *   **RDS Instance (`stacktracker-db-v3`):**
        *   Engine: PostgreSQL `16.9`.
        *   Endpoint: `stacktracker-db-v3.clcggkmq0zdo.us-west-2.rds.amazonaws.com`
        *   Port: `5432`.
        *   Instance Class: `db.t3.micro` (or as per current CDK).
        *   Storage: 20GB (auto-scaling to 100GB).
        *   Security Group: `sg-0739944e69f7dd7a6` (`StackTrackerInfraStackV3-DatabaseSecurityGroup...`), allows access from Elastic Beanstalk App SG (`sg-01ed149510a39a212`) and dev IP (`73.97.54.60/32`).
        *   Subnet Group: `stacktracker-mixed-subnet-group-v3` (logical name in CDK), utilizing public and private subnets for flexible access, currently enabling public accessibility for development.
        *   Parameter group configured (pgvector support considered, extensions `fuzzystrmatch`, `pg_trgm`, `vector` were part of restore process).
        *   Automated backups (7-day retention).
        *   Maintenance windows configured.
        *   Credentials managed by AWS Secrets Manager: `stacktracker/db-credentials-v3` (ARN: `arn:aws:secretsmanager:us-west-2:881490119784:secret:stacktracker/db-credentials-v3-Rl67v3`).
    *   **S3 Bucket for Uploads:**
        *   Auto-generated unique name by CDK (e.g., `stacktrackerinfrastackv3-uploadsbucket...`).
        *   Versioning enabled.
        *   Server-side encryption (AES256).
        *   CORS configuration for web access.
        *   Public access blocked.
    *   **Elastic Beanstalk (`stacktracker-app-v3` application, `stacktracker-env-v3` environment):**
        *   Docker platform (Amazon Linux 2023 v4.5.2).
        *   Deployed in VPC `vpc-0028b3c9845c20985`, using private subnets for instances and public subnets for the load balancer.
        *   IAM roles and instance profile configured.
        *   Environment variables configured to connect to `stacktracker-db-v3` via its endpoint and Secrets Manager.
        *   Health check endpoint: `/_health`.
    *   **Monitoring Stack:**
        *   CloudWatch dashboard for RDS and EB metrics.
        *   Alarms for CPU utilization, connections, etc.
        *   WAF rules for security, rate limiting, SQL injection protection.

3.  **Data Migration to `stacktracker-db-v3`**
    *   Data successfully restored to `stacktracker-db-v3` from local `stacktracker_replit_backup.dump` file using `pg_restore`.
    *   Schema and data verified via `psql` connection.

4.  **Connectivity**
    *   Elastic Beanstalk application can connect to `stacktracker-db-v3`.
    *   Local development environment can connect to `stacktracker-db-v3` (due to public accessibility and security group rule for `73.97.54.60/32`).

### In Progress 🚧 / Pending ⏳
1.  **Application Deployment & Testing on Elastic Beanstalk**
    *   Thorough testing of application functionality on the Elastic Beanstalk environment.
    *   Verification of all integrations (S3, RDS, external services).

2.  **CI/CD Pipeline (GitHub Actions - as per original plan)**
    *   Finalize GitHub Actions workflow for `build-web`, `deploy-web`, `db-migrate` (Drizzle), `promote-prod`.

3.  **Monorepo Refinements & Mobile App Development**
    *   Continue structuring `apps/web` and `apps/mobile` within the monorepo.
    *   Integrate shared UI/core packages.
    *   Proceed with mobile app development using Expo.

4.  **Post-Migration Hardening (To be prioritized after stabilization)**
    *   Review and potentially restrict public access to `stacktracker-db-v3` once development requiring it is complete, relying on VPC internal access for EB.
    *   Enable RDS Multi-AZ.
    *   Expand WAF rules and synthetic monitoring.

---

## Original Migration & Monorepo Plan Sections (Review and update as needed)

*(Sections below are from the original planning documents. They should be reviewed for continued relevance and updated where assumptions have changed based on the implemented infrastructure.)*

## 0 · Prerequisites & Assumptions (Original)

*   Small active user base (<100) ⇒ brief read‑only window is acceptable but strive for 0‑downtime.
*   AWS account, Route 53, and Apple/Google developer accounts are already provisioned.
*   Current Postgres data (originally on Replit) exportable with `pg_dump` (This was done, resulting in `stacktracker_replit_backup.dump`).
*   CI provider is GitHub Actions.

---

## 1 · Branch Strategy (Original)

1.  **Create long‑lived branch** `migration/aws-monorepo` off `main`. (Assumed done)
2.  Protect `main`; all prod deploys continued via previous hosting until final cut‑over.
3.  Periodically merge `main` → `migration` to stay up to date.

---

## 2 · Infrastructure Summary Table (Current State)

| Stack Component      | Service                     | Notes                                                                                                                            |
| -------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **VPC**              | AWS VPC                     | `vpc-0028b3c9845c20985`. 2 Public, 2 Private, 2 Isolated Subnets. NAT GW. Endpoints.                                             |
| **Database**         | **RDS PostgreSQL 16.9**     | `stacktracker-db-v3`. `db.t3.micro` (example). Configured for dev access, connects to EB. Credentials via Secrets Manager. Extensions (vector, etc.) restored. |
| **Compute**          | **Elastic Beanstalk (EB)**  | `stacktracker-env-v3`. Docker platform. Load‑balanced. Connects to RDS.                                                            |
| **Storage**          | S3 bucket                   | Auto-named (e.g., `stacktrackerinfrastackv3-uploadsbucket...`). Versioning on. Pre‑signed uploads.                                  |
| **Secrets**          | AWS Secrets Manager         | `stacktracker/db-credentials-v3`. Stores DB creds, API keys.                                                                     |
| **Monitoring**       | CloudWatch Logs + Alarms, WAF | EB log streaming; alarms on 5xx & CPU. WAF active.                                                                              |

---

## 3 · Monorepo Scaffolding (Original Plan - Verify Status)

```
/
├ apps/
│  ├ web/        # existing Vite/Express app
│  └ mobile/     # Expo placeholder
├ packages/
│  ├ ui/         # shared RN + web components
│  └ core/       # api clients, hooks, utils
├ infra/         # IaC code (AWS CDK - StackTrackerInfraStackV3)
├ turbo.json
├ package.json   # workspaces
└ tsconfig.json
```
1.  Enable pnpm or Yarn workspaces.
2.  Add Turbo tasks: `build`, `lint`, `test`, `deploy:web`.
3.  Move current code into `apps/web`; fix paths. (Status: In progress/Done as per docs)

---

## 4 · Containerization & EB (Original Plan - Verify Status)

1.  Add multi‑stage Dockerfile in `apps/web`.
2.  Use Docker platform on Elastic Beanstalk (Done).
3.  EB environment variables map to Secrets Manager values (Done).
4.  Configure EB health check to `/_health` (Done).

---

## 5 · CI/CD Pipeline (GitHub Actions - Original Plan)

| Job            | Trigger                | Key Steps                                           |
| -------------- | ---------------------- | --------------------------------------------------- |
| `build-web`    | push → `migration/*`   | Turbo cache → Docker build → push to ECR.            |
| `deploy-web`   | success of `build-web` | Update EB environment via CLI; wait for green.      |
| `db-migrate`   | after deploy           | Run Drizzle migrations (e.g.,`drizzle-kit push:pg`) against RDS. |
| `promote-prod` | tag `v*` on `main`     | Same build, deploy to **prod** EB.                  |
| `mobile-build` | on‑demand              | `eas build --platform all`.                        |

---

## 6 · Data Migration (Recap of what was done)

1.  Previous Replit DB data was dumped using `pg_dump` into `stacktracker_replit_backup.dump`.
2.  This dump file was restored into the new AWS RDS instance `stacktracker-db-v3` using `pg_restore`.
3.  The `stacktracker-db-v3` instance is now the source of truth for the application.

---

## 7 · Cut‑Over / Production Switch (Future Step - Original Plan)

1.  Lower DNS TTL to 60 seconds (24 h prior).
2.  Merge `migration` → `main`; pipeline deploys to **prod** EB.
3.  Validate ALB health checks, Stripe webhooks.
4.  Switch Route 53 record to EB ALB.
5.  Monitor logs & metrics for 30 minutes; rollback via previous EB version if needed.

---

## 8 · Mobile Roll‑Out (Future Step - Original Plan)

1.  Scaffold `apps/mobile` via Expo TS template.
2.  Consume `packages/ui` components.
3.  Configure `.env.*` for API base URL & publishable keys.
4.  Integrate Apple/Google sign‑in (if required).
5.  Build with EAS Build; TestFlight & internal testing.
6.  Submit to App Store & Play Store.
7.  Link store listings to privacy policy (hosted on website).

---

## 9 · Risk Mitigation & Rollback (Original Plan - Review for current relevance)

*   Keep previous hosting live until DNS cut‑over (if applicable).
*   Automated snapshots on RDS `stacktracker-db-v3` are active.
*   Use EB blue/green deployments for zero‑downtime swap if possible.

---

## 10 · Security Best Practices & Hardening (Ongoing & Future)

1.  **Network Security:**
    *   All resources in VPC `vpc-0028b3c9845c20985`.
    *   Database `stacktracker-db-v3` currently in a mixed subnet group enabling public dev access. **Plan to transition to isolated/private subnet access only for production workloads**, accessible only via VPC internal resources (like Elastic Beanstalk).
    *   Application servers (EB instances) in private subnets.
    *   Load balancers in public subnets.
    *   VPC endpoints for AWS services used.
2.  **Access Control:**
    *   IAM roles for services.
    *   Security groups with least privilege (current setup for `stacktracker-db-v3` SG `sg-0739944e69f7dd7a6` allows specific dev IP and EB app SG).
    *   Secrets Manager (`stacktracker/db-credentials-v3`) for credentials.
    *   SSL/TLS for all connections (RDS enforces SSL, EB ALB terminates HTTPS).
3.  **Monitoring and Logging:** CloudWatch, RDS Performance Insights, VPC Flow Logs are configured or can be enhanced.

---

## Verification Steps (For `stacktracker-db-v3`)

### 1. Database Connectivity Test
```bash
# Get database credentials from Secrets Manager
aws secretsmanager get-secret-value --secret-id stacktracker/db-credentials-v3 --query SecretString --output text

# Set PGPASSWORD (example, use actual password from above)
# export PGPASSWORD='YOUR_DB_PASSWORD'

# Test connection from local machine (if public access & SG rule for your IP is active)
psql --host=stacktracker-db-v3.clcggkmq0zdo.us-west-2.rds.amazonaws.com \\
     --port=5432 \\
     --username=stacktracker_admin \\
     --dbname=stacktracker

# Inside psql, verify tables and extensions:
# \dt
# \dx
# SELECT * FROM pg_extension WHERE extname = 'vector'; # or fuzzystrmatch, pg_trgm
```

### 2. Elastic Beanstalk to RDS Connectivity
*   Check Elastic Beanstalk logs for any database connection errors upon application startup.
*   Test application endpoints that interact with the database.

---

This consolidated document should provide a much clearer picture of your current infrastructure and ongoing migration plan. 