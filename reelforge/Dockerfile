# ReelForge app image.
# Includes ffmpeg so exports actually reframe + burn in captions in-container,
# and openssl for Prisma. Single stage for simplicity.
FROM node:22-bookworm-slim

# System deps: ffmpeg (export rendering), openssl (Prisma), ca-certs (HTTPS).
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Build the app (runs `prisma generate && next build`).
COPY . .
RUN npm run build

# Uploaded videos + rendered exports live here (mounted as a volume in compose).
RUN mkdir -p /app/storage
EXPOSE 3000

# On boot: sync the schema to the database, then start the server.
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && npm run start"]
