"use client";

import LogoModerno from "@/components/logo/LogoModerno";
import EnlaceFlip from "@/components/motion/EnlaceFlip";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const links = [
    ["Productos", "#productos"],
    ["Servicios", "#servicios"],
    ["Nosotros", "#nosotros"],
    ["Recursos", "#recursos"],
    ["Cliente", "/area-cliente"],
  ];

  return (
    <header className="site-header">
      <LogoModerno />

      <nav
        className={open ? "nav-links is-open" : "nav-links"}
        aria-label="Navegación principal"
      >
        {links.map(([label, href], i) => (
          <EnlaceFlip texto={label} textoHover={label} href={href} key={i} />
        ))}
        <div className="group relative overflow-hidden bg-sexto cursor-pointer select-none px-4 py-3.5 text-segundo mt-2 md:mt-0">
          <div className="absolute inset-0 bg-white [clip-path:polygon(0_0,0_0,0_0,0_0)] transition-[clip-path] duration-500 ease-out group-hover:[clip-path:polygon(0_0,100%_0,100%_100%,0_100%)]" />
          <div className="relative z-10 flex items-end justify-center gap-2 text-xl font-anton leading-none uppercase">
            <span>Cotiza tu proyecto</span>
            <ArrowUpRight />
          </div>
        </div>
      </nav>
      <button
        className="menu-button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
      >
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}
