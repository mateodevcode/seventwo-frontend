"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Check, FilePlus2, FileText, FolderKanban, Plus, Sparkles, UserRound } from "lucide-react";
import PageHeading from "./components/PageHeading";
import { useAuth } from "@/components/auth/AuthProvider";
import { api } from "@/lib/api";
import { fecha } from "@/lib/clientes";
import { haceCuanto } from "@/lib/solicitudes";
import { PillProyecto, Progreso } from "@/components/clientes/Proyecto";
import "@/components/clientes/clientes.css";

function QuickCard({ icon: Icon, label, value, note, onClick }) {
  return (
    <button type="button" className="quick-card" onClick={onClick}>
      <div className="quick-icon">
        <Icon aria-hidden="true" />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
      <ArrowUpRight aria-hidden="true" />
    </button>
  );
}

const saludo = (h) => (h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches");
const fechaHoy = () => {
  const f = new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return f.charAt(0).toUpperCase() + f.slice(1);
};
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

export default function Overview({ onNavigate, onAbrirProyecto }) {
  const { usuario } = useAuth();
  const nombre = usuario?.name?.split(" ")[0] ?? "";
  const [r, setR] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    api("/clientes/yo/resumen", { auth: true }).then((x) => vigente && setR(x.data)).catch(() => {});
    return () => { vigente = false; };
  }, [version]);
  useEffect(() => {
    const fn = (ev) => /^(proyecto_|solicitud_|contrato_)/.test(ev.detail?.tipo ?? "") && setVersion((v) => v + 1);
    window.addEventListener("seventwo:notificacion", fn);
    return () => window.removeEventListener("seventwo:notificacion", fn);
  }, []);

  const principal = r?.proyectos?.[0];
  const otros = (r?.proyectos?.length ?? 0) - 1;

  return (
    <section id="resumen" aria-label="Resumen">
      <PageHeading
        eyebrow={fechaHoy()}
        title={<>{saludo(new Date().getHours())}, <em>{nombre}</em></>}
        description="Aquí tienes una vista general de tu cuenta y tus proyectos."
        action={
          <button type="button" className="button button-primary" onClick={() => onNavigate("cotizar")}>
            <Plus aria-hidden="true" /> Cotizar nuevo proyecto
          </button>
        }
      />

      {r?.contratos_pendientes?.map((c) => (
        <button key={c.id} type="button" className="aviso-contrato" onClick={() => onAbrirProyecto(c.proyecto_codigo)}>
          <FileText aria-hidden="true" />
          <span>
            <strong>Tienes un contrato pendiente de aceptar</strong>
            <small>{c.proyecto_codigo} · {c.titulo} · versión {c.version}</small>
          </span>
          <ArrowUpRight aria-hidden="true" />
        </button>
      ))}

      <div className="overview-grid">
        <div className="welcome-card">
          {principal ? (
            <div style={{ width: "100%" }}>
              <span className="card-kicker">{principal.codigo} · Proyecto activo</span>
              <h2>{principal.nombre}</h2>
              <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "6px 0 14px", maxWidth: 360 }}>
                <PillProyecto estado={principal.estado} />
                <div style={{ flex: 1 }}><Progreso valor={principal.progreso} /></div>
              </div>
              <p>
                {principal.siguiente_hito
                  ? <>Próximo hito: <strong>{principal.siguiente_hito}</strong>{principal.siguiente_hito_fecha ? ` · ${fecha(principal.siguiente_hito_fecha)}` : ""}</>
                  : principal.fecha_entrega_estimada ? <>Entrega prevista: <strong>{fecha(principal.fecha_entrega_estimada)}</strong></> : "Estamos trabajando en tu proyecto."}
              </p>
              <button type="button" className="text-button" onClick={() => onAbrirProyecto(principal.codigo)}>
                Ver proyecto <ArrowUpRight aria-hidden="true" />
              </button>
              {otros > 0 && (
                <button type="button" className="text-button" style={{ marginLeft: 18 }} onClick={() => onNavigate("proyectos")}>
                  y {plural(otros, "proyecto más", "proyectos más")} <ArrowUpRight aria-hidden="true" />
                </button>
              )}
            </div>
          ) : (
            <div>
              <span className="card-kicker">{r?.cliente ? "Bienvenido a Seventwo" : "Tu cuenta"}</span>
              <h2>Tu presencia digital,<br /><em>en buenas manos.</em></h2>
              <p>{r?.cliente ? "Estamos preparando tu proyecto. Lo verás aquí en cuanto esté dado de alta." : "Cuéntanos qué necesitas y prepararemos una propuesta para ti."}</p>
              <button type="button" className="text-button" onClick={() => onNavigate(r?.cliente ? "proyectos" : "cotizar")}>
                {r?.cliente ? "Mis proyectos" : "Solicitar presupuesto"} <ArrowUpRight aria-hidden="true" />
              </button>
            </div>
          )}
          <div className="orbital-art" aria-hidden="true">
            <div className="orbital-line one" />
            <div className="orbital-line two" />
            <div className="orbital-dot" />
          </div>
        </div>

        <div className="stats-card">
          <div className="stat-heading">
            <span>Estado de cuenta</span>
            <span className="status-dot">Al día</span>
          </div>
          <div className="stat-main">
            <strong style={{ fontSize: 22 }}>Sin cobros pendientes</strong>
            <span>Tus cuentas de cobro y pagos aparecerán aquí muy pronto.</span>
          </div>
          <button type="button" className="button button-outline" onClick={() => onNavigate("datos")}>
            Datos de facturación <ArrowUpRight aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="section-row">
        <div>
          <p className="eyebrow">De un vistazo</p>
          <h2 className="section-title">Tu cuenta</h2>
        </div>
      </div>

      <div className="quick-grid">
        <QuickCard
          icon={FolderKanban}
          label="Mis proyectos"
          value={r ? plural(r.conteos.proyectos_activos, "activo", "activos") : "…"}
          note={r?.conteos.proyectos ? `${plural(r.conteos.proyectos, "proyecto", "proyectos")} en total` : "Aún no hay proyectos"}
          onClick={() => onNavigate("proyectos")}
        />
        <QuickCard
          icon={FilePlus2}
          label="Solicitudes"
          value={r ? plural(r.conteos.solicitudes_abiertas, "abierta", "abiertas") : "…"}
          note="Presupuestos en conversación"
          onClick={() => onNavigate("cotizar")}
        />
        <QuickCard
          icon={UserRound}
          label="Perfil"
          value="Datos de facturación"
          note="Mantén tus datos al día"
          onClick={() => onNavigate("datos")}
        />
      </div>

      <div className="bottom-grid">
        <div className="activity-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Actividad reciente</p>
              <h2>Últimos movimientos</h2>
            </div>
          </div>
          {r?.actividad?.length ? (
            r.actividad.map((a) => (
              <div className="activity-item" key={a.id}>
                <div className={`activity-icon ${a.entidad === "cliente" ? "message" : "paid"}`}>
                  {a.entidad === "contrato" ? <FileText aria-hidden="true" /> : a.entidad === "proyecto" ? <Check aria-hidden="true" /> : <UserRound aria-hidden="true" />}
                </div>
                <div>
                  <strong>{a.descripcion}</strong>
                  <span>{new Date(a.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <b>{haceCuanto(a.created_at)}</b>
              </div>
            ))
          ) : (
            <p className="admin-vacio">Todavía no hay movimientos.</p>
          )}
        </div>

        <div className="quote-card">
          <Sparkles aria-hidden="true" />
          <p className="eyebrow">¿Tienes una idea?</p>
          <h3>Hagámosla realidad.</h3>
          <p>Cuéntanos qué tienes en mente y prepararemos una propuesta para ti.</p>
          <button type="button" className="text-button" onClick={() => onNavigate("cotizar")}>
            Empezar ahora <ArrowUpRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
