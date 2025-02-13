import { RDS } from '@aws-sdk/client-rds';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { rdsDb } from "./rds";
import { sql } from "drizzle-orm";
import { promises as dns } from 'dns';
import { Socket } from 'net';
import { lookup } from 'dns/promises';
import fetch from 'node-fetch';

async function verifyProxyConfiguration() {
  try {
    console.log('Starting RDS Proxy verification...');

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

    // Get all network information
    console.log('Getting network information...');
    try {
      const publicIpResponse = await fetch('https://api.ipify.org?format=json');
      const { ip: ourPublicIp } = await publicIpResponse.json();

      // Try to get AWS metadata (if we're running in AWS)
      const metadataUrl = 'http://169.254.169.254/latest/meta-data/';
      const metadataResponse = await fetch(metadataUrl, { timeout: 1000 }).catch(() => null);
      const isInAWS = metadataResponse?.ok || false;

      console.log('Network information:', {
        publicIp: ourPublicIp,
        isInAWS,
        region: process.env.AWS_REGION,
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
      });

      // Try to get route to RDS proxy
      try {
        const traceResponse = await fetch('https://api.ipapi.com/api/trace', {
          headers: { 'Accept': 'application/json' }
        });
        const traceData = await traceResponse.json();
        console.log('Network path information:', traceData);
      } catch (err) {
        console.log('Could not get network path information:', err instanceof Error ? err.message : String(err));
      }
    } catch (error) {
      console.log('Error getting metadata (expected if not in AWS):', error instanceof Error ? error.message : String(error));
    }

    // Step 2: Verify IAM credentials and proxy access
    console.log('Verifying IAM credentials and proxy access...');
    try {
      const rds = new RDS({
        region: process.env.AWS_REGION,
        credentials: defaultProvider(),
      });

      const { DBProxies } = await rds.describeDBProxies({});
      const proxy = DBProxies?.find(p => p.DBProxyName === 'stacktrackerproxy1');

      if (!proxy) {
        throw new Error('Could not find RDS proxy stacktrackerproxy1');
      }

      console.log('Proxy details:', {
        name: proxy.DBProxyName,
        status: proxy.Status,
        engineFamily: proxy.EngineFamily,
        endpoint: proxy.Endpoint,
        requiresTLS: proxy.RequireTLS,
        iamAuth: proxy.Auth?.find(a => a.AuthScheme === 'SECRETS')?.IAMAuth,
        vpcId: proxy.VpcId,
        vpcSecurityGroups: proxy.VpcSecurityGroups?.map(sg => sg.VpcSecurityGroupId).join(', '),
        vpcSubnetIds: proxy.VpcSubnetIds?.join(', ')
      });
    } catch (error) {
      console.error('Failed to verify proxy access:', {
        error: error instanceof Error ? error.message : String(error),
        code: error instanceof Error && 'Code' in error ? (error as any).Code : undefined
      });
      throw error;
    }

    // Parse proxy endpoint
    const proxyEndpoint = process.env.AWS_RDS_PROXY_ENDPOINT;
    if (!proxyEndpoint) {
      throw new Error('AWS_RDS_PROXY_ENDPOINT not set');
    }
    const [host, portStr] = proxyEndpoint.split(':');
    const port = parseInt(portStr);

    // Step 3: Test proxy endpoint DNS resolution with more details
    console.log('Testing proxy endpoint DNS resolution...');
    try {
      // Get all possible IP addresses for the proxy
      const addresses = await dns.lookup(host, { all: true });
      console.log('Proxy DNS resolution:', { 
        host,
        addresses: addresses.map(addr => ({
          ip: addr.address,
          family: `IPv${addr.family}`,
          isPrivate: addr.address.match(/^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/)
        }))
      });

      // Try to reverse lookup each IP
      for (const addr of addresses) {
        try {
          const hostnames = await dns.reverse(addr.address);
          console.log('Reverse DNS lookup:', {
            ip: addr.address,
            hostnames
          });
        } catch (err) {
          console.log('Reverse DNS lookup failed (expected for some AWS endpoints):', {
            ip: addr.address,
            error: err instanceof Error ? err.message : String(err)
          });
        }
      }
    } catch (error) {
      console.error('Failed to resolve proxy DNS:', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }

    // Step 4: Test network connectivity with expanded diagnostics and longer timeout
    console.log('Testing TCP connectivity to proxy...');
    try {
      await Promise.race([
        new Promise((resolve, reject) => {
          const socket = new Socket();

          // Increase socket timeout to 30 seconds for initial connection
          socket.setTimeout(30000);

          socket.on('connect', () => {
            console.log('TCP connection successful:', {
              localAddress: socket.localAddress,
              localPort: socket.localPort,
              remoteAddress: socket.remoteAddress,
              remotePort: socket.remotePort,
              bytesRead: socket.bytesRead,
              bytesWritten: socket.bytesWritten
            });
            socket.end();
            resolve(true);
          });

          socket.on('timeout', () => {
            console.error('Socket timeout:', {
              host,
              port,
              timeout: socket.timeout,
              localAddress: socket.localAddress,
              remoteAddress: socket.remoteAddress,
              timestamp: new Date().toISOString()
            });
            socket.destroy();
            reject(new Error('TCP connection timeout'));
          });

          socket.on('error', (err) => {
            console.error('Socket error:', {
              message: err.message,
              code: err.code,
              syscall: (err as any).syscall,
              host,
              port,
              localAddress: socket.localAddress,
              remoteAddress: socket.remoteAddress
            });
            reject(err);
          });

          socket.on('close', () => {
            console.log('Socket closed');
          });

          // Log connection attempt details
          console.log('Attempting TCP connection:', {
            host,
            port,
            family: socket.address()?.family,
            timestamp: new Date().toISOString()
          });

          socket.connect(port, host);
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Overall connection timeout after 35s')), 35000)
        )
      ]);

      // Step 5: Test database connection with enhanced error reporting
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
      console.error('TCP connection failed:', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  } catch (error) {
    console.error('Proxy verification failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

verifyProxyConfiguration()
  .then((success) => {
    console.log(`Proxy verification ${success ? 'succeeded' : 'failed'}`);
    process.exit(success ? 0 : 1);
  });