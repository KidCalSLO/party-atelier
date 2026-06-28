/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The Google Fonts <link> loads in the browser at runtime; don't fetch it
  // during the build (keeps builds fast and offline-safe).
  optimizeFonts: false,
};

export default nextConfig;
