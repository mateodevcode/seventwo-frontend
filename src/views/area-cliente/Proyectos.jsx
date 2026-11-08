"use client";

// Área de cliente → Mis proyectos (sustituye a "Servicio contratado").
// La URL manda: ?seccion=proyectos&proyecto=P-0007 abre el detalle.
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import PageHeading from "./components/PageHeading";
import { api } from "@/lib/api";
import { fecha, valorProyecto, MODELOS_COBRO } from "@/lib/clientes";
import { Alerta } from "@/components/auth/ui";
import { Hitos, MetaProyecto, PillProyecto, Progreso } from "@/components/clientes/Proyecto";
import "@/components/clientes/clientes.css";

// Recarga cuando llega un aviso de proyecto (estado, hito…).
function useAvisosProyecto(recargar) {
  useEffect(() => {
    const fn = (ev) => ev.detail?.tipo?.startsWith("proyecto_") && recargar();
    window.addEventListener("seventwo:notificacion", fn);
    return () => window.removeEventListener("seventwo:notificacion", fn);
  }, [recargar]);
}

function Lista({ onAbrir, onNavigate }) {
  const [proyectos, setProyectos] = useState(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  useAvisosProyecto(() => setVersion((v) => v + 1));

  useEffect(() => {
    let vigente = true;
    api("/proyectos/mios", { auth: true })
      .then((r) => vigente && setProyectos(r.data))
      .catch((e) => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [version]);

  if (error) return <div className="auth-embed"><Alerta>{error}</Alerta></div>;
  if (!proyectos) return <p className="admin-vacio">Cargando…</p>;
  if (!proyectos.length) {
    return (
      <div className="vacio-card">
        <strong>Estamos preparando tu proyecto</strong>
        Cuando el equipo lo dé de alta verás aquí su estado, hitos, fechas y lo que incluye.
        <div style={{ marginTop: 14 }}>
          <button type="button" className="text-button" onClick={() => onNavigate("cotizar")}>
            Ver mis solicitudes <ArrowUpRight aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="proyectos-lista">
      {proyectos.map((p) => (
        <button key={p.codigo} type="button" className="proyecto-card" onClick={() => onAbrir(p.codigo)}>
          <div>
            <span className="proyecto-codigo">{p.codigo} · {p.tipo_proyecto ?? MODELOS_COBRO[p.modelo_cobro]}</span>
            <h3>{p.nombre}</h3>
            <p>
              {valorProyecto(p)} · Inicio {fecha(p.fecha_inicio)}
              {p.fecha_entrega_estimada ? ` · Entrega ${fecha(p.fecha_entrega_estimada)}` : ""}
              {p.hitos ? ` · ${p.hitos_completados}/${p.hitos} hitos` : ""}
            </p>
          </div>
          <div style={{ display: "grid", gap: 10, justifyItems: "end" }}>
            <PillProyecto estado={p.estado} />
            <div style={{ width: "100%" }}><Progreso valor={p.progreso} /></div>
          </div>
        </button>
      ))}
    </div>
  );
}

function Detalle({ codigo, onVolver, onNavigate }) {
  const [p, setP] = useState(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  useAvisosProyecto(() => setVersion((v) => v + 1));

  useEffect(() => {
    let vigente = true;
    api(`/proyectos/mios/${encodeURIComponent(codigo)}`, { auth: true })
      .then((r) => vigente && setP(r.data))
      .catch((e) => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [codigo, version]);

  return (
    <div className="table-panel">
      <button type="button" className="solicitud-volver" onClick={onVolver}><ArrowLeft aria-hidden="true" /> Mis proyectos</button>
      {error && <div className="auth-embed"><Alerta>{error}</Alerta></div>}
      {!p && !error && <p className="admin-vacio">Cargando…</p>}
      {p && (
        <>
          <div className="solicitud-cabecera">
            <div>
              <span className="proyecto-codigo">{p.codigo}{p.tipo_proyecto ? ` · ${p.tipo_proyecto}` : ""}{p.servicio ? ` · ${p.servicio}` : ""}</span>
              <h2>{p.nombre}</h2>
              <p className="heading-description">{p.responsable ? `Responsable: ${p.responsable}` : "Equipo Seventwo"}</p>
            </div>
            <div style={{ display: "grid", gap: 10, justifyItems: "end", minWidth: 200 }}>
              <PillProyecto estado={p.estado} />
              <div style={{ width: "100%" }}><Progreso valor={p.progreso} /></div>
            </div>
          </div>

          <MetaProyecto p={p} />

          <div className="proyecto-cols">
            <div>
              <p className="eyebrow">Hitos</p>
              <Hitos hitos={p.hitos} moneda={p.moneda} />
              {p.descripcion && (
                <>
                  <p className="eyebrow" style={{ marginTop: 24 }}>Descripción</p>
                  <p className="proyecto-descripcion">{p.descripcion}</p>
                </>
              )}
            </div>
            <div>
              <p className="eyebrow">Lo que incluye</p>
              {p.incluye?.length ? (
                <div className="feature-list" style={{ marginTop: 14 }}>
                  {p.incluye.map((x) => <span key={x}><Check aria-hidden="true" /> {x}</span>)}
                </div>
              ) : <p className="admin-vacio">Se detallará en el contrato.</p>}
              <p className="eyebrow" style={{ marginTop: 24 }}>Contrato</p>
              <p className="heading-description">Muy pronto podrás leer y aceptar el contrato desde aquí.</p>
              {p.solicitud_codigo && (
                <>
                  <p className="eyebrow" style={{ marginTop: 24 }}>Origen</p>
                  <button type="button" className="text-button" onClick={() => onNavigate("cotizar")}>
                    Solicitud {p.solicitud_codigo} <ArrowUpRight aria-hidden="true" />
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Proyectos({ codigoInicial, onAbrir, onNavigate }) {
  return (
    <section id="proyectos" aria-label="Mis proyectos">
      <PageHeading
        eyebrow="Tu trabajo con Seventwo"
        title={<>Mis <em>proyectos</em></>}
        description="Estado, hitos, fechas y lo que incluye cada proyecto."
      />
      {codigoInicial
        ? <Detalle codigo={codigoInicial} onVolver={() => onAbrir(null)} onNavigate={onNavigate} />
        : <Lista onAbrir={onAbrir} onNavigate={onNavigate} />}
    </section>
  );
}
