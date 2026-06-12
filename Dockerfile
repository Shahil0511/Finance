# Stage 1: Build the React frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Install frontend deps (cached layer unless package.json changes)
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

# Copy source and build (vite outputs to ../backend/public per vite.config.js)
COPY frontend/ ./frontend/
RUN mkdir -p backend/public && cd frontend && npm run build


# Stage 2: Production backend
FROM node:20-alpine AS runner

WORKDIR /app/backend

# Install only production deps
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend source files. backend/public is excluded by .dockerignore,
# then replaced with the freshly compiled frontend below.
COPY backend/ ./

# Copy the compiled frontend from the builder stage
COPY --from=builder /app/backend/public ./public/

ENV NODE_ENV=production
ENV PORT=5555

EXPOSE 5555

CMD ["node", "server.js"]
