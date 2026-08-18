# Development Dockerfile untuk Next.js (hot-reload via volume mount)
FROM node:20-alpine

WORKDIR /app

# Copy dependency files dulu (layer caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code (akan di-override oleh volume mount saat dev)
COPY . .

EXPOSE 3000

# Next.js dev server dengan hot-reload
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
