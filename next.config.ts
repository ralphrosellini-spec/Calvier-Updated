import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        // Firebase Storage — allows all Firebase project storage buckets
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '*.firebasestorage.app',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.app',
      },
      {
        // Firebase Storage alternate CDN
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        // Flag CDN used in login page
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
    ],
  },
  // Allow <img> tags to load from Firebase Storage without domain restriction
  // (next/image uses remotePatterns above; raw <img> tags work without config)
};

export default nextConfig;
