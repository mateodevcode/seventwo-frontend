import { ArrowUpRight } from "lucide-react";
import ProductArt from "./components/ProductArt";
import BolaAnimada from "./components/BolaAnimada";

const products = [
  {
    name: "Inmobitwo",
    status: "En desarrollo activo",
    sector: "Real estate",
    stack: "Web app · Colombia",
    featured: true,
    art: "inmobitwo-art",
    description:
      "La plataforma inmobiliaria pensada para encontrar, publicar y mover propiedades en Colombia.",
  },
  {
    name: "Bordex",
    status: "En standby",
    sector: "Operaciones",
    stack: "SaaS · Gestión",
    description:
      "Control de inventarios para plantas y equipos que necesitan operar con claridad.",
    art: "bordex-art",
  },
  {
    name: "Reservas",
    status: "Próximamente",
    sector: "Beauty & care",
    stack: "Mobile first · B2C",
    description:
      "Reservas simples para barberías y estilistas. El nombre todavía está en construcción.",
    art: "reservas-art",
  },
  {
    name: "Mainfud",
    status: "Próximamente",
    sector: "Food & beverage",
    stack: "Platform · B2B2C",
    description:
      "Una plataforma para que los restaurantes gestionen mejor su día a día.",
    art: "mainfud-art",
  },
];

export default function ProductEcosystem() {
  return (
    <section className="section-shell ecosystem relative" id="productos">
      <BolaAnimada />

      <div className="section-heading">
        <div>
          <span className="eyebrow">02 / Lo que estamos construyendo</span>
          <h2>
            Ideas que salen
            <br />
            <em>al mundo.</em>
          </h2>
        </div>
        <p>
          No solo entregamos proyectos. Creamos plataformas propias, las ponemos
          a prueba y aprendemos de usuarios reales.
        </p>
      </div>
      <div className="product-grid z-30">
        {products.map((product) => (
          <article
            className={
              product.featured ? "product-card featured" : "product-card"
            }
            key={product.name}
          >
            <ProductArt type={product.art} />
            <div className="product-info">
              <div className="product-top">
                <span className="status">
                  <span />
                  {product.status}
                </span>
                <ArrowUpRight aria-hidden="true" />
              </div>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <dl>
                <div>
                  <dt>Sector:</dt>
                  <dd>{product.sector}</dd>
                </div>
                <div>
                  <dt>Stack:</dt>
                  <dd>{product.stack}</dd>
                </div>
              </dl>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
