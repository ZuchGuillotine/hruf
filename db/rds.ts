import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { supplementReference } from "./schema";

if (!process.env.AWS_RDS_URL) {
  throw new Error("AWS_RDS_URL must be set for supplement reference database");
}

// Ensure the URL uses the correct protocol
const ensureCorrectProtocol = (url: string) => {
  if (url.startsWith('postgresql://')) {
    return url.replace('postgresql://', 'postgres://');
  }
  if (!url.startsWith('postgres://')) {
    return `postgres://${url}`;
  }
  return url;
};

// Add connection options with timeout and retry logic
const connectionOptions = {
  max: 1, // Reduce connection pool size for testing
  idle_timeout: 30, // Use idle_timeout instead of deprecated timeout
  connect_timeout: 30, // Connection timeout in seconds
  max_lifetime: 60 * 30, // Connection lifetime in seconds
  max_retries: 3, // Number of connection retries
  retry_interval: 5, // Seconds between retries
  debug: console.log, // Enable debug logging
  ssl: {
    rejectUnauthorized: false, // Required for AWS RDS SSL connections
    timeout: 30000 // SSL handshake timeout
  },
  keepalive: {
    enabled: true,
    intervalMs: 60000 // Send keep-alive every 60 seconds
  },
  onnotice: (notice: any) => {
    console.log('Database Notice:', notice);
  },
  onparameter: (parameterStatus: any) => {
    console.log('Parameter Status:', parameterStatus);
  },
  onconnect: () => {
    console.log('Attempting to establish database connection...');
  },
  onend: () => {
    console.log('Database connection ended.');
  }
};

const rdsUrl = ensureCorrectProtocol(process.env.AWS_RDS_URL);
console.log('Attempting to connect to RDS with URL pattern:', 
  rdsUrl.replace(/:[^:@]+@/, ':****@')); // Log URL pattern without password

const client = postgres(rdsUrl, connectionOptions);
export const rdsDb = drizzle(client, { schema: { supplementReference } });