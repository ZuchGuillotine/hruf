/**
    * @description      : 
    * @author           : 
    * @group            : 
    * @created          : 17/05/2025 - 00:45:02
    * 
    * MODIFICATION LOG
    * - Version         : 1.0.0
    * - Date            : 17/05/2025
    * - Author          : 
    * - Modification    : 
**/
import dotenv from 'dotenv';
dotenv.config();
console.log("DATABASE_URL at db/index.ts:", process.env.DATABASE_URL);
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema';
import * as fs from 'fs';
import { TLSSocket, PeerCertificate } from 'tls';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("Environment variables related to SSL:", {
  NODE_ENV: process.env.NODE_ENV,
  NODE_EXTRA_CA_CERTS: process.env.NODE_EXTRA_CA_CERTS,
  AWS_RDS_CA_CERT_PATH: process.env.AWS_RDS_CA_CERT_PATH,
  __dirname: __dirname,
  cwd: process.cwd()
});

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const isProduction = process.env.NODE_ENV === 'production';

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
};

// In production, enforce SSL with the AWS RDS CA certificate.
// For local testing against RDS, we temporarily disable verification.
if (process.env.DATABASE_URL.includes('rds.amazonaws.com')) {
    console.log('RDS connection detected, configuring SSL...');
    if (isProduction) {
        console.log('Production mode: Using strict SSL with AWS RDS CA certificate');
        const caPath = process.env.AWS_RDS_CA_CERT_PATH ||
          path.resolve(__dirname, '../certs/stcert.pem');

        // Also try absolute path if relative path fails
        const possiblePaths = [
          caPath,
          '/app/certs/stcert.pem',  // Docker container path
          path.join(process.cwd(), 'certs', 'stcert.pem'),  // CWD relative
          path.resolve(__dirname, '../../certs/stcert.pem')  // Alternative relative
        ];

        let certContent: string | null = null;
        let foundPath: string | null = null;

        for (const tryPath of possiblePaths) {
          if (fs.existsSync(tryPath)) {
            console.log(`Found RDS CA bundle at: ${tryPath}`);
            certContent = fs.readFileSync(tryPath, 'utf8');
            foundPath = tryPath;
            break;
          } else {
            console.log(`Certificate not found at: ${tryPath}`);
          }
        }

        if (certContent && foundPath) {
          console.log(`Loading RDS CA bundle from: ${foundPath}`);
          console.log('Certificate content preview:', certContent.substring(0, 100) + '...');
          
          // Enable SSL debugging
          process.env.NODE_DEBUG = 'tls,ssl';
          
          poolConfig.ssl = {
            rejectUnauthorized: true,
            ca: certContent,
            // Add these options for debugging and more permissive SSL
            checkServerIdentity: (host: string, cert: any) => {
              console.log('SSL Certificate details:', {
                subject: cert.subject,
                issuer: cert.issuer,
                valid_from: cert.valid_from,
                valid_to: cert.valid_to,
                fingerprint: cert.fingerprint,
                serialNumber: cert.serialNumber
              });
              
              // Verify the hostname matches
              if (host !== cert.subject.CN) {
                console.log('Hostname mismatch:', { 
                  expected: host, 
                  got: cert.subject.CN 
                });
                return new Error('Hostname mismatch');
              }
              
              // Accept the certificate if it's valid
              return undefined;
            },
            // Add these options to help with certificate chain issues
            minVersion: 'TLSv1.2',
            ciphers: 'HIGH:!aNULL:!MD5:!RC4:!3DES',
            honorCipherOrder: true
          };
          
          // Log the full SSL configuration (excluding sensitive data)
          console.log('SSL Configuration:', {
            rejectUnauthorized: poolConfig.ssl.rejectUnauthorized,
            minVersion: poolConfig.ssl.minVersion,
            hasCA: !!poolConfig.ssl.ca,
            ciphers: poolConfig.ssl.ciphers,
            honorCipherOrder: poolConfig.ssl.honorCipherOrder
          });
        } else {
          // Fallback: log an error and disable verification to keep the app running (optional)
          console.error(`❌ RDS CA bundle not found. Tried paths: ${possiblePaths.join(', ')}. Falling back to insecure SSL configuration.`);
          poolConfig.ssl = {
            rejectUnauthorized: false
          };
        }
    } else {
        console.log('Development mode: Using permissive SSL configuration');
        poolConfig.ssl = {
            rejectUnauthorized: false
        };
    }
}

const pool = new Pool(poolConfig);

export const db = drizzle(pool, { schema });
export * from './schema';