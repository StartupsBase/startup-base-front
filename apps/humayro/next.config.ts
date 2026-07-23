import type { NextConfig } from "next"
import path from "node:path"
import { fileURLToPath } from "node:url"

const monorepoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
)

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  deploymentId: process.env.DEPLOYMENT_VERSION,
  transpilePackages: ["@workspace/ui"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
    qualities: [75, 90, 100],
  },
}

export default nextConfig
