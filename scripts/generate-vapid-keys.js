/**
 * Script to generate VAPID keys for web push notifications
 * Run with: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('Generated VAPID Keys:');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('\nAdd these to your .env file to enable web push notifications');