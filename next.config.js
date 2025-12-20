/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production';

const getCSP = () => {
  const policies = {
    'default-src': ["'self'"],
    // Добавили https://unpkg.com чтобы разрешить загрузку скрипта иконок
    'script-src': ["'self'", "'wasm-unsafe-eval'", "'inline-speculation-rules'", "https://unpkg.com", "'unsafe-inline'"],
    // Добавили https://unpkg.com для стилей (если скрипт подгружает CSS)
    'style-src': ["'self'", "'unsafe-inline'", "https://unpkg.com"],
    'img-src': ["'self'", 'blob:', 'data:'],
    'connect-src': ["'self'", 'wss://*.donationalerts.com', 'https://www.donationalerts.com', "https://unpkg.com"],
    // Добавили https://unpkg.com для шрифтов
    'font-src': ["'self'", 'data:', "https://unpkg.com"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'", 'https://www.donationalerts.com'],
    'frame-ancestors': ["'none'"],
    'block-all-mixed-content': [],
    'upgrade-insecure-requests': [],
  };

  if (isDev) {
    policies['script-src'].push("'unsafe-eval'");
  }

  return Object.entries(policies)
    .map(([key, value]) => `${key} ${value.join(' ')}`)
    .join('; ');
};

const nextConfig = {
  // output: "standalone",
  
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