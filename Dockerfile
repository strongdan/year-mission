# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm i -g pnpm@latest

# Copy lockfile and package manifests
COPY pnpm-lock.yaml .
COPY package.json .

# Install dependencies (pruned for production)
RUN pnpm install --frozen-lockfile --prod

# Copy the rest of the source code
COPY . .

# Build the Next.js app
RUN pnpm build

# ---- Runtime Stage ----
FROM node:20-alpine AS runner
WORKDIR /app

# Install pnpm
RUN npm i -g pnpm@latest

# Copy only the necessary files from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Set environment variables
ENV NODE_ENV production
ENV PORT 3000
EXPOSE 3000

# Start the Next.js server
CMD ["pnpm", "start"]
