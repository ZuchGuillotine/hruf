/**
 * Deployment build script for StackTracker
 * This script handles the build process for production deployment,
 * ensuring all server files are properly compiled and included.
 */
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Run a command and return a promise
function runCommand(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      if (error) {
        console.error(`Error executing command: ${command}`);
        return reject(error);
      }
      resolve();
    });
  });
}

// Copy a file from source to destination
function copyFile(source: string, destination: string): void {
  try {
    fs.copyFileSync(source, destination);
  } catch (error) {
    console.error(`Error copying file from ${source} to ${destination}:`, error);
    throw error;
  }
}

// Copy directory recursively
function copyDirectory(source: string, destination: string): void {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Read all files/folders in the source directory
  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    // Skip node_modules and .git directories
    if (entry.name === 'node_modules' || entry.name === '.git') {
      continue;
    }

    if (entry.isDirectory()) {
      // Recursively copy directories
      copyDirectory(srcPath, destPath);
    } else {
      // Copy files
      copyFile(srcPath, destPath);
    }
  }
}

async function buildForDeployment(): Promise<void> {
  try {
    console.log('Starting production build process...');

    // Step 1: Clean dist directory
    if (fs.existsSync('dist')) {
      console.log('Cleaning existing dist directory...');
      fs.rmSync('dist', { recursive: true });
    }
    fs.mkdirSync('dist');

    // Step 2: Build frontend with Vite
    console.log('Building frontend with Vite...');
    await runCommand('npx vite build');

    // Step 3: Compile TypeScript server files
    console.log('Compiling server TypeScript files...');
    await runCommand('npx tsc --project tsconfig.server.json');

    // Step 4: Copy necessary server files to dist
    console.log('Copying compiled server files to dist...');
    if (!fs.existsSync('dist/server')) {
      fs.mkdirSync('dist/server', { recursive: true });
    }
    copyDirectory('server-dist', 'dist/server');

    // Step 5: Create a server entry point
    console.log('Creating server entry point...');
    const serverEntryPoint = `
// Production server entry point
process.env.NODE_ENV = 'production';
require('./server/index.js');
    `.trim();
    fs.writeFileSync('dist/server.js', serverEntryPoint);

    // Step 6: Copy package.json and other essential files
    console.log('Copying essential project files...');
    copyFile('package.json', 'dist/package.json');
    
    if (fs.existsSync('.env.production')) {
      copyFile('.env.production', 'dist/.env');
    }

    console.log('Build completed successfully! Files are ready in the dist directory.');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Run the build process
buildForDeployment().catch(console.error);