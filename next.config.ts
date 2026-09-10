import withSerwist from '@serwist/next';

const nextConfig = {
  output: 'standalone' as const,
  turbopack: {},
};

export default withSerwist({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);
