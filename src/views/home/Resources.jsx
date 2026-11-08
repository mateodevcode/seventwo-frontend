import { ArrowUpRight } from "lucide-react";

export default function Resources() {
  return (
    <section className="resources section-shell" id="recursos">
      <div className="section-heading">
        <div>
          <span className="eyebrow">05 / Recursos</span>
          <h2>
            Ideas para
            <br />
            <em>seguir pensando.</em>
          </h2>
        </div>
        <a className="text-link" href="#contacto">
          Ver todos los recursos <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
      <div className="resource-grid">
        <article>
          <span>01 · Producto</span>
          <h3>Cuándo conviene construir software a medida</h3>
          <a href="#contacto">
            Leer artículo <ArrowUpRight aria-hidden="true" />
          </a>
        </article>
        <article>
          <span>02 · Seguridad</span>
          <h3>Ciberseguridad para pymes: por dónde empezar</h3>
          <a href="#contacto">
            Leer artículo <ArrowUpRight aria-hidden="true" />
          </a>
        </article>
        <article>
          <span>03 · Tecnología</span>
          <h3>Lo que cambia cuando operas tu propio producto</h3>
          <a href="#contacto">
            Leer artículo <ArrowUpRight aria-hidden="true" />
          </a>
        </article>
      </div>
    </section>
  );
}
