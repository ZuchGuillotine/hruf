# Build stage
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ libc6-compat

# Set working directory to root of monorepo
WORKDIR /app

# Copy root manifest & lockfile first
COPY package.json package-lock.json ./

# Copy workspace manifests (so that npm ci treats workspaces correctly)
COPY apps/web/package.json apps/web/
COPY packages/ui/package.json packages/ui/
COPY packages/shared-components/package.json packages/shared-components/

# Install dependencies (using reproducible install via npm ci)
RUN npm ci --include-workspace-root

# Ensure the linux-musl esbuild binary is installed (avoid glibc mismatch)
RUN npm rebuild esbuild --platform=linuxmusl --arch=x64 || npm rebuild esbuild@latest --platform=linuxmusl --arch=x64

# Copy the entire monorepo (so that the root package.json's build script is available)
COPY . .

# Change to the web app directory for the build
WORKDIR /app/apps/web

# Build the application (using the musl binary of esbuild)
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/apps/web/dist ./dist
COPY --from=builder /app/apps/web/package.json ./
COPY --from=builder /app/package-lock.json ./

# Install production dependencies only
RUN npm install --production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port the app runs on
EXPOSE 8080

# Start the application
CMD ["node", "dist/server/index.js"] 