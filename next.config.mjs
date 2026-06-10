/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs", "jsonwebtoken"],
  },
};
export default nextConfig;
