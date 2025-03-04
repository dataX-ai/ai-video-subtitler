# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json .
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

ARG AI_BACKEND_URL
ENV AI_BACKEND_URL=${AI_BACKEND_URL}

WORKDIR /app

# Copy only necessary files from builder stage
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "run", "start"]