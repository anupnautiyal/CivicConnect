import type { NextConfig } from "next";
const config: NextConfig = {
 transpilePackages: ["@civicconnect/domain"],
 experimental: { serverActions: { bodySizeLimit: "7mb" } }
};
export default config;
