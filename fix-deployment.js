/**
 * Minimal deployment fix script
 * This script addresses the specific deployment issues:
 * 1. Missing server/index.js in build output
 * 2. Incorrect file paths in production
 */

// Import required modules
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting deployment fix...');

// 1. Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// 2. Ensure server directory exists in dist
if (!fs.existsSync('dist/server')) {
  fs.mkdirSync('dist/server', { recursive: true });
}

// 3. Copy server/index.ts to dist/server/index.js with minimal transformation
try {
  console.log('Copying server/index.ts to dist/server/index.js...');
  
  // Read the original TypeScript file
  const indexContent = fs.readFileSync('server/index.ts', 'utf8');
  
  // Simple transformation to JavaScript (remove TypeScript annotations)
  const jsContent = indexContent
    .replace(/: Express/g, '')
    .replace(/: Request/g, '')
    .replace(/: Response/g, '')
    .replace(/: NextFunction/g, '')
    .replace(/: Server/g, '')
    .replace(/: number/g, '')
    .replace(/: string/g, '')
    .replace(/: Error/g, '')
    .replace(/: unknown/g, '')
    .replace(/: CustomError/g, '')
    .replace(/: any/g, '');
  
  // Write to the destination
  fs.writeFileSync('dist/server/index.js', jsContent);
  
  console.log('Created dist/server/index.js successfully');
} catch (error) {
  console.error('Error copying server/index.ts:', error);
}

// 4. Create a simple entry point
console.log('Creating main entry point...');
fs.writeFileSync('dist/index.js', `
// Production server entry point
process.env.NODE_ENV = 'production';
require('./server/index.js');
`);

console.log('Deployment fix completed!');