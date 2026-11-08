"use client";

// Admin → Clientes: listado, alta manual, ficha con pestañas (resumen, datos,
// proyectos, historial) y editor de proyectos (docs/CLIENTES.md §7.2).
// La URL manda: /admin?seccion=clientes&cliente=3&proyecto=7
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Pencil, Plus, Search } from "lucide-react";
import PageHeading from "@/views/area-cliente/components/PageHeading";
import { api } from "@/lib/api";
import { ESTADOS_CLIENTE, MODELOS_COBRO, documento, fecha, valorProyecto } from "@/lib/clientes";
import { ESTADOS as ESTADOS_SOLICITUD, fechaCorta } from "@/lib/solicitudes";
import { ETIQUETA_ROL } from "@/lib/roles";
import { Alerta } from "@/components/auth/ui";
import FichaForm from "@/components/clientes/FichaForm";
import FichaVista from "@/components/clientes/FichaVista";
import { Hitos, ListaActividad, MetaProyecto, PillCliente, PillProyecto, Progreso } from "@/components/clientes/Proyecto";
import ProyectoForm from "./ProyectoForm";
import "@/components/area-cliente/solicitudes.css";
import "@/components/clientes/clientes.css";

/** Catálogo activo para el selector de servicio del formulario de proyecto. */
export function useServicios() {
  const [servicios, setServicios] = useState([]);
  useEffect(() => {
    let vigente = true;
    api("/admin/servicios", { auth: true }).then((r) => vigente && setServicios(r.data)).catch(() => {});
    return () => { vigente = false; };
  }, []);
  return servicios;
}

// ── Listado ──────────────────────────────────────────────────────
function Lista({ onAbrir }) {
  const [datos, setDatos] = useState({ clientes: [], total: 0, pagina: 1, paginas: 1, conteos: {} });
  const [estado, setEstado] = useState("");
  const [buscar, setBuscar] = useState("");
  const [consulta, setConsulta] = useState("");
  const [pagina, setPagina] = useState(1);
  const [error, setError] = useState("");
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    let vigente = true;
    const qs = new URLSearchParams({ pagina: String(pagina) });
    if (estado) qs.set("estado", estado);
    if (consulta) qs.set("buscar", consulta);
    api(`/admin/clientes?${qs}`, { auth: true })
      .then((r) => vigente && setDatos(r.data))
      .catch((e) => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [estado, consulta, pagina]);

  useEffect(() => {
    const t = setTimeout(() => {
      const q = buscar.trim();
      if (q !== consulta) { setConsulta(q); setPagina(1); }
    }, 350);
    return () => clearTimeout(t);
  }, [buscar, consulta]);

  if (creando) {
    return (
      <div className="table-panel">
        <button type="button" className="solicitud-volver" onClick={() => setCreando(false)}><ArrowLeft aria-hidden="true" /> Clientes</button>
        <h2 style={{ margin: 0 }}>Nuevo cliente</h2>
        <p className="heading-description">Para clientes que no llegaron por una solicitud. Si llegó por una, usa «Convertir en proyecto» en la solicitud.</p>
        <FichaForm
          equipo
          conEmail
          textoGuardar="Crear cliente"
          onCancelar={() => setCreando(false)}
          onGuardar={async (body) => {
            const r = await api("/admin/clientes", { method: "POST", auth: true, body });
            onAbrir(r.data.id);
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div className="invoice-summary admin-summary admin-chips" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {Object.entries(ESTADOS_CLIENTE).map(([e, t]) => (
          <button key={e} type="button" className={estado === e ? "activo" : ""} onClick={() => { setEstado(estado === e ? "" : e); setPagina(1); }}>
            <span>{t}</span>
            <strong>{datos.conteos[e] ?? 0}</strong>
          </button>
        ))}
      </div>
      <div className="table-panel">
        <div className="table-toolbar admin-toolbar">
          <h2>{datos.total} {datos.total === 1 ? "cliente" : "clientes"}</h2>
          <div className="admin-filtros">
            <label className="admin-buscar">
              <Search aria-hidden="true" />
              <input type="search" placeholder="Nombre, email o documento" value={buscar} onChange={(e) => setBuscar(e.target.value)} aria-label="Buscar clientes" />
            </label>
            <button type="button" className="button button-primary" onClick={() => setCreando(true)}>
              <Plus aria-hidden="true" /> Nuevo cliente
            </button>
          </div>
        </div>
        {error && <div className="auth-embed admin-aviso"><Alerta>{error}</Alerta></div>}
        <div className="invoice-table" role="table" aria-label="Clientes">
          <div className="table-row table-head admin-cli-row" role="row">
            <span>Cliente</span><span>Documento</span><span>Proyectos</span><span>Estado</span><span>Alta</span>
          </div>
          {datos.clientes.map((c) => (
            <button key={c.id} type="button" className="table-row admin-cli-row solicitud-row-btn" onClick={() => onAbrir(c.id)}>
              <span className="admin-user">
                <strong>{c.nombre}{c.nombre_comercial ? ` · ${c.nombre_comercial}` : ""}</strong>
                <span>{c.email}{c.tiene_cuenta ? "" : " · sin cuenta"}</span>
              </span>
              <span>{documento(c) || "—"}</span>
              <span>{c.proyectos_activos} activos / {c.proyectos}</span>
              <span><PillCliente estado={c.estado} /></span>
              <span>{fechaCorta(c.created_at)}</span>
            </button>
          ))}
          {datos.clientes.length === 0 && <p className="admin-vacio">No hay clientes con esos filtros.</p>}
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

// ── Proyecto (detalle + edición) ─────────────────────────────────
function ProyectoAdmin({ id, onVolver }) {
  const [p, setP] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [editando, setEditando] = useState(false);
  const servicios = useServicios();

  useEffect(() => {
    let vigente = true;
    api(`/admin/proyectos/${id}`, { auth: true }).then((r) => vigente && setP(r.data)).catch((e) => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [id]);

  if (!p) return <div className="table-panel"><div className="auth-embed"><Alerta>{error}</Alerta>{!error && <p className="admin-vacio">Cargando…</p>}</div></div>;

  return (
    <div className="table-panel">
      <button type="button" className="solicitud-volver" onClick={() => onVolver(p.cliente?.id)}><ArrowLeft aria-hidden="true" /> {p.cliente?.nombre ?? "Cliente"}</button>
      <div className="solicitud-cabecera">
        <div>
          <span className="proyecto-codigo">{p.codigo}{p.solicitud_codigo ? ` · desde ${p.solicitud_codigo}` : ""}{p.servicio ? ` · ${p.servicio}` : ""}</span>
          <h2>{p.nombre}</h2>
          <p className="heading-description">{p.responsable ? `Responsable: ${p.responsable}` : "Sin responsable"} · {MODELOS_COBRO[p.modelo_cobro]}</p>
        </div>
        <div style={{ display: "grid", gap: 10, justifyItems: "end", minWidth: 200 }}>
          <PillProyecto estado={p.estado} />
          <div style={{ width: "100%" }}><Progreso valor={p.progreso} /></div>
          {!editando && (
            <button type="button" className="button button-outline" onClick={() => { setOk(""); setEditando(true); }}>
              <Pencil aria-hidden="true" /> Editar
            </button>
          )}
        </div>
      </div>
      <div className="auth-embed admin-aviso"><Alerta>{error}</Alerta><Alerta tipo="ok">{ok}</Alerta></div>
      {editando ? (
        <ProyectoForm
          edicion
          valores={p}
          equipo={p.equipo}
          servicios={servicios}
          onCancelar={() => setEditando(false)}
          onGuardar={async (body) => {
            const r = await api(`/admin/proyectos/${id}`, { method: "PATCH", auth: true, body });
            setP((x) => ({ ...x, ...r.data }));
            setEditando(false);
            setOk(r.message);
          }}
        />
      ) : (
        <>
          <MetaProyecto p={p} />
          <div className="proyecto-cols">
            <div>
              <p className="eyebrow">Hitos</p>
              <Hitos hitos={p.hitos} moneda={p.moneda} />
              {p.descripcion && <p className="proyecto-descripcion">{p.descripcion}</p>}
            </div>
            <div>
              <p className="eyebrow">Lo que incluye</p>
              {p.incluye?.length
                ? <ul className="actividad-lista">{p.incluye.map((x) => <li key={x} style={{ gridTemplateColumns: "1fr" }}>{x}</li>)}</ul>
                : <p className="admin-vacio">Sin detallar.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Ficha de cliente ─────────────────────────────────────────────
const TABS = [["resumen", "Resumen"], ["datos", "Datos"], ["proyectos", "Proyectos"], ["historial", "Historial"]];

function Ficha({ id, onVolver, onAbrirProyecto, onAbrirSolicitud }) {
  const [c, setC] = useState(null);
  const [tab, setTab] = useState("resumen");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [editando, setEditando] = useState(false);
  const [nuevoProyecto, setNuevoProyecto] = useState(false);
  const servicios = useServicios();

  const cargar = useCallback(() => api(`/admin/clientes/${id}`, { auth: true }).then((r) => setC(r.data)), [id]);
  useEffect(() => {
    let vigente = true;
    api(`/admin/clientes/${id}`, { auth: true }).then((r) => vigente && setC(r.data)).catch((e) => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [id]);

  if (!c) return <div className="table-panel"><div className="auth-embed"><Alerta>{error}</Alerta>{!error && <p className="admin-vacio">Cargando…</p>}</div></div>;
  const activos = c.proyectos.filter((p) => !["finalizado", "cancelado"].includes(p.estado));

  return (
    <div className="table-panel">
      <button type="button" className="solicitud-volver" onClick={onVolver}><ArrowLeft aria-hidden="true" /> Clientes</button>
      <div className="solicitud-cabecera">
        <div>
          <h2>{c.nombre}{c.nombre_comercial ? ` · ${c.nombre_comercial}` : ""}</h2>
          <p className="heading-description">
            {[documento(c), c.email, c.telefono].filter(Boolean).join(" · ")}
            <br />
            Cuenta: {c.cuenta ? `${c.cuenta.name} · ${ETIQUETA_ROL[c.cuenta.rol]}${c.cuenta.bloqueado ? " · bloqueada" : ""}` : "sin cuenta (se vinculará cuando se registre y verifique este email)"}
          </p>
        </div>
        <PillCliente estado={c.estado} />
      </div>

      <div className="tabs" role="tablist">
        {TABS.map(([k, t]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "activo" : ""} onClick={() => { setTab(k); setOk(""); }}>
            {t}{k === "proyectos" ? ` (${c.proyectos.length})` : ""}
          </button>
        ))}
      </div>
      <div className="auth-embed admin-aviso"><Alerta>{error}</Alerta><Alerta tipo="ok">{ok}</Alerta></div>

      {tab === "resumen" && (
        <div className="proyecto-cols">
          <div>
            <p className="eyebrow">Proyectos activos</p>
            {activos.length ? activos.map((p) => (
              <button key={p.id} type="button" className="proyecto-card" style={{ marginTop: 12 }} onClick={() => onAbrirProyecto(p.id)}>
                <div>
                  <span className="proyecto-codigo">{p.codigo} · {p.tipo_proyecto ?? MODELOS_COBRO[p.modelo_cobro]}</span>
                  <h3>{p.nombre}</h3>
                  <p>{valorProyecto(p)} · Inicio {fecha(p.fecha_inicio)}{p.responsable ? ` · ${p.responsable}` : ""}</p>
                </div>
                <div style={{ display: "grid", gap: 10, justifyItems: "end" }}>
                  <PillProyecto estado={p.estado} />
                  <div style={{ width: "100%" }}><Progreso valor={p.progreso} /></div>
                </div>
              </button>
            )) : <p className="admin-vacio">Sin proyectos activos.</p>}
            <p className="eyebrow" style={{ marginTop: 24 }}>Notas internas</p>
            <p className="proyecto-descripcion">{c.notas_internas || "—"}</p>
          </div>
          <div>
            <p className="eyebrow">Solicitudes</p>
            {c.solicitudes.length ? (
              <ul className="actividad-lista">
                {c.solicitudes.map((s) => (
                  <li key={s.id}>
                    <time>{fechaCorta(s.created_at)}</time>
                    <button type="button" className="text-button" style={{ justifyContent: "flex-start" }} onClick={() => onAbrirSolicitud(s.id)}>
                      {s.codigo} · {s.tipo_proyecto} · {ESTADOS_SOLICITUD[s.estado]} <ArrowUpRight aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="admin-vacio">Sin solicitudes.</p>}
            <p className="eyebrow" style={{ marginTop: 24 }}>Alta</p>
            <p className="heading-description">{fechaCorta(c.created_at)}{c.alta_por_nombre ? ` · por ${c.alta_por_nombre}` : ""}</p>
          </div>
        </div>
      )}

      {tab === "datos" && (editando ? (
        <FichaForm
          equipo
          valores={c}
          onCancelar={() => setEditando(false)}
          onGuardar={async (body) => {
            const r = await api(`/admin/clientes/${id}`, { method: "PATCH", auth: true, body });
            setC((x) => ({ ...x, ...r.data }));
            setEditando(false);
            setOk(r.message);
          }}
        />
      ) : (
        <>
          <button type="button" className="button button-outline" onClick={() => { setOk(""); setEditando(true); }}>
            <Pencil aria-hidden="true" /> Editar datos
          </button>
          <FichaVista c={c} />
        </>
      ))}

      {tab === "proyectos" && (nuevoProyecto ? (
        <ProyectoForm
          equipo={c.equipo}
          servicios={servicios}
          textoGuardar="Crear proyecto"
          onCancelar={() => setNuevoProyecto(false)}
          onGuardar={async (body) => {
            const r = await api("/admin/proyectos", { method: "POST", auth: true, body: { ...body, cliente_id: c.id } });
            setNuevoProyecto(false);
            await cargar();
            setOk(r.message);
          }}
        />
      ) : (
        <>
          <button type="button" className="button button-primary" onClick={() => { setOk(""); setNuevoProyecto(true); }}>
            <Plus aria-hidden="true" /> Nuevo proyecto
          </button>
          <div className="invoice-table" role="table" aria-label="Proyectos del cliente" style={{ marginTop: 16 }}>
            <div className="table-row table-head admin-proy-row" role="row">
              <span>Código</span><span>Proyecto</span><span>Valor</span><span>Progreso</span><span>Estado</span>
            </div>
            {c.proyectos.map((p) => (
              <button key={p.id} type="button" className="table-row admin-proy-row solicitud-row-btn" onClick={() => onAbrirProyecto(p.id)}>
                <strong>{p.codigo}</strong>
                <span className="admin-user"><strong>{p.nombre}</strong><span>{p.tipo_proyecto ?? "—"} · inicio {fecha(p.fecha_inicio)}</span></span>
                <span>{valorProyecto(p)}</span>
                <span><Progreso valor={p.progreso} /></span>
                <span><PillProyecto estado={p.estado} /></span>
              </button>
            ))}
            {c.proyectos.length === 0 && <p className="admin-vacio">Este cliente aún no tiene proyectos.</p>}
          </div>
        </>
      ))}

      {tab === "historial" && <ListaActividad items={c.actividad} verAutor />}
    </div>
  );
}

export default function AdminClientes({ clienteId, proyectoId, onIr, onAbrirSolicitud }) {
  return (
    <section aria-label="Clientes">
      <PageHeading
        eyebrow="Administración"
        title={<>Tus <em>clientes</em></>}
        description="Ficha de cada cliente, sus proyectos y todo lo que ha pasado con ellos."
      />
      {proyectoId ? (
        <ProyectoAdmin key={proyectoId} id={proyectoId} onVolver={(cid) => onIr({ cliente: cid ?? clienteId })} />
      ) : clienteId ? (
        <Ficha
          key={clienteId}
          id={clienteId}
          onVolver={() => onIr({})}
          onAbrirProyecto={(pid) => onIr({ cliente: clienteId, proyecto: pid })}
          onAbrirSolicitud={onAbrirSolicitud}
        />
      ) : (
        <Lista onAbrir={(cid) => onIr({ cliente: cid })} />
      )}
    </section>
  );
}
