import { ArrowUpRight, Check, CreditCard, MoreHorizontal, Plus } from "lucide-react";
import PageHeading from "./components/PageHeading";

export default function Payments({ onNavigate }) {
  return (
    <section id="pagos" aria-label="Pagos">
      <PageHeading
        eyebrow="Gestión económica"
        title={
          <>
            Tus <em>pagos</em>
          </>
        }
        description="Consulta tus pagos y gestiona tus métodos de pago."
        action={
          <span className="button button-primary" aria-hidden="true">
            <Plus aria-hidden="true" /> Añadir método
          </span>
        }
      />

      <div className="payment-top">
        <div className="balance-card">
          <span>Próximo cobro</span>
          <strong>480,00 €</strong>
          <p>Se cargará automáticamente el 28 de julio de 2024</p>
          <span className="text-button" aria-hidden="true">
            Gestionar pagos <ArrowUpRight aria-hidden="true" />
          </span>
        </div>
        <div className="method-card">
          <div className="card-title">
            <span>Método principal</span>
            <MoreHorizontal aria-hidden="true" />
          </div>
          <div className="card-number">
            <CreditCard aria-hidden="true" />
            <strong>•••• 4242</strong>
            <span>Visa</span>
          </div>
          <small>María García · Válida hasta 08/27</small>
        </div>
      </div>

      <div className="table-panel payment-history">
        <div className="table-toolbar">
          <h2>Historial de pagos</h2>
          <button type="button" className="quiet-button" onClick={() => onNavigate("facturas")}>
            Ver facturas <ArrowUpRight aria-hidden="true" />
          </button>
        </div>
        <div className="activity-item">
          <div className="activity-icon paid">
            <Check aria-hidden="true" />
          </div>
          <div>
            <strong>Pago realizado</strong>
            <span>28 Jun 2024 · FAC-2024-008</span>
          </div>
          <b>480,00 €</b>
        </div>
      </div>
    </section>
  );
}
