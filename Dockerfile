# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/

# Install dependencies
RUN cd apps/backend && npm ci --only=production
RUN cd apps/frontend && npm ci --only=production

# Copy source code
COPY apps/backend ./apps/backend
COPY apps/frontend ./apps/frontend

# Build applications
RUN cd apps/backend && npm run build
RUN cd apps/frontend && npm run build

# Production stage
FROM node:18-alpine AS production

# Install PM2 globally
RUN npm install -g pm2

# Create app directory
WORKDIR /app

# Copy built applications
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

COPY --from=builder /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=builder /app/apps/frontend/package.json ./apps/frontend/
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

# Copy PM2 ecosystem file
COPY ecosystem.config.json ./

# Create logs directory
RUN mkdir -p logs

# Expose ports
EXPOSE 3000 5000

# Start applications with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.json"]