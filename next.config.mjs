/** @type {import('next').NextConfig} */
const nextConfig = {
  // Imagen Docker mínima: .next/standalone incluye server.js y solo las
  // dependencias usadas (ver Dockerfile).
  output: "standalone",
};

export default nextConfig;
