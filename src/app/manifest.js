// PWA instalable (Android, escritorio y iPhone/iPad desde "Añadir a pantalla de inicio").
// Necesaria para Web Push con la app cerrada (docs/PRESUPUESTOS.md §6).
export default function manifest() {
  return {
    name: "Seventwo Technologies",
    short_name: "Seventwo",
    description: "Tus proyectos, presupuestos y avisos de Seventwo.",
    start_url: "/area-cliente",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#100b17",
    theme_color: "#100b17",
    lang: "es",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
