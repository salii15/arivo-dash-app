/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  experimental: {

  },
  images: {
    domains: ['uqgrhwejkbnybsvnbauh.supabase.co']
  }
}

module.exports = nextConfig 