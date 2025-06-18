import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getEnvironmentSecrets } from '../utils/secretsManager';

// Load environment variables immediately
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

let environmentSecretsLoaded = false;

async function loadEnvironmentSecrets(): Promise<void> {
  if (environmentSecretsLoaded) {
    return;
  }

  try {
    // First try to load from .env file (for local development)
    console.log('🔍 Checking for local .env file at:', envPath);
    const result = dotenv.config({ path: envPath });

    if (result.error) {
      console.log('📁 No .env file found, loading from AWS Secrets Manager...');
      
      try {
        // Load main application secrets
        console.log('🔐 Loading main application secrets...');
        const secrets = await getEnvironmentSecrets();
        
        // Set environment variables from secrets
        Object.entries(secrets).forEach(([key, value]) => {
          if (typeof value === 'string') {
            process.env[key] = value;
            console.log(`✅ Set environment variable: ${key}`);
          }
        });
        
        // Also set GOOGLE_VISION_CREDENTIALS from the dedicated secret
        try {
          const { getGoogleVisionCredentials } = await import('../utils/secretsManager');
          const googleCreds = await getGoogleVisionCredentials();
          process.env.GOOGLE_VISION_CREDENTIALS = googleCreds;
          console.log('✅ Set GOOGLE_VISION_CREDENTIALS from dedicated secret');
        } catch (googleError) {
          console.warn('⚠️ Failed to load Google Vision credentials from dedicated secret:', googleError);
        }
        
        console.log('🎉 Environment variables loaded successfully from AWS Secrets Manager');
      } catch (secretsError) {
        console.error('❌ Failed to load from AWS Secrets Manager:', secretsError);
        
        // Set minimal required environment variables for basic startup
        if (!process.env.DATABASE_URL) {
          process.env.DATABASE_URL = 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
          console.log('🔧 Set placeholder DATABASE_URL for startup');
        }
        if (!process.env.SESSION_SECRET) {
          process.env.SESSION_SECRET = 'placeholder-session-secret-for-startup';
          console.log('🔧 Set placeholder SESSION_SECRET for startup');
        }
        
        console.log('⚠️ Application will continue with placeholder environment variables...');
      }
    } else {
      console.log('✅ Environment variables loaded successfully from .env file');
    }

    // Log which critical env vars are present (without values for security)
    const criticalVars = [
      'DATABASE_URL',
      'SESSION_SECRET',
      'OPENAI_API_KEY',
      'SENDGRID_API_KEY',
      'STRIPE_SECRET_KEY',
      'GOOGLE_CLIENT_ID_TEST',
      'GOOGLE_CLIENT_SECRET_TEST',
      'GOOGLE_CLIENT_ID_PROD',
      'GOOGLE_CLIENT_SECRET_PROD',
      'GOOGLE_VISION_CREDENTIALS',
      'CUSTOM_DOMAIN'
    ];
    
    console.log('📋 Environment variables status:');
    criticalVars.forEach(varName => {
      const isSet = !!process.env[varName];
      const status = isSet ? '✅ Set' : '❌ Missing';
      console.log(`  ${varName}: ${status}`);
    });

    environmentSecretsLoaded = true;
  } catch (error) {
    console.error('💥 Critical error loading environment variables:', error);
    throw error;
  }
}

// For development, try to load .env file immediately
if (process.env.NODE_ENV !== 'production') {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.log('No .env file found in development, you may need to set up AWS Secrets Manager or create a .env file');
  } else {
    console.log('Environment variables loaded successfully from .env file');
  }
}

// Export the async function for production use
export { loadEnvironmentSecrets };

// Export a function to validate required env vars
export function validateEnvVars(): void {
  const required = [
    'DATABASE_URL',
    'SESSION_SECRET'
  ];
  
  const missing = required.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please ensure these are set in your STEBENV secret in AWS Secrets Manager');
    
    // In production, log the error but don't crash immediately
    // This gives the deployment a chance to succeed and allows manual intervention
    if (process.env.NODE_ENV === 'production') {
      console.error('Application starting with missing env vars - some features may not work');
      return;
    }
    
    // In development, still throw the error
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// This file should be imported before anything else
export default {}; 