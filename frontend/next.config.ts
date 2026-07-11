import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${apiUrl}/:path*`,
        },
      ],
    };
  },
  // Disable image optimization in production to reduce build time
  images: {
    unoptimized: true,
  },
  // Enable SWR revalidation for better caching
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, s-maxage=3600',
        },
      ],
    },
  ],
};

export default nextConfig;
