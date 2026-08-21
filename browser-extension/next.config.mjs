/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // Absolute paths ("/sidepanel/_next/...") resolve fine against a
  // chrome-extension:// origin, so no assetPrefix needed.
};

export default nextConfig;
