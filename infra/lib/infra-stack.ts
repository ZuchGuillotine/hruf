/**
    * @description      : 
    * @author           : 
    * @group            : 
    * @created          : 26/05/2025 - 14:36:55
    * 
    * MODIFICATION LOG
    * - Version         : 1.0.0
    * - Date            : 26/05/2025
    * - Author          : 
    * - Modification    : 
**/
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as elasticbeanstalk from 'aws-cdk-lib/aws-elasticbeanstalk';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

export class InfraStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly appSecurityGroup: ec2.SecurityGroup;
  public readonly dbInstance: rds.DatabaseInstance;
  public readonly dbSecret: secretsmanager.Secret;
  public readonly ebApplication: elasticbeanstalk.CfnApplication;
  public readonly ebEnvironment: elasticbeanstalk.CfnEnvironment;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, 'StackTrackerVPC', {
      vpcName: 'stacktracker-vpc-v3',
      maxAzs: 2, // Use 2 AZs for high availability
      natGateways: 1, // Start with 1 NAT gateway to control costs
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ],
      // Enable DNS hostnames and support
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create new subnet group for isolated subnets
    const subnetGroupName = 'stacktracker-db-isolated-v3';
    const dbSubnetGroup = new rds.CfnDBSubnetGroup(this, 'DatabaseSubnetGroup', {
      dbSubnetGroupName: subnetGroupName,
      dbSubnetGroupDescription: 'Isolated subnets for StackTracker RDS instance V3',
      subnetIds: this.vpc.isolatedSubnets.map(subnet => subnet.subnetId),
    });

    // Add import instruction as a comment for the first deployment
    // To import the existing subnet group, run this command before deploying:
    // aws cloudformation import-resources --stack-name StackTrackerInfraStackV2 --resource-type "AWS::RDS::DBSubnetGroup" --resources '{"DatabaseSubnetGroup":{"Properties":{"DBSubnetGroupName":"stacktracker-db-isolated","DBSubnetGroupDescription":"Isolated subnets for StackTracker RDS instance","SubnetIds":["subnet-0a4c0264355eda44e","subnet-04b101642ee61aa20"]}}}'

    // Create application security group
    this.appSecurityGroup = new ec2.SecurityGroup(this, 'ApplicationSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: 'stacktracker-app-sg-v3',
      description: 'Security group for StackTracker application',
      allowAllOutbound: true, // Allow outbound traffic for application
    });

    // Create a security group for the RDS instance
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for StackTracker RDS instance V3',
      allowAllOutbound: false,
    });

    // Allow application to connect to database
    dbSecurityGroup.addIngressRule(
      this.appSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow application to connect to database'
    );

    // Create a secret for the database credentials
    this.dbSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: 'stacktracker/db-credentials-v3',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'stacktracker_admin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 16,
      },
    });

    // Create parameter group for database with pgvector support
    const parameterGroup = new rds.ParameterGroup(this, 'DatabaseParameterGroup', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_8,
      }),
      parameters: {
        'max_connections': '100',
      },
    });

    // Create a new RDS instance with the new subnet group
    const newDbInstance = new rds.DatabaseInstance(this, 'NewDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_8,
      }),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(this.dbSecret),
      databaseName: 'stacktracker',
      backupRetention: cdk.Duration.days(7),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'Mon:04:00-Mon:05:00',
      parameterGroup: parameterGroup,
      subnetGroup: rds.SubnetGroup.fromSubnetGroupName(this, 'ImportedSubnetGroup', subnetGroupName),
      // Add a unique identifier to the instance name
      instanceIdentifier: 'stacktracker-db-v3',
    });

    // Keep the old instance reference for now
    this.dbInstance = newDbInstance;

    // Output the new database endpoint
    new cdk.CfnOutput(this, 'NewDatabaseEndpoint', {
      value: newDbInstance.dbInstanceEndpointAddress,
      description: 'New database endpoint',
      exportName: 'StackTrackerNewDatabaseEndpointV3',
    });

    // Add a note about migration steps
    new cdk.CfnOutput(this, 'MigrationNote', {
      value: 'After verifying the new database is working, update the application to use the new endpoint and then delete the old database instance.',
      description: 'Migration instructions',
      exportName: 'StackTrackerMigrationNoteV3',
    });

    // Add VPC endpoints for AWS services to reduce NAT Gateway costs
    this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    this.vpc.addInterfaceEndpoint('RDSEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.RDS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }],
    });

    // Create S3 bucket for uploads
    const uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
          allowedOrigins: ['*'], // Configure this properly for production
          allowedHeaders: ['*'],
        },
      ],
    });

    // Create IAM role for the test instance
    const testInstanceRole = new iam.Role(this, 'TestInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),  // For Systems Manager access
      ],
    });

    // Create temporary EC2 instance for database testing
    const testInstance = new ec2.Instance(this, 'DatabaseTestInstance', {
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: this.appSecurityGroup,
      userData: ec2.UserData.forLinux(),
      role: testInstanceRole,
    });

    // Update the user data script to test both databases
    const userDataScript = [
      '#!/bin/bash',
      'set -e',
      'exec > >(tee /var/log/user-data.log) 2>&1',
      'echo "Starting user data script..."',
      'echo "Updating system..."',
      'yum update -y',
      'echo "Installing PostgreSQL and jq..."',
      'yum install -y postgresql15 jq',
      'echo "Getting database credentials..."',
      'aws secretsmanager get-secret-value --secret-id stacktracker/db-credentials-v3 --query SecretString --output text > /tmp/db-creds.json',
      'echo "Setting up environment variables..."',
      'export PGPASSWORD=$(jq -r .password /tmp/db-creds.json)',
      `export NEW_DB_HOST=${newDbInstance.dbInstanceEndpointAddress}`,
      'echo "Testing new database connection..."',
      'echo "NEW_DB_HOST: $NEW_DB_HOST"',
      'psql -h $NEW_DB_HOST -U stacktracker_admin -d stacktracker -c "SELECT version();" || { echo "New database connection failed!"; exit 1; }',
      'echo "New database connection successful!"',
      'echo "Cleaning up..."',
      'rm /tmp/db-creds.json',
      'echo "User data script completed successfully."'
    ].join('\n');

    // Add the user data script
    testInstance.userData.addCommands(userDataScript);

    // Grant the instance permission to read the secret
    this.dbSecret.grantRead(testInstance.role!);

    // Output the instance ID for easy reference
    new cdk.CfnOutput(this, 'TestInstanceId', {
      value: testInstance.instanceId,
      description: 'ID of the temporary test instance',
      exportName: 'StackTrackerTestInstanceIdV3',
    });

    // Output VPC information
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: 'StackTrackerVpcIdV3',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: 'StackTrackerPrivateSubnetIdsV3',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: 'StackTrackerPublicSubnetIdsV3',
    });

    // Output database information
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.dbInstance.dbInstanceEndpointAddress,
      description: 'Database endpoint',
      exportName: 'StackTrackerDatabaseEndpointV3',
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: this.dbInstance.dbInstanceEndpointPort,
      description: 'Database port',
      exportName: 'StackTrackerDatabasePortV3',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.dbSecret.secretArn,
      description: 'Database secret ARN',
      exportName: 'StackTrackerDatabaseSecretArnV3',
    });

    // Output S3 bucket information
    new cdk.CfnOutput(this, 'UploadsBucketName', {
      value: uploadsBucket.bucketName,
      description: 'S3 bucket for uploads',
      exportName: 'StackTrackerUploadsBucketNameV3',
    });

    new cdk.CfnOutput(this, 'UploadsBucketArn', {
      value: uploadsBucket.bucketArn,
      description: 'S3 bucket ARN for uploads',
      exportName: 'StackTrackerUploadsBucketArnV3',
    });

    // Output subnet group information
    new cdk.CfnOutput(this, 'DatabaseSubnetGroupName', {
      value: subnetGroupName,
      description: 'Database subnet group name',
      exportName: 'StackTrackerDatabaseSubnetGroupNameV3',
    });

    // Create IAM role for Elastic Beanstalk
    const ebServiceRole = new iam.Role(this, 'ElasticBeanstalkServiceRole', {
      assumedBy: new iam.ServicePrincipal('elasticbeanstalk.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSElasticBeanstalkService'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSElasticBeanstalkEnhancedHealth'),
      ],
    });

    // Create IAM role for EC2 instances
    const ebInstanceRole = new iam.Role(this, 'ElasticBeanstalkInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSElasticBeanstalkWebTier'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSElasticBeanstalkWorkerTier'),
      ],
    });

    // Create instance profile
    const instanceProfile = new iam.CfnInstanceProfile(this, 'ElasticBeanstalkInstanceProfile', {
      roles: [ebInstanceRole.roleName],
    });

    // Grant access to Secrets Manager
    this.dbSecret.grantRead(ebInstanceRole);

    // Create Elastic Beanstalk application
    this.ebApplication = new elasticbeanstalk.CfnApplication(this, 'StackTrackerApplication', {
      applicationName: 'stacktracker-app-v3',
      description: 'StackTracker Web Application',
    });

    // Create Elastic Beanstalk environment
    this.ebEnvironment = new elasticbeanstalk.CfnEnvironment(this, 'StackTrackerEnvironment', {
      applicationName: this.ebApplication.applicationName!,
      environmentName: 'stacktracker-env-v3',
      solutionStackName: '64bit Amazon Linux 2023 v4.5.2 running Docker',
      optionSettings: [
        // VPC Configuration
        {
          namespace: 'aws:ec2:vpc',
          optionName: 'VPCId',
          value: this.vpc.vpcId,
        },
        {
          namespace: 'aws:ec2:vpc',
          optionName: 'Subnets',
          value: this.vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
        },
        {
          namespace: 'aws:ec2:vpc',
          optionName: 'ELBSubnets',
          value: this.vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
        },
        // Instance Configuration
        {
          namespace: 'aws:autoscaling:launchconfiguration',
          optionName: 'IamInstanceProfile',
          value: instanceProfile.ref,
        },
        {
          namespace: 'aws:autoscaling:launchconfiguration',
          optionName: 'SecurityGroups',
          value: this.appSecurityGroup.securityGroupId,
        },
        {
          namespace: 'aws:autoscaling:launchconfiguration',
          optionName: 'InstanceType',
          value: 't3.micro',
        },
        // Environment Variables
        {
          namespace: 'aws:elasticbeanstalk:application:environment',
          optionName: 'RDS_HOST',
          value: this.dbInstance.dbInstanceEndpointAddress,
        },
        {
          namespace: 'aws:elasticbeanstalk:application:environment',
          optionName: 'RDS_PORT',
          value: this.dbInstance.dbInstanceEndpointPort,
        },
        {
          namespace: 'aws:elasticbeanstalk:application:environment',
          optionName: 'RDS_DB_NAME',
          value: 'stacktracker',
        },
        {
          namespace: 'aws:elasticbeanstalk:application:environment',
          optionName: 'RDS_SECRET_ARN',
          value: this.dbSecret.secretArn,
        },
        {
          namespace: 'aws:elasticbeanstalk:application:environment',
          optionName: 'S3_BUCKET',
          value: uploadsBucket.bucketName,
        },
        // Load Balancer Configuration
        {
          namespace: 'aws:elbv2:loadbalancer',
          optionName: 'SecurityGroups',
          value: this.appSecurityGroup.securityGroupId,
        },
        // Health Check Configuration
        {
          namespace: 'aws:elasticbeanstalk:application',
          optionName: 'Application Healthcheck URL',
          value: '/_health',
        },
      ],
    });

    // Add dependency to ensure application is created before environment
    this.ebEnvironment.addDependency(this.ebApplication);

    // Output Elastic Beanstalk information
    new cdk.CfnOutput(this, 'ElasticBeanstalkEnvironmentUrl', {
      value: `http://${this.ebEnvironment.attrEndpointUrl}`,
      description: 'Elastic Beanstalk Environment URL',
      exportName: 'StackTrackerElasticBeanstalkUrlV3',
    });
  }
}
