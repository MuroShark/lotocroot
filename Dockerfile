# 1. Base image
FROM node:22-alpine AS base

# Устанавливаем зависимости для работы sharp и нативных модулей
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 2. Install dependencies
FROM base AS deps
COPY package.json package-lock.json* yarn.lock* .npmrc* ./

# Устанавливаем зависимости (npm ci использует lock-файл для чистоты)
RUN npm ci

# 3. Build the source code
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Отключаем телеметрию Next.js на этапе сборки
ENV NEXT_TELEMETRY_DISABLED=1

# Сборка проекта
RUN npm run build

# 4. Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Создаем системного пользователя
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем публичные файлы
COPY --from=builder /app/public ./public

# Настраиваем права для кэша
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Копируем standalone сборку (она создается благодаря output: "standalone" в конфиге)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]