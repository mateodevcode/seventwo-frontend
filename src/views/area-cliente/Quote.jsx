import { ArrowUpRight } from "lucide-react";
import PageHeading from "./components/PageHeading";

function Info({ label, value }) {
  return (
    <div className="info">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function Quote() {
  return (
    <section id="cotizar" aria-label="Cotizar nuevo proyecto">
      <PageHeading
        eyebrow="Nuevo proyecto"
        title={
          <>
            Cuéntanos <em>tu idea</em>
          </>
        }
        description="Completa este formulario y prepararemos una propuesta a tu medida."
      />

      <div className="data-panel quote-form">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Primer paso</p>
            <h2>¿Qué tienes en mente?</h2>
          </div>
        </div>
        <div className="info-fields">
          <Info label="Nombre del proyecto" value="Nueva web corporativa" />
          <Info label="Presupuesto estimado" value="A definir" />
          <Info label="Tipo de proyecto" value="Web / Diseño / Desarrollo" />
          <Info label="Fecha ideal de inicio" value="Lo antes posible" />
        </div>
        <span className="button button-primary quote-submit" aria-hidden="true">
          Enviar solicitud <ArrowUpRight aria-hidden="true" />
        </span>
      </div>
    </section>
  );
}
