"use client";

// Área de cliente → Soporte (F5): tickets ligados a sus proyectos, con conversación.
// La URL manda: ?seccion=soporte&ticket=T-0003
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Headphones, Plus, Send } from "lucide-react";
import PageHeading from "./components/PageHeading";
import { api } from "@/lib/api";
import { erroresDe } from "@/lib/clientes";
import { haceCuanto } from "@/lib/solicitudes";
import { CATEGORIAS, PRIORIDADES, PillTicket } from "@/lib/tickets";
import { Alerta, Boton, Campo } from "@/components/auth/ui";
import { Selector } from "@/components/clientes/FichaForm";
import { Conversacion } from "@/components/area-cliente/Solicitudes";
import { useAuth } from "@/components/auth/AuthProvider";
import "@/components/area-cliente/solicitudes.css";
import "@/components/clientes/clientes.css";

function useAvisosTicket(recargar) {
  useEffect(() => {
    const fn = (ev) => ev.detail?.tipo === "ticket_equipo" && recargar();
    window.addEventListener("seventwo:notificacion", fn);
    return () => window.removeEventListener("seventwo:notificacion", fn);
  }, [recargar]);
}

function Nuevo({ proyectos, onCreado, onCancelar }) {
  const [f, setF] = useState({ asunto: "", categoria: "consulta", prioridad: "normal", proyecto: proyectos[0]?.codigo ?? "", cuerpo: "" });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const enviar = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    setErrores({});
    try {
      const r = await api("/tickets/mios", { method: "POST", auth: true, body: { ...f, proyecto: f.proyecto || null } });
      onCreado(r.data.codigo, r.message);
    } catch (er) {
      setError(er.message);
      setErrores(erroresDe(er));
      setCargando(false);
    }
  };
  return (
    <div className="table-panel">
      <button type="button" className="solicitud-volver" onClick={onCancelar}><ArrowLeft aria-hidden="true" /> Soporte</button>
      <h2 style={{ margin: 0 }}>Nuevo ticket</h2>
      <form className="auth-embed auth-form ficha-form" onSubmit={enviar} noValidate>
        <Alerta>{error}</Alerta>
        <Campo id="tk-asunto" label="Asunto" value={f.asunto} onChange={set("asunto")} error={errores.asunto} placeholder="Ej.: Cambiar el precio de un plato" />
        <div className="solicitud-grid">
          {proyectos.length > 0 && (
            <Selector id="tk-proy" label="Proyecto" value={f.proyecto} onChange={set("proyecto")} opciones={Object.fromEntries(proyectos.map((p) => [p.codigo, `${p.codigo} · ${p.nombre}`]))} vacio="General" error={errores.proyecto} />
          )}
          <Selector id="tk-cat" label="Tipo" value={f.categoria} onChange={set("categoria")} opciones={CATEGORIAS} />
          <Selector id="tk-pri" label="Prioridad" value={f.prioridad} onChange={set("prioridad")} opciones={PRIORIDADES} />
        </div>
        <div className="auth-field">
          <label htmlFor="tk-cuerpo">Cuéntanos qué necesitas</label>
          <textarea id="tk-cuerpo" className="solicitud-textarea" rows={5} maxLength={5000} value={f.cuerpo} onChange={set("cuerpo")} aria-invalid={errores.cuerpo ? "true" : undefined} />
          {errores.cuerpo && <p className="auth-field-error">{errores.cuerpo}</p>}
        </div>
        <div className="auth-row">
          <Boton type="submit" cargando={cargando} disabled={f.asunto.trim().length < 4 || f.cuerpo.trim().length < 10}>Enviar ticket</Boton>
        </div>
      </form>
    </div>
  );
}

function Detalle({ codigo, onVolver }) {
  const { usuario } = useAuth();
  const [t, setT] = useState(null);
  const [error, setError] = useState("");
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [version, setVersion] = useState(0);
  useAvisosTicket(useCallback(() => setVersion((v) => v + 1), []));

  useEffect(() => {
    let vigente = true;
    api(`/tickets/mios/${encodeURIComponent(codigo)}`, { auth: true }).then((r) => vigente && setT(r.data)).catch((e) => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [codigo, version]);

  const enviar = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      await api(`/tickets/mios/${encodeURIComponent(codigo)}/mensajes`, { method: "POST", auth: true, body: { cuerpo: texto } });
      setTexto("");
      setVersion((v) => v + 1);
    } catch (er) {
      setError(er.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="table-panel">
      <button type="button" className="solicitud-volver" onClick={onVolver}><ArrowLeft aria-hidden="true" /> Soporte</button>
      <div className="auth-embed"><Alerta>{error}</Alerta></div>
      {t && (
        <>
          <div className="solicitud-cabecera">
            <div>
              <h2>{t.codigo} · {t.asunto}</h2>
              <p className="heading-description">{CATEGORIAS[t.categoria]} · prioridad {PRIORIDADES[t.prioridad].toLowerCase()}{t.proyecto_codigo ? ` · ${t.proyecto_codigo}` : ""}</p>
            </div>
            <PillTicket estado={t.estado} cliente />
          </div>
          {t.mensajes.length > 0 && (
            <Conversacion descripcion={t.mensajes[0].cuerpo} autorInicial={usuario?.name ?? "Tú"} creada={t.mensajes[0].created_at} mensajes={t.mensajes.slice(1)} />
          )}
          {t.estado === "cerrado" ? (
            <p className="heading-description" style={{ marginTop: 18 }}>Este ticket está cerrado. Si necesitas algo más, abre uno nuevo.</p>
          ) : (
            <form className="auth-embed solicitud-responder" onSubmit={enviar}>
              <textarea className="solicitud-textarea" rows={3} maxLength={5000} placeholder="Escribe tu respuesta…" value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Respuesta" />
              <Boton type="submit" cargando={cargando} disabled={texto.trim().length < 2}><Send aria-hidden="true" width={15} height={15} /> Responder</Boton>
            </form>
          )}
        </>
      )}
    </div>
  );
}

export default function Soporte({ codigoInicial, onAbrir }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [creando, setCreando] = useState(false);
  const [version, setVersion] = useState(0);
  useAvisosTicket(useCallback(() => setVersion((v) => v + 1), []));

  useEffect(() => {
    if (codigoInicial) return undefined;
    let vigente = true;
    api("/tickets/mios", { auth: true }).then((r) => vigente && setD(r.data)).catch((e) => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [codigoInicial, version]);

  return (
    <section aria-label="Soporte">
      <PageHeading
        eyebrow="Estamos para ayudarte"
        title={<>Centro de <em>soporte</em></>}
        description="Abre un ticket y sigue la conversación con el equipo."
        action={!codigoInicial && !creando && (
          <button type="button" className="button button-primary" onClick={() => { setOk(""); setCreando(true); }}><Plus aria-hidden="true" /> Nuevo ticket</button>
        )}
      />
      {codigoInicial ? (
        <Detalle codigo={codigoInicial} onVolver={() => onAbrir(null)} />
      ) : creando ? (
        <Nuevo proyectos={d?.proyectos ?? []} onCancelar={() => setCreando(false)} onCreado={(codigo, m) => { setCreando(false); setOk(m); onAbrir(codigo); }} />
      ) : (
        <div className="table-panel">
          <div className="auth-embed"><Alerta>{error}</Alerta><Alerta tipo="ok">{ok}</Alerta></div>
          {d?.tickets.length === 0 && (
            <div className="vacio-card"><strong>No tienes tickets</strong>Si necesitas un cambio, tienes una duda o algo no funciona, abre un ticket y te respondemos en horario hábil.</div>
          )}
          {d?.tickets.map((t) => (
            <button key={t.codigo} type="button" className="cobro-fila" onClick={() => onAbrir(t.codigo)}>
              <span className="cobro-fecha">{t.codigo}</span>
              <span className="cobro-concepto"><strong>{t.asunto}</strong><small>{CATEGORIAS[t.categoria]}{t.proyecto_codigo ? ` · ${t.proyecto_codigo}` : ""} · {haceCuanto(t.ultimo_mensaje_en)}</small></span>
              <span />
              <PillTicket estado={t.estado} cliente />
              <Headphones aria-hidden="true" className="cobro-flecha" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
