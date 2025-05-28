# StackTracker AWS RDS Database Migration Plan (Simplified)

## 1. Objective
Migrate the StackTracker PostgreSQL database from Replit to AWS RDS with minimal, acceptable downtime, suitable for a small database and low user traffic.

## 2. Assumptions
*   Small database size and low active user base.
*   A brief period of application downtime (or read-only mode) is acceptable during the migration window.
*   The AWS RDS instance (created via `StackTrackerInfraStack`) is fully deployed, configured with the `pgvector` extension, and accessible.
*   Necessary command-line tools (`psql`, `pg_dump`, `pg_restore`, AWS CLI) are available on a machine that can connect to both the Replit DB and the new RDS instance.
*   Credentials for both the Replit PostgreSQL database and the AWS RDS instance are known.

## 3. Migration Steps

### A. Preparation
1.  **Backup Replit Database**:
    *   Perform a complete backup of your current Replit PostgreSQL database before starting any migration activities. This is your primary safety net.
2.  **Retrieve RDS Instance Details**:
    *   **RDS Endpoint**: Get this from the AWS CloudFormation stack outputs for `StackTrackerInfraStack` or the AWS RDS console.
    *   **RDS Admin Username**: This is the master username you defined (e.g., `stacktracker_admin`).
    *   **RDS Admin Password**: Retrieve this from AWS Secrets Manager (secret ID: `stacktracker/db-credentials`).
    ```bash
    # Example command to retrieve secret
    aws secretsmanager get-secret-value --secret-id stacktracker/db-credentials --query SecretString --output text
    ```
3.  **Ensure Network Accessibility**:
    *   Confirm that the machine you will use for `pg_restore` can connect to the RDS instance's endpoint on port `5432`.
    *   This typically means running the restore process from:
        *   An EC2 instance within the same VPC as your RDS instance.
        *   Your local machine, if you've configured the RDS instance's security group to allow inbound traffic from your IP address (for temporary migration purposes only) and your network allows outbound connections.
4.  **Schedule Maintenance Window**:
    *   Notify any active users about a brief maintenance period during which the application might be unavailable or in read-only mode.

### B. Data Export from Replit
1.  **(Recommended) Place Application in Read-Only/Maintenance Mode**:
    *   To ensure data consistency, prevent any new writes to the Replit database during the export process.
    *   Update your application to temporarily disable write operations or display a maintenance page.
2.  **Execute `pg_dump`**:
    *   Use `pg_dump` to create a compressed, custom-format backup of your Replit database.
    ```bash
    pg_dump "postgresql://YOUR_REPLIT_DB_USER:YOUR_REPLIT_DB_PASSWORD@YOUR_REPLIT_DB_HOST:YOUR_REPLIT_DB_PORT/YOUR_REPLIT_DB_NAME" \
      --format=custom \
      --blobs \
      --verbose \
      --file=stacktracker_replit_backup.dump
    ```
    *   **Replace placeholders** with your actual Replit database connection details.
    *   Store `stacktracker_replit_backup.dump` securely.

### C. Data Import to AWS RDS
1.  **Transfer Dump File (if necessary)**:
    *   If `pg_dump` was executed on a machine different from where `pg_restore` will run, securely transfer the `stacktracker_replit_backup.dump` file to the machine with RDS access (e.g., using `scp` or AWS S3).
2.  **Execute `pg_restore`**:
    *   Restore the database dump into your AWS RDS PostgreSQL instance. The target database (`stacktracker`) should have been created by your CDK/CloudFormation script.
    ```bash
    # Set the PGPASSWORD environment variable to avoid interactive prompt if preferred
    # export PGPASSWORD='YOUR_RDS_ADMIN_PASSWORD'
    
    pg_restore \
      --host=<YOUR_RDS_ENDPOINT> \
      --port=5432 \
      --username=<YOUR_RDS_ADMIN_USERNAME> \
      --dbname=stacktracker \
      --clean \
      --if-exists \
      --verbose \
      stacktracker_replit_backup.dump
    
    # unset PGPASSWORD
    ```
    *   Replace `<YOUR_RDS_ENDPOINT>` and `<YOUR_RDS_ADMIN_USERNAME>` with the actual values.
    *   You will be prompted for the RDS admin password if `PGPASSWORD` is not set.
    *   The `--clean` and `--if-exists` flags help ensure a clean import by dropping and recreating database objects if they already exist from a previous attempt.

### D. Post-Migration & Go-Live
1.  **Update Application Configuration**:
    *   Modify your StackTracker application's environment variables to use the new AWS RDS database:
        *   `DATABASE_URL` or individual variables like `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
        *   Ensure the application uses the RDS endpoint, port `5432`, the `stacktracker` database name, and the appropriate credentials (consider creating a less privileged read/write user for the application rather than using the master user long-term).
2.  **Thoroughly Test Application**:
    *   Restart your application to apply the new configuration.
    *   Verify all core functionalities, including user login, data creation, reading, updating, and deletion.
    *   Specifically test any features that rely on the `pgvector` extension.
    *   Check data integrity by comparing some records with the old database if possible.
3.  **Disable Maintenance Mode / Re-enable Writes**:
    *   Once you are confident that the application is working correctly with the new RDS database, disable the maintenance mode or re-enable write operations.
4.  **Monitor**:
    *   Closely monitor application logs for any database-related errors.
    *   Check AWS CloudWatch metrics for the RDS instance (CPU utilization, connections, read/write IOPS).

## 4. Rollback Plan (Simplified)
In case of critical issues during or immediately after the migration that cannot be quickly resolved:
1.  **Revert Application Configuration**: Change the application's environment variables back to point to the Replit PostgreSQL database.
2.  **Restore Replit DB State**: If the Replit DB was put in read-only mode, re-enable write access.
3.  **Resume Operations**: The application will now operate using the original Replit database.
4.  **Troubleshoot**: Investigate the cause of the RDS migration failure offline before re-attempting.

## 5. Final Steps (Post-Successful Migration)
*   After a period of stable operation (e.g., 24-48 hours) using the AWS RDS database:
    1.  Perform a final backup of the (now old) Replit database.
    2.  Plan the decommissioning and cleanup of the Replit PostgreSQL database resources.

---

## AWS Migration Details (May 2025 Update)

- **VPC**: vpc-0bfbc6bce446d4ced (`stacktracker-vpc-v3`)
- **Migration RDS Instance**: `stacktracker-migration-db`
- **Public Subnets**: subnet-0a4c0264355eda44e (us-west-2a), subnet-04b101642ee61aa20 (us-west-2b)
- **Subnet Group**: `stacktracker-migration-subnet-group`
- **Parameter Group**: `stacktracker-migration-param-group`
- **PostgreSQL Version**: 17.5
- **Security Group**: sg-033417a7d86b9a062

### Migration Steps (Updated)
1. Create a new RDS instance (`stacktracker-migration-db`) in the public subnets using the above subnet group and parameter group, with PostgreSQL 17.5.
2. Allow your IP address in the security group (sg-033417a7d86b9a062) for port 5432.
3. Perform the migration using `pg_restore`.
4. **After migration is verified:**
   - Modify the RDS instance to use the private/isolated subnet group.
   - Remove your IP from the security group.
   - Set the RDS instance to not be publicly accessible.

### Security Reminder
- **IMPORTANT:** Publicly accessible RDS instances are at risk of attack. Only enable public access for the duration of the migration, and restrict access to your IP.
- After migration, always revert the RDS instance to private subnets and remove public access/security group rules.

### Checklist: Reverting Public Access
- [ ] Modify RDS instance to use private/isolated subnet group
- [ ] Set `PubliclyAccessible` to `false`
- [ ] Remove your IP from the security group
- [ ] Verify database is only accessible from within the VPC

---
This simplified plan should be suitable for your needs. Remember to replace all placeholder values with your actual configuration details. 