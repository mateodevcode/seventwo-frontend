// Secciones del área de cliente que aún no tienen datos reales (cuentas de cobro,
// pagos y soporte llegan en las fases F3–F5 de docs/CLIENTES.md).
import { ArrowUpRight } from "lucide-react";
import PageHeading from "./components/PageHeading";
import "@/components/clientes/clientes.css";

const TEXTOS = {
  facturas: {
    eyebrow: "Gestión económica",
    title: <>Cuentas de <em>cobro</em></>,
    vacio: "Aquí verás y descargarás tus cuentas de cobro, con su estado y fecha de vencimiento.",
  },
  pagos: {
    eyebrow: "Gestión económica",
    title: <>Tus <em>pagos</em></>,
    vacio: "Podrás pagar con Mercado Pago o subir el comprobante de tu transferencia o Nequi, y ver el historial de pagos.",
  },
  soporte: {
    eyebrow: "Estamos para ayudarte",
    title: <>Centro de <em>soporte</em></>,
    vacio: "Podrás abrir tickets ligados a tu proyecto y seguir la conversación con el equipo. Mientras tanto, escríbenos a info@seventwo.tech.",
  },
};

export default function EnPreparacion({ seccion, onNavigate }) {
  const t = TEXTOS[seccion];
  return (
    <section aria-label={seccion}>
      <PageHeading eyebrow={t.eyebrow} title={t.title} />
      <div className="vacio-card">
        <strong>Muy pronto</strong>
        {t.vacio}
        <div style={{ marginTop: 14 }}>
          <button type="button" className="text-button" onClick={() => onNavigate("proyectos")}>
            Ver mis proyectos <ArrowUpRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
