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

export default function ClientData() {
  return (
    <section id="datos" aria-label="Datos del cliente">
      <PageHeading
        eyebrow="Mi perfil"
        title={
          <>
            Datos del <em>cliente</em>
          </>
        }
        description="Gestiona la información de tu cuenta y los datos de facturación."
        action={
          <span className="button button-outline" aria-hidden="true">
            Editar datos <ArrowUpRight aria-hidden="true" />
          </span>
        }
      />
      <div className="data-grid">
        <div className="data-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Información personal</p>
              <h2>Datos de contacto</h2>
            </div>
          </div>
          <div className="info-fields">
            <Info label="Nombre completo" value="María García López" />
            <Info label="Correo electrónico" value="maria@ejemplo.com" />
            <Info label="Teléfono" value="+34 612 345 678" />
            <Info label="Empresa" value="Estudio García" />
          </div>
        </div>
        <div className="data-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Facturación</p>
              <h2>Datos fiscales</h2>
            </div>
          </div>
          <div className="info-fields">
            <Info label="NIF / CIF" value="B-12345678" />
            <Info label="Dirección" value="Calle Serrano, 42 · Madrid" />
            <Info label="Código postal" value="28001" />
            <Info label="Método de pago" value="Visa terminada en 4242" />
          </div>
        </div>
      </div>
    </section>
  );
}
