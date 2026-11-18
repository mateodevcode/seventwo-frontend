"use client";

// /admin → Soporte (F5): cola de tickets por prioridad, conversación con notas
// internas, estado, prioridad y asignado. URL: /admin?seccion=soporte&ticket=12
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Send } from "lucide-react";
import PageHeading from "@/views/area-cliente/components/PageHeading";
import { api } from "@/lib/api";
import { haceCuanto } from "@/lib/solicitudes";
import { CATEGORIAS, ESTADOS_TICKET, PRIORIDADES, PillTicket } from "@/lib/tickets";
import { Alerta, Boton } from "@/components/auth/ui";
import { Conversacion } from "@/components/area-cliente/Solicitudes";
import "@/components/area-cliente/solicitudes.css";
import "@/components/clientes/clientes.css";

function useAvisos(recargar) {
  useEffect(() => {
    const fn = (ev) => ev.detail?.tipo === "ticket_cliente" && recargar();
    window.addEventListener("seventwo:notificacion", fn);
    return () => window.removeEventListener("seventwo:notificacion", fn);
  }, [recargar]);
}

function Lista({ onAbrir }) {
  const [d, setD] = useState(null);
  const [estado, setEstado] = useState("abiertos");
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  useAvisos(useCallback(() => setVersion((v) => v + 1), []));
  useEffect(() => {
    let vigente = true;
    api(`/admin/tickets?estado=${estado}`, { auth: true }).then((r) => vigente && setD(r.data)).catch((e) => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [estado, version]);
  return (
    <div className="table-panel">
      <div className="table-toolbar admin-toolbar">
        <h2>{d ? `${d.tickets.length} ticket(s)` : "Tickets"}</h2>
        <select className="admin-select" value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Filtrar tickets">
          <option value="abiertos">Abiertos</option>
          {Object.entries(ESTADOS_TICKET).map(([k, t]) => <option key={k} value={k}>{t} ({d?.conteos?.[k] ?? 0})</option>)}
          <option value="todos">Todos</option>
        </select>
      </div>
      <div className="auth-embed"><Alerta>{error}</Alerta></div>
      {d?.tickets.length === 0 && <p className="admin-vacio">No hay tickets con ese filtro.</p>}
      {d?.tickets.map((t) => (
        <button key={t.id} type="button" className="cobro-fila" onClick={() => onAbrir(t.id)}>
          <span className="cobro-fecha">{t.codigo}<br />{PRIORIDADES[t.prioridad]}</span>
          <span className="cobro-concepto"><strong>{t.asunto}</strong><small>{t.cliente}{t.proyecto_codigo ? ` · ${t.proyecto_codigo}` : ""} · {CATEGORIAS[t.categoria]} · {haceCuanto(t.ultimo_mensaje_en)}{t.asignado ? ` · ${t.asignado}` : ""}</small></span>
          <span />
          <PillTicket estado={t.estado} />
          <ArrowUpRight aria-hidden="true" className="cobro-flecha" />
        </button>
      ))}
    </div>
  );
}

function Detalle({ id, onVolver, onAbrirCliente }) {
  const [t, setT] = useState(null);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [texto, setTexto] = useState("");
  const [interno, setInterno] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [version, setVersion] = useState(0);
  useAvisos(useCallback(() => setVersion((v) => v + 1), []));
  useEffect(() => {
    let vigente = true;
    api(`/admin/tickets/${id}`, { auth: true }).then((r) => vigente && setT(r.data)).catch((e) => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [id, version]);

  const accion = async (fn) => {
    setOcupado(true);
    setError("");
    setOk("");
    try {
      const r = await fn();
      setT(r.data);
      setOk(r.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  };
  const actualizar = (body) => accion(() => api(`/admin/tickets/${id}`, { method: "PATCH", auth: true, body }));
  const enviar = (e) => {
    e.preventDefault();
    accion(async () => {
      const r = await api(`/admin/tickets/${id}/mensajes`, { method: "POST", auth: true, body: { cuerpo: texto, interno } });
      setTexto("");
      return r;
    });
  };

  if (!t) return <div className="table-panel"><div className="auth-embed"><Alerta>{error}</Alerta>{!error && <p className="admin-vacio">Cargando…</p>}</div></div>;
  return (
    <div className="table-panel">
      <button type="button" className="solicitud-volver" onClick={onVolver}><ArrowLeft aria-hidden="true" /> Soporte</button>
      <div className="solicitud-cabecera">
        <div>
          <h2>{t.codigo} · {t.asunto}</h2>
          <p className="heading-description">
            <button type="button" className="text-button" onClick={() => onAbrirCliente(t.cliente_id, t.proyecto_id)}>{t.cliente}{t.proyecto_codigo ? ` · ${t.proyecto_codigo}` : ""} <ArrowUpRight aria-hidden="true" /></button>
            <br />{CATEGORIAS[t.categoria]} · abierto {haceCuanto(t.created_at)}
          </p>
        </div>
        <div className="admin-sol-controles">
          <label>Estado
            <select className="admin-select" value={t.estado} disabled={ocupado} onChange={(e) => actualizar({ estado: e.target.value })}>
              {Object.entries(ESTADOS_TICKET).map(([k, x]) => <option key={k} value={k}>{x}</option>)}
            </select>
          </label>
          <label>Prioridad
            <select className="admin-select" value={t.prioridad} disabled={ocupado} onChange={(e) => actualizar({ prioridad: e.target.value })}>
              {Object.entries(PRIORIDADES).map(([k, x]) => <option key={k} value={k}>{x}</option>)}
            </select>
          </label>
          <label>Asignado
            <select className="admin-select" value={t.asignado_a ?? ""} disabled={ocupado} onChange={(e) => actualizar({ asignado_a: e.target.value ? Number(e.target.value) : null })}>
              <option value="">Sin asignar</option>
              {t.equipo.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="auth-embed admin-aviso"><Alerta>{error}</Alerta><Alerta tipo="ok">{ok}</Alerta></div>
      {t.mensajes.length > 0 && (
        <Conversacion descripcion={t.mensajes[0].cuerpo} autorInicial={t.cliente} creada={t.mensajes[0].created_at} mensajes={t.mensajes.slice(1)} verInternos />
      )}
      <form className="auth-embed solicitud-responder" onSubmit={enviar}>
        <div className="admin-sol-tipo" role="radiogroup" aria-label="Tipo de mensaje">
          <label><input type="radio" checked={!interno} onChange={() => setInterno(false)} /> Respuesta al cliente <small>(email y aviso en su área)</small></label>
          <label><input type="radio" checked={interno} onChange={() => setInterno(true)} /> Nota interna <small>(solo el equipo)</small></label>
        </div>
        <textarea className="solicitud-textarea" rows={4} maxLength={5000} value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Mensaje" placeholder={interno ? "Nota para el equipo…" : "Escribe al cliente…"} />
        <Boton type="submit" cargando={ocupado} disabled={texto.trim().length < 2}><Send aria-hidden="true" width={15} height={15} /> {interno ? "Guardar nota" : "Enviar respuesta"}</Boton>
      </form>
    </div>
  );
}

export default function AdminTickets({ ticketId, onAbrir, onAbrirCliente }) {
  return (
    <section aria-label="Soporte">
      <PageHeading eyebrow="Administración" title={<>Tickets de <em>soporte</em></>} description="Lo que piden los clientes, ordenado por prioridad." />
      {ticketId ? <Detalle key={ticketId} id={ticketId} onVolver={() => onAbrir(null)} onAbrirCliente={onAbrirCliente} /> : <Lista onAbrir={onAbrir} />}
    </section>
  );
}
