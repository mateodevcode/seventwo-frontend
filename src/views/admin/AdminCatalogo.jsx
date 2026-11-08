"use client";

// Admin → Catálogo: servicios con precio base, modelo de cobro y lo que incluyen.
// Al crear un proyecto, elegir un servicio rellena esos datos.
import { useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import PageHeading from "@/views/area-cliente/components/PageHeading";
import { api } from "@/lib/api";
import { MODELOS_COBRO, PERIODICIDADES, TIPOS_PROYECTO, dinero, erroresDe } from "@/lib/clientes";
import { Alerta, Boton, Campo } from "@/components/auth/ui";
import { Selector } from "@/components/clientes/FichaForm";
import "@/components/area-cliente/solicitudes.css";
import "@/components/clientes/clientes.css";

const nuevo = () => ({
  nombre: "", categoria: "proyecto", tipo_proyecto: "", modelo_cobro: "unico", precio_base: "",
  moneda: "COP", periodicidad: "", descripcion: "", incluye: "", activo: true,
});

function FormServicio({ valores, onGuardar, onCancelar }) {
  const [f, setF] = useState(() => (valores
    ? { ...nuevo(), ...valores, precio_base: valores.precio_base ?? "", periodicidad: valores.periodicidad ?? "", tipo_proyecto: valores.tipo_proyecto ?? "", descripcion: valores.descripcion ?? "", incluye: (valores.incluye ?? []).join("\n") }
    : nuevo()));
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    setErrores({});
    try {
      await onGuardar({
        nombre: f.nombre,
        categoria: f.categoria,
        tipo_proyecto: f.tipo_proyecto || null,
        modelo_cobro: f.modelo_cobro,
        precio_base: f.precio_base === "" ? null : f.precio_base,
        moneda: f.moneda,
        periodicidad: f.modelo_cobro === "recurrente" ? f.periodicidad || "mensual" : null,
        descripcion: f.descripcion || null,
        incluye: f.incluye.split("\n").map((t) => t.trim()).filter(Boolean),
        activo: f.activo,
      });
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
      <div className="solicitud-grid">
        <Campo id="s-nombre" label="Nombre" value={f.nombre} onChange={set("nombre")} error={errores.nombre} placeholder="Landing profesional" required />
        <Selector id="s-cat" label="Categoría" value={f.categoria} onChange={set("categoria")} opciones={{ proyecto: "Proyecto", recurrente: "Servicio recurrente" }} />
        <Selector id="s-tipo" label="Tipo de proyecto" value={f.tipo_proyecto} onChange={set("tipo_proyecto")} opciones={Object.fromEntries(TIPOS_PROYECTO.map((t) => [t, t]))} vacio="Sin indicar" />
        <Selector id="s-modelo" label="Modelo de cobro" value={f.modelo_cobro} onChange={set("modelo_cobro")} opciones={MODELOS_COBRO} />
        <Campo id="s-precio" label={f.modelo_cobro === "horas" ? "Precio por hora" : f.modelo_cobro === "recurrente" ? "Precio por periodo" : "Precio base"} tipo="number" min={0}
          value={f.precio_base} onChange={set("precio_base")} error={errores.precio_base} ayuda={f.precio_base ? dinero(f.precio_base, f.moneda) : "Orientativo; se ajusta en cada proyecto."} />
        <Selector id="s-moneda" label="Moneda" value={f.moneda} onChange={set("moneda")} opciones={{ COP: "COP", USD: "USD" }} />
        {f.modelo_cobro === "recurrente" && (
          <Selector id="s-periodo" label="Periodicidad" value={f.periodicidad || "mensual"} onChange={set("periodicidad")} opciones={PERIODICIDADES} />
        )}
      </div>
      <div className="auth-field">
        <label htmlFor="s-incluye">Lo que incluye (uno por línea)</label>
        <textarea id="s-incluye" className="solicitud-textarea" rows={4} value={f.incluye} onChange={set("incluye")} />
        {errores.incluye && <p className="auth-field-error">{errores.incluye}</p>}
      </div>
      <div className="auth-field">
        <label htmlFor="s-desc">Descripción</label>
        <textarea id="s-desc" className="solicitud-textarea" rows={3} value={f.descripcion} onChange={set("descripcion")} />
      </div>
      <label className="solicitud-check">
        <input type="checkbox" checked={f.activo} onChange={(e) => setF((x) => ({ ...x, activo: e.target.checked }))} />
        Activo (aparece al crear proyectos)
      </label>
      <div className="auth-row">
        <Boton type="submit" cargando={cargando} disabled={f.nombre.trim().length < 2}>Guardar servicio</Boton>
        <button type="button" className="auth-text-button" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}

export default function AdminCatalogo() {
  const [servicios, setServicios] = useState([]);
  const [editando, setEditando] = useState(null); // null | "nuevo" | servicio
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    api("/admin/servicios?todos=1", { auth: true }).then((r) => vigente && setServicios(r.data)).catch((e) => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [version]);

  const guardar = async (body) => {
    const r = editando === "nuevo"
      ? await api("/admin/servicios", { method: "POST", auth: true, body })
      : await api(`/admin/servicios/${editando.id}`, { method: "PATCH", auth: true, body });
    setEditando(null);
    setOk(r.message);
    setVersion((v) => v + 1);
  };

  return (
    <section aria-label="Catálogo de servicios">
      <PageHeading
        eyebrow="Administración"
        title={<>Catálogo de <em>servicios</em></>}
        description="Servicios y precios base. Al crear un proyecto puedes partir de uno de ellos."
        action={!editando && (
          <button type="button" className="button button-primary" onClick={() => { setOk(""); setEditando("nuevo"); }}>
            <Plus aria-hidden="true" /> Nuevo servicio
          </button>
        )}
      />
      <div className="table-panel">
        <div className="auth-embed admin-aviso"><Alerta>{error}</Alerta><Alerta tipo="ok">{ok}</Alerta></div>
        {editando ? (
          <>
            <h2 style={{ margin: 0 }}>{editando === "nuevo" ? "Nuevo servicio" : editando.nombre}</h2>
            <FormServicio key={editando === "nuevo" ? "nuevo" : editando.id} valores={editando === "nuevo" ? null : editando} onGuardar={guardar} onCancelar={() => setEditando(null)} />
          </>
        ) : (
          <div className="invoice-table" role="table" aria-label="Servicios">
            <div className="table-row table-head admin-serv-row" role="row">
              <span>Servicio</span><span>Modelo</span><span>Precio</span><span>Incluye</span><span />
            </div>
            {servicios.map((s) => (
              <div key={s.id} className="table-row admin-serv-row" role="row" style={s.activo ? undefined : { opacity: 0.5 }}>
                <span className="admin-user">
                  <strong>{s.nombre}</strong>
                  <span>{s.tipo_proyecto ?? (s.categoria === "recurrente" ? "Recurrente" : "Proyecto")}{s.activo ? "" : " · inactivo"}</span>
                </span>
                <span>{MODELOS_COBRO[s.modelo_cobro]}{s.periodicidad ? ` · ${PERIODICIDADES[s.periodicidad].toLowerCase()}` : ""}</span>
                <span>{dinero(s.precio_base, s.moneda)}</span>
                <span>{s.incluye.length} elementos</span>
                <span className="admin-acciones">
                  <button type="button" className="icon-button" aria-label={`Editar ${s.nombre}`} onClick={() => { setOk(""); setEditando(s); }}>
                    <Pencil aria-hidden="true" />
                  </button>
                </span>
              </div>
            ))}
            {servicios.length === 0 && <p className="admin-vacio">Aún no hay servicios. Crea los que ofreces con su precio orientativo.</p>}
          </div>
        )}
      </div>
    </section>
  );
}
