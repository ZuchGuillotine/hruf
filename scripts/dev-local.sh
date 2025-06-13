#!/bin/bash

echo "Starting local development server..."
echo "This script ensures proper configuration for local development"
echo ""
echo "IMPORTANT: Access the application at http://localhost:5173"
echo "NOT at http://localhost:3001"
echo ""

# Export LOCAL_DEV flag to help the server detect local development
export LOCAL_DEV=true

# CRITICAL: Override NODE_ENV for local development to fix auth
export NODE_ENV=development

echo "Setting NODE_ENV=development to ensure auth works locally"
echo ""

# Start both the Express server and Vite dev server
npm run dev 