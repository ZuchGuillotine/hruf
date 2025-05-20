// Custom build script for deployment
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Starting deployment build process...');

try {
  // Clean dist directory
  console.log('Cleaning dist directory...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  fs.mkdirSync('dist');

  // Build frontend with Vite
  console.log('Building frontend with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });

  // Ensure server directory in dist
  console.log('Creating server directory structure...');
  if (!fs.existsSync('dist/server')) {
    fs.mkdirSync('dist/server', { recursive: true });
  }

  // Copy all server files
  console.log('Copying server files...');
  copyFolderRecursiveSync('server', 'dist');

  // Create server entry point
  console.log('Creating server entry point...');
  fs.writeFileSync('dist/server.js', `
// Production server entry point
process.env.NODE_ENV = 'production';
import './server/index.js';
  `.trim());

  console.log('Deployment build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}

// Helper function to copy folders recursively
function copyFolderRecursiveSync(source, target) {
  const targetFolder = path.join(target, path.basename(source));
  
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  if (fs.lstatSync(source).isDirectory()) {
    const files = fs.readdirSync(source);
    files.forEach(file => {
      const currentPath = path.join(source, file);
      if (fs.lstatSync(currentPath).isDirectory()) {
        copyFolderRecursiveSync(currentPath, targetFolder);
      } else {
        copyFileSync(currentPath, targetFolder);
      }
    });
  }
}

// Helper function to copy individual files
function copyFileSync(source, target) {
  const targetFile = path.join(target, path.basename(source));
  fs.writeFileSync(targetFile, fs.readFileSync(source));
}