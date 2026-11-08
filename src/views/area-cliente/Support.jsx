import { ArrowUpRight, ChevronDown, Headphones, Plus } from "lucide-react";
import PageHeading from "./components/PageHeading";

export default function Support() {
  return (
    <section id="soporte" aria-label="Soporte">
      <PageHeading
        eyebrow="Estamos para ayudarte"
        title={
          <>
            Centro de <em>soporte</em>
          </>
        }
        description="Resuelve tus dudas o habla directamente con nuestro equipo."
        action={
          <span className="button button-primary" aria-hidden="true">
            <Plus aria-hidden="true" /> Nuevo ticket
          </span>
        }
      />

      <div className="support-grid">
        <div className="support-main">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Tus solicitudes</p>
              <h2>Tickets de soporte</h2>
            </div>
            <span className="filter-button" aria-hidden="true">
              Todos <ChevronDown aria-hidden="true" />
            </span>
          </div>
          <div className="ticket">
            <div className="ticket-status open" aria-hidden="true" />
            <div>
              <strong>Actualización de contenidos</strong>
              <span>#2841 · Abierto · Última respuesta hace 2h</span>
            </div>
            <ArrowUpRight aria-hidden="true" />
          </div>
          <div className="ticket">
            <div className="ticket-status closed" aria-hidden="true" />
            <div>
              <strong>Consulta sobre factura de junio</strong>
              <span>#2819 · Resuelto · 18 Jun 2024</span>
            </div>
            <ArrowUpRight aria-hidden="true" />
          </div>
        </div>

        <div className="contact-card">
          <Headphones aria-hidden="true" />
          <h3>¿Necesitas hablar?</h3>
          <p>Te respondemos de lunes a viernes, de 9:00 a 18:00.</p>
          <span className="button button-outline" aria-hidden="true">
            Contactar con el equipo
          </span>
        </div>
      </div>
    </section>
  );
}
