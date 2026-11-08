"use client";

// Admin → Solicitudes: listado con conteos por estado, detalle, conversación,
// responder / nota interna, estado, asignado y "Pasar a cliente" (docs/PRESUPUESTOS.md §7.4).
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, FolderPlus, Search, Send, UserCheck } from "lucide-react";
import ConvertirProyecto from "./ConvertirProyecto";
import PageHeading from "@/views/area-cliente/components/PageHeading";
import { api } from "@/lib/api";
import { ESTADOS, fechaCorta, haceCuanto } from "@/lib/solicitudes";
import { ETIQUETA_ROL } from "@/lib/roles";
import { Alerta, Boton } from "@/components/auth/ui";
import { Conversacion, PillEstado } from "@/components/area-cliente/Solicitudes";
import "@/components/area-cliente/solicitudes.css";

const CHIPS = ["nueva", "en_revision", "respondida", "aceptada", "rechazada", "archivada"];

function Lista({ onAbrir }) {
  const [datos, setDatos] = useState({ solicitudes: [], total: 0, pagina: 1, paginas: 1, conteos: {} });
  const [estado, setEstado] = useState("");
  const [buscar, setBuscar] = useState("");
  const [consulta, setConsulta] = useState("");
  const [pagina, setPagina] = useState(1);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let vigente = true;
    const qs = new URLSearchParams({ pagina: String(pagina) });
    if (estado) qs.set("estado", estado);
    if (consulta) qs.set("buscar", consulta);
    api(`/admin/solicitudes?${qs}`, { auth: true })
      .then((r) => vigente && setDatos(r.data))
      .catch((e) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [estado, consulta, pagina, version]);

  useEffect(() => {
    const t = setTimeout(() => {
      const q = buscar.trim();
      if (q !== consulta) {
        setConsulta(q);
        setPagina(1);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [buscar, consulta]);

  // Una solicitud nueva o una respuesta del cliente refresca la lista.
  useEffect(() => {
    const recargar = (ev) => ev.detail?.tipo?.startsWith("solicitud_") && setVersion((v) => v + 1);
    window.addEventListener("seventwo:notificacion", recargar);
    return () => window.removeEventListener("seventwo:notificacion", recargar);
  }, []);

  return (
    <>
      <div className="invoice-summary admin-summary admin-chips">
        {CHIPS.slice(0, 4).map((e) => (
          <button
            key={e}
            type="button"
            className={estado === e ? "activo" : ""}
            onClick={() => { setEstado(estado === e ? "" : e); setPagina(1); }}
          >
            <span>{ESTADOS[e]}</span>
            <strong>{datos.conteos[e] ?? 0}</strong>
          </button>
        ))}
      </div>
      <div className="table-panel">
        <div className="table-toolbar admin-toolbar">
          <h2>{datos.total} {datos.total === 1 ? "solicitud" : "solicitudes"}</h2>
          <div className="admin-filtros">
            <label className="admin-buscar">
              <Search aria-hidden="true" />
              <input type="search" placeholder="Código, nombre, email o empresa" value={buscar} onChange={(e) => setBuscar(e.target.value)} aria-label="Buscar solicitudes" />
            </label>
            <select className="admin-select" value={estado} onChange={(e) => { setEstado(e.target.value); setPagina(1); }} aria-label="Filtrar por estado">
              <option value="">Activas (sin archivadas)</option>
              {CHIPS.map((e) => <option key={e} value={e}>{ESTADOS[e]}</option>)}
            </select>
          </div>
        </div>
        {error && <div className="auth-embed admin-aviso"><Alerta>{error}</Alerta></div>}
        <div className="invoice-table" role="table" aria-label="Solicitudes">
          <div className="table-row table-head admin-sol-row" role="row">
            <span>Código</span><span>Solicitante</span><span>Proyecto</span><span>Presupuesto</span><span>Estado</span><span>Llegó</span>
          </div>
          {datos.solicitudes.map((s) => (
            <button key={s.id} type="button" className="table-row admin-sol-row solicitud-row-btn" onClick={() => onAbrir(s.id)}>
              <strong>{s.codigo}</strong>
              <span className="admin-user">
                <strong>{s.nombre}</strong>
                <span>{s.email}{s.usuario_id ? ` · ${ETIQUETA_ROL[s.usuario_rol] ?? "cuenta"}` : " · sin cuenta"}</span>
              </span>
              <span>{s.tipo_proyecto}</span>
              <span>{s.presupuesto ?? "—"}</span>
              <span><PillEstado estado={s.estado} /></span>
              <span>{haceCuanto(s.created_at)}</span>
            </button>
          ))}
          {datos.solicitudes.length === 0 && <p className="admin-vacio">No hay solicitudes con esos filtros.</p>}
        </div>
        {datos.paginas > 1 && (
          <div className="admin-paginacion">
            <button type="button" className="icon-button" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)} aria-label="Página anterior">‹</button>
            <span>Página {datos.pagina} de {datos.paginas}</span>
            <button type="button" className="icon-button" disabled={pagina >= datos.paginas} onClick={() => setPagina((p) => p + 1)} aria-label="Página siguiente">›</button>
          </div>
        )}
      </div>
    </>
  );
}

function Detalle({ id, onVolver, onAbrirProyecto }) {
  const [s, setS] = useState(null);
  const [convirtiendo, setConvirtiendo] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [texto, setTexto] = useState("");
  const [interno, setInterno] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const cargar = useCallback(() => api(`/admin/solicitudes/${id}`, { auth: true }).then((r) => setS(r.data)).catch((e) => setError(e.message)), [id]);
  useEffect(() => {
    let vigente = true;
    api(`/admin/solicitudes/${id}`, { auth: true }).then((r) => vigente && setS(r.data)).catch((e) => vigente && setError(e.message));
    const recargar = (ev) => String(ev.detail?.datos?.solicitud_id) === String(id) && cargar();
    window.addEventListener("seventwo:notificacion", recargar);
    return () => {
      vigente = false;
      window.removeEventListener("seventwo:notificacion", recargar);
    };
  }, [id, cargar]);

  async function accion(fn, ok) {
    setOcupado(true);
    setError("");
    setAviso("");
    try {
      const r = await fn();
      if (r?.data?.mensajes) setS(r.data);
      setAviso(r?.message ?? ok ?? "");
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  const enviar = (e) => {
    e.preventDefault();
    if (texto.trim().length < 2) return;
    accion(async () => {
      const r = await api(`/admin/solicitudes/${id}/mensajes`, { method: "POST", auth: true, body: { cuerpo: texto, interno } });
      setTexto("");
      return r;
    });
  };
  const actualizar = (body) => accion(() => api(`/admin/solicitudes/${id}`, { method: "PATCH", auth: true, body }));
  const pasarACliente = () => {
    if (!window.confirm(`¿Pasar a ${s.cuenta.name} a cliente? Verá facturas, pagos y servicio.`)) return;
    accion(async () => {
      await api(`/admin/usuarios/${s.cuenta.id}/rol`, { method: "PATCH", auth: true, body: { rol: "cliente" } });
      await cargar();
    }, `${s.cuenta.name} ahora es cliente.`);
  };

  if (!s) return <div className="table-panel"><div className="auth-embed"><Alerta>{error}</Alerta>{!error && <p className="admin-vacio">Cargando…</p>}</div></div>;

  return (
    <div className="table-panel">
      <button type="button" className="solicitud-volver" onClick={onVolver}><ArrowLeft aria-hidden="true" /> Solicitudes</button>
      <div className="solicitud-cabecera">
        <div>
          <h2>{s.codigo} · {s.nombre}</h2>
          <p className="heading-description">
            {s.email}{s.telefono ? ` · ${s.telefono}` : ""}{s.empresa ? ` · ${s.empresa}` : ""}
            <br />
            {s.tipo_proyecto} · {s.presupuesto ?? "Presupuesto sin indicar"} · {s.origen === "web" ? "desde la web" : "desde el área de cliente"} · {fechaCorta(s.created_at)}
          </p>
          <p className="heading-description">
            Cuenta: {s.cuenta ? `${s.cuenta.name} · ${ETIQUETA_ROL[s.cuenta.rol]}${s.cuenta.bloqueado ? " · bloqueada" : ""}` : "sin cuenta (le llegan los emails; al registrarse con este correo verá la solicitud)"}
          </p>
        </div>
        <div className="admin-sol-controles">
          <label>
            Estado
            <select className="admin-select" value={s.estado} disabled={ocupado} onChange={(e) => actualizar({ estado: e.target.value })}>
              {CHIPS.map((e) => <option key={e} value={e}>{ESTADOS[e]}</option>)}
            </select>
          </label>
          <label>
            Asignado
            <select className="admin-select" value={s.asignado_a ?? ""} disabled={ocupado} onChange={(e) => actualizar({ asignado_a: e.target.value ? Number(e.target.value) : null })}>
              <option value="">Sin asignar</option>
              {s.equipo.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          {s.proyecto ? (
            <button type="button" className="button button-outline" onClick={() => onAbrirProyecto(s.proyecto.cliente_id, s.proyecto.id)}>
              <ArrowUpRight aria-hidden="true" /> Ver proyecto {s.proyecto.codigo}
            </button>
          ) : !["rechazada", "archivada"].includes(s.estado) && !convirtiendo && (
            <button type="button" className="button button-primary" disabled={ocupado} onClick={() => { setAviso(""); setConvirtiendo(true); }}>
              <FolderPlus aria-hidden="true" /> Convertir en proyecto
            </button>
          )}
          {!s.proyecto && s.cuenta?.rol === "usuario" && (
            <button type="button" className="button button-outline" disabled={ocupado} onClick={pasarACliente}>
              <UserCheck aria-hidden="true" /> Solo pasar a cliente
            </button>
          )}
        </div>
      </div>

      <div className="auth-embed admin-aviso">
        <Alerta>{error}</Alerta>
        <Alerta tipo="ok">{aviso}</Alerta>
      </div>

      {convirtiendo && (
        <div className="table-panel" style={{ marginBottom: 18, borderColor: "var(--cliente-lime)" }}>
          <ConvertirProyecto
            solicitud={s}
            onCancelar={() => setConvirtiendo(false)}
            onHecho={async (r) => {
              setConvirtiendo(false);
              await cargar();
              setAviso(r.message);
            }}
          />
        </div>
      )}

      <Conversacion descripcion={s.descripcion} autorInicial={s.nombre} creada={s.created_at} mensajes={s.mensajes} verInternos />

      <form className="auth-embed solicitud-responder" onSubmit={enviar}>
        <div className="admin-sol-tipo" role="radiogroup" aria-label="Tipo de mensaje">
          <label><input type="radio" checked={!interno} onChange={() => setInterno(false)} /> Respuesta al cliente <small>(le llega por email{s.cuenta ? " y en su área" : ""})</small></label>
          <label><input type="radio" checked={interno} onChange={() => setInterno(true)} /> Nota interna <small>(solo el equipo)</small></label>
        </div>
        <textarea
          className="solicitud-textarea"
          rows={4}
          maxLength={5000}
          placeholder={interno ? "Nota para el equipo…" : `Escribe a ${s.nombre.split(" ")[0]}…`}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-label="Mensaje"
        />
        <Boton type="submit" cargando={ocupado} disabled={texto.trim().length < 2}>
          <Send aria-hidden="true" width={15} height={15} /> {interno ? "Guardar nota" : "Enviar respuesta"}
        </Boton>
      </form>
    </div>
  );
}

export default function AdminSolicitudes({ idInicial = null, onCambiarId, onAbrirProyecto }) {
  return (
    <section aria-label="Solicitudes de presupuesto">
      <PageHeading
        eyebrow="Administración"
        title={<>Solicitudes de <em>presupuesto</em></>}
        description="Responde a quienes piden presupuesto; les llega por email y, si tienen cuenta, en su área."
      />
      {idInicial ? <Detalle id={idInicial} onVolver={() => onCambiarId(null)} onAbrirProyecto={onAbrirProyecto} /> : <Lista onAbrir={onCambiarId} />}
    </section>
  );
}
