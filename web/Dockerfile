# =========================================================
# Builder: install dependencies + build Next.js production bundle
# =========================================================
FROM node:20-alpine AS builder
WORKDIR /app

# Dependency layer caching
COPY package.json package-lock.json ./
RUN npm ci

# NEXT_PUBLIC_* di-inline saat build. Harus URL yang bisa diakses browser,
# bukan nama service compose (mis. http://localhost:8080/api).
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY . .
RUN npm run build

# =========================================================
# Runner: runtime produksi minimal (next start)
# =========================================================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["npm", "run", "start", "--", "-H", "0.0.0.0"]
