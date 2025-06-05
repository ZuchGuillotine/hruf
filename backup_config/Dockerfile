# --- Build stage ---------------------------------------------------
FROM node:20-slim AS builder

# Create app directory
WORKDIR /app

# Install dependencies (including dev-deps needed for the build)
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the production assets (Vite + esbuild)
RUN npx vite build && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server

# Remove dev dependencies to keep the runtime layer small
# RUN npm prune --production

# --- Runtime stage --------------------------------------------------
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

# Copy built app & prod dependencies from builder layer
COPY --from=builder /app /app

# Expose the port the server listens on (see server/index.ts, default 3001)
EXPOSE 3001

# Default command – start the Node server
CMD ["node", "dist/server/index.js"] 