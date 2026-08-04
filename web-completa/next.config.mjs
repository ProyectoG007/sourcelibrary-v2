/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Las imagenes se sirven directo desde images.sourcelibrary.org o via el
  // proxy /api/image de Source Library, por eso no usamos next/image ni
  // hace falta declarar remotePatterns.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Content-Type-Options", value: "nosniff" }],
      },
    ];
  },
};

export default nextConfig;
