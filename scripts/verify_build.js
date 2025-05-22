/**
 * Build Verification Script
 * This script verifies that the build output is correctly structured for deployment
 */

import fs from 'fs';
import path from 'path';

// Check if running in a production environment
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Running build verification in ${isProduction ? 'production' : 'development'} mode`);

// Define the build directory path
const distDir = path.resolve(process.cwd(), 'dist');
const serverDir = path.resolve(distDir, 'server');
const publicDir = path.resolve(serverDir, 'public');

// Function to verify directory existence
function verifyDirectory(dirPath, name) {
  try {
    if (fs.existsSync(dirPath)) {
      console.log(`✓ ${name} directory exists at: ${dirPath}`);
      const files = fs.readdirSync(dirPath);
      console.log(`  Contents (${files.length} items): ${files.slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}`);
      return true;
    } else {
      console.error(`✗ ${name} directory is missing at: ${dirPath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error checking ${name} directory:`, error.message);
    return false;
  }
}

// Check all required directories
const distExists = verifyDirectory(distDir, 'Dist');
const serverExists = verifyDirectory(serverDir, 'Server');
const publicExists = verifyDirectory(publicDir, 'Public');

// Check critical files
function verifyFile(filePath, name) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`✓ ${name} file exists (${(stats.size / 1024).toFixed(2)} KB)`);
      return true;
    } else {
      console.error(`✗ ${name} file is missing at: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error checking ${name} file:`, error.message);
    return false;
  }
}

// Check critical files
const serverIndexExists = verifyFile(path.join(serverDir, 'index.js'), 'Server index');
const publicIndexHtmlExists = verifyFile(path.join(publicDir, 'index.html'), 'HTML index');

// Summarize verification
console.log('\nBuild Verification Summary:');
if (distExists && serverExists && publicExists && serverIndexExists && publicIndexHtmlExists) {
  console.log('✓ Build structure appears correct for deployment');
} else {
  console.log('✗ Build structure has issues that may prevent successful deployment');
}

// Provide next steps
console.log('\nNext Steps:');
console.log('1. Run "npm run build" to rebuild the application if issues were found');
console.log('2. Ensure that the build script in package.json is correctly configured');
console.log('3. For Replit deployment, ensure port 5000 is used in production');