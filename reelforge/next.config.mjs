/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Video uploads can be large; allow server actions to accept bigger bodies.
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
