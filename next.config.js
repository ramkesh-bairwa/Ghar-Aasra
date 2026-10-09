/** @type {import('next').NextConfig} */
const nextConfig = {
  // Browsers that ask for /favicon.ico directly get the theme-coloured icon.
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/theme-icon/32" }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

module.exports = nextConfig;
