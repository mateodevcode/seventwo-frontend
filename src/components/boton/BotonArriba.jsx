"use client";

import { ArrowUp } from "lucide-react";

const BotonArriba = () => {
  return (
    <div
      className="group relative overflow-hidden bg-sexto cursor-pointer select-none p-2.5 text-segundo"
      aria-label="Volver arriba"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <div className="absolute inset-0 bg-white [clip-path:polygon(0_0,0_0,0_0,0_0)] transition-[clip-path] duration-500 ease-out group-hover:[clip-path:polygon(0_0,100%_0,100%_100%,0_100%)]" />
      <div className="relative z-10 flex items-end justify-center gap-2 text-xl font-anton leading-none uppercase">
        <ArrowUp size={20} />
      </div>
    </div>
  );
};

export default BotonArriba;
