import { EC2 } from '@aws-sdk/client-ec2';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

async function verifyRouteTablesAndSubnets() {
  try {
    console.log('Starting route table and subnet verification...');

    const ec2 = new EC2({
      region: process.env.AWS_REGION,
      credentials: defaultProvider()
    });

    // Get subnet details
    const subnets = await ec2.describeSubnets({
      SubnetIds: [
        'subnet-0724c47e95b57f9a2',
        'subnet-035cb767062c7f44f',
        'subnet-0262500bb81bef74e'
      ]
    });

    console.log('Subnet configurations:', 
      subnets.Subnets?.map(subnet => ({
        subnetId: subnet.SubnetId,
        vpcId: subnet.VpcId,
        availabilityZone: subnet.AvailabilityZone,
        mapPublicIpOnLaunch: subnet.MapPublicIpOnLaunch,
        routeTableId: subnet.RouteTableId,
        cidrBlock: subnet.CidrBlock
      }))
    );

    // Get route tables
    const routeTables = await ec2.describeRouteTables({
      Filters: [{
        Name: 'vpc-id',
        Values: ['vpc-0828d71205e8b01f9']
      }]
    });

    // Check for Internet Gateway routes
    console.log('Route table configurations:',
      routeTables.RouteTables?.map(rt => ({
        routeTableId: rt.RouteTableId,
        vpcId: rt.VpcId,
        hasInternetGateway: rt.Routes?.some(route => 
          route.GatewayId?.startsWith('igw-') && 
          route.DestinationCidrBlock === '0.0.0.0/0'
        ),
        routes: rt.Routes?.map(route => ({
          destination: route.DestinationCidrBlock,
          target: route.GatewayId || route.NatGatewayId || route.VpcPeeringConnectionId
        }))
      }))
    );

    // Get security groups
    const securityGroups = await ec2.describeSecurityGroups({
      Filters: [{
        Name: 'vpc-id',
        Values: ['vpc-0828d71205e8b01f9']
      }]
    });

    console.log('Security group configurations:',
      securityGroups.SecurityGroups?.map(sg => ({
        groupId: sg.GroupId,
        groupName: sg.GroupName,
        inboundRules: sg.IpPermissions?.map(rule => ({
          protocol: rule.IpProtocol,
          fromPort: rule.FromPort,
          toPort: rule.ToPort,
          ipRanges: rule.IpRanges?.map(range => range.CidrIp)
        }))
      }))
    );

    return true;
  } catch (error) {
    console.error('Route table verification failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

verifyRouteTablesAndSubnets()
  .then((success) => {
    console.log(`Route table verification ${success ? 'succeeded' : 'failed'}`);
    process.exit(success ? 0 : 1);
  });
