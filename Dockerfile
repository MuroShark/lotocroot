# 1. Этап сборки (Builder)
FROM node:20-alpine AS builder
WORKDIR /app

# Копируем конфиги зависимостей
COPY package*.json ./

# Устанавливаем зависимости (используем ci для чистоты)
RUN npm ci

# Копируем весь исходный код проекта
COPY . .

# Собираем проект (именно тут создается папка .next со всеми стилями)
RUN npm run build

# ---

# 2. Этап запуска (Runner)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache libc6-compat

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/next.config.js ./

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

ENV PORT=3000
EXPOSE 3000

CMD ["/bin/sh", "-c", "ls -la && npm start"]