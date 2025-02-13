import { RDS } from '@aws-sdk/client-rds';
import { EC2 } from '@aws-sdk/client-ec2';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { rdsDb } from "./rds";
import { sql } from "drizzle-orm";
import { promises as dns } from 'dns';
import { Socket } from 'net';
import fetch from 'node-fetch';
import { lookup } from 'dns/promises';

async function verifyProxyConfiguration() {
  try {
    console.log('Starting detailed proxy network verification...');

    // Initialize AWS clients
    const rds = new RDS({
      region: process.env.AWS_REGION,
      credentials: defaultProvider()
    });

    const ec2 = new EC2({
      region: process.env.AWS_REGION,
      credentials: defaultProvider()
    });

    // Step 1: Get proxy details
    const { DBProxies } = await rds.describeDBProxies({});
    const proxy = DBProxies?.find(p => p.DBProxyName === 'stacktrackerproxy1');

    if (!proxy) {
      throw new Error('Could not find RDS proxy stacktrackerproxy1');
    }

    console.log('Proxy configuration:', {
      name: proxy.DBProxyName,
      status: proxy.Status,
      vpc: proxy.VpcId,
      vpcSecurityGroups: proxy.VpcSecurityGroupIds,
      vpcSubnetIds: proxy.VpcSubnetIds,
      requiresTLS: proxy.RequireTLS,
      engineFamily: proxy.EngineFamily,
      endpoint: proxy.Endpoint,
    });

    // Step 2: Get network interface details for the proxy
    const { NetworkInterfaces } = await ec2.describeNetworkInterfaces({
      Filters: [
        {
          Name: 'vpc-id',
          Values: [proxy.VpcId!]
        },
        {
          Name: 'group-id',
          Values: proxy.VpcSecurityGroupIds || []
        }
      ]
    });

    console.log('Network interfaces associated with proxy:', 
      NetworkInterfaces?.map(ni => ({
        id: ni.NetworkInterfaceId,
        subnet: ni.SubnetId,
        privateIp: ni.PrivateIpAddress,
        publicIp: ni.Association?.PublicIp,
        status: ni.Status,
        description: ni.Description
      }))
    );

    // Step 3: Get our application's public IP
    const publicIpResponse = await fetch('https://api.ipify.org?format=json');
    const { ip: ourPublicIp } = await publicIpResponse.json();
    console.log('Application public IP:', ourPublicIp);

    // Step 4: Test DNS resolution for the proxy endpoint
    const proxyEndpoint = process.env.AWS_RDS_PROXY_ENDPOINT;
    if (!proxyEndpoint) {
      throw new Error('AWS_RDS_PROXY_ENDPOINT not set');
    }

    const [host, portStr] = proxyEndpoint.split(':');
    const port = parseInt(portStr);

    const dnsResults = await dns.lookup(host, { all: true });
    console.log('Proxy DNS resolution:', {
      host,
      resolvedAddresses: dnsResults.map(r => ({
        ip: r.address,
        family: `IPv${r.family}`,
        isPrivate: r.address.match(/^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/)
      }))
    });

    // Step 5: Detailed connection test
    console.log('Testing connection with detailed diagnostics...');
    await new Promise((resolve, reject) => {
      const socket = new Socket();
      let connectionStartTime = Date.now();

      socket.setTimeout(10000); // Increased timeout for better diagnostics

      socket.on('connect', () => {
        const connectionTime = Date.now() - connectionStartTime;
        console.log('TCP connection successful:', {
          localAddress: socket.localAddress,
          localPort: socket.localPort,
          remoteAddress: socket.remoteAddress,
          remotePort: socket.remotePort,
          connectionTimeMs: connectionTime
        });
        socket.end();
        resolve(true);
      });

      socket.on('timeout', () => {
        console.error('Connection diagnostics on timeout:', {
          timeElapsed: Date.now() - connectionStartTime,
          targetHost: host,
          targetPort: port,
          localAddress: socket.localAddress,
          dnsResolution: dnsResults,
        });
        socket.destroy();
        reject(new Error('Connection timeout after detailed diagnostics'));
      });

      socket.on('error', (err) => {
        console.error('Detailed connection error:', {
          error: err.message,
          code: err.code,
          host,
          port,
          timeElapsed: Date.now() - connectionStartTime,
          dnsResolution: dnsResults
        });
        reject(err);
      });

      socket.connect(port, host);
    });

    // Step 6: Test database connection with network details
    console.log('Testing database connection with network information...');
    const result = await rdsDb.execute(sql`
      SELECT 
        inet_server_addr() as server_ip,
        inet_server_port() as server_port,
        inet_client_addr() as client_ip,
        inet_client_port() as client_port,
        current_setting('listen_addresses') as listen_addresses,
        version() as postgres_version
    `);
    console.log('Database connection details:', result);

    return true;
  } catch (error) {
    console.error('Detailed proxy verification failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// Run verification
verifyProxyConfiguration()
  .then(() => {
    console.log('Detailed proxy verification completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Proxy verification failed:', error);
    process.exit(1);
  });