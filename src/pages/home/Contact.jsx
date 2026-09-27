"use client";

import { ArrowUpRight } from "lucide-react";

export default function Contact() {
  return (
    <section className="contact section-shell" id="contacto">
      <div>
        <span className="eyebrow">06 / Hablemos</span>
        <h2>
          ¿Qué vamos a
          <br />
          <em>construir?</em>
        </h2>
        <p>Una buena conversación es un buen comienzo.</p>
      </div>
      <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
        <input aria-label="Nombre" placeholder="Tu nombre" />
        <input
          type="email"
          aria-label="Correo electrónico"
          placeholder="Tu correo"
        />
        <textarea
          aria-label="Mensaje"
          placeholder="Cuéntanos sobre tu proyecto"
          rows="3"
        />
        <div className="group relative overflow-hidden bg-primero cursor-pointer select-none px-4 py-3.5 text-segundo w-54">
          <div className="absolute inset-0 bg-sexto [clip-path:polygon(0_0,0_0,0_0,0_0)] transition-[clip-path] duration-500 ease-out group-hover:[clip-path:polygon(0_0,100%_0,100%_100%,0_100%)]" />
          <div className="relative z-10 flex items-end justify-center gap-2 text-xl font-anton leading-none uppercase">
            <span>Enviar mensaje</span>
            <ArrowUpRight />
          </div>
        </div>
      </form>
    </section>
  );
}
