import { RDS } from '@aws-sdk/client-rds';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { rdsDb } from "./rds";
import { sql } from "drizzle-orm";
import { promises as dns } from 'dns';
import { Socket } from 'net';

async function verifyProxyConfiguration() {
  try {
    console.log('Starting RDS Proxy verification...');

    // Initialize RDS client
    const rds = new RDS({
      region: process.env.AWS_REGION,
      credentials: defaultProvider(),
    });

    // Step 1: Verify IAM credentials and proxy access
    console.log('Verifying IAM credentials and proxy access...');
    try {
      const { DBProxies } = await rds.describeDBProxies({});
      const proxy = DBProxies?.find(p => p.DBProxyName === 'stacktrackerproxy1');
      console.log('Proxy details:', {
        name: proxy?.DBProxyName,
        status: proxy?.Status,
        engineFamily: proxy?.EngineFamily,
        endpoint: proxy?.Endpoint,
        requiresTLS: proxy?.RequireTLS,
        iamAuth: proxy?.Auth?.find(a => a.AuthScheme === 'SECRETS')?.IAMAuth
      });
    } catch (error) {
      console.error('Failed to verify proxy access:', {
        error: error instanceof Error ? error.message : String(error),
        code: error instanceof Error && 'Code' in error ? (error as any).Code : undefined
      });
      throw error;
    }

    // Step 2: Test proxy endpoint resolution
    console.log('Testing proxy endpoint DNS resolution...');
    const proxyEndpoint = process.env.AWS_RDS_PROXY_ENDPOINT;
    if (!proxyEndpoint) {
      throw new Error('AWS_RDS_PROXY_ENDPOINT not set');
    }
    const [host, portStr] = proxyEndpoint.split(':');
    const port = parseInt(portStr);

    try {
      const addresses = await dns.lookup(host);
      console.log('Successfully resolved proxy DNS:', { 
        host, 
        ip: addresses.address,
        family: `IPv${addresses.family}`
      });
    } catch (error) {
      console.error('Failed to resolve proxy DNS:', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }

    // Step 3: Test network connectivity with detailed logging
    console.log('Testing TCP connectivity to proxy...');
    try {
      await new Promise((resolve, reject) => {
        const socket = new Socket();
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
          socket.destroy();
          reject(new Error('TCP connection timeout'));
        });

        socket.on('error', (err) => {
          console.error('Socket error:', {
            message: err.message,
            code: err.code,
            syscall: (err as any).syscall
          });
          reject(err);
        });

        socket.connect(port, host);
      });
    } catch (error) {
      console.error('TCP connection failed:', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }

    // Step 4: Test database connection with enhanced error reporting
    console.log('Testing database connection through proxy...');
    try {
      await rdsDb.execute(sql`SELECT current_user, current_database()`);
      console.log('Successfully connected to database through proxy');
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