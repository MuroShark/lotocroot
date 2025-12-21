# 🎲 LotoСroot

**LotoСroot** — это интерактивная платформа для стримеров, объединяющая функционал аукционов и рулетки. Приложение создано для повышения вовлеченности аудитории, управления донатами и проведения захватывающих розыгрышей в реальном времени.

## ✨ Основные возможности

### 🏷️ Аукцион (Auction)
Профессиональный инструмент для проведения аукционов (например, на выбор игры, фильма или челленджа).

- **Интеграции**: Полная поддержка **DonationAlerts**, **DonatePay** и **Twitch**.
- **Умный Таймер**: Гибкие настройки авто-продления времени при новых ставках, новых лотах или смене лидера.
- **Управление лотами**: Автоматическая сортировка, добавление времени, история выбывших лотов.
- **Интерактивность**: Панель входящих донатов, отображение топ-донатеров и настраиваемые правила.

### 🎡 Рулетка (Roulette)
Красочная и динамичная рулетка для розыгрышей призов.

- **Режимы игры**:
  - *Классический*: Традиционный выбор одного победителя.
  - *На выбывание (Elimination)*: Режим "Battle Royale", где сектора исчезают до последнего выжившего.
- **Кастомизация**: Настройка длительности вращения, цветов, весов секторов и скрытие выбывших участников.
- **Визуальные эффекты**: Анимации частиц (конфетти), плавное вращение и модальные окна победителей.

## 🛠️ Технологический стек

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Phosphor Icons

## 🚀 Запуск проекта

1. **Установите зависимости:**
```bash
npm install
# или
yarn install
```

2. **Запустите режим разработки:**
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
