# 1. Base image
FROM node:20-alpine AS base

# 2. Dependencies
FROM base AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
RUN npm ci

# 3. Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Отключаем телеметрию (опционально)
ENV NEXT_TELEMETRY_DISABLED 1

# Собираем в режиме Standalone (благодаря настройке в next.config.js)
RUN npm run build

# 4. Runner (Финальный образ)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

# Создаем пользователя, чтобы не запускать под root (безопасность)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем публичные файлы (картинки, robots.txt)
COPY --from=builder /app/public ./public

# --- МАГИЯ STANDALONE ---
# Копируем только скомпилированное приложение
# Оно уже содержит внутри next.config.js и нужные node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Запускаем server.js (который создал Next.js), а не npm start
CMD ["node", "server.js"]