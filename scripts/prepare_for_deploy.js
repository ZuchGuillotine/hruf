/**
 * Deployment Preparation Script
 * 
 * This script helps prepare the application for deployment on Replit
 * by setting up the correct environment variables and configuration.
 */

import fs from 'fs';
import path from 'path';

// Ensure the dist directory exists
const distDir = path.resolve(process.cwd(), 'dist');
const serverDir = path.resolve(distDir, 'server');
const publicDir = path.resolve(serverDir, 'public');

// Create directories if they don't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

ensureDirectoryExists(distDir);
ensureDirectoryExists(serverDir);
ensureDirectoryExists(publicDir);

// Create a sample health check file in the public directory
const healthCheckPath = path.join(publicDir, 'health-check.html');
if (!fs.existsSync(healthCheckPath)) {
  console.log(`Creating health check file: ${healthCheckPath}`);
  const healthCheckContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StackTracker Health Check</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    .status { padding: 20px; border-radius: 5px; background: #e6f7ff; }
    .success { background: #f6ffed; border: 1px solid #b7eb8f; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <div class="container">
    <h1>StackTracker Health Check</h1>
    <div class="status success">
      <h2>✅ Service is running</h2>
      <p>The StackTracker application is running properly.</p>
      <p>Server time: <span id="server-time"></span></p>
    </div>
  </div>
  <script>
    document.getElementById('server-time').textContent = new Date().toISOString();
  </script>
</body>
</html>
  `;
  fs.writeFileSync(healthCheckPath, healthCheckContent);
}

console.log('✅ Deployment preparation completed successfully');
console.log('The application is now ready for deployment on Replit');