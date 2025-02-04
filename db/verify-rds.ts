import { rdsDb, createDatabaseIfNotExists } from "./rds";
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
  console.log('Replit IP Address: 34.148.196.141');

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

        if (attempts === maxAttempts) {
          console.log('All TCP connection attempts failed. Last error:', lastError);
          console.log('This suggests a network connectivity issue:');
          console.log('1. Security group may be blocking access');
          console.log('2. Network ACL may be restricting traffic');
          console.log('3. Route table may not be properly configured');

          // Additional network path diagnostics
          console.log('\nNetwork Path Analysis:');
          console.log('1. Source: Replit (34.148.196.141) in us-east-1');
          console.log('2. Destination:', dnsResult.address, 'in us-east-2');
          console.log('3. Required Network Path:');
          console.log('   - Traffic leaves Replit in us-east-1');
          console.log('   - Crosses to AWS us-east-2 region');
          console.log('   - Enters VPC:', process.env.AWS_VPC_ID || 'vpc-0828d71205e8b01f9');
          console.log('   - Through Internet Gateway:', process.env.AWS_IGW_ID || 'igw-0f7c57458c5d92051');
          console.log('   - Passes Network ACL:', 'acl-023b9eedcd59a8791');
          console.log('   - Reaches RDS Security Group');

          console.log('\nPotential Blocking Points:');
          console.log('1. Network ACL inbound rule missing for port 5432');
          console.log('2. Network ACL outbound rule missing for ephemeral ports');
          console.log('3. Security Group inbound rule misconfigured');
          console.log('4. Route table missing Internet Gateway route');

          console.log('\nSubnet Route Table Verification:');
          console.log('Route Table ID: rtb-05a0ba83c3045fb71');
          console.log('Required route: 0.0.0.0/0 -> igw-0f7c57458c5d92051');
          console.log('Subnet associations to verify:');
          console.log('- subnet-0724c47e95b57f9a2 (us-east-2c)');
          console.log('- subnet-035cb767062c7f44f (us-east-2a)');
          console.log('- subnet-0262500bb81bef74e (us-east-2b)');
        }

      } catch (dnsError) {
        console.error('DNS Resolution failed:', {
          hostname,
          error: dnsError instanceof Error ? dnsError.message : String(dnsError)
        });
      }
    }

    // Database connection test
    console.log('Testing database connection with increased timeout...');

    // First ensure database exists
    await createDatabaseIfNotExists();

    // Basic connection test
    console.log('Attempting basic connection test...');
    const result = await rdsDb.execute(sql`SELECT NOW()`);
    console.log('Basic connection test successful, server time:', result[0]?.now);

    // Test table access
    console.log('Attempting to query supplement reference table...');
    const supplements = await rdsDb.select().from(supplementReference);
    console.log(`Successfully connected to RDS! Found ${supplements.length} supplements`);

  } catch (error: any) {
    console.error("Error connecting to RDS:", {
      message: error.message,
      code: error.code,
      errno: error.errno,
      address: error.address,
      port: error.port,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Enhanced connection diagnostics
    const rdsUrl = process.env.AWS_RDS_URL || '';
    const urlParts = {
      hasProtocol: rdsUrl.startsWith('postgres://') || rdsUrl.startsWith('postgresql://'),
      containsHost: rdsUrl.includes('@'),
      containsPort: /:\d+\//.test(rdsUrl),
      containsDatabase: /\/[^/]+$/.test(rdsUrl),
      region: rdsUrl.match(/\.([^.]+)\.rds\.amazonaws\.com/)?.[1] || 'unknown'
    };

    console.log('Connection Diagnostics:', {
      urlFormat: urlParts,
      region: urlParts.region,
      replitRegion: 'us-east-1', // Replit's primary region
      possibleIssues: [
        urlParts.region !== 'us-east-1' 
          ? 'RDS instance is in a different region than Replit (us-east-1)'
          : 'RDS and Replit are in the same region',
        'Security group may need to allow inbound from 34.148.196.141',
        'VPC configuration might be blocking access',
        'Database instance status should be checked in AWS Console',
        'Network ACL (acl-023b9eedcd59a8791) may be blocking PostgreSQL traffic'
      ],
      recommendations: [
        '1. Verify RDS security group allows inbound from 34.148.196.141 on port 5432',
        '2. Check if RDS instance is publicly accessible',
        '3. Ensure database instance is in "available" state',
        '4. Verify Network ACL allows inbound traffic on port 5432',
        '5. Consider creating RDS instance in us-east-1 region for better latency'
      ]
    });
  }
}

verifyRdsTable()
  .catch(console.error)
  .finally(() => process.exit());