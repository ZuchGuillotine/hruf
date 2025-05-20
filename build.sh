#!/bin/bash

# Clean up any previous builds
rm -rf dist

# Run the vite build for the frontend
echo "Building frontend..."
npx vite build

# Bundle server index file
echo "Bundling server index..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Copy necessary server files
echo "Copying server files..."
mkdir -p dist/server
cp -r server/* dist/server/

# Create a server starter that points to the right file
echo "Creating server starter..."
cat > dist/server.js << 'EOF'
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Set production environment
process.env.NODE_ENV = 'production';

// Import and run the bundled server
import './index.js';
EOF

echo "Build completed successfully!"