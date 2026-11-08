import { ArrowUpRight, ChevronDown } from "lucide-react";
import PageHeading from "./components/PageHeading";
import { invoices } from "@/data/data.area-cliente";

export default function Invoices() {
  return (
    <section id="facturas" aria-label="Facturas">
      <PageHeading
        eyebrow="Gestión económica"
        title={
          <>
            Tus <em>facturas</em>
          </>
        }
        description="Consulta, descarga y revisa el estado de todas tus facturas."
        action={
          <span className="button button-primary" aria-hidden="true">
            <ArrowUpRight aria-hidden="true" /> Descargar resumen
          </span>
        }
      />

      <div className="invoice-summary">
        <div>
          <span>Total facturado este año</span>
          <strong>2.400,00 €</strong>
        </div>
        <div>
          <span>Facturas pagadas</span>
          <strong>5</strong>
        </div>
        <div>
          <span>Pendientes de pago</span>
          <strong>1</strong>
        </div>
      </div>

      <div className="table-panel">
        <div className="table-toolbar">
          <h2>Todas las facturas</h2>
          <span className="filter-button" aria-hidden="true">
            2024 <ChevronDown aria-hidden="true" />
          </span>
        </div>
        <div className="invoice-table" role="table" aria-label="Listado de facturas">
          <div className="table-row table-head" role="row">
            <span>Factura</span>
            <span>Concepto</span>
            <span>Fecha</span>
            <span>Importe</span>
            <span>Estado</span>
            <span />
          </div>
          {invoices.map((invoice) => (
            <div className="table-row" role="row" key={invoice.id}>
              <strong>{invoice.id}</strong>
              <span>{invoice.concept}</span>
              <span>{invoice.date}</span>
              <strong>{invoice.amount}</strong>
              <span className={`pill ${invoice.status === "Pagada" ? "success" : "warning"}`}>
                {invoice.status}
              </span>
              <span className="row-action" aria-hidden="true">
                <ArrowUpRight aria-hidden="true" />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
