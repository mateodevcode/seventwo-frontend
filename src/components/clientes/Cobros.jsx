"use client";

// Piezas compartidas de cobros y pagos (área de cliente y /admin).
import { useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import { ESTADOS_COBRO, ESTADOS_PAGO, TIPOS_COMPROBANTE, VIAS_PAGO, dinero, fecha, tamano } from "@/lib/clientes";

export function PillCobro({ cobro }) {
  const estado = cobro.vencido ? "vencido" : cobro.estado;
  return <span className={`pill cobro-${estado}`}>{ESTADOS_COBRO[estado]}</span>;
}

export const PillPago = ({ estado }) => <span className={`pill pago-${estado}`}>{ESTADOS_PAGO[estado]}</span>;

/** "Nequi · 16 nov 2026 · $ 54.000" */
export const resumenPago = (p) => `${VIAS_PAGO[p.via] ?? p.via} · ${fecha(p.fecha_pago)} · ${dinero(p.importe, p.moneda)}`;

const MARCA = { coincide: "✓", nueva: "✓", distinto: "⚠", fuera_de_rango: "⚠", ya_usada: "✗ ya usada", sin_dato: "?" };

/** Lo que leyó la IA del comprobante, contrastado con el cobro (solo equipo). */
export function LecturaIA({ lectura }) {
  if (!lectura) return null;
  const c = lectura.contraste ?? {};
  return (
    <div className="lectura-ia">
      <strong>Lectura automática · confianza {lectura.confianza}</strong>
      {!lectura.es_comprobante && <span className="auth-field-error">No parece un comprobante de pago.</span>}
      <span className={`li-${c.importe}`}>Valor: {lectura.importe != null ? dinero(lectura.importe, lectura.moneda ?? "COP") : "—"} {MARCA[c.importe]}</span>
      <span className={`li-${c.fecha}`}>Fecha: {lectura.fecha ? fecha(lectura.fecha) : "—"} {MARCA[c.fecha]}</span>
      <span className={`li-${c.referencia}`}>Ref.: {lectura.referencia ?? "—"} {MARCA[c.referencia]}</span>
      {lectura.entidad && <span>Entidad: {lectura.entidad}</span>}
      {(lectura.pagador || lectura.destinatario) && <span>{lectura.pagador ?? "?"} → {lectura.destinatario ?? "?"}</span>}
    </div>
  );
}

/** Selector de archivo para comprobantes (imagen o PDF ≤ 5 MB) con validación local. */
export function ElegirComprobante({ id, archivo, onArchivo, onError }) {
  const input = useRef(null);
  const elegir = (e) => {
    const f = e.target.files?.[0] ?? null;
    if (f && !TIPOS_COMPROBANTE.includes(f.type)) { onError("El comprobante debe ser una foto (JPG, PNG, WEBP) o un PDF."); e.target.value = ""; return; }
    if (f && f.size > 5 * 1024 * 1024) { onError("El comprobante supera los 5 MB."); e.target.value = ""; return; }
    onError("");
    onArchivo(f);
  };
  return (
    <div className="auth-field">
      <label htmlFor={id}>Foto o PDF del comprobante (máx. 5 MB)</label>
      <input id={id} ref={input} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" capture="environment" onChange={elegir} className="contrato-file" />
      {archivo && <p className="auth-field-help">{archivo.name} · {tamano(archivo.size)}</p>}
    </div>
  );
}

/** Botón compacto "Adjuntar foto" que sube al instante. */
export function BotonAdjuntar({ onSubir, texto = "Adjuntar foto" }) {
  const input = useRef(null);
  const [estado, setEstado] = useState("");
  const elegir = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!TIPOS_COMPROBANTE.includes(f.type)) return setEstado("Solo JPG, PNG, WEBP o PDF.");
    if (f.size > 5 * 1024 * 1024) return setEstado("Máximo 5 MB.");
    setEstado("Subiendo…");
    try {
      await onSubir(f);
      setEstado("");
    } catch (er) {
      setEstado(er.message);
    }
  };
  return (
    <span className="adjuntar">
      <button type="button" className="text-button" onClick={() => input.current?.click()} disabled={estado === "Subiendo…"}>
        <Paperclip aria-hidden="true" /> {estado === "Subiendo…" ? "Subiendo…" : texto}
      </button>
      <input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp,application/pdf" onChange={elegir} />
      {estado && estado !== "Subiendo…" && <small className="auth-field-error">{estado}</small>}
    </span>
  );
}
