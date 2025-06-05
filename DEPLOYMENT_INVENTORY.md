# Deployment Files Inventory

## 🐳 Docker Files
- `Dockerfile` - Main production Docker configuration (32 lines)
- `.dockerignore` - Docker build exclusions (6 lines)
- `backup_config/Dockerfile` - Backup Docker config (32 lines)
- `backup_config/.dockerignore` - Backup Docker ignore (6 lines)

## ☁️ AWS CDK Infrastructure Files

### Source Code
- `infra/bin/infra.js` - CDK app entry point (50 lines)
- `infra/lib/infra-stack.js` - Main infrastructure stack (289 lines)
- `infra/lib/infra-stack.d.ts` - TypeScript definitions (27 lines)

### Generated Templates (CDK Output)
- `infra/cdk.out/manifest.json` - CDK deployment manifest (1,297 lines)
- `infra/cdk.out/StackTrackerInfraStackV3.template.json` - Main CloudFormation template (1,495+ lines)
- `infra/cdk.out/StackTrackerInfraStackV2.template.json` - Previous version template (1,491+ lines)
- `infra/cdk.out/StackTrackerInfraStack.template.json` - Original template (1,295+ lines)
- `infra/cdk.out/InfraStack.template.json` - Base infrastructure template (1,308+ lines)
- `infra/cdk.out/StackTrackerMonitoringStackV3.template.json` - Monitoring stack template
- `infra/cdk.out/StackTrackerMonitoringStackV2.template.json` - Previous monitoring stack

### Asset Files
- `infra/cdk.out/StackTrackerInfraStackV3.assets.json` - V3 asset manifest
- `infra/cdk.out/StackTrackerInfraStackV2.assets.json` - V2 asset manifest
- `infra/cdk.out/StackTrackerInfraStack.assets.json` - Main asset manifest
- `infra/cdk.out/InfraStack.assets.json` - Base asset manifest
- `infra/cdk.out/StackTrackerMonitoringStackV3.assets.json` - V3 monitoring assets
- `infra/cdk.out/StackTrackerMonitoringStackV2.assets.json` - V2 monitoring assets

### Metadata
- `infra/cdk.out/tree.json` - CDK construct tree
- `infra/cdk.out/cdk.out` - CDK output marker

### Lambda Assets
- `infra/cdk.out/asset.7fa1e366ee8a9ded01fc355f704cff92bfd179574e6f9cfee800a3541df1b200/` - Lambda function code
  - `index.js` - Lambda function implementation

## 📦 Package Configuration
- `package.json` - Main package file with build scripts (160 lines)
  - Build script: `vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server`
  - Start script: `NODE_ENV=production node dist/index.js`

## 🔧 Deployment-Related Code

### Health Check Endpoint
- `packages/backend/src/utils/healthCheck.ts` - Health check utility (11 lines of deployment comments)

### Server Configuration
- `server/index.ts` - Main server file with deployment configs:
  - Port 3001 for deployment compatibility
  - Host 0.0.0.0 for container deployments
  - Production environment detection

### Service Initialization
- `server/services/serviceInitializer.ts` - Deployment mode detection:
  - `REPLIT_DEPLOYMENT` environment variable handling
  - Service initialization skipping during deployment
  - Production vs deployment mode logic

- `server/services/embeddingService.ts` - Embedding service with deployment checks:
  - Deployment mode detection
  - Service initialization skipping
  - Cache operation handling during deployment

## 🏗️ AWS Resources Configured

### Infrastructure Stack V3 (Current)
1. **VPC & Networking**
   - Custom VPC (stacktracker-vpc)
   - Public, Private, and Isolated subnets
   - NAT Gateway for private subnet internet access
   - Internet Gateway for public access
   - Route tables and security groups

2. **Database (RDS)**
   - PostgreSQL 15.3 instance (db.t3.micro)
   - Database subnet group in isolated subnet
   - Secrets Manager integration
   - Automated backups (7-day retention)
   - pgvector extension support

3. **Application Hosting**
   - Elastic Beanstalk application
   - Docker platform (Amazon Linux 2023)
   - Auto-scaling configuration
   - Load balancer with health checks
   - IAM roles and policies

4. **Storage**
   - S3 bucket for file uploads
   - Encryption and versioning enabled
   - CORS configuration for web access
   - Public access blocked for security

5. **Security**
   - Application security group
   - Database security group
   - Proper ingress/egress rules
   - Secrets Manager for credentials

### Environment Variables Set
- `RDS_DB_NAME=stacktracker`
- `RDS_SECRET_ARN` (auto-generated)
- `S3_BUCKET` (auto-generated bucket name)
- `NODE_ENV=production`

### AWS Account Details
- **Account ID**: 881490119784
- **Region**: us-west-2 (Oregon)
- **Environment**: staging
- **CDK Bootstrap Version**: Required v6+

## 📊 Deployment Artifacts Summary

### Total Files: 20+ deployment-specific files
### Total Lines of Infrastructure Code: 5,000+ lines
### CloudFormation Resources: 50+ AWS resources
### Docker Configurations: 2 complete setups
### CDK Stack Versions: 3 major versions tracked

## 🔄 Version History
- **V1**: Initial infrastructure setup
- **V2**: Enhanced with monitoring and improved security
- **V3**: Current version with Elastic Beanstalk and optimized networking

## 🚀 Quick Deploy Commands
```bash
# Infrastructure
cd infra && cdk deploy StackTrackerInfraStackV3

# Application
npm run build
docker build -t stacktracker .

# Local testing
docker run -p 3001:3001 stacktracker
```

---
**Generated**: This inventory was created for the `deployment/aws-docker-consolidated` branch on $(date) 