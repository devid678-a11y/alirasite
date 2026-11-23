/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep each production build in a fresh directory. The PM2 process runs as root,
  // while deployment builds run as alira-deploy; isolating outputs avoids ownership conflicts.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
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
