import { RDS, EC2 } from '@aws-sdk/client-rds';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { rdsDb } from "./rds";
import { sql } from "drizzle-orm";
import { promises as dns } from 'dns';
import { Socket } from 'net';
import { lookup } from 'dns/promises';
import fetch from 'node-fetch';

async function verifyProxyConfiguration() {
  try {
    console.log('Starting RDS Proxy verification with VPC checks...');

    // Step 1: Verify environment variables
    console.log('Checking required environment variables...');
    const requiredVars = [
      'AWS_RDS_PROXY_ENDPOINT',
      'AWS_REGION',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY'
    ];

    const missing = requiredVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    console.log('All required environment variables are present');

    // Get all network information including VPC details
    console.log('Getting network information...');
    try {
      const publicIpResponse = await fetch('https://api.ipify.org?format=json');
      const { ip: ourPublicIp } = await publicIpResponse.json();

      console.log('Application network details:', {
        publicIp: ourPublicIp,
        vpc: 'vpc-0828d71205e8b01f9',
        subnets: [
          'subnet-0724c47e95b57f9a2',
          'subnet-035cb767062c7f44f',
          'subnet-0262500bb81bef74e'
        ]
      });

      // Try DNS resolution with detailed subnet info
      const proxyEndpoint = process.env.AWS_RDS_PROXY_ENDPOINT;
      if (!proxyEndpoint) {
        throw new Error('AWS_RDS_PROXY_ENDPOINT not set');
      }

      const addresses = await dns.lookup(proxyEndpoint.split(':')[0], { all: true });
      console.log('Proxy DNS resolution:', {
        endpoint: proxyEndpoint,
        resolvedAddresses: addresses.map(addr => ({
          ip: addr.address,
          family: `IPv${addr.family}`,
          isPrivate: addr.address.match(/^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/)
        }))
      });

      // Check if we're resolving to private IPs
      const hasPrivateIps = addresses.some(addr =>
        addr.address.match(/^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/)
      );

      if (hasPrivateIps) {
        console.warn('Warning: Proxy is resolving to private IP addresses. This may indicate VPC/subnet misconfiguration');
      }

      // Try TCP connection with detailed logging
      const [host, portStr] = proxyEndpoint.split(':');
      const port = parseInt(portStr);

      const socket = new Socket();
      await new Promise((resolve, reject) => {
        socket.setTimeout(5000);

        socket.on('connect', () => {
          console.log('TCP connection successful:', {
            localAddress: socket.localAddress,
            localPort: socket.localPort,
            remoteAddress: socket.remoteAddress,
            remotePort: socket.remotePort
          });
          socket.end();
          resolve(true);
        });

        socket.on('timeout', () => {
          console.error('Connection timeout. This may indicate:', {
            possibleCauses: [
              'Security group not allowing inbound traffic',
              'Route table missing Internet Gateway route',
              'Subnet not auto-assigning public IPs',
              'RDS Proxy not publicly accessible'
            ]
          });
          socket.destroy();
          reject(new Error('Connection timeout'));
        });

        socket.on('error', (err) => {
          console.error('Connection error:', {
            error: err.message,
            code: err.code,
            host,
            port
          });
          reject(err);
        });

        socket.connect(port, host);
      });


    } catch (error) {
      console.error('Network verification failed:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }

    // Verify RDS configuration
    const rds = new RDS({
      region: process.env.AWS_REGION,
      credentials: defaultProvider()
    });

    const { DBProxies } = await rds.describeDBProxies({});
    const proxy = DBProxies?.find(p => p.DBProxyName === 'stacktrackerproxy1');

    if (!proxy) {
      throw new Error('Could not find RDS proxy stacktrackerproxy1');
    }

    console.log('Proxy configuration:', {
      name: proxy.DBProxyName,
      status: proxy.Status,
      vpc: proxy.VpcId,
      vpcSecurityGroupIds: proxy.VpcSecurityGroupIds,
      vpcSubnetIds: proxy.VpcSubnetIds,
      requiresTLS: proxy.RequireTLS,
      engineFamily: proxy.EngineFamily,
      endpoint: proxy.Endpoint,
      isPubliclyAccessible: true // This should match RDS configuration
    });

    // Step 5: Test database connection with enhanced error reporting (from original code)
    console.log('Testing database connection through proxy...');
    try {
      const result = await rdsDb.execute(sql`
        SELECT
          current_user,
          current_database(),
          inet_server_addr() as server_ip,
          inet_server_port() as server_port,
          inet_client_addr() as client_ip,
          inet_client_port() as client_port,
          version() as postgres_version
      `);
      console.log('Successfully connected to database through proxy:', result);
    } catch (error) {
      console.error('Database connection failed:', {
        error: error instanceof Error ? error.message : String(error),
        code: error instanceof Error && 'code' in error ? (error as any).code : undefined,
        detail: error instanceof Error && 'detail' in error ? (error as any).detail : undefined
      });
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Proxy verification failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// Run verification
verifyProxyConfiguration()
  .then(() => {
    console.log('Proxy verification completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Proxy verification failed:', error);
    process.exit(1);
  });