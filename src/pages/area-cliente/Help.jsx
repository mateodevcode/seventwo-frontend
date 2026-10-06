import { ArrowUpRight, FileText, Headphones, Search, Sparkles } from "lucide-react";
import PageHeading from "./components/PageHeading";

function HelpCard({ icon: Icon, title, text }) {
  return (
    <span className="help-card" aria-hidden="true">
      <div className="quick-icon">
        <Icon aria-hidden="true" />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      <ArrowUpRight aria-hidden="true" />
    </span>
  );
}

export default function Help() {
  return (
    <section id="ayuda" aria-label="Ayuda">
      <PageHeading
        eyebrow="Centro de ayuda"
        title={
          <>
            ¿En qué <em>podemos ayudarte?</em>
          </>
        }
        description="Encuentra respuestas rápidas a las preguntas más frecuentes."
      />

      <div className="help-search" aria-hidden="true">
        <Search aria-hidden="true" />
        <span>Buscar en el centro de ayuda...</span>
      </div>

      <div className="help-grid">
        <HelpCard
          icon={FileText}
          title="Facturación y pagos"
          text="Gestiona tus facturas, pagos y datos fiscales."
        />
        <HelpCard
          icon={Sparkles}
          title="Tu servicio"
          text="Conoce todo lo que incluye tu plan contratado."
        />
        <HelpCard
          icon={Headphones}
          title="Soporte técnico"
          text="Te ayudamos con cualquier incidencia o duda."
        />
      </div>
    </section>
  );
}
