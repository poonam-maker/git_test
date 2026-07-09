/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Video uploads can be large; allow server actions to accept bigger bodies.
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    // Server-only, dynamically-imported libs — keep them out of the bundle
    // (required at runtime instead). Silences BullMQ's dynamic-require warning
    // and trims the serverless bundle.
    serverComponentsExternalPackages: [
      "bullmq",
      "ioredis",
      "@aws-sdk/client-s3",
    ],
  },
};

export default nextConfig;
