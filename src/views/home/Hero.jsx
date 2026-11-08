"use client";

import { useHeroTitle } from "@/components/gsap/useHeroTilte";
import BolaAnimada from "./components/BolaAnimada";

export default function Hero() {
  const ref = useHeroTitle();

  return (
    <section className="hero section-shell" id="inicio">
      <BolaAnimada />
      <BolaAnimada />
      <div className="hero-kicker">
        <span>01 /</span>
        <span>Estudio de software · Colombia</span>
      </div>
      <div className="hero-copy">
        <h1 ref={ref}>
          Software que
          <br />
          <em>mueve</em> negocios.
        </h1>
        <p>
          Construimos productos digitales a medida y operamos nuestras propias
          plataformas. Entendemos el negocio porque también estamos dentro de
          él.
        </p>
      </div>
      <div className="hero-bottom">
        <span>Seventwo Technologies</span>
        <span className="scroll-note">
          Scrollea para explorar <span className="line" />
        </span>
      </div>
    </section>
  );
}
