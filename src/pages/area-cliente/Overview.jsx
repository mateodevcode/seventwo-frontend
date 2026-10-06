import {
  ArrowUpRight,
  Check,
  FileText,
  Headphones,
  Plus,
  Sparkles,
} from "lucide-react";
import PageHeading from "./components/PageHeading";

function QuickCard({ icon: Icon, label, value, note, onClick }) {
  return (
    <button type="button" className="quick-card" onClick={onClick}>
      <div className="quick-icon">
        <Icon aria-hidden="true" />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
      <ArrowUpRight aria-hidden="true" />
    </button>
  );
}

export default function Overview({ onNavigate }) {
  return (
    <section id="resumen" aria-label="Resumen">
      <PageHeading
        eyebrow="Lunes, 1 de julio de 2024"
        title={
          <>
            Buenos días, <em>María</em>
          </>
        }
        description="Aquí tienes una vista general de tu cuenta y tus proyectos."
        action={
          <button type="button" className="button button-primary" onClick={() => onNavigate("cotizar")}>
            <Plus aria-hidden="true" /> Cotizar nuevo proyecto
          </button>
        }
      />

      <div className="overview-grid">
        <div className="welcome-card">
          <div>
            <span className="card-kicker">Proyecto activo</span>
            <h2>
              Tu presencia digital,
              <br />
              <em>en buenas manos.</em>
            </h2>
            <p>Estamos cuidando cada detalle para que tu negocio siga creciendo.</p>
            <button type="button" className="text-button" onClick={() => onNavigate("servicio")}>
              Ver servicio <ArrowUpRight aria-hidden="true" />
            </button>
          </div>
          <div className="orbital-art" aria-hidden="true">
            <div className="orbital-line one" />
            <div className="orbital-line two" />
            <div className="orbital-dot" />
          </div>
        </div>

        <div className="stats-card">
          <div className="stat-heading">
            <span>Estado de cuenta</span>
            <span className="status-dot">Al día</span>
          </div>
          <div className="stat-main">
            <strong>480,00 €</strong>
            <span>próximo pago · 28 Jul 2024</span>
          </div>
          <div className="stat-progress">
            <div />
            <span>100% pagado</span>
          </div>
          <button type="button" className="button button-outline" onClick={() => onNavigate("pagos")}>
            Ver pagos <ArrowUpRight aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="section-row">
        <div>
          <p className="eyebrow">De un vistazo</p>
          <h2 className="section-title">Tu cuenta</h2>
        </div>
      </div>

      <div className="quick-grid">
        <QuickCard
          icon={FileText}
          label="Facturas"
          value="2 pendientes"
          note="Última factura · 480,00 €"
          onClick={() => onNavigate("facturas")}
        />
        <QuickCard
          icon={Sparkles}
          label="Servicio contratado"
          value="Mantenimiento web"
          note="Activo desde Ene 2024"
          onClick={() => onNavigate("servicio")}
        />
        <QuickCard
          icon={Headphones}
          label="Soporte"
          value="1 ticket abierto"
          note="Última respuesta · hace 2h"
          onClick={() => onNavigate("soporte")}
        />
      </div>

      <div className="bottom-grid">
        <div className="activity-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Actividad reciente</p>
              <h2>Últimos movimientos</h2>
            </div>
            <button type="button" className="quiet-button" onClick={() => onNavigate("facturas")}>
              Ver todo <ArrowUpRight aria-hidden="true" />
            </button>
          </div>
          <div className="activity-item">
            <div className="activity-icon paid">
              <Check aria-hidden="true" />
            </div>
            <div>
              <strong>Pago recibido</strong>
              <span>Factura FAC-2024-008 · 28 Jun 2024</span>
            </div>
            <b>+480,00 €</b>
          </div>
          <div className="activity-item">
            <div className="activity-icon message">
              <Headphones aria-hidden="true" />
            </div>
            <div>
              <strong>Respuesta de soporte</strong>
              <span>Ticket #2841 · 27 Jun 2024</span>
            </div>
            <b>Hace 2 días</b>
          </div>
        </div>

        <div className="quote-card">
          <Sparkles aria-hidden="true" />
          <p className="eyebrow">¿Tienes una idea?</p>
          <h3>Hagámosla realidad.</h3>
          <p>Cuéntanos qué tienes en mente y prepararemos una propuesta para ti.</p>
          <button type="button" className="text-button" onClick={() => onNavigate("cotizar")}>
            Empezar ahora <ArrowUpRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
