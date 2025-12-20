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
};

module.exports = nextConfig;

// Injected content via Sentry wizard below

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  module.exports,
  {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    // We need to move the headers configuration inside withSentryConfig
    // to ensure it is applied correctly.
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [{ key: 'Content-Security-Policy', value: getCSP() }],
        },
      ];
    },

    org: "muroshark",
    project: "javascript-nextjs",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);
