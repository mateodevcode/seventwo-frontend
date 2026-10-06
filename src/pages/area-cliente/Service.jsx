import { Check, Headphones, Sparkles } from "lucide-react";
import PageHeading from "./components/PageHeading";

export default function Service() {
  return (
    <section id="servicio" aria-label="Servicio contratado">
      <PageHeading
        eyebrow="Tu servicio"
        title={
          <>
            Servicio <em>contratado</em>
          </>
        }
        description="Todo lo que hacemos para mantener tu presencia digital a punto."
        action={
          <span className="button button-outline" aria-hidden="true">
            <Headphones aria-hidden="true" /> Contactar con soporte
          </span>
        }
      />

      <div className="service-hero">
        <div>
          <span className="pill active-pill">Activo</span>
          <h2>
            Mantenimiento web
            <br />
            <em>Essential</em>
          </h2>
          <p>Tu web rápida, segura y siempre actualizada.</p>
          <div className="service-meta">
            <span>
              Inicio <strong>01 Ene 2024</strong>
            </span>
            <span>
              Renovación <strong>Mensual</strong>
            </span>
            <span>
              Inversión <strong>480,00 € / mes</strong>
            </span>
          </div>
        </div>
        <div className="service-shape" aria-hidden="true">
          <Sparkles aria-hidden="true" />
        </div>
      </div>

      <div className="included-grid">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Lo que incluye</p>
            <h2>Tu plan de servicio</h2>
          </div>
        </div>
        <div className="feature-list">
          <span>
            <Check aria-hidden="true" /> Actualizaciones y mantenimiento técnico
          </span>
          <span>
            <Check aria-hidden="true" /> Monitorización de seguridad 24/7
          </span>
          <span>
            <Check aria-hidden="true" /> Copias de seguridad semanales
          </span>
          <span>
            <Check aria-hidden="true" /> Soporte prioritario por email
          </span>
        </div>
      </div>
    </section>
  );
}
