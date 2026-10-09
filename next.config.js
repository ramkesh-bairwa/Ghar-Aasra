/** @type {import('next').NextConfig} */
const nextConfig = {
  // Browsers that ask for /favicon.ico directly get the theme-coloured icon.
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [{ source: "/favicon.ico", destination: "/theme-icon/32" }],
      // Uploads saved after `next build` aren't in the static file set that
      // `next start` serves; this only kicks in when no static file matched.
      fallback: [{ source: "/uploads/:path*", destination: "/api/uploads/:path*" }],
    };
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

module.exports = nextConfig;
