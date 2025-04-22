/**
 * Generate VAPID keys for web push notifications
 * 
 * This script generates a public/private VAPID key pair for use with the
 * web-push library to send push notifications.
 * 
 * The generated keys should be set as environment variables:
 * - VAPID_PUBLIC_KEY
 * - VAPID_PRIVATE_KEY
 */

import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name correctly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID keys generated successfully!\n');
console.log('Public Key:');
console.log(vapidKeys.publicKey);
console.log('\nPrivate Key:');
console.log(vapidKeys.privateKey);
console.log('\n');

// Save to .env file if it exists
try {
  const envPath = path.join(__dirname, '..', '.env');
  
  // Check if .env file exists
  if (fs.existsSync(envPath)) {
    // Read current .env content
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace VAPID keys if they exist, or add them if they don't
    const publicKeyRegex = /VAPID_PUBLIC_KEY=.*/;
    const privateKeyRegex = /VAPID_PRIVATE_KEY=.*/;
    
    if (publicKeyRegex.test(envContent)) {
      envContent = envContent.replace(publicKeyRegex, `VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
    } else {
      envContent += `\nVAPID_PUBLIC_KEY=${vapidKeys.publicKey}`;
    }
    
    if (privateKeyRegex.test(envContent)) {
      envContent = envContent.replace(privateKeyRegex, `VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
    } else {
      envContent += `\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}`;
    }
    
    // Add VAPID_SUBJECT if it doesn't exist
    const subjectRegex = /VAPID_SUBJECT=.*/;
    if (!subjectRegex.test(envContent)) {
      envContent += '\nVAPID_SUBJECT=mailto:support@stacktracker.com';
    }
    
    // Write updated content back to .env
    fs.writeFileSync(envPath, envContent);
    console.log('Keys have been added to your .env file.');
  } else {
    // Create new .env file with VAPID keys
    const envContent = 
`# Web Push VAPID Keys
VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
VAPID_SUBJECT=mailto:support@stacktracker.com
`;
    fs.writeFileSync(envPath, envContent);
    console.log('Created new .env file with VAPID keys.');
  }

  console.log('\nUsage Instructions:');
  console.log('1. Use these keys in your environment variables');
  console.log('2. Make sure these environment variables are available in your deployment environment');
  console.log('3. The VAPID_SUBJECT should be a mailto: URL or a website URL');
  
} catch (error) {
  console.error('Error saving keys to .env file:', error);
  console.log('\nPlease manually add these keys to your environment:');
  console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
  console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
  console.log('VAPID_SUBJECT=mailto:support@stacktracker.com');
}