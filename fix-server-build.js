// Simple fix for server build issues
// This creates the minimal necessary files for deployment

// Create server/index.js in the dist directory
const fs = require('fs');
const path = require('path');

console.log('Starting server build fix...');

// Ensure dist/server directory exists
if (!fs.existsSync('dist/server')) {
  fs.mkdirSync('dist/server', { recursive: true });
}

// Create a simplified server/index.js directly in the dist directory
const serverIndexContent = `
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set production environment
process.env.NODE_ENV = 'production';

const app = express();

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '..')));

// All routes that don't match static files should serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;

// Write the server index file
fs.writeFileSync('dist/server/index.js', serverIndexContent);

// Create a main entry point that loads the server
const mainIndexContent = `
// Production server entry point
import './server/index.js';
`;

// Write the main entry point
fs.writeFileSync('dist/index.js', mainIndexContent);

console.log('Server build fix completed successfully!');