/** @type {import('next').NextConfig} */
const nextConfig = {
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
        hostname: "developers.google.com", // ✅ add this line
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
   experimental: {
    appDir: true
  }
};

module.exports = nextConfig;
