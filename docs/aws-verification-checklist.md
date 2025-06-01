# AWS Infrastructure Verification Checklist

> **Status**: Deployed & Post-Migration Verification (as of recent updates)
> **Stack Name**: `StackTrackerInfraStackV3`
> **Region**: us-west-2

## Pre-Verification Requirements

- [x] CloudFormation stack deployment completed successfully (`StackTrackerInfraStackV3` and `StackTrackerMonitoringStackV3`)
- [x] All stack outputs available (verified via CDK deploy output)
- [x] No failed resources in CloudFormation console (verified by successful `cdk deploy`)

## 1. Infrastructure Verification

### VPC and Networking
- [x] VPC created with correct CIDR (10.0.0.0/16) - VPC ID: `vpc-0028b3c9845c20985`
- [x] All subnets created in correct AZs:
  - [x] Public subnets (e.g., `subnet-0fc4f88a966ccc3b1`, `subnet-07d1bc08a9a0dfc6a`)
  - [x] Private subnets (e.g., `subnet-05d67bc6ea9521956`, `subnet-037109f45cec36809`)
  - [x] Isolated subnets (also defined by CDK)
- [x] NAT Gateway operational in public subnet
- [x] Internet Gateway attached to VPC
- [x] Route tables configured correctly (verified for public access)
- [x] VPC endpoints created for S3, Secrets Manager, RDS

### Security Groups
- [x] Application security group (`sg-01ed149510a39a212`) allows outbound traffic
- [x] Database security group (`sg-0739944e69f7dd7a6`) allows inbound 5432 from application SG and dev IP `73.97.54.60/32`
- [x] VPC endpoint security groups configured properly

### Commands to Verify VPC
```bash
# Get VPC ID from stack outputs
aws cloudformation describe-stacks --stack-name StackTrackerInfraStackV3 --query 'Stacks[0].Outputs[?OutputKey==`VpcId`].OutputValue' --output text

# Verify subnets (replace <VPC_ID> with actual ID: vpc-0028b3c9845c20985)
aws ec2 describe-subnets --filters "Name=vpc-id,Values=vpc-0028b3c9845c20985" --query 'Subnets[*].[SubnetId,CidrBlock,AvailabilityZone,Tags[?Key==`aws-cdk:subnet-type`].Value|[0]]' --output table

# Check security groups (replace <VPC_ID> with actual ID: vpc-0028b3c9845c20985)
aws ec2 describe-security-groups --filters "Name=vpc-id,Values=vpc-0028b3c9845c20985" --query 'SecurityGroups[*].[GroupId,GroupName,Description]' --output table
```

## 2. RDS Database Verification

### Database Instance
- [x] RDS instance `stacktracker-db-v3` running and available
- [x] PostgreSQL `16.9` engine confirmed
- [x] Instance in a subnet group (`stacktracker-mixed-subnet-group-v3`) allowing public access (currently for dev)
- [x] Security group `sg-0739944e69f7dd7a6` properly attached
- [x] Backup configuration verified (7-day retention by CDK default)
- [x] Maintenance window configured (CDK defaults or as specified)

### Database Connectivity
- [x] Database endpoint `stacktracker-db-v3.clcggkmq0zdo.us-west-2.rds.amazonaws.com` accessible
- [x] Secrets Manager integration working (secret: `stacktracker/db-credentials-v3`)
- [x] Database credentials retrievable
- [x] Connection successful from local dev machine (verified)
- [ ] Connection successful from Elastic Beanstalk environment (To be fully tested by app)

### PostgreSQL Extensions (fuzzystrmatch, pg_trgm, vector)
- [x] Extensions were part of `pg_restore` from dump file.
- [x] Extensions functionality verified via `psql (\dx)` after restore.

### Commands to Verify RDS
```bash
# Get database endpoint
aws cloudformation describe-stacks --stack-name StackTrackerInfraStackV3 --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' --output text

# Verify RDS instance
aws rds describe-db-instances --db-instance-identifier stacktracker-db-v3 --query 'DBInstances[0].[DBInstanceIdentifier,DBInstanceStatus,Engine,EngineVersion,DBInstanceClass]' --output table

# Get database credentials
aws secretsmanager get-secret-value --secret-id stacktracker/db-credentials-v3 --query 'SecretString' --output text

# Test connection (from local machine or EC2 instance in VPC)
# export PGPASSWORD='<PASSWORD_FROM_SECRET>'
# psql -h stacktracker-db-v3.clcggkmq0zdo.us-west-2.rds.amazonaws.com -U stacktracker_admin -d stacktracker -c "SELECT version();"

# Verify extensions
# psql -h stacktracker-db-v3.clcggkmq0zdo.us-west-2.rds.amazonaws.com -U stacktracker_admin -d stacktracker -c "\\dx"
# psql -h stacktracker-db-v3.clcggkmq0zdo.us-west-2.rds.amazonaws.com -U stacktracker_admin -d stacktracker -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

## 3. S3 Storage Verification

### Bucket Configuration
- [x] S3 bucket created (e.g., `stacktrackerinfrastackv3-uploadsbucket...`)
- [x] Versioning enabled
- [x] Server-side encryption configured (AES256)
- [x] Public access blocked
- [x] CORS configuration applied

### Bucket Access
- [ ] Bucket accessible from Elastic Beanstalk application (To be fully tested by app)
- [ ] CORS headers working for web requests (To be tested by app)
- [ ] Upload/download functionality tested (To be tested by app)

### Commands to Verify S3
```bash
# Get bucket name
aws cloudformation describe-stacks --stack-name StackTrackerInfraStackV3 --query 'Stacks[0].Outputs[?OutputKey==`UploadsBucketName`].OutputValue' --output text

# Verify bucket configuration (replace <BUCKET_NAME> with actual name)
# aws s3api get-bucket-versioning --bucket <BUCKET_NAME>
# aws s3api get-bucket-encryption --bucket <BUCKET_NAME>
# aws s3api get-bucket-cors --bucket <BUCKET_NAME>
# aws s3api get-public-access-block --bucket <BUCKET_NAME>

# Test bucket access (replace <BUCKET_NAME> with actual name)
# aws s3 ls s3://<BUCKET_NAME>
# echo "test" | aws s3 cp - s3://<BUCKET_NAME>/test.txt
# aws s3 rm s3://<BUCKET_NAME>/test.txt
```

## 4. Secrets Manager Verification

### Secret Configuration
- [x] Database secret `stacktracker/db-credentials-v3` created
- [x] Secret contains username and password (verified by retrieval)
- [x] Secret accessible from application security group (by IAM policy on EB instance role)
- [ ] Automatic rotation configured (N/A for this setup, can be added later if needed)

### Commands to Verify Secrets Manager
```bash
# Get secret ARN
aws cloudformation describe-stacks --stack-name StackTrackerInfraStackV3 --query 'Stacks[0].Outputs[?OutputKey==`DatabaseSecretArn`].OutputValue' --output text

# Verify secret exists and is accessible
aws secretsmanager describe-secret --secret-id stacktracker/db-credentials-v3
aws secretsmanager get-secret-value --secret-id stacktracker/db-credentials-v3
```

## 5. Lambda Function Verification (pgvector Installer - N/A for current setup)

> **Note:** PostgreSQL extensions (`vector`, `fuzzystrmatch`, `pg_trgm`) were included in the `pg_dump` from the source database and restored directly into `stacktracker-db-v3`. A separate Lambda installer function is not part of the current `StackTrackerInfraStackV3` for this purpose.

- [N/A] Lambda function created successfully
- [N/A] Function has proper VPC configuration
- [N/A] Function has access to Secrets Manager
- [N/A] Function execution logs available in CloudWatch
- [N/A] Custom resource completed successfully

### Commands to Verify Lambda (N/A for pgvector installer)
```bash
# (Commands below are for a hypothetical Lambda, not currently in use for pgvector)
# aws lambda list-functions --query 'Functions[?contains(FunctionName, `PgVectorInstaller`)].[FunctionName,Runtime,VpcConfig.VpcId]' --output table
# aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/StackTrackerInfraStackV3-PgVectorInstallerFunction"
# aws logs describe-log-streams --log-group-name "/aws/lambda/StackTrackerInfraStackV3-PgVectorInstallerFunction" --order-by LastEventTime --descending --max-items 1
```

## 6. Application Integration Preparation (Elastic Beanstalk)

### Environment Variables (Managed by CDK and EB Console)
- [x] RDS endpoint documented (`stacktracker-db-v3.clcggkmq0zdo.us-west-2.rds.amazonaws.com`)
- [x] RDS port documented (`5432`)
- [x] Database name confirmed (`stacktracker`)
- [x] S3 bucket name documented (e.g., `stacktrackerinfrastackv3-uploadsbucket...`)
- [x] Secrets Manager ARN for DB creds documented (`arn:aws:secretsmanager:us-west-2:881490119784:secret:stacktracker/db-credentials-v3-Rl67v3`)
- [x] VPC configuration for EB is handled by CDK.

### Configuration Updates Needed (Conceptual for Application Code)
```typescript
// Example: Database configuration in application
// Actual implementation will use environment variables set by Elastic Beanstalk
// which are sourced from CDK outputs and Secrets Manager.

const dbConfig = {
  host: process.env.RDS_HOST, // Set in EB environment
  port: process.env.RDS_PORT, // Set in EB environment (e.g., 5432)
  database: process.env.RDS_DB_NAME, // Set in EB environment (e.g., 'stacktracker')
  user: process.env.RDS_USERNAME, // Potentially sourced via SDK from Secrets Manager
  password: process.env.RDS_PASSWORD, // Potentially sourced via SDK from Secrets Manager
  // Or, use AWS SDK to get credentials directly from Secrets Manager ARN (RDS_SECRET_ARN)
};

// Example: S3 configuration in application
const s3Config = {
  bucket: process.env.S3_BUCKET, // Set in EB environment
  region: 'us-west-2' // Or as configured
};
```

## 7. Performance and Monitoring Setup

### CloudWatch Monitoring
- [x] RDS monitoring enabled (default, enhanced can be configured)
- [ ] Lambda function monitoring enabled (N/A for pgvector installer)
- [ ] VPC Flow Logs configured (Optional, can be enabled if needed for deep network troubleshooting)
- [x] CloudWatch alarms set up for critical metrics (Part of Monitoring Stack)

### Performance Baselines
- [x] Database connection time measured (locally successful)
- [ ] S3 upload/download performance tested (To be tested via application)
- [ ] Lambda function execution time verified (N/A for pgvector installer)

## 8. Security Validation

### Network Security
- [x] Database `stacktracker-db-v3` currently publicly accessible for dev (security group `sg-0739944e69f7dd7a6` allows dev IP). Plan to restrict for prod.
- [x] S3 bucket not publicly accessible.
- [x] Security groups follow principle of least privilege (generally, with noted dev exception for DB).
- [x] VPC endpoints reduce internet traffic.

### Access Control
- [x] IAM roles and policies reviewed (CDK defaults for EB, RDS, etc.)
- [x] Secrets Manager access properly restricted (EB instance role has access to `stacktracker/db-credentials-v3`).
- [ ] Lambda function permissions minimal (N/A for pgvector installer).

## 9. Backup and Recovery Testing

### Database Backups
- [x] Automated backups enabled and tested (CDK default, existence verified).
- [x] Point-in-time recovery available (standard RDS feature).
- [x] Backup retention period confirmed (7 days by CDK default).

### Disaster Recovery
- [ ] Multi-AZ deployment considered for production (Currently Single-AZ by CDK default for cost, can be changed).
- [ ] Cross-region backup strategy planned (Future consideration).
- [ ] Recovery procedures documented (Part of general DR planning).

## 10. Cost Optimization Review

### Resource Sizing
- [x] RDS instance size (`db.t3.micro`) appropriate for current workload/MVP.
- [ ] Lambda function memory allocation optimized (N/A for pgvector).
- [x] NAT Gateway usage minimized with VPC endpoints.

### Cost Monitoring
- [ ] AWS Cost Explorer configured (User responsibility).
- [ ] Billing alerts set up (User responsibility).
- [x] Resource tagging implemented by CDK for cost tracking.

---

## Verification Completion Checklist

- [x] All key infrastructure components verified (VPC, RDS, S3, Secrets Manager)
- [x] Database connectivity confirmed (local, EB pending full app test)
- [ ] S3 storage accessible (pending full app test)
- [x] Security configurations validated (with dev exceptions noted)
- [x] Monitoring and alerting configured (basic via Monitoring Stack)
- [x] Documentation updated with new endpoints (`Unified-AWS-Migration-And-Infrastructure-Plan.md`)
- [x] Application configuration ready for environment variables.

## Next Steps After Verification

1.  **Application Deployment & Thorough Testing on Elastic Beanstalk**
    *   Deploy latest application build to `stacktracker-env-v3`.
    *   Perform end-to-end testing of all features.
    *   Verify S3 uploads/downloads through the application.
    *   Confirm all database interactions are successful.

2.  **CI/CD Pipeline Finalization**
    *   Ensure GitHub Actions workflows for `build-web`, `deploy-web` are targeting the correct EB environment.
    *   Test `db-migrate` job (Drizzle migrations) against `stacktracker-db-v3` if further schema changes occur.

3.  **Production Cutover Planning (If applicable, or formalizing current setup as prod)**
    *   Schedule maintenance window if a formal cutover is happening.
    *   Prepare rollback procedures (e.g., previous EB application version).
    *   Plan DNS updates if changing domains.

4.  **Post-Launch Hardening**
    *   Transition RDS `stacktracker-db-v3` to private access only (modify subnet group and security group to remove public access and dev IP rule) once direct dev access is no longer needed.
    *   Consider enabling Multi-AZ for RDS for higher availability.
    *   Review and enhance WAF rules. 