import { rdsDb } from "./rds";
import { supplementReference } from "./schema";
import { sql } from "drizzle-orm";
import dns from 'dns';
import { promisify } from 'util';
import net from 'net';

const lookup = promisify(dns.lookup);

async function testTcpConnection(host: string, port: number): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let connected = false;

    socket.setTimeout(5000); // 5 second timeout

    socket.on('connect', () => {
      connected = true;
      socket.end();
      resolve({ success: true });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ success: false, error: 'Connection attempt timed out' });
    });

    socket.on('error', (err) => {
      socket.destroy();
      resolve({ 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown connection error'
      });
    });

    socket.connect(port, host);
  });
}

async function verifyRdsTable() {
  console.log('Starting RDS verification...');
  console.log('Current Replit IP Address: 34.148.196.141');

  try {
    // DNS lookup check
    const rdsUrl = process.env.AWS_RDS_URL || '';
    const hostname = rdsUrl.match(/@([^:]+):/)?.[1];
    const port = parseInt(rdsUrl.match(/:(\d+)\//)?.[1] || '5432');

    if (hostname) {
      console.log('Performing DNS lookup for RDS hostname...');
      try {
        const dnsResult = await lookup(hostname);
        console.log('DNS Resolution successful:', {
          hostname,
          ip: dnsResult.address,
          family: dnsResult.family
        });

        // Test raw TCP connection with retries
        console.log('Testing raw TCP connection...');
        let attempts = 0;
        const maxAttempts = 3;
        let lastError = '';

        while (attempts < maxAttempts) {
          attempts++;
          console.log(`TCP connection attempt ${attempts}/${maxAttempts}...`);

          const { success, error } = await testTcpConnection(dnsResult.address, port);
          if (success) {
            console.log('TCP connection successful - port is reachable');
            break;
          } else {
            lastError = error || 'Unknown error';
            console.log(`TCP connection attempt ${attempts} failed:`, error);
            if (attempts < maxAttempts) {
              console.log('Waiting 2 seconds before retry...');
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
      } catch (dnsError) {
        console.error('DNS Resolution failed:', {
          hostname,
          error: dnsError instanceof Error ? dnsError.message : String(dnsError)
        });
      }
    }

    // Database connection test
    console.log('Testing database connection...');

    // Basic connection test
    console.log('Attempting basic connection test...');
    const result = await rdsDb.execute(sql`SELECT NOW()`);
    console.log('Basic connection test successful');

    // Test table access
    console.log('Attempting to query supplement reference table...');
    const supplements = await rdsDb.select().from(supplementReference);
    console.log(`Successfully connected to RDS! Found ${supplements.length} supplements`);

    return true;
  } catch (error: any) {
    console.error("Error connecting to RDS:", {
      message: error.message,
      code: error.code,
      errno: error.errno,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return false;
  }
}

verifyRdsTable()
  .then((success) => {
    if (success) {
      console.log("RDS verification completed successfully");
    } else {
      console.log("RDS verification failed");
    }
  })
  .catch(console.error)
  .finally(() => process.exit());