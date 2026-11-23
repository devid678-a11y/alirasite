/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep each production build in a fresh directory. The PM2 process runs as root,
  // while deployment builds run as alira-deploy; isolating outputs avoids ownership conflicts.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
  // User uploads are persistent runtime data, not deployment artifacts. Excluding them
  // prevents Next.js from copying gigabytes of images into every standalone build;
  // scripts/prepare-standalone.mjs links the live uploads directory at runtime.
  outputFileTracingExcludes: {
    "/*": ["./public/uploads/**/*"],
    "next-server": ["./public/uploads/**/*"],
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
