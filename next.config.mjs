// Cabeceras de seguridad para todas las rutas del frontend.
// - frame-ancestors 'none' + X-Frame-Options: nadie puede incrustar la web en
//   un iframe (evita clickjacking sobre login y área de cliente).
// - Sin CSP de scripts por ahora: Next inyecta scripts inline y una CSP estricta
//   exige nonces; frame-ancestors es la parte que protege aquí.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Imagen Docker mínima: .next/standalone incluye server.js y solo las
  // dependencias usadas (ver Dockerfile).
  output: "standalone",
  // No anunciar la tecnología (X-Powered-By: Next.js).
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
