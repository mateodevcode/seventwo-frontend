// Vista de solo lectura de la ficha de cliente (Mi perfil y /admin).
import { TIPOS_DOCUMENTO, documento } from "@/lib/clientes";

function Info({ label, value }) {
  return (
    <div className="info">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}

export default function FichaVista({ c }) {
  const juridica = c.tipo_persona === "juridica";
  const ubicacion = [c.direccion, c.ciudad, c.departamento, c.pais !== "CO" ? c.pais : null].filter(Boolean).join(", ");
  return (
    <div className="info-fields">
      <Info label={juridica ? "Razón social" : "Nombre"} value={c.nombre} />
      <Info label="Tipo" value={juridica ? "Empresa" : "Persona natural"} />
      {juridica && <Info label="Nombre comercial" value={c.nombre_comercial} />}
      <Info label={TIPOS_DOCUMENTO[c.tipo_documento] ?? "Documento"} value={documento(c)} />
      <Info label="Email de facturación" value={c.email_facturacion || c.email} />
      <Info label="Teléfono" value={c.telefono} />
      <Info label="Dirección" value={ubicacion} />
      <Info label="Sitio web" value={c.sitio_web} />
      <Info label="Sector" value={c.sector} />
      {juridica && <Info label="Contacto" value={[c.contacto_nombre, c.contacto_cargo, c.contacto_telefono].filter(Boolean).join(" · ")} />}
    </div>
  );
}
