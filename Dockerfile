# Use Node.js 22.17.1 as the base image
FROM node:22.17.1-alpine AS base

# Install necessary dependencies
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# -------------------
# Dependencies stage
# -------------------
FROM base AS deps
# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies using npm
RUN npm ci --only=production

# -------------------
# Build stage
# -------------------
FROM base AS builder
# Copy dependencies from the deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Copy environment variables (if available)
COPY .env* ./

# Build the Next.js application
RUN npm run build

# -------------------
# Production stage
# -------------------
FROM base AS production

# Create a non-root user
RUN addgroup -S -g 1001 nodejs
RUN adduser -D -S -u 1001 -G nodejs nextjs

# Set working directory
WORKDIR /app

# Copy built application and dependencies
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Change ownership to the nextjs user
RUN chown -R nextjs:nodejs .

# Switch to the non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Start the application
CMD ["node", "server.js"]