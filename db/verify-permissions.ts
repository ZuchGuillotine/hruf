import { IAM } from '@aws-sdk/client-iam';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

async function verifyIAMPermissions() {
  try {
    console.log('Starting IAM permissions verification...');

    const iam = new IAM({
      region: process.env.AWS_REGION,
      credentials: defaultProvider()
    });

    // Check current user
    const { User } = await iam.getUser({});
    console.log('Current user:', {
      username: User?.UserName,
      arn: User?.Arn,
      userId: User?.UserId,
      createDate: User?.CreateDate
    });

    // List attached policies
    const { AttachedPolicies } = await iam.listAttachedUserPolicies({
      UserName: User?.UserName || 'BenCox820'
    });

    console.log('Attached policies:', AttachedPolicies);

    // Required permissions for RDS and EC2 access
    const requiredPermissions = [
      'ec2:DescribeRouteTables',
      'ec2:DescribeSubnets',
      'ec2:DescribeSecurityGroups',
      'rds:DescribeDBProxies',
      'rds-db:connect'
    ];

    console.log('Required permissions:', requiredPermissions);

    // Get policy details for each attached policy
    for (const policy of AttachedPolicies || []) {
      const { Policy } = await iam.getPolicy({
        PolicyArn: policy.PolicyArn
      });

      const { PolicyVersion } = await iam.getPolicyVersion({
        PolicyArn: policy.PolicyArn,
        VersionId: Policy?.DefaultVersionId || 'v1'
      });

      console.log(`Policy ${policy.PolicyName} details:`, {
        arn: policy.PolicyArn,
        defaultVersionId: Policy?.DefaultVersionId,
        document: PolicyVersion?.Document
      });
    }

    return true;
  } catch (error) {
    console.error('IAM verification failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

verifyIAMPermissions()
  .then((success) => {
    console.log(`IAM verification ${success ? 'succeeded' : 'failed'}`);
    process.exit(success ? 0 : 1);
  });
