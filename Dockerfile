# ---------- 1️⃣ Base Builder Stage ----------
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Copy dependency files first (better caching)
COPY package*.json tsconfig*.json ./
COPY prisma ./prisma

# Install dependencies for building
RUN npm ci

# Copy full source and build
COPY . .
RUN npm run build

# ---------- 2️⃣ Production Dependencies Stage ----------
FROM node:22-alpine AS deps

WORKDIR /usr/src/app

# Copy only package files for prod deps
COPY package*.json ./
COPY prisma ./prisma

RUN npm ci --omit=dev

# ---------- 3️⃣ Final Runtime Stage ----------
FROM node:22-alpine AS runner

# Environment variables (can be overridden via docker-compose)
ENV NODE_ENV=production \
    PORT=3000

WORKDIR /usr/src/app

# Copy production node_modules and built files from previous stages
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# Expose app port
EXPOSE ${PORT}

# Run command
CMD ["sh", "-c", "npm run db:deploy && npm run start:server"]

# ---------- 4️⃣ Image Size Output ----------
# Print image size after build
RUN echo "----- IMAGE SIZE -----" && du -sh /usr/src/app