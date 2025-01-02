import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    domains: ['uqgrhwejkbnybsvnbauh.supabase.co']  // Supabase storage hostname'ini ekle
  },
};

export default nextConfig;
