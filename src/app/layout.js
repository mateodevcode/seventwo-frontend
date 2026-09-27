import {
  Geist,
  Geist_Mono,
  Bangers,
  Anton,
  Londrina_Outline,
  Archivo_Black,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const geistPoppins = Geist({
  variable: "--font-geist-poppins",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const geistMontserrat = Geist({
  variable: "--font-geist-montserrat",
  subsets: ["latin"],
});

const geistBangers = Bangers({
  variable: "--font-geist-bangers",
  subsets: ["latin"],
  weight: ["400"],
});

const geistAnton = Anton({
  variable: "--font-geist-anton",
  subsets: ["latin"],
  weight: ["400"],
});

const geistLondrina = Londrina_Outline({
  variable: "--font-geist-londrina",
  subsets: ["latin"],
  weight: ["400"],
});

const geistArchivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: "400", // revisá qué weights tiene disponibles en fonts.google.com antes de pedir otros
});

export const metadata = {
  title: "Seventwo Technologies",
  description:
    "En Seventwo desarrollamos software a medida, aplicaciones web y móviles, con un enfoque fuerte en ciberseguridad. Impulsa tu negocio con soluciones tecnológicas seguras, eficientes y adaptadas a tus necesidades.",
  keywords:
    "Seventwo Technologies, software, desarrollo, ciberseguridad, aplicaciones, web, móviles, tecnología, soluciones, personalizadas, software a medida, desarrollo de software, aplicaciones web, aplicaciones móviles, ciberseguridad, soluciones tecnológicas, desarrollo de aplicaciones, desarrollo web, desarrollo móvil, tecnología avanzada, soluciones personalizadas",
  authors: [
    {
      name: "Mateo Lizcano Noriega",
      url: "https://mateoln.vercel.app",
    },
  ],
  creator: "Seventwo Technologies",
  publisher: "Seventwo Technologies",
  robots: "index, follow",
  icons: {
    icon: "/logo/favicon.ico",
    shortcut: "/logo/favicon.ico",
  },
  metadataBase: new URL("https://www.seventwo.tech"),
  openGraph: {
    title: "Seventwo Technologies",
    description: "Desarrollamos el software que tu empresa necesita.",
    url: "https://www.seventwo.tech",
    siteName: "Seventwo",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Seventwo Technologies",
      },
    ],
    locale: "es-ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Seventwo Technologies",
    description: "Desarrollo de software y soluciones tecnológicas avanzadas.",
    images: ["https://www.seventwo.tech/og-image.png"],
    creator: "@seventwotech", // opcional
  },
};
export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${geistMontserrat.variable} ${geistPoppins.variable} ${geistBangers.variable} ${geistAnton.variable} ${geistLondrina.variable} ${geistArchivoBlack.variable} antialiased `}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
