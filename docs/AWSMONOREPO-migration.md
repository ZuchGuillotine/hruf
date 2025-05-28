# AWS Infrastructure Migration Guide

## Infrastructure Overview

### VPC Configuration (stacktracker-vpc-v3)
- VPC ID: vpc-0bfbc6bce446d4ced
- CIDR Block: 10.0.0.0/16
- Subnets:
  - Public (Load Balancers):
    - subnet-0a4c0264355eda44e (us-west-2a, 10.0.0.0/24)
    - subnet-04b101642ee61aa20 (us-west-2b, 10.0.1.0/24)
  - Private (Application):
    - 10.0.2.0/24 (us-west-2a)
    - 10.0.3.0/24 (us-west-2b)
  - Isolated (Database):
    - 10.0.4.0/24 (us-west-2a)
    - 10.0.5.0/24 (us-west-2b)
- Security Groups:
  - Application SG: Outbound traffic for app servers
  - Database SG (sg-033417a7d86b9a062): Inbound 5432 from Application SG only
- VPC Endpoints:
  - S3 Gateway Endpoint
  - Secrets Manager Interface Endpoint
  - Systems Manager Interface Endpoint

### RDS Configuration
- Instance: stacktracker-migration-db
- Engine: PostgreSQL 17.5
- Configuration:
  - Subnet Group: stacktracker-migration-subnet-group
  - Parameter Group: stacktracker-migration-param-group
  - Security Group: sg-033417a7d86b9a062
  - Storage: 20GB (auto-scaling to 100GB)
  - Backups: 7-day retention
  - Maintenance Window: Mon 04:00-05:00 UTC
- Security:
  - Private subnet placement
  - No public access
  - Encrypted at rest
  - SSL/TLS required for connections

### Elastic Beanstalk Environment
- Name: stacktracker-env-v3
- Platform: Docker (Amazon Linux 2023 v4.5.2)
- Configuration:
  - VPC: vpc-0bfbc6bce446d4ced
  - Subnet placement: Private subnets
  - IAM roles and instance profile
  - Environment variables
  - Health check endpoint: /_health
  - Load balancer in public subnets
  - Auto-scaling settings

## Security Best Practices
1. Network Security:
   - All resources in VPC
   - Database in isolated subnet
   - Application servers in private subnet
   - Load balancers in public subnet
   - No direct internet access to database
   - VPC endpoints for AWS services

2. Access Control:
   - IAM roles for services
   - Security groups with least privilege
   - Secrets Manager for credentials
   - SSL/TLS for all connections
   - Regular security group audits

3. Monitoring and Logging:
   - CloudWatch for metrics and logs
   - RDS performance insights
   - VPC flow logs
   - Security group changes tracking
   - Database access monitoring

4. Backup and Recovery:
   - Automated RDS backups
   - Point-in-time recovery
   - Cross-region backup copies
   - Regular backup testing
   - Documented recovery procedures

## Migration Steps
1. Infrastructure Setup:
   - Create VPC and subnets
   - Configure security groups
   - Set up VPC endpoints
   - Create RDS instance
   - Configure Elastic Beanstalk

2. Database Migration:
   - Create new RDS instance
   - Configure security groups
   - Set up parameter groups
   - Enable encryption
   - Test connectivity

3. Application Deployment:
   - Update environment variables
   - Configure load balancer
   - Set up auto-scaling
   - Enable monitoring
   - Test health checks

4. Security Verification:
   - Verify VPC configuration
   - Test security groups
   - Validate IAM roles
   - Check encryption
   - Audit access logs

## Post-Migration Tasks
1. Security:
   - Verify no public access to database
   - Confirm security group rules
   - Check VPC endpoint connectivity
   - Validate SSL/TLS connections
   - Review IAM permissions

2. Monitoring:
   - Set up CloudWatch alarms
   - Configure RDS monitoring
   - Enable VPC flow logs
   - Set up backup monitoring
   - Create performance baselines

3. Documentation:
   - Update infrastructure diagrams
   - Document security configurations
   - Create runbooks
   - Update access procedures
   - Document backup/restore processes

## Maintenance Procedures
1. Regular Tasks:
   - Security group audits
   - IAM role reviews
   - Backup verification
   - Performance monitoring
   - Log analysis

2. Update Procedures:
   - RDS parameter updates
   - Security group modifications
   - VPC endpoint changes
   - IAM role updates
   - Environment variable changes

3. Emergency Procedures:
   - Database failover
   - Security incident response
   - Backup restoration
   - Access revocation
   - Incident documentation 