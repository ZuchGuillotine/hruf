import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class RdsStack extends cdk.Stack {
  public readonly dbInstance: rds.DatabaseInstance;
  public readonly dbSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, vpc: ec2.IVpc, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a security group for the RDS instance
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for StackTracker RDS instance',
      allowAllOutbound: false,
    });

    // Allow inbound PostgreSQL access from the application security group
    dbSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from application tier'
    );

    // Create a secret for the database credentials
    this.dbSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: 'stacktracker/db-credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'stacktracker_admin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 16,
      },
    });

    // Create parameter group for pgvector support
    const parameterGroup = new rds.ParameterGroup(this, 'DatabaseParameterGroup', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_3,
      }),
      parameters: {
        'shared_preload_libraries': 'pgvector',
        'max_connections': '100',
      },
    });

    // Create the RDS instance
    this.dbInstance = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_3,
      }),
      vpc,
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
    });

    // Output the database endpoint
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.dbInstance.dbInstanceEndpointAddress,
      description: 'Database endpoint',
      exportName: 'StackTrackerDatabaseEndpoint',
    });

    // Output the database port
    new cdk.CfnOutput(this, 'DatabasePort', {
      value: this.dbInstance.dbInstanceEndpointPort,
      description: 'Database port',
      exportName: 'StackTrackerDatabasePort',
    });
  }
} 