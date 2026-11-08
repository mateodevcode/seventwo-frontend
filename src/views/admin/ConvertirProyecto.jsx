"use client";

// /admin → solicitud → "Convertir en proyecto" (docs/CLIENTES.md §7.1): crea o completa
// la ficha del cliente, lo sube a "cliente" y crea el proyecto con la solicitud como base.
import { useState } from "react";
import { Campo } from "@/components/auth/ui";
import { Selector } from "@/components/clientes/FichaForm";
import { TIPOS_DOCUMENTO } from "@/lib/clientes";
import { api } from "@/lib/api";
import ProyectoForm from "./ProyectoForm";
import { useServicios } from "./AdminClientes";
import "@/components/clientes/clientes.css";

export default function ConvertirProyecto({ solicitud: s, onHecho, onCancelar }) {
  const servicios = useServicios();
  const [cli, setCli] = useState({
    tipo_persona: s.empresa ? "juridica" : "natural",
    nombre: s.empresa || s.nombre,
    tipo_documento: "",
    numero_documento: "",
    ciudad: "",
  });
  const set = (k) => (e) => setCli((x) => ({ ...x, [k]: e.target.value }));

  const guardar = async (proyecto) => {
    const cliente = Object.fromEntries(Object.entries(cli).filter(([, v]) => v !== ""));
    const r = await api(`/admin/solicitudes/${s.id}/convertir`, { method: "POST", auth: true, body: { cliente, proyecto } });
    onHecho(r);
  };

  return (
    <div className="convertir">
      <h3 style={{ margin: "0 0 4px" }}>Nuevo proyecto desde {s.codigo}</h3>
      <p className="heading-description">
        {s.cuenta
          ? `${s.cuenta.name} tiene cuenta: pasará a cliente y verá el proyecto en su área.`
          : `${s.nombre} aún no tiene cuenta: le llegará un email para crearla con ${s.email} y ver su proyecto.`}
        {" "}Si ya existe una ficha con este email, solo se completan los datos que falten.
      </p>
      <ProyectoForm
        valores={{ nombre: "", tipo_proyecto: s.tipo_proyecto, descripcion: s.descripcion, estado: "en_curso", responsable_id: s.asignado_a ?? "" }}
        equipo={s.equipo}
        servicios={servicios}
        textoGuardar="Crear proyecto"
        onGuardar={guardar}
        onCancelar={onCancelar}
      >
        <p className="eyebrow ficha-sub">Cliente</p>
        <div className="ficha-tipo" role="radiogroup" aria-label="Tipo de persona">
          <label><input type="radio" checked={cli.tipo_persona === "natural"} onChange={() => setCli((x) => ({ ...x, tipo_persona: "natural" }))} /> Persona natural</label>
          <label><input type="radio" checked={cli.tipo_persona === "juridica"} onChange={() => setCli((x) => ({ ...x, tipo_persona: "juridica" }))} /> Empresa</label>
        </div>
        <div className="solicitud-grid">
          <Campo id="cv-nombre" label={cli.tipo_persona === "juridica" ? "Razón social" : "Nombre completo"} value={cli.nombre} onChange={set("nombre")} />
          <Campo id="cv-ciudad" label="Ciudad" value={cli.ciudad} onChange={set("ciudad")} />
          <Selector id="cv-tipodoc" label="Tipo de documento" value={cli.tipo_documento} onChange={set("tipo_documento")} opciones={TIPOS_DOCUMENTO} vacio="Sin indicar (lo completa el cliente)" />
          <Campo id="cv-doc" label="Número de documento" value={cli.numero_documento} onChange={set("numero_documento")} inputMode="numeric" />
        </div>
      </ProyectoForm>
    </div>
  );
}
