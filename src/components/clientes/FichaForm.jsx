"use client";

// Formulario de la ficha de cliente: lo usan el propio cliente (Mi perfil →
// Datos de facturación) y el equipo (/admin → Clientes). `equipo` añade estado
// y notas internas; `conEmail` pide el email (alta manual de un cliente nuevo).
import { useState } from "react";
import { Alerta, Boton, Campo } from "@/components/auth/ui";
import { ESTADOS_CLIENTE, TIPOS_DOCUMENTO, erroresDe } from "@/lib/clientes";
import "@/components/area-cliente/solicitudes.css";

const CAMPOS = [
  "tipo_persona", "nombre", "nombre_comercial", "tipo_documento", "numero_documento", "dv",
  "email_facturacion", "telefono", "direccion", "ciudad", "departamento", "pais", "sitio_web", "sector",
  "contacto_nombre", "contacto_cargo", "contacto_telefono",
];
const CAMPOS_EQUIPO = ["estado", "notas_internas"];

const inicial = (v, equipo, conEmail) => {
  const base = Object.fromEntries(CAMPOS.map((k) => [k, v?.[k] ?? ""]));
  base.tipo_persona ||= "natural";
  base.pais ||= "CO";
  if (equipo) Object.assign(base, { estado: v?.estado ?? "activo", notas_internas: v?.notas_internas ?? "" });
  if (conEmail) base.email = v?.email ?? "";
  return base;
};

export function Selector({ id, label, value, onChange, opciones, vacio, error, disabled }) {
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} className="solicitud-select" value={value ?? ""} onChange={onChange} disabled={disabled} aria-invalid={error ? "true" : undefined}>
        {vacio !== undefined && <option value="">{vacio}</option>}
        {Object.entries(opciones).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
      </select>
      {error && <p className="auth-field-error">{error}</p>}
    </div>
  );
}

export default function FichaForm({ valores, onGuardar, onCancelar, equipo = false, conEmail = false, textoGuardar = "Guardar" }) {
  const [f, setF] = useState(() => inicial(valores, equipo, conEmail));
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const juridica = f.tipo_persona === "juridica";

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const err = (k) => errores[k];

  const guardar = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    setErrores({});
    try {
      const claves = [...CAMPOS, ...(equipo ? CAMPOS_EQUIPO : []), ...(conEmail ? ["email"] : [])];
      // Vacío → null: así se pueden borrar campos opcionales.
      await onGuardar(Object.fromEntries(claves.map((k) => [k, typeof f[k] === "string" && f[k].trim() === "" ? null : f[k]])));
    } catch (er) {
      setError(er.message);
      setErrores(erroresDe(er));
    } finally {
      setCargando(false);
    }
  };

  return (
    <form className="auth-embed auth-form ficha-form" onSubmit={guardar} noValidate>
      <Alerta>{error}</Alerta>

      {conEmail && (
        <Campo id="ficha-email" label="Email del cliente" tipo="email" value={f.email} onChange={set("email")} error={err("email")}
          ayuda="Si ya tiene cuenta con este email (verificado), se vincula y pasa a cliente. Si no, al registrarse." required />
      )}

      <div className="ficha-tipo" role="radiogroup" aria-label="Tipo de persona">
        <label><input type="radio" checked={!juridica} onChange={() => setF((x) => ({ ...x, tipo_persona: "natural" }))} /> Persona natural</label>
        <label><input type="radio" checked={juridica} onChange={() => setF((x) => ({ ...x, tipo_persona: "juridica" }))} /> Empresa</label>
      </div>

      <div className="solicitud-grid">
        <Campo id="ficha-nombre" label={juridica ? "Razón social" : "Nombre completo"} value={f.nombre} onChange={set("nombre")} error={err("nombre")} required />
        {juridica
          ? <Campo id="ficha-comercial" label="Nombre comercial" value={f.nombre_comercial} onChange={set("nombre_comercial")} error={err("nombre_comercial")} />
          : <Campo id="ficha-sector" label="Actividad o sector" value={f.sector} onChange={set("sector")} error={err("sector")} />}
        <Selector id="ficha-tipodoc" label="Tipo de documento" value={f.tipo_documento} onChange={set("tipo_documento")} opciones={TIPOS_DOCUMENTO} vacio="Sin indicar" error={err("tipo_documento")} />
        <div className="ficha-doc">
          <Campo id="ficha-doc" label="Número de documento" value={f.numero_documento} onChange={set("numero_documento")} error={err("numero_documento")} inputMode="numeric" />
          {f.tipo_documento === "NIT" && <Campo id="ficha-dv" label="DV" value={f.dv} onChange={set("dv")} error={err("dv")} maxLength={1} inputMode="numeric" />}
        </div>
        <Campo id="ficha-email-fac" label="Email de facturación" tipo="email" value={f.email_facturacion} onChange={set("email_facturacion")} error={err("email_facturacion")} ayuda="Donde enviaremos las cuentas de cobro. Vacío = el de la cuenta." />
        <Campo id="ficha-tel" label="Teléfono" tipo="tel" value={f.telefono} onChange={set("telefono")} error={err("telefono")} />
        <Campo id="ficha-dir" label="Dirección" value={f.direccion} onChange={set("direccion")} error={err("direccion")} autoComplete="street-address" />
        <Campo id="ficha-ciudad" label="Ciudad" value={f.ciudad} onChange={set("ciudad")} error={err("ciudad")} />
        <Campo id="ficha-depto" label="Departamento" value={f.departamento} onChange={set("departamento")} error={err("departamento")} />
        <Campo id="ficha-web" label="Sitio web" value={f.sitio_web} onChange={set("sitio_web")} error={err("sitio_web")} placeholder="tuempresa.com" />
        {juridica && <Campo id="ficha-sector-j" label="Sector" value={f.sector} onChange={set("sector")} error={err("sector")} />}
        <Campo id="ficha-pais" label="País (código)" value={f.pais} onChange={set("pais")} error={err("pais")} maxLength={2} />
      </div>

      {juridica && (
        <>
          <p className="eyebrow ficha-sub">Persona de contacto</p>
          <div className="solicitud-grid">
            <Campo id="ficha-cnombre" label="Nombre" value={f.contacto_nombre} onChange={set("contacto_nombre")} error={err("contacto_nombre")} />
            <Campo id="ficha-ccargo" label="Cargo" value={f.contacto_cargo} onChange={set("contacto_cargo")} error={err("contacto_cargo")} />
            <Campo id="ficha-ctel" label="Teléfono de contacto" tipo="tel" value={f.contacto_telefono} onChange={set("contacto_telefono")} error={err("contacto_telefono")} />
          </div>
        </>
      )}

      {equipo && (
        <>
          <p className="eyebrow ficha-sub">Solo el equipo</p>
          <div className="solicitud-grid">
            <Selector id="ficha-estado" label="Estado del cliente" value={f.estado} onChange={set("estado")} opciones={ESTADOS_CLIENTE} error={err("estado")} />
          </div>
          <div className="auth-field">
            <label htmlFor="ficha-notas">Notas internas (el cliente no las ve)</label>
            <textarea id="ficha-notas" className="solicitud-textarea" rows={3} maxLength={5000} value={f.notas_internas} onChange={set("notas_internas")} />
          </div>
        </>
      )}

      <div className="auth-row">
        <Boton type="submit" cargando={cargando} disabled={f.nombre.trim().length < 2}>{textoGuardar}</Boton>
        {onCancelar && <button type="button" className="auth-text-button" onClick={onCancelar}>Cancelar</button>}
      </div>
    </form>
  );
}
