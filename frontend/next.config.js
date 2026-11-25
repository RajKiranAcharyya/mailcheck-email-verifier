/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === 'true';

const nextConfig = {
  reactStrictMode: true,
  ...(isStaticExport
    ? {
        output: 'export',
        images: { unoptimized: true },
      }
    : {}),
  env: {
    NEXT_PUBLIC_API_URL: isStaticExport
      ? ''
      : (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'),
  },
};

module.exports = nextConfig;
