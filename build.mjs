#!/usr/bin/env node

/**
 * Production build script for StackTracker application
 * This script prepares the application for deployment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility functions
function log(message) {
  console.log(`\x1b[36m${message}\x1b[0m`);
}

function error(message) {
  console.error(`\x1b[31mERROR: ${message}\x1b[0m`);
  process.exit(1);
}

function exec(command) {
  try {
    log(`Executing: ${command}`);
    execSync(command, { stdio: 'inherit' });
  } catch (err) {
    error(`Command failed: ${command}\n${err.message}`);
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyRecursive(src, dest) {
  ensureDir(dest);
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Main build process
async function build() {
  try {
    log('🚀 Starting production build process');
    
    // Clean dist folder
    log('Cleaning dist folder...');
    if (fs.existsSync('dist')) {
      fs.rmSync('dist', { recursive: true, force: true });
    }
    ensureDir('dist');
    
    // Build frontend
    log('Building frontend with Vite...');
    exec('npx vite build');
    
    // Compile server TypeScript
    log('Compiling server TypeScript...');
    exec('npx tsc -p tsconfig.server.json');
    
    // Copy server files to dist
    log('Copying server files to dist...');
    ensureDir('dist/server');
    copyRecursive('server-dist', 'dist/server');
    
    // Copy necessary config files
    log('Copying configuration files...');
    fs.copyFileSync('package.json', 'dist/package.json');
    
    // Create server entry point
    log('Creating server entry point...');
    fs.writeFileSync('dist/server.js', `
// Production server entry point
process.env.NODE_ENV = 'production';
require('./server/index.js');
`);
    
    log('✅ Build completed successfully!');
    log('The application is ready for deployment in the dist directory');

  } catch (err) {
    error(`Build failed: ${err.message}`);
  }
}

// Run the build
build().catch(error);