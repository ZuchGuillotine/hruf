# AWS Infrastructure Verification Checklist

> **Status**: Infrastructure deployment in progress (May 26, 2025)
> **Stack Name**: `StackTrackerInfraStack`
> **Region**: us-west-2

## Pre-Verification Requirements

- [ ] CloudFormation stack deployment completed successfully
- [ ] All stack outputs available
- [ ] No failed resources in CloudFormation console

## 1. Infrastructure Verification

### VPC and Networking
- [ ] VPC created with correct CIDR (10.0.0.0/16)
- [ ] All subnets created in correct AZs:
  - [ ] Public subnets: 10.0.0.0/24 (us-west-2a), 10.0.1.0/24 (us-west-2b)
  - [ ] Private subnets: 10.0.2.0/24 (us-west-2a), 10.0.3.0/24 (us-west-2b)
  - [ ] Isolated subnets: 10.0.4.0/24 (us-west-2a), 10.0.5.0/24 (us-west-2b)
- [ ] NAT Gateway operational in public subnet
- [ ] Internet Gateway attached to VPC
- [ ] Route tables configured correctly
- [ ] VPC endpoints created for S3, Secrets Manager, RDS

### Security Groups
- [ ] Application security group allows outbound traffic
- [ ] Database security group only allows inbound 5432 from application SG
- [ ] VPC endpoint security groups configured properly

### Commands to Verify VPC
```bash
# Get VPC ID from stack outputs
aws cloudformation describe-stacks --stack-name StackTrackerInfraStack --query 'Stacks[0].Outputs[?OutputKey==`VpcId`].OutputValue' --output text

# Verify subnets
aws ec2 describe-subnets --filters "Name=vpc-id,Values=<VPC_ID>" --query 'Subnets[*].[SubnetId,CidrBlock,AvailabilityZone,Tags[?Key==`aws-cdk:subnet-type`].Value|[0]]' --output table

# Check security groups
aws ec2 describe-security-groups --filters "Name=vpc-id,Values=<VPC_ID>" --query 'SecurityGroups[*].[GroupId,GroupName,Description]' --output table
```

## 2. RDS Database Verification

### Database Instance
- [ ] RDS instance running and available
- [ ] PostgreSQL 15.8 engine confirmed
- [ ] Instance in isolated subnets
- [ ] Security groups properly attached
- [ ] Backup configuration verified (7-day retention)
- [ ] Maintenance window configured (Mon 04:00-05:00 UTC)

### Database Connectivity
- [ ] Database endpoint accessible from private subnets
- [ ] Secrets Manager integration working
- [ ] Database credentials retrievable
- [ ] Connection successful from within VPC

### pgvector Extension
- [ ] Lambda function executed successfully
- [ ] pgvector extension installed
- [ ] Extension functionality verified

### Commands to Verify RDS
```bash
# Get database endpoint
aws cloudformation describe-stacks --stack-name StackTrackerInfraStack --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' --output text

# Verify RDS instance
aws rds describe-db-instances --query 'DBInstances[?DBName==`stacktracker`].[DBInstanceIdentifier,DBInstanceStatus,Engine,EngineVersion,DBInstanceClass]' --output table

# Get database credentials
aws secretsmanager get-secret-value --secret-id stacktracker/db-credentials --query 'SecretString' --output text

# Test connection (from EC2 instance in VPC)
psql -h <RDS_ENDPOINT> -U stacktracker_admin -d stacktracker -c "SELECT version();"

# Verify pgvector extension
psql -h <RDS_ENDPOINT> -U stacktracker_admin -d stacktracker -c "SELECT * FROM pg_extension WHERE extname = 'vector';"
```

## 3. S3 Storage Verification

### Bucket Configuration
- [ ] S3 bucket created with auto-generated name
- [ ] Versioning enabled
- [ ] Server-side encryption configured (AES256)
- [ ] Public access blocked
- [ ] CORS configuration applied

### Bucket Access
- [ ] Bucket accessible from application
- [ ] CORS headers working for web requests
- [ ] Upload/download functionality tested

### Commands to Verify S3
```bash
# Get bucket name
aws cloudformation describe-stacks --stack-name StackTrackerInfraStack --query 'Stacks[0].Outputs[?OutputKey==`UploadsBucketName`].OutputValue' --output text

# Verify bucket configuration
aws s3api get-bucket-versioning --bucket <BUCKET_NAME>
aws s3api get-bucket-encryption --bucket <BUCKET_NAME>
aws s3api get-bucket-cors --bucket <BUCKET_NAME>
aws s3api get-public-access-block --bucket <BUCKET_NAME>

# Test bucket access
aws s3 ls s3://<BUCKET_NAME>
echo "test" | aws s3 cp - s3://<BUCKET_NAME>/test.txt
aws s3 rm s3://<BUCKET_NAME>/test.txt
```

## 4. Secrets Manager Verification

### Secret Configuration
- [ ] Database secret created
- [ ] Secret contains username and password
- [ ] Secret accessible from application security group
- [ ] Automatic rotation configured (if needed)

### Commands to Verify Secrets Manager
```bash
# Get secret ARN
aws cloudformation describe-stacks --stack-name StackTrackerInfraStack --query 'Stacks[0].Outputs[?OutputKey==`DatabaseSecretArn`].OutputValue' --output text

# Verify secret exists and is accessible
aws secretsmanager describe-secret --secret-id stacktracker/db-credentials
aws secretsmanager get-secret-value --secret-id stacktracker/db-credentials
```

## 5. Lambda Function Verification

### pgvector Installer Function
- [ ] Lambda function created successfully
- [ ] Function has proper VPC configuration
- [ ] Function has access to Secrets Manager
- [ ] Function execution logs available in CloudWatch
- [ ] Custom resource completed successfully

### Commands to Verify Lambda
```bash
# Find Lambda function
aws lambda list-functions --query 'Functions[?contains(FunctionName, `PgVectorInstaller`)].[FunctionName,Runtime,VpcConfig.VpcId]' --output table

# Check function logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/StackTrackerInfraStack-PgVectorInstallerFunction"

# Get recent log events
aws logs describe-log-streams --log-group-name "/aws/lambda/StackTrackerInfraStack-PgVectorInstallerFunction" --order-by LastEventTime --descending --max-items 1
```

## 6. Application Integration Preparation

### Environment Variables
- [ ] RDS endpoint documented
- [ ] RDS port documented
- [ ] Database name confirmed
- [ ] S3 bucket name documented
- [ ] Secrets Manager ARN documented
- [ ] VPC configuration documented

### Configuration Updates Needed
```typescript
// Database configuration
const dbConfig = {
  host: process.env.RDS_ENDPOINT, // From CloudFormation output
  port: 5432,
  database: 'stacktracker',
  // Use AWS SDK to get credentials from Secrets Manager
}

// S3 configuration
const s3Config = {
  bucket: process.env.S3_BUCKET_NAME, // From CloudFormation output
  region: 'us-west-2'
}

// Secrets Manager configuration
const secretsConfig = {
  secretId: 'stacktracker/db-credentials',
  region: 'us-west-2'
}
```

## 7. Performance and Monitoring Setup

### CloudWatch Monitoring
- [ ] RDS monitoring enabled
- [ ] Lambda function monitoring enabled
- [ ] VPC Flow Logs configured (optional)
- [ ] CloudWatch alarms set up for critical metrics

### Performance Baselines
- [ ] Database connection time measured
- [ ] S3 upload/download performance tested
- [ ] Lambda function execution time verified

## 8. Security Validation

### Network Security
- [ ] Database not accessible from public internet
- [ ] S3 bucket not publicly accessible
- [ ] Security groups follow principle of least privilege
- [ ] VPC endpoints reduce internet traffic

### Access Control
- [ ] IAM roles and policies reviewed
- [ ] Secrets Manager access properly restricted
- [ ] Lambda function permissions minimal

## 9. Backup and Recovery Testing

### Database Backups
- [ ] Automated backups enabled and tested
- [ ] Point-in-time recovery available
- [ ] Backup retention period confirmed

### Disaster Recovery
- [ ] Multi-AZ deployment considered for production
- [ ] Cross-region backup strategy planned
- [ ] Recovery procedures documented

## 10. Cost Optimization Review

### Resource Sizing
- [ ] RDS instance size appropriate for workload
- [ ] Lambda function memory allocation optimized
- [ ] NAT Gateway usage minimized with VPC endpoints

### Cost Monitoring
- [ ] AWS Cost Explorer configured
- [ ] Billing alerts set up
- [ ] Resource tagging implemented for cost tracking

---

## Verification Completion Checklist

- [ ] All infrastructure components verified
- [ ] Database connectivity confirmed
- [ ] S3 storage accessible
- [ ] Security configurations validated
- [ ] Monitoring and alerting configured
- [ ] Documentation updated with new endpoints
- [ ] Application configuration ready for migration

## Next Steps After Verification

1. **Database Migration Planning**
   - Export current database schema and data
   - Create migration scripts
   - Plan migration timeline and rollback procedures

2. **Application Configuration**
   - Update environment variables
   - Modify database connection logic
   - Update S3 integration code

3. **Testing and Validation**
   - Deploy application to test environment
   - Run comprehensive tests
   - Validate all functionality

4. **Production Cutover Planning**
   - Schedule maintenance window
   - Prepare rollback procedures
   - Plan DNS updates and traffic routing 