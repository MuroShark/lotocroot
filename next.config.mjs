// @ts-check

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  async headers() {
    const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
    const sentryHost = sentryDsn ? new URL(sentryDsn).host : '';

    const cspHeader = `
      default-src 'self';
      script-src 'self' 'wasm-unsafe-eval' 'inline-speculation-rules' ${process.env.NODE_ENV === 'development' ? "'unsafe-eval' 'unsafe-inline'" : ''};
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data:;
      media-src 'none';
      connect-src 'self' wss://*.donationalerts.com wss://centrifugo.donationalerts.com https://www.donationalerts.com https://${sentryHost};
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      worker-src 'self' blob:;
      block-all-mixed-content;
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim();

    return [{ source: '/:path*', headers: [{ key: 'Content-Security-Policy', value: cspHeader }] }];
  },
};

export default nextConfig;