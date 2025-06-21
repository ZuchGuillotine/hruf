/**
 * Startup script that loads environment variables before importing any services
 */
import { loadEnvironmentSecrets } from './config/env';

async function startup() {
  console.log('🚀 Starting application...');
  
  // Load environment secrets FIRST in production
  if (process.env.NODE_ENV === 'production') {
    console.log('📦 Production mode: Loading environment secrets before service initialization...');
    try {
      await loadEnvironmentSecrets();
      console.log('✅ Environment secrets loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load environment secrets:', error);
      console.log('⚠️ Application will continue with limited functionality');
    }
  } else {
    console.log('🔧 Development mode: Using local environment variables');
  }
  
  // Now import and start the main server
  console.log('📡 Importing and starting main server...');
  const { default: initializeAndStart } = await import('./index');
  await initializeAndStart();
}

// Export the startup function
export default startup;

// If this file is run directly, execute startup
if (import.meta.url === `file://${process.argv[1]}`) {
  startup().catch((error) => {
    console.error('💥 Startup failed:', error);
    process.exit(1);
  });
}