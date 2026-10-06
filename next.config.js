/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{
      source: "/sw.js",
      headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
    }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "covers.openlibrary.org", // ✅ added
      },
      {
        protocol: "https",
        hostname: "archive.org", // ✅ optional (backup image source)
      },
      {
        protocol: "https",
        hostname: "www.gutenberg.org",
      },
      {
        protocol: "https",
        hostname: "assets.openstax.org",
      },
       {
        protocol: "https",
        hostname: "developers.google.com", // ✅ add this line
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
