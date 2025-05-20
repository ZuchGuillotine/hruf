/**
 * Deployment preparation script for StackTracker
 * 
 * This script addresses the specific deployment issues:
 * 1. Ensuring server/index.js exists in the build output
 * 2. Aligning file paths between development and production
 * 3. Creating proper entry points for the production server
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting deployment preparation...');

// Ensure we have the right directories
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// Run the standard build process first
try {
  console.log('Building frontend with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });
} catch (error) {
  console.error('Error building frontend:', error);
  process.exit(1);
}

// Create server directory in dist
if (!fs.existsSync('dist/server')) {
  fs.mkdirSync('dist/server', { recursive: true });
}

// Copy entire server directory structure
console.log('Copying server directory to dist...');
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      // For TypeScript files, transform to JavaScript
      if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        const destJsPath = destPath.replace(/\.tsx?$/, '.js');
        
        // Simple transformation for TypeScript files (remove type annotations)
        let content = fs.readFileSync(srcPath, 'utf8');
        
        // Remove type annotations
        content = content
          .replace(/: [a-zA-Z0-9<>,\[\] |]+/g, '')  // Remove type annotations
          .replace(/<[a-zA-Z0-9<>,\[\] |]+>/g, '')  // Remove generic type parameters
          .replace(/import .* from ['"]\./g, match => match.replace('.', './')) // Fix relative imports
          .replace(/^export interface .*?\}/gms, '') // Remove interfaces
          .replace(/^export type .*?;/gm, ''); // Remove type exports
          
        fs.writeFileSync(destJsPath, content);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// Copy server files with conversion
copyDir('server', 'dist/server');

// Copy db directory as well (needed for database connections)
copyDir('db', 'dist/db');

// Create main entry point
console.log('Creating main entry point...');
fs.writeFileSync('dist/index.js', `
// Production server entry point
process.env.NODE_ENV = 'production';

// Import server
import('./server/index.js').catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
`);

console.log('✅ Deployment preparation completed!');
console.log('The application is now ready for deployment in the dist directory.');