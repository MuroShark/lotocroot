const isDev = process.env.NODE_ENV !== 'production';

const getCSP = () => {
  // Получаем DSN Sentry из переменных окружения, чтобы разрешить подключение к его хосту.
  // Sentry SDK автоматически устанавливает NEXT_PUBLIC_SENTRY_DSN.
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const sentryHost = sentryDsn ? new URL(sentryDsn).host : '';

  const policies = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'wasm-unsafe-eval'", "'inline-speculation-rules'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    // Добавляем blob: для поддержки Sentry Replay
    'img-src': ["'self'", 'blob:', 'data:'],
    // Добавляем хост Sentry в connect-src
    'connect-src': ["'self'", 'wss://*.donationalerts.com', 'https://www.donationalerts.com'],
    // Разрешаем data: для инлайновых шрифтов, если они используются
    'font-src': ["'self'", 'data:'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'", 'https://www.donationalerts.com'],
    'frame-ancestors': ["'none'"],
    'block-all-mixed-content': [],
    'upgrade-insecure-requests': [],
    // Добавляем worker-src для Sentry Replay
    'worker-src': ["'self'", 'blob:'],
  };

  // Добавляем хост Sentry, только если DSN определен
  if (sentryHost) {
    policies['connect-src'].push(`https://${sentryHost}`);
  }

  if (isDev) {
    policies['script-src'].push("'unsafe-inline'", "'unsafe-eval'");
  }

  return Object.entries(policies)
    .map(([key, value]) => `${key} ${value.join(' ')}`)
    .join('; ');
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  // БЫЛО: output: 'export',
  // СТАЛО:
  output: 'standalone', 
  
  reactStrictMode: true,
  compress: false,
  
  // Ваши заголовки безопасности
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'Content-Security-Policy', value: getCSP() }],
      },
    ];
  },
};

module.exports = nextConfig;

// Injected content via Sentry wizard below

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  nextConfig, 
  {
    org: "muroshark",
    project: "javascript-nextjs",
    silent: !process.env.CI,
    widenClientFileUpload: true,
    tunnelRoute: "/monitoring",
    disableLogger: true,
    automaticVercelMonitors: true,
  }
);
