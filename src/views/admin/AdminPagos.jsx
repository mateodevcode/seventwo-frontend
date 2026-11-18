"use client";

// /admin → Pagos (F3): comprobantes por verificar, cobros abiertos (vencidos
// primero) y lo cobrado en el mes. Cada fila lleva al proyecto del cliente.
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, FileText } from "lucide-react";
import PageHeading from "@/views/area-cliente/components/PageHeading";
import { api, abrirArchivo } from "@/lib/api";
import { VIAS_PAGO, dinero, fecha } from "@/lib/clientes";
import { Alerta } from "@/components/auth/ui";
import { LecturaIA, PillCobro } from "@/components/clientes/Cobros";
import { VerificarPago } from "./CobrosAdmin";
import "@/components/clientes/clientes.css";

export default function AdminPagos({ onAbrirProyecto }) {
  const [d, setD] = useState(null);
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let vigente = true;
    api("/admin/cobros", { auth: true }).then((r) => vigente && setD(r.data)).catch((e) => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [version]);
  useEffect(() => {
    const fn = (ev) => /^(pago_|cobro_)/.test(ev.detail?.tipo ?? "") && recargar();
    window.addEventListener("seventwo:notificacion", fn);
    return () => window.removeEventListener("seventwo:notificacion", fn);
  }, [recargar]);

  const vencidos = d?.abiertos.filter((c) => c.vencido) ?? [];
  const pendiente = (d?.abiertos ?? []).reduce((s, c) => s + Number(c.importe) - Number(c.pagado), 0);

  return (
    <section aria-label="Pagos">
      <PageHeading eyebrow="Administración" title={<>Cobros y <em>pagos</em></>} description="Comprobantes por verificar y cobros pendientes de todos los clientes." />
      <div className="auth-embed"><Alerta>{error}</Alerta><Alerta tipo="ok">{ok}</Alerta></div>
      {d && (
        <>
          <div className="invoice-summary">
            <div><span>Por verificar</span><strong>{d.verificar.length}</strong></div>
            <div><span>Pendiente de cobro</span><strong>{dinero(pendiente)}</strong>{vencidos.length > 0 && <small className="cobro-alerta">{vencidos.length} vencido(s)</small>}</div>
            <div><span>Cobrado este mes</span><strong>{dinero(d.cobrado_mes)}</strong></div>
          </div>

          <div className="table-panel">
            <div className="table-toolbar"><h2>Comprobantes por verificar</h2></div>
            {d.verificar.length === 0 && <p className="admin-vacio">No hay comprobantes pendientes de revisar.</p>}
            {d.verificar.map((p) => (
              <div key={p.id} className="contrato-card" style={{ marginTop: 10 }}>
                <div className="contrato-cabecera">
                  <div>
                    <strong>{p.cliente} · {dinero(p.importe, p.moneda)}</strong>
                    <small>{p.cobro_codigo} · {p.concepto} · {VIAS_PAGO[p.via]} · {fecha(p.fecha_pago)}{p.referencia ? ` · ref. ${p.referencia}` : ""}</small>
                  </div>
                  <button type="button" className="text-button" onClick={() => onAbrirProyecto(p.cliente_id, p.proyecto_id)}>{p.proyecto_codigo} <ArrowUpRight aria-hidden="true" /></button>
                </div>
                <div className="contrato-acciones">
                  {p.tiene_comprobante && (
                    <button type="button" className="text-button" onClick={() => abrirArchivo(`/admin/pagos/${p.id}/comprobante`).catch((e) => setError(e.message))}>
                      <FileText aria-hidden="true" /> Ver comprobante
                    </button>
                  )}
                  <VerificarPago pago={p} onHecho={(m) => { setError(""); setOk(m); recargar(); }} onError={(m) => { setOk(""); setError(m); }} />
                </div>
                <LecturaIA lectura={p.lectura_ia} />
              </div>
            ))}
          </div>

          <div className="table-panel" style={{ marginTop: 18 }}>
            <div className="table-toolbar"><h2>Cobros pendientes</h2></div>
            {d.abiertos.length === 0 && <p className="admin-vacio">Todo al día.</p>}
            {d.abiertos.map((c) => (
              <button key={c.id} type="button" className="cobro-fila" onClick={() => onAbrirProyecto(c.cliente_id, c.proyecto_id)}>
                <span className="cobro-fecha">{fecha(c.fecha_vencimiento)}</span>
                <span className="cobro-concepto"><strong>{c.cliente}</strong><small>{c.codigo} · {c.concepto}</small></span>
                <strong className="cobro-importe">{dinero(Number(c.importe) - Number(c.pagado), c.moneda)}</strong>
                <PillCobro cobro={c} />
                <ArrowUpRight aria-hidden="true" className="cobro-flecha" />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
