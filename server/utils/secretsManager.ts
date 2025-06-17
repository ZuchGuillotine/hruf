import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import logger from './logger';

const client = new SecretsManagerClient({
  region: "us-west-2"
});

interface SecretsCache {
  [key: string]: {
    value: any;
    timestamp: number;
    ttl: number;
  };
}

const secretsCache: SecretsCache = {};
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function getSecret(secretName: string, ttl: number = DEFAULT_TTL): Promise<any> {
  try {
    // Check cache first
    const cached = secretsCache[secretName];
    if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
      logger.debug(`Using cached secret for ${secretName}`);
      return cached.value;
    }

    logger.info(`Fetching secret from AWS Secrets Manager: ${secretName}`);
    
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });

    const response = await client.send(command);
    
    if (!response.SecretString) {
      throw new Error(`No secret string found for ${secretName}`);
    }

    let secretValue;
    try {
      // Try to parse as JSON first
      secretValue = JSON.parse(response.SecretString);
    } catch {
      // If not JSON, return as string
      secretValue = response.SecretString;
    }

    // Cache the result
    secretsCache[secretName] = {
      value: secretValue,
      timestamp: Date.now(),
      ttl
    };

    logger.info(`Successfully fetched and cached secret: ${secretName}`);
    return secretValue;

  } catch (error) {
    logger.error(`Error fetching secret ${secretName}:`, error);
    throw error;
  }
}

export async function getEnvironmentSecrets(): Promise<Record<string, string>> {
  try {
    const secrets = await getSecret('STEBENV');
    
    // If secrets is already an object, return it
    if (typeof secrets === 'object' && secrets !== null) {
      return secrets;
    }
    
    // If it's a string, try to parse it
    if (typeof secrets === 'string') {
      try {
        return JSON.parse(secrets);
      } catch {
        logger.error('STEBENV secret is not valid JSON');
        throw new Error('STEBENV secret must be a JSON object');
      }
    }
    
    throw new Error('STEBENV secret has unexpected format');
  } catch (error) {
    logger.error('Failed to fetch environment secrets:', error);
    throw error;
  }
}

// Clear cache (useful for testing or forcing refresh)
export function clearSecretsCache(): void {
  Object.keys(secretsCache).forEach(key => delete secretsCache[key]);
}