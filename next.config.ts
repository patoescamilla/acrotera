import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

/**
 * Cabeceras de seguridad aplicadas a todas las respuestas.
 * No hay Content-Security-Policy todavía: hacerla bien exige nonces
 * para los scripts que Next inyecta, y una mal puesta rompe el sitio
 * en silencio. Queda anotada como pendiente.
 */
const securityHeaders = [
  // Obliga HTTPS durante dos años, incluidos subdominios.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Impide que el navegador adivine el tipo de un archivo servido.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Nadie puede meter el sitio en un iframe para engañar al usuario.
  { key: "X-Frame-Options", value: "DENY" },
  // No filtrar la ruta completa al navegar a otros dominios.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Apaga APIs del navegador que esta tienda no usa.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
