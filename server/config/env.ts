import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables immediately
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

console.log('Loading environment variables from:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('Environment variables loaded successfully');
  
  // Log which critical env vars are present (without values)
  const criticalVars = [
    'DATABASE_URL',
    'OPENAI_API_KEY',
    'SENDGRID_API_KEY',
    'STRIPE_SECRET_KEY',
    'GOOGLE_CLIENT_ID_TEST',
    'GOOGLE_CLIENT_SECRET_TEST'
  ];
  
  criticalVars.forEach(varName => {
    console.log(`${varName}: ${process.env[varName] ? 'Set' : 'Not set'}`);
  });
}

// Export a function to validate required env vars
export function validateEnvVars(): void {
  const required = [
    'DATABASE_URL',
    'SESSION_SECRET'
  ];
  
  const missing = required.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// This file should be imported before anything else
export default {}; 