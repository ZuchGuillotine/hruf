import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as elasticbeanstalk from 'aws-cdk-lib/aws-elasticbeanstalk';
import * as rds from 'aws-cdk-lib/aws-rds';

interface MonitoringStackProps extends cdk.StackProps {
  dbInstance: rds.IDatabaseInstance;
  ebEnvironment: elasticbeanstalk.CfnEnvironment;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // Create CloudWatch dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'StackTrackerDashboard', {
      dashboardName: 'StackTracker-Monitoring',
    });

    // Add RDS metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'RDS CPU Utilization',
        left: [props.dbInstance.metricCPUUtilization()],
        right: [props.dbInstance.metricFreeableMemory()],
      }),
      new cloudwatch.GraphWidget({
        title: 'RDS Connections',
        left: [props.dbInstance.metricDatabaseConnections()],
      }),
      new cloudwatch.GraphWidget({
        title: 'RDS Storage',
        left: [props.dbInstance.metricFreeStorageSpace()],
      })
    );

    // Add EB metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'EB Environment Health',
        left: [new cloudwatch.Metric({
          namespace: 'AWS/ElasticBeanstalk',
          metricName: 'EnvironmentHealth',
          dimensionsMap: {
            EnvironmentName: props.ebEnvironment.environmentName!,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(1),
        })],
      }),
      new cloudwatch.GraphWidget({
        title: 'EB CPU Utilization',
        left: [new cloudwatch.Metric({
          namespace: 'AWS/ElasticBeanstalk',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            EnvironmentName: props.ebEnvironment.environmentName!,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(1),
        })],
      })
    );

    // Create CloudWatch alarms for RDS
    const dbCpuAlarm = new cloudwatch.Alarm(this, 'DatabaseCPUAlarm', {
      metric: props.dbInstance.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'Database CPU utilization is too high',
    });

    const dbConnectionsAlarm = new cloudwatch.Alarm(this, 'DatabaseConnectionsAlarm', {
      metric: props.dbInstance.metricDatabaseConnections(),
      threshold: 80,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'Database connection count is too high',
    });

    // Create CloudWatch alarms for EB
    const ebHealthAlarm = new cloudwatch.Alarm(this, 'EBHealthAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ElasticBeanstalk',
        metricName: 'EnvironmentHealth',
        dimensionsMap: {
          EnvironmentName: props.ebEnvironment.environmentName!,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 0.8, // 80% health threshold
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'EB environment health is degraded',
    });

    // Create WAF rules for the ALB
    const wafAcl = new wafv2.CfnWebACL(this, 'StackTrackerWAF', {
      defaultAction: { allow: {} },
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'StackTrackerWAFMetric',
        sampledRequestsEnabled: true,
      },
      rules: [
        // Rate limiting rule for auth endpoints
        {
          name: 'AuthRateLimit',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 100,
              aggregateKeyType: 'IP',
              scopeDownStatement: {
                byteMatchStatement: {
                  searchString: '/auth',
                  fieldToMatch: { uriPath: {} },
                  textTransformations: [{ priority: 1, type: 'NONE' }],
                  positionalConstraint: 'STARTS_WITH',
                },
              },
            },
          },
          action: { block: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'AuthRateLimitMetric',
            sampledRequestsEnabled: true,
          },
        },
        // SQL injection protection
        {
          name: 'SQLInjectionProtection',
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLInjectionMetric',
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    // Output the WAF ACL ARN
    new cdk.CfnOutput(this, 'WafAclArn', {
      value: wafAcl.attrArn,
      description: 'WAF ACL ARN',
      exportName: 'StackTrackerWafAclArnV3',
    });
  }
} 