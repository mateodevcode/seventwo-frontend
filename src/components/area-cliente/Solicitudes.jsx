"use client";

// Área de cliente → Solicitar presupuesto: formulario (relleno con la cuenta),
// "Mis solicitudes" y la conversación de cada una (docs/PRESUPUESTOS.md §7.2).
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Send } from "lucide-react";
import PageHeading from "@/views/area-cliente/components/PageHeading";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { Alerta, Boton, Campo } from "@/components/auth/ui";
import { ESTADOS, RANGOS_PRESUPUESTO, TIPOS_PROYECTO, erroresSolicitud, fechaCorta, fechaHora } from "@/lib/solicitudes";
import "./solicitudes.css";

export function PillEstado({ estado }) {
  const fuerte = estado === "respondida" || estado === "aceptada";
  return <span className={`pill ${fuerte ? "success" : "warning"} estado-${estado}`}>{ESTADOS[estado] ?? estado}</span>;
}

function Formulario({ onCreada }) {
  const { usuario } = useAuth();
  const [form, setForm] = useState({ tipo_proyecto: TIPOS_PROYECTO[0], presupuesto: "", telefono: usuario?.telefono ?? "", descripcion: "", acepta: false });
  const [tocado, setTocado] = useState(false);
  const [estado, setEstado] = useState({ enviando: false, error: "", ok: "" });
  const montado = useRef(0);
  useEffect(() => {
    montado.current = Date.now();
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const errores = erroresSolicitud(form, { conSesion: true });

  async function enviar(e) {
    e.preventDefault();
    setTocado(true);
    if (Object.keys(errores).length) return;
    setEstado({ enviando: true, error: "", ok: "" });
    try {
      const r = await api("/solicitudes", {
        method: "POST",
        auth: true,
        body: { ...form, presupuesto: form.presupuesto || undefined, ms: Date.now() - montado.current },
      });
      setEstado({ enviando: false, error: "", ok: `Solicitud ${r.data.codigo} enviada. Te responderemos por aquí y a tu correo.` });
      setForm((f) => ({ ...f, descripcion: "", acepta: false }));
      setTocado(false);
      onCreada(r.data.codigo);
    } catch (err) {
      setEstado({ enviando: false, error: err.message, ok: "" });
    }
  }

  return (
    <div className="data-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Nuevo proyecto</p>
          <h2>Cuéntanos qué necesitas</h2>
        </div>
      </div>
      <form className="auth-embed auth-form" onSubmit={enviar} noValidate>
        <Alerta>{estado.error}</Alerta>
        <Alerta tipo="ok">{estado.ok}</Alerta>
        <div className="solicitud-grid">
          <div className="auth-field">
            <label htmlFor="sol-tipo">Tipo de proyecto</label>
            <select id="sol-tipo" className="solicitud-select" value={form.tipo_proyecto} onChange={set("tipo_proyecto")}>
              {TIPOS_PROYECTO.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="auth-field">
            <label htmlFor="sol-presupuesto">Presupuesto aproximado</label>
            <select id="sol-presupuesto" className="solicitud-select" value={form.presupuesto} onChange={set("presupuesto")}>
              <option value="">Selecciona un rango</option>
              {RANGOS_PRESUPUESTO.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <Campo id="sol-telefono" label="Teléfono (opcional)" tipo="tel" value={form.telefono} onChange={set("telefono")} error={tocado ? errores.telefono : ""} />
        <div className="auth-field">
          <label htmlFor="sol-descripcion">Cuéntanos brevemente</label>
          <textarea
            id="sol-descripcion"
            className="solicitud-textarea"
            rows={4}
            maxLength={3000}
            placeholder="Qué quieres construir, para quién y para cuándo…"
            value={form.descripcion}
            onChange={set("descripcion")}
            aria-invalid={tocado && errores.descripcion ? "true" : undefined}
          />
          {tocado && errores.descripcion && <p className="auth-field-error">{errores.descripcion}</p>}
        </div>
        <label className="solicitud-check">
          <input type="checkbox" checked={form.acepta} onChange={set("acepta")} />
          <span>Acepto que Seventwo me contacte sobre esta solicitud.</span>
        </label>
        {tocado && errores.acepta && <p className="auth-field-error">{errores.acepta}</p>}
        <p className="auth-field-help">Enviaremos la respuesta a <strong>{usuario?.email}</strong> y aquí mismo.</p>
        <Boton type="submit" cargando={estado.enviando}>Enviar solicitud</Boton>
      </form>
    </div>
  );
}

function Lista({ solicitudes, onAbrir }) {
  return (
    <div className="table-panel">
      <div className="table-toolbar">
        <h2>Mis solicitudes</h2>
      </div>
      {solicitudes.length === 0 ? (
        <p className="admin-vacio">Aún no has enviado solicitudes. Las que hayas hecho desde la web con este email aparecerán aquí.</p>
      ) : (
        <div className="invoice-table" role="table" aria-label="Mis solicitudes">
          <div className="table-row table-head solicitud-row" role="row">
            <span>Código</span>
            <span>Proyecto</span>
            <span>Enviada</span>
            <span>Estado</span>
            <span />
          </div>
          {solicitudes.map((s) => (
            <button key={s.codigo} type="button" className="table-row solicitud-row solicitud-row-btn" onClick={() => onAbrir(s.codigo)}>
              <strong>{s.codigo}</strong>
              <span>{s.tipo_proyecto}</span>
              <span>{fechaCorta(s.created_at)}</span>
              <span><PillEstado estado={s.estado} /></span>
              <span className="row-action" aria-hidden="true"><ArrowUpRight /></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Conversacion({ descripcion, autorInicial, creada, mensajes, verInternos = false }) {
  return (
    <div className="conversacion">
      <div className="mensaje mensaje-cliente">
        <div className="mensaje-meta">{autorInicial} · {fechaHora(creada)}</div>
        <p>{descripcion}</p>
      </div>
      {mensajes.map((m) => (
        <div
          key={m.id}
          className={`mensaje ${m.de_equipo ? "mensaje-equipo" : "mensaje-cliente"}${m.interno ? " mensaje-interno" : ""}`}
        >
          <div className="mensaje-meta">
            {m.interno && verInternos ? "Nota interna · " : ""}
            {m.de_equipo ? `Seventwo${m.autor ? ` (${m.autor})` : ""}` : autorInicial} · {fechaHora(m.created_at)}
          </div>
          <p>{m.cuerpo}</p>
        </div>
      ))}
    </div>
  );
}

function Detalle({ codigo, onVolver, onCambio }) {
  const [s, setS] = useState(null);
  const [error, setError] = useState("");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(
    () => api(`/solicitudes/mias/${encodeURIComponent(codigo)}`, { auth: true }).then((r) => setS(r.data)).catch((e) => setError(e.message)),
    [codigo],
  );
  useEffect(() => {
    let vigente = true;
    api(`/solicitudes/mias/${encodeURIComponent(codigo)}`, { auth: true })
      .then((r) => vigente && setS(r.data))
      .catch((e) => vigente && setError(e.message));
    // Si llega una notificación de esta solicitud mientras está abierta, se recarga.
    const recargar = (ev) => ev.detail?.datos?.codigo === codigo && cargar();
    window.addEventListener("seventwo:notificacion", recargar);
    return () => {
      vigente = false;
      window.removeEventListener("seventwo:notificacion", recargar);
    };
  }, [codigo, cargar]);

  async function responder(e) {
    e.preventDefault();
    if (texto.trim().length < 2) return;
    setEnviando(true);
    setError("");
    try {
      await api(`/solicitudes/mias/${encodeURIComponent(codigo)}/mensajes`, { method: "POST", auth: true, body: { cuerpo: texto } });
      setTexto("");
      await cargar();
      onCambio();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="table-panel">
      <button type="button" className="text-button solicitud-volver" onClick={onVolver}>
        <ArrowLeft aria-hidden="true" /> Mis solicitudes
      </button>
      {!s ? (
        <div className="auth-embed"><Alerta>{error}</Alerta>{!error && <p className="admin-vacio">Cargando…</p>}</div>
      ) : (
        <>
          <div className="solicitud-cabecera">
            <div>
              <h2>{s.codigo} · {s.tipo_proyecto}</h2>
              <p className="heading-description">{s.presupuesto || "Presupuesto sin indicar"} · enviada el {fechaCorta(s.created_at)}</p>
            </div>
            <PillEstado estado={s.estado} />
          </div>
          <Conversacion descripcion={s.descripcion} autorInicial="Tú" creada={s.created_at} mensajes={s.mensajes} />
          {s.estado !== "archivada" && (
            <form className="auth-embed solicitud-responder" onSubmit={responder}>
              <Alerta>{error}</Alerta>
              <textarea
                className="solicitud-textarea"
                rows={3}
                maxLength={3000}
                placeholder="Escribe tu respuesta…"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                aria-label="Tu respuesta"
              />
              <Boton type="submit" cargando={enviando} disabled={texto.trim().length < 2}>
                <Send aria-hidden="true" width={15} height={15} /> Enviar
              </Boton>
            </form>
          )}
        </>
      )}
    </div>
  );
}

export default function Solicitudes({ codigoInicial = null }) {
  const [lista, setLista] = useState([]);
  const [abierta, setAbierta] = useState(codigoInicial);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    api("/solicitudes/mias", { auth: true })
      .then((r) => vigente && setLista(r.data))
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [version]);

  const refrescar = () => setVersion((v) => v + 1);

  return (
    <section id="cotizar" aria-label="Solicitar presupuesto">
      <PageHeading
        eyebrow="Proyectos"
        title={<>Solicitar <em>presupuesto</em></>}
        description="Cuéntanos tu idea y sigue aquí la conversación con nuestro equipo."
      />
      {abierta ? (
        <Detalle codigo={abierta} onVolver={() => { setAbierta(null); refrescar(); }} onCambio={refrescar} />
      ) : (
        <div className="solicitudes-layout">
          <Formulario onCreada={refrescar} />
          <Lista solicitudes={lista} onAbrir={setAbierta} />
        </div>
      )}
    </section>
  );
}
