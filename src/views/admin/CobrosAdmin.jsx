"use client";

// /admin → proyecto → Cobros y pagos (F3): mensualidades generadas, cobros
// manuales, registrar pagos (uno o varios a la vez, p. ej. el historial),
// verificar comprobantes y adjuntar fotos a pagos ya registrados.
import { useState } from "react";
import { Check, FileText, Plus, RefreshCw, X } from "lucide-react";
import { api, abrirArchivo } from "@/lib/api";
import { VIAS_PAGO, dinero, erroresDe, fecha, hoyISO } from "@/lib/clientes";
import { Alerta, Boton, Campo } from "@/components/auth/ui";
import { Selector } from "@/components/clientes/FichaForm";
import { BotonAdjuntar, LecturaIA, PillCobro, PillPago, resumenPago } from "@/components/clientes/Cobros";

function NuevoCobro({ proyectoId, onHecho, onCancelar }) {
  const [f, setF] = useState({ concepto: "", importe: "", fecha_vencimiento: hoyISO() });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const guardar = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      onHecho((await api(`/admin/proyectos/${proyectoId}/cobros`, { method: "POST", auth: true, body: f })).message);
    } catch (er) {
      setError(er.message);
      setErrores(erroresDe(er));
      setCargando(false);
    }
  };
  return (
    <form className="auth-embed auth-form contrato-subir" onSubmit={guardar} noValidate>
      <Alerta>{error}</Alerta>
      <div className="solicitud-grid">
        <Campo id="nc-concepto" label="Concepto" value={f.concepto} onChange={set("concepto")} error={errores.concepto} placeholder="Ej.: Módulo de reservas" />
        <Campo id="nc-importe" label="Valor" tipo="number" min={0} value={f.importe} onChange={set("importe")} error={errores.importe} ayuda={f.importe ? dinero(f.importe) : undefined} />
        <Campo id="nc-fecha" label="Fecha de pago" tipo="date" value={f.fecha_vencimiento} onChange={set("fecha_vencimiento")} error={errores.fecha_vencimiento} />
      </div>
      <div className="auth-row">
        <Boton type="submit" cargando={cargando} disabled={f.concepto.trim().length < 3 || !f.importe}>Crear cobro</Boton>
        <button type="button" className="auth-text-button" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}

function RegistrarPago({ cobro, onHecho, onCancelar }) {
  const pendiente = Number(cobro.importe) - Number(cobro.pagado);
  const [f, setF] = useState({ fecha_pago: hoyISO(), via: "nequi", importe: String(pendiente), referencia: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const guardar = async () => {
    setCargando(true);
    setError("");
    try {
      onHecho((await api(`/admin/cobros/${cobro.id}/pagos`, { method: "POST", auth: true, body: { ...f, referencia: f.referencia || null } })).message);
    } catch (er) {
      setError(er.message);
      setCargando(false);
    }
  };
  return (
    <div className="auth-embed contrato-subir">
      <Alerta>{error}</Alerta>
      <div className="solicitud-grid">
        <Campo id={`rp-f-${cobro.id}`} label="Fecha del pago" tipo="date" value={f.fecha_pago} onChange={set("fecha_pago")} />
        <Selector id={`rp-v-${cobro.id}`} label="Medio" value={f.via} onChange={set("via")} opciones={VIAS_PAGO} />
        <Campo id={`rp-i-${cobro.id}`} label="Valor" tipo="number" min={0} value={f.importe} onChange={set("importe")} ayuda={`Pendiente: ${dinero(pendiente, cobro.moneda)}`} />
        <Campo id={`rp-r-${cobro.id}`} label="Referencia (opcional)" value={f.referencia} onChange={set("referencia")} />
      </div>
      <div className="auth-row">
        <Boton type="button" cargando={cargando} onClick={guardar}>Registrar pago</Boton>
        <button type="button" className="auth-text-button" onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  );
}

/** Confirmar / rechazar un comprobante subido por el cliente (también en /admin → Pagos). */
export function VerificarPago({ pago, onHecho, onError }) {
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [cargando, setCargando] = useState(false);
  const accion = async (ruta, body) => {
    setCargando(true);
    try {
      onHecho((await api(ruta, { method: "POST", auth: true, body })).message);
    } catch (e) {
      onError(e.message);
      setCargando(false);
    }
  };
  if (rechazando) {
    return (
      <span className="verificar">
        <input className="solicitud-select" style={{ height: 34 }} placeholder="Motivo (lo verá el cliente)" value={motivo} onChange={(e) => setMotivo(e.target.value)} aria-label="Motivo del rechazo" />
        <button type="button" className="text-button" disabled={cargando || motivo.trim().length < 3} onClick={() => accion(`/admin/pagos/${pago.id}/rechazar`, { motivo })}>Rechazar</button>
        <button type="button" className="text-button" onClick={() => setRechazando(false)}>Cancelar</button>
      </span>
    );
  }
  return (
    <span className="verificar">
      <button type="button" className="text-button" disabled={cargando} onClick={() => accion(`/admin/pagos/${pago.id}/confirmar`, {})}><Check aria-hidden="true" /> Confirmar</button>
      <button type="button" className="text-button" disabled={cargando} onClick={() => setRechazando(true)}><X aria-hidden="true" /> Rechazar</button>
    </span>
  );
}

export default function CobrosAdmin({ proyecto, onCambio }) {
  const cobros = proyecto.cobros ?? [];
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");
  const [nuevo, setNuevo] = useState(false);
  const [pagando, setPagando] = useState(null);
  const [marcados, setMarcados] = useState([]);
  const [lote, setLote] = useState({ via: "nequi", fecha: "vencimiento" });
  const [cargando, setCargando] = useState(false);

  const hecho = (m) => { setError(""); setOk(m); setNuevo(false); setPagando(null); setMarcados([]); onCambio(); };
  const fallo = (m) => { setOk(""); setError(m); };
  const abiertos = cobros.filter((c) => ["pendiente", "parcial"].includes(c.estado) && !c.pagos.some((p) => p.estado === "en_verificacion"));
  const marcar = (id) => setMarcados((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  const recurrente = proyecto.modelo_cobro === "recurrente";

  const pagarLote = async () => {
    setCargando(true);
    try {
      hecho((await api("/admin/cobros/pagar-lote", { method: "POST", auth: true, body: { cobro_ids: marcados.map(Number), via: lote.via, fecha: lote.fecha } })).message);
    } catch (e) {
      fallo(e.message);
    } finally {
      setCargando(false);
    }
  };
  const generar = async () => {
    try { hecho((await api(`/admin/proyectos/${proyecto.id}/cobros/generar`, { method: "POST", auth: true })).message); } catch (e) { fallo(e.message); }
  };
  const anular = async (c) => {
    const motivo = window.prompt(`Motivo para anular ${c.codigo} (lo verá el cliente):`);
    if (!motivo) return;
    try { hecho((await api(`/admin/cobros/${c.id}/anular`, { method: "POST", auth: true, body: { motivo } })).message); } catch (e) { fallo(e.message); }
  };
  const adjuntar = async (pagoId, archivo) => {
    const r = await api(`/admin/pagos/${pagoId}/comprobante?nombre=${encodeURIComponent(archivo.name)}`, { method: "POST", auth: true, archivo });
    hecho(r.message);
  };
  const ver = (id) => abrirArchivo(`/admin/pagos/${id}/comprobante`).catch((e) => fallo(e.message));

  return (
    <div className="contratos">
      <div className="auth-embed"><Alerta tipo="ok">{ok}</Alerta><Alerta>{error}</Alerta></div>
      {recurrente && (
        <p className="heading-description" style={{ margin: 0 }}>
          {proyecto.importe_periodo ? `${dinero(proyecto.importe_periodo, proyecto.moneda)} ${proyecto.periodicidad ?? ""}` : "Sin importe por periodo"}
          {proyecto.proximo_cobro ? ` · próximo cobro ${fecha(proyecto.proximo_cobro)}` : " · sin fecha de próximo cobro"}
          {` · recordatorio ${proyecto.recordatorio_dias ?? 3} día(s) antes`}
        </p>
      )}

      {abiertos.length > 0 && (
        <div className="lote">
          <strong>{marcados.length ? `${marcados.length} cobro(s) marcados` : "Marca cobros para registrarlos como pagados de una vez"}</strong>
          <select className="solicitud-select" value={lote.via} onChange={(e) => setLote((x) => ({ ...x, via: e.target.value }))} aria-label="Medio de pago del lote">
            {Object.entries(VIAS_PAGO).map(([k, t]) => <option key={k} value={k}>{t}</option>)}
          </select>
          <select className="solicitud-select" value={lote.fecha} onChange={(e) => setLote((x) => ({ ...x, fecha: e.target.value }))} aria-label="Fecha del pago del lote">
            <option value="vencimiento">Pagado en su fecha de cobro</option>
            <option value={hoyISO()}>Pagado hoy</option>
          </select>
          <button type="button" className="text-button" onClick={() => setMarcados(marcados.length === abiertos.length ? [] : abiertos.map((c) => c.id))}>
            {marcados.length === abiertos.length ? "Quitar todos" : "Marcar todos"}
          </button>
          <Boton type="button" cargando={cargando} disabled={!marcados.length} onClick={pagarLote}>Registrar como pagados</Boton>
        </div>
      )}

      {cobros.length === 0 && <p className="admin-vacio">Aún no hay cobros{recurrente ? "; se generan solos según el próximo cobro" : ""}.</p>}
      {cobros.map((c) => {
        const abierto = abiertos.includes(c);
        return (
          <div key={c.id} className={`contrato-card ${c.estado === "anulado" ? "apagado" : ""}`}>
            <div className="contrato-cabecera">
              <label className="cobro-check">
                {abierto && <input type="checkbox" checked={marcados.includes(c.id)} onChange={() => marcar(c.id)} aria-label={`Marcar ${c.codigo}`} />}
                <span>
                  <strong>{fecha(c.fecha_vencimiento)} · {dinero(c.importe, c.moneda)}</strong>
                  <small>{c.codigo} · {c.concepto}{Number(c.pagado) > 0 && c.estado !== "pagado" ? ` · pagado ${dinero(c.pagado, c.moneda)}` : ""}</small>
                </span>
              </label>
              <PillCobro cobro={c} />
            </div>
            {c.pagos.map((p) => (
              <div key={p.id} className="pago-linea">
                <span>{resumenPago(p)}{p.referencia ? ` · ref. ${p.referencia}` : ""}{p.registrado_por_nombre ? ` · ${p.registrado_por_nombre}` : ""}</span>
                <PillPago estado={p.estado} />
                {p.tiene_comprobante && <button type="button" className="text-button" onClick={() => ver(p.id)}><FileText aria-hidden="true" /> Comprobante</button>}
                {p.estado !== "rechazado" && <BotonAdjuntar onSubir={(f) => adjuntar(p.id, f)} texto={p.tiene_comprobante ? "Reemplazar foto" : "Adjuntar foto"} />}
                {p.estado === "en_verificacion" && <VerificarPago pago={p} onHecho={hecho} onError={fallo} />}
                {p.estado === "rechazado" && <small className="auth-field-error">{p.rechazo_motivo}</small>}
                {p.estado === "en_verificacion" && <LecturaIA lectura={p.lectura_ia} />}
              </div>
            ))}
            {c.estado === "anulado" && <small className="heading-description">Anulado: {c.anulado_motivo}</small>}
            {abierto && pagando !== c.id && (
              <div className="contrato-acciones">
                <button type="button" className="text-button" onClick={() => setPagando(c.id)}><Plus aria-hidden="true" /> Registrar pago</button>
                {Number(c.pagado) === 0 && <button type="button" className="text-button" onClick={() => anular(c)}><X aria-hidden="true" /> Anular</button>}
              </div>
            )}
            {pagando === c.id && <RegistrarPago cobro={c} onHecho={hecho} onCancelar={() => setPagando(null)} />}
          </div>
        );
      })}

      {nuevo ? (
        <NuevoCobro proyectoId={proyecto.id} onHecho={hecho} onCancelar={() => setNuevo(false)} />
      ) : (
        <div className="contrato-acciones" style={{ marginTop: 6 }}>
          <button type="button" className="button button-outline" onClick={() => { setOk(""); setNuevo(true); }}><Plus aria-hidden="true" /> Nuevo cobro</button>
          {recurrente && <button type="button" className="button button-outline" onClick={generar}><RefreshCw aria-hidden="true" /> Generar mensualidades pendientes</button>}
        </div>
      )}
    </div>
  );
}
