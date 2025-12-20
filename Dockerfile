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
RUN npm run build -- --no-lint --no-mangling

# ---

# 2. Этап запуска (Runner)
FROM node:20-alpine AS runner
WORKDIR /app

# Устанавливаем production (важно для оптимизации)
ENV NODE_ENV=production

# Копируем самое важное из этапа сборки
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# ВАЖНО: Копируем папку public (там картинки, фавиконки)
COPY --from=builder /app/public ./public

# ВАЖНО: Копируем ВСЮ папку .next (там и стили, и чанки, и сервер)
COPY --from=builder /app/.next ./.next

# Открываем порт и запускаем
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]