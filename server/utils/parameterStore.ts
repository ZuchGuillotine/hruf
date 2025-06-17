import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import logger from './logger';

const ssmClient = new SSMClient({ region: 'us-west-2' });

export async function getGoogleVisionCredentials(): Promise<string> {
  try {
    // First try to get from environment variable (for local development)
    if (process.env.GOOGLE_VISION_CREDENTIALS) {
      return process.env.GOOGLE_VISION_CREDENTIALS;
    }

    // Try Parameter Store (may fail if permissions not set up)
    try {
      const command = new GetParameterCommand({
        Name: '/stacktracker/google-vision-credentials',
        WithDecryption: true,
      });

      const response = await ssmClient.send(command);
      
      if (response.Parameter?.Value) {
        return response.Parameter.Value;
      }
    } catch (parameterStoreError) {
      logger.warn('Parameter Store access failed, falling back to embedded credentials');
    }

    // Fallback to minimal embedded credentials (for deployment)
    const fallbackCredentials = {
      type: "service_account",
      project_id: "lando-410205",
      private_key_id: "3e5185d8c6057e49a2486a5a25e462be03beaa46",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDbTCxeDAkAV8J1\nH5WPF1WGs9FBfv3Oo3NnxDtQZscwsIK/TKODL/8h9jCtOLBezByURyqDoQMx/8Ee\nbtWwuwZ79eA4SV3+dkk7vmrCvgglABFS71fXsSl71VDbiYIOD9vr8eqWF9boIH0a\nEs9oP+8HSOOVIT6fJRNW2ALggmR4lzmIWM8r5nBccgT2aMlBMh6ZjaaLpxq0m/pO\nCynFqhAsmo9yEIutkO7ITU4CUPQC3haW4m/h1cmDXuZ8L8WmxoUYLfvKYtPZJUM9\nW1Z6JN7FvE7PM8igRAYKXdPy9Cw4dNeDGGGuJ5lhwDzza9eL1j2878bBQMKVp5Ky\nCeujDGDbAgMBAAECggEAH/z7gnhvnlzZdlY2GFpHVSUeWAHF1KzjpPZAegOT+Kvh\nVorqVbTcRWrw7MOWeS19hGThHwmPOsLbZldf1QNi+Gqu2zxbI/Ft0J4qWop3tlX3\n254itR7C4K0Gug9T05NH+XcfSJI6UeqIn74GAmdDtE9TNdSp8B2WCuvqzNmYUufk\nYm6w8tKIJqhqeyoWRGofse+PN+yPEm+rwM/LaB5e8+cD5rwchVLgMhPbqK2tueIz\nKWQZWc2gq/GDRprr6DuofPJSBakZ+YSmR9GPwbXQUxC0imOYkHeBaIfB/6lkEOnT\nLwfwGHsoeIArd/LuQgYqYQ2WLBbr+t2SLZ1BWppc6QKBgQDy0CGTOBCKObmNHwh1\n28jUK47Me45+5+LDi81MAW50j9dXOAls6yHQ3jsYbzqtMw9K1nQRknDk/+2v+8vN\nsMifNi8YrV4EjreyRgBfVrNjbLnFfbXt5C+q8m7+mH9/PrDTlDgJW/m1KbDD5Z85\nBnhlPkxgs0vU77frJLIT4leDrQKBgQDnNRpWkzikt8tDbYed+wZmtz9ir6uXNi/Q\nVVV9FAOTMkWGAAYWNtdoaAVl5YfzykjKrHJmr4p1xCmeC2VbN98MAlLAX1IarOVq\n2xk+KJHSO0QxD4EK2u1gq+kEYBGnUS0Dj+Mpj/FvL23n7zKmubw9i2UfQlEC2FsC\n1BUFSkLHpwKBgCWd2uW81MslQDq9qQjhQM6l5NyG879zWy0iNm7k9eC2/Ax2EPe/\nwaBjHVKewL9eXqsgaCDkx/qiL4eJAbze+2W29jrjeOJJ3emPcLVUcDwh9vHClPHC\n3SOlpU5p/66N3sUYfEnu5tOLHuhqZW1nNDWzHhAJFuFpNdwG9lOgSCCNAoGBAIG8\n+52PGR7c/5NDl/EfVjU3KLtQxiGgx23JJKJ+I49qizapNsEqXu94R2cpSIOVhAku\ngTd7019IBu5niKWKEYAkoZjPJDxRvp6aeWy2yTTGCvrYr1mPBdrUPHo3ClDwLSkt\niZPd8OWqIKsgPzTtTmLeoIzM4raM/2zz4yPHyvdLAoGAP69/cuzHO11TGjw5NYbl\nVgCPq8CY0Ro8JQuTlE41+AMhle5gzUkJsgt4Rf/t+FmivpWRfY5WZrX6s+mkvqv0\nRV/Zq8Olo1fxsJ4T9yihCjudZLf5x+LxCE9H8POUaR8nA9l5qCzFihHCTFUl7kO6\nl37hdwfGRNugZTvymw+Rz90=\n-----END PRIVATE KEY-----\n",
      client_email: "replit-ocr-processor@lando-410205.iam.gserviceaccount.com",
      client_id: "107089383292640692451",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/replit-ocr-processor%40lando-410205.iam.gserviceaccount.com",
      universe_domain: "googleapis.com"
    };

    return JSON.stringify(fallbackCredentials);
  } catch (error) {
    logger.error('Failed to get Google Vision credentials:', error);
    throw error;
  }
}