"use client";

// Área de cliente → Pagos (F3): estado de cuenta, cobros mes a mes, sus pagos y
// comprobantes. El cliente adjunta el comprobante de lo que pagó; el equipo lo confirma.
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, CreditCard, FileText, Upload } from "lucide-react";
import PageHeading from "./components/PageHeading";
import { api, abrirArchivo } from "@/lib/api";
import { VIAS_PAGO, dinero, erroresDe, fecha, hoyISO } from "@/lib/clientes";
import { Alerta, Boton, Campo } from "@/components/auth/ui";
import { Selector } from "@/components/clientes/FichaForm";
import { BotonAdjuntar, ElegirComprobante, PillCobro, PillPago, resumenPago } from "@/components/clientes/Cobros";
import "@/components/area-cliente/solicitudes.css";
import "@/components/clientes/clientes.css";

const VIAS_CLIENTE = Object.fromEntries(Object.entries(VIAS_PAGO).filter(([k]) => k !== "mercadopago"));

function SubirComprobante({ cobro, onHecho, onCancelar }) {
  const [via, setVia] = useState("nequi");
  const [fechaPago, setFechaPago] = useState(hoyISO());
  const [referencia, setReferencia] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState("");
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    if (!archivo) return;
    setCargando(true);
    setError("");
    setErrores({});
    try {
      const qs = new URLSearchParams({ via, fecha: fechaPago, nombre: archivo.name, ...(referencia ? { referencia } : {}) });
      const r = await api(`/cobros/mios/${encodeURIComponent(cobro.codigo)}/comprobante?${qs}`, { method: "POST", auth: true, archivo });
      onHecho(r.message);
    } catch (er) {
      setError(er.message);
      setErrores(erroresDe(er));
      setCargando(false);
    }
  };

  return (
    <form className="auth-embed auth-form contrato-subir" onSubmit={enviar} noValidate>
      <Alerta>{error}</Alerta>
      <div className="solicitud-grid">
        <Selector id={`via-${cobro.id}`} label="¿Cómo pagaste?" value={via} onChange={(e) => setVia(e.target.value)} opciones={VIAS_CLIENTE} error={errores.via} />
        <Campo id={`fecha-${cobro.id}`} label="Fecha del pago" tipo="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} error={errores.fecha_pago} />
        <Campo id={`ref-${cobro.id}`} label="Referencia o n.º de aprobación (opcional)" value={referencia} onChange={(e) => setReferencia(e.target.value)} error={errores.referencia} />
        <ElegirComprobante id={`comp-${cobro.id}`} archivo={archivo} onArchivo={setArchivo} onError={setError} />
      </div>
      <p className="heading-description" style={{ margin: 0, fontSize: 12 }}>
        Registraremos {dinero(Number(cobro.importe) - Number(cobro.pagado), cobro.moneda)} cuando confirmemos el comprobante.
      </p>
      <div className="auth-row">
        <Boton type="submit" cargando={cargando} disabled={!archivo}><Upload aria-hidden="true" width={15} height={15} /> Enviar comprobante</Boton>
        <button type="button" className="auth-text-button" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}

function FilaCobro({ c, abierto, onAbrir, onCambio, onOk, onError, mercadopago }) {
  const [subiendo, setSubiendo] = useState(false);
  const [yendo, setYendo] = useState(false);
  const pagarMp = async () => {
    setYendo(true);
    try {
      const r = await api(`/cobros/mios/${encodeURIComponent(c.codigo)}/mercadopago`, { method: "POST", auth: true });
      window.location.assign(r.data.url);
    } catch (e) {
      onError(e.message);
      setYendo(false);
    }
  };
  const porVerificar = c.pagos.some((p) => p.estado === "en_verificacion");
  const puedePagar = ["pendiente", "parcial"].includes(c.estado) && !porVerificar;

  const verComprobante = (id) => abrirArchivo(`/pagos/${id}/comprobante`).catch((e) => onError(e.message));
  const adjuntar = async (pagoId, archivo) => {
    const r = await api(`/pagos/${pagoId}/comprobante?nombre=${encodeURIComponent(archivo.name)}`, { method: "POST", auth: true, archivo });
    onOk(r.message);
    onCambio();
  };

  return (
    <div className={`cobro ${abierto ? "abierto" : ""}`}>
      <button type="button" className="cobro-fila" onClick={onAbrir} aria-expanded={abierto}>
        <span className="cobro-fecha">{fecha(c.fecha_vencimiento)}</span>
        <span className="cobro-concepto"><strong>{c.concepto}</strong><small>{c.codigo} · {c.proyecto_codigo}</small></span>
        <strong className="cobro-importe">{dinero(c.importe, c.moneda)}</strong>
        <PillCobro cobro={c} />
        <ChevronDown aria-hidden="true" className="cobro-flecha" />
      </button>
      {abierto && (
        <div className="cobro-detalle">
          {c.estado === "anulado" && <p className="heading-description">Anulado: {c.anulado_motivo}</p>}
          {c.pagos.length === 0 && c.estado !== "anulado" && <p className="heading-description">Aún no hay pagos registrados.</p>}
          {c.pagos.map((p) => (
            <div key={p.id} className="pago-linea">
              <span>{resumenPago(p)}{p.referencia ? ` · ref. ${p.referencia}` : ""}</span>
              <PillPago estado={p.estado} />
              {p.tiene_comprobante ? (
                <button type="button" className="text-button" onClick={() => verComprobante(p.id)}><FileText aria-hidden="true" /> Ver comprobante</button>
              ) : p.estado === "confirmado" ? (
                <BotonAdjuntar onSubir={(f) => adjuntar(p.id, f)} />
              ) : null}
              {p.estado === "rechazado" && p.rechazo_motivo && <small className="auth-field-error">Motivo: {p.rechazo_motivo}</small>}
            </div>
          ))}
          {porVerificar && <p className="heading-description">Estamos verificando tu comprobante. Te avisaremos al confirmarlo.</p>}
          {puedePagar && (subiendo ? (
            <SubirComprobante cobro={c} onCancelar={() => setSubiendo(false)} onHecho={(m) => { setSubiendo(false); onOk(m); onCambio(); }} />
          ) : (
            <div className="contrato-acciones">
              {mercadopago && (
                <button type="button" className="button button-primary" disabled={yendo} onClick={pagarMp}>
                  <CreditCard aria-hidden="true" /> {yendo ? "Abriendo Mercado Pago…" : "Pagar con Mercado Pago"}
                </button>
              )}
              <button type="button" className={`button ${mercadopago ? "button-outline" : "button-primary"}`} onClick={() => setSubiendo(true)}>
                <Upload aria-hidden="true" /> Ya pagué por transferencia o Nequi
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Pagos({ codigoInicial, volviendoDeMp = false }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  // Al volver de Mercado Pago el webhook puede tardar unos segundos en confirmar.
  const [ok, setOk] = useState(volviendoDeMp ? "Si completaste el pago en Mercado Pago, lo verás confirmado aquí en unos segundos." : "");
  const [abierto, setAbierto] = useState(codigoInicial ?? null);
  const [version, setVersion] = useState(0);
  const [anio, setAnio] = useState("todos");
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let vigente = true;
    api("/cobros/mios", { auth: true }).then((r) => vigente && setDatos(r.data)).catch((e) => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [version]);
  useEffect(() => {
    const fn = (ev) => /^(cobro_|pago_)/.test(ev.detail?.tipo ?? "") && recargar();
    window.addEventListener("seventwo:notificacion", fn);
    return () => window.removeEventListener("seventwo:notificacion", fn);
  }, [recargar]);

  const cobros = datos?.cobros ?? [];
  const anios = [...new Set(cobros.map((c) => String(c.fecha_vencimiento).slice(0, 4)))];
  const visibles = anio === "todos" ? cobros : cobros.filter((c) => String(c.fecha_vencimiento).startsWith(anio));
  const cuenta = datos?.cuenta;
  const pagadoAnio = visibles.reduce((s, c) => s + Number(c.pagado), 0);

  return (
    <section aria-label="Pagos">
      <PageHeading eyebrow="Gestión económica" title={<>Tus <em>pagos</em></>} description="Tus cobros mes a mes, lo que ya pagaste y sus comprobantes." />
      <div className="auth-embed"><Alerta>{error}</Alerta><Alerta tipo="ok">{ok}</Alerta></div>
      {!datos && !error && <p className="admin-vacio">Cargando…</p>}
      {datos && !cuenta && <div className="vacio-card"><strong>Aún no hay cobros</strong>Cuando tengas un servicio activo verás aquí tus pagos.</div>}
      {cuenta && (
        <>
          <div className="invoice-summary">
            <div>
              <span>Pendiente</span>
              <strong>{dinero(cuenta.pendiente)}</strong>
              {Number(cuenta.vencido) > 0 && <small className="cobro-alerta">{dinero(cuenta.vencido)} vencido</small>}
            </div>
            <div>
              <span>Próximo pago</span>
              <strong>{fecha(cuenta.proximo_vencimiento ?? cuenta.proximo_recurrente)}</strong>
              {!cuenta.proximo_vencimiento && cuenta.importe_recurrente && <small>{dinero(cuenta.importe_recurrente)}</small>}
            </div>
            <div>
              <span>Pagado {anio === "todos" ? "en total" : `en ${anio}`}</span>
              <strong>{dinero(pagadoAnio)}</strong>
              <small>{cuenta.cobros_pagados} cobros pagados</small>
            </div>
          </div>
          <div className="table-panel">
            <div className="table-toolbar">
              <h2>Cobros</h2>
              {anios.length > 1 && (
                <select className="solicitud-select" style={{ width: "auto" }} value={anio} onChange={(e) => setAnio(e.target.value)} aria-label="Filtrar por año">
                  <option value="todos">Todos los años</option>
                  {anios.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              )}
            </div>
            {visibles.map((c) => (
              <FilaCobro
                key={c.id}
                c={c}
                abierto={abierto === c.codigo}
                onAbrir={() => setAbierto(abierto === c.codigo ? null : c.codigo)}
                onCambio={recargar}
                mercadopago={datos.mercadopago}
                onOk={(m) => { setError(""); setOk(m); }}
                onError={(m) => { setOk(""); setError(m); }}
              />
            ))}
            {visibles.length === 0 && <p className="admin-vacio">No hay cobros.</p>}
          </div>
        </>
      )}
    </section>
  );
}
