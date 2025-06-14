import { type CookieOptions } from 'express-session';

export interface AuthConfig {
  session: {
    secret: string;
    cookie: CookieOptions;
    resave: boolean;
    saveUninitialized: boolean;
    name: string;
  };
  google: {
    clientId: string | undefined;
    clientSecret: string | undefined;
    callbackURL: string;
  };
  tiers: {
    free: {
      llmRequestsPerDay: number;
      labUploadsPerMonth: number;
    };
    starter: {
      llmRequestsPerDay: number;
      labUploadsPerMonth: number;
    };
    pro: {
      llmRequestsPerDay: number;
      labUploadsPerMonth: number;
    };
  };
}

// Determine if we're in a secure HTTPS environment
const isSecureEnvironment = (): boolean => {
  const customDomain = process.env.CUSTOM_DOMAIN || '';
  const cleanDomain = customDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const isLocalhost = ['localhost', '127.0.0.1'].some(host => cleanDomain.includes(host));
  const isProduction = process.env.NODE_ENV === 'production';
  const forceHttps = process.env.FORCE_HTTPS === 'true';
  
  return (isProduction && !isLocalhost) || forceHttps;
};

// Get the appropriate Google OAuth callback URL
const getGoogleCallbackURL = (): string => {
  const customDomain = process.env.CUSTOM_DOMAIN;
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction && customDomain && !customDomain.includes('localhost')) {
    const cleanDomain = customDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `https://${cleanDomain}/auth/google/callback`;
  }
  
  // For development and local environments
  return 'http://localhost:3001/auth/google/callback';
};

// Get the appropriate Google OAuth credentials
const getGoogleCredentials = () => {
  const callbackURL = getGoogleCallbackURL();
  const useTestCredentials = callbackURL.includes('localhost');
  
  const clientId = useTestCredentials
    ? (process.env.GOOGLE_CLIENT_ID_TEST || process.env.GOOGLE_CLIENT_ID_DEV || process.env.GOOGLE_CLIENT_ID)
    : (process.env.GOOGLE_CLIENT_ID_PROD || process.env.GOOGLE_CLIENT_ID);
    
  const clientSecret = useTestCredentials
    ? (process.env.GOOGLE_CLIENT_SECRET_TEST || process.env.GOOGLE_CLIENT_SECRET_DEV || process.env.GOOGLE_CLIENT_SECRET)
    : (process.env.GOOGLE_CLIENT_SECRET_PROD || process.env.GOOGLE_CLIENT_SECRET);
    
  return { clientId, clientSecret };
};

export const authConfig: AuthConfig = {
  session: {
    secret: process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex'),
    name: 'stacktracker.sid',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isSecureEnvironment(),
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: isSecureEnvironment() ? 'none' : 'lax',
      path: '/',
      domain: undefined // Let browser handle domain automatically
    }
  },
  google: {
    ...getGoogleCredentials(),
    callbackURL: getGoogleCallbackURL()
  },
  tiers: {
    free: {
      llmRequestsPerDay: 10,
      labUploadsPerMonth: 1
    },
    starter: {
      llmRequestsPerDay: 50,
      labUploadsPerMonth: 5
    },
    pro: {
      llmRequestsPerDay: -1, // Unlimited
      labUploadsPerMonth: -1 // Unlimited
    }
  }
};

// Log configuration on startup (without exposing secrets)
console.log('Auth Configuration:', {
  environment: process.env.NODE_ENV,
  isSecure: isSecureEnvironment(),
  cookieSettings: {
    secure: authConfig.session.cookie.secure,
    sameSite: authConfig.session.cookie.sameSite,
    httpOnly: authConfig.session.cookie.httpOnly
  },
  googleOAuth: {
    callbackURL: authConfig.google.callbackURL,
    clientIdConfigured: !!authConfig.google.clientId,
    clientSecretConfigured: !!authConfig.google.clientSecret
  },
  timestamp: new Date().toISOString()
}); 