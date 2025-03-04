
/**
 * This script checks the Google OAuth configuration
 * Run with: node scripts/test_google_auth.js
 */

// Load environment variables
require('dotenv').config();

console.log('=== Google OAuth Configuration Test ===');

// Check for Google OAuth credentials
const googleClientId = process.env.GOOGLE_CLIENT_ID_TEST || process.env.GOOGLE_CLIENT_ID_PROD;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET_TEST || process.env.GOOGLE_CLIENT_SECRET_PROD;

console.log('Google Client ID exists:', !!googleClientId);
console.log('Google Client Secret exists:', !!googleClientSecret);

// Determine callback URL based on environment
const replSlug = process.env.REPL_SLUG;
const replOwner = process.env.REPL_OWNER;
const replitHostname = process.env.REPLIT_HOSTNAME;

let callbackUrl;
if (process.env.NODE_ENV === 'production') {
  callbackUrl = 'https://stacktracker.io/auth/google/callback';
} else if (replSlug && replOwner) {
  callbackUrl = `https://${replSlug}.${replOwner}.repl.co/auth/google/callback`;
} else if (replitHostname) {
  callbackUrl = `https://${replitHostname}/auth/google/callback`;
} else {
  callbackUrl = 'http://0.0.0.0:5000/auth/google/callback';
}

console.log('Callback URL:', callbackUrl);
console.log('\nConfiguration variables:');
console.log('- REPL_SLUG:', replSlug);
console.log('- REPL_OWNER:', replOwner);
console.log('- REPLIT_HOSTNAME:', replitHostname);
console.log('- NODE_ENV:', process.env.NODE_ENV);

console.log('\nVerify this information in your Google Cloud Console:');
console.log('1. Go to: https://console.cloud.google.com/apis/credentials');
console.log('2. Make sure the redirect URI matches your callback URL');
console.log('3. Ensure your OAuth consent screen is configured correctly');
console.log('4. If using test mode, add your email as a test user');

console.log('\nTest login URL:');
console.log('/auth/google');
