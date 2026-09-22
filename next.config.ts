import withSerwist from '@serwist/next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

const nextConfig = {
  output: 'standalone' as const,
  turbopack: {},
};

export default withNextIntl(
  withSerwist({
    swSrc: 'src/app/sw.ts',
    swDest: 'public/sw.js',
    disable: process.env.NODE_ENV === 'development',
  })(nextConfig),
);
