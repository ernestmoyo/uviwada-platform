/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.childrenincrossfire.org' }
    ]
  },
  async rewrites() {
    return [
      { source: '/legacy', destination: '/_legacy/index.html' },
      { source: '/legacy/:path*', destination: '/_legacy/:path*' }
    ]
  }
}

export default nextConfig
