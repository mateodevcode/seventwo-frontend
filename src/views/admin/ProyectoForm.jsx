"use client";

// Formulario de proyecto del equipo: alta, edición y "Convertir en proyecto".
// Elegir un servicio del catálogo rellena modelo, precio, periodicidad y lo que incluye.
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Alerta, Boton, Campo } from "@/components/auth/ui";
import { Selector } from "@/components/clientes/FichaForm";
import {
  ESTADOS_HITO,
  ESTADOS_PROYECTO,
  MODELOS_COBRO,
  PERIODICIDADES,
  TIPOS_PROYECTO,
  dinero,
  erroresDe,
} from "@/lib/clientes";

const vacioHito = () => ({ nombre: "", fecha_prevista: "", porcentaje_cobro: "", estado: "pendiente" });

function inicial(v) {
  return {
    nombre: v?.nombre ?? "",
    tipo_proyecto: v?.tipo_proyecto ?? "",
    servicio_id: v?.servicio_id ?? "",
    modelo_cobro: v?.modelo_cobro ?? "unico",
    valor_total: v?.valor_total ?? "",
    moneda: v?.moneda ?? "COP",
    importe_periodo: v?.importe_periodo ?? "",
    periodicidad: v?.periodicidad ?? "",
    proximo_cobro: v?.proximo_cobro ?? "",
    horas_contratadas: v?.horas_contratadas ?? "",
    precio_hora: v?.precio_hora ?? "",
    estado: v?.estado ?? "en_curso",
    fecha_inicio: v?.fecha_inicio ?? new Date().toISOString().slice(0, 10),
    fecha_entrega_estimada: v?.fecha_entrega_estimada ?? "",
    fecha_entrega: v?.fecha_entrega ?? "",
    progreso: v?.progreso ?? 0,
    responsable_id: v?.responsable_id ?? "",
    descripcion: v?.descripcion ?? "",
    incluye: v?.incluye?.length ? [...v.incluye] : [],
    hitos: v?.hitos?.map((h) => ({ ...h, fecha_prevista: h.fecha_prevista ?? "", porcentaje_cobro: h.porcentaje_cobro ?? "" })) ?? [],
  };
}

const nulo = (x) => (x === "" || x === undefined ? null : x);

export default function ProyectoForm({ valores, equipo = [], servicios = [], onGuardar, onCancelar, textoGuardar = "Guardar proyecto", edicion = false, children }) {
  const [f, setF] = useState(() => inicial(valores));
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const err = (k) => errores[k];

  const elegirServicio = (e) => {
    const id = e.target.value;
    const s = servicios.find((x) => String(x.id) === id);
    setF((x) => ({
      ...x,
      servicio_id: id,
      ...(s && {
        modelo_cobro: s.modelo_cobro,
        moneda: s.moneda,
        tipo_proyecto: x.tipo_proyecto || s.tipo_proyecto || "",
        nombre: x.nombre || s.nombre,
        incluye: s.incluye?.length ? [...s.incluye] : x.incluye,
        ...(s.modelo_cobro === "recurrente"
          ? { importe_periodo: s.precio_base ?? "", periodicidad: s.periodicidad ?? "mensual" }
          : s.modelo_cobro === "horas" ? { precio_hora: s.precio_base ?? "" } : { valor_total: s.precio_base ?? "" }),
      }),
    }));
  };

  const setHito = (i, k, val) => setF((x) => ({ ...x, hitos: x.hitos.map((h, j) => (j === i ? { ...h, [k]: val } : h)) }));
  const setIncluye = (i, val) => setF((x) => ({ ...x, incluye: x.incluye.map((t, j) => (j === i ? val : t)) }));
  const pct = f.hitos.reduce((s, h) => s + (Number(h.porcentaje_cobro) || 0), 0);

  const guardar = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    setErrores({});
    const body = {
      nombre: f.nombre,
      tipo_proyecto: nulo(f.tipo_proyecto),
      servicio_id: f.servicio_id ? Number(f.servicio_id) : null,
      modelo_cobro: f.modelo_cobro,
      moneda: f.moneda,
      valor_total: nulo(f.valor_total),
      importe_periodo: nulo(f.importe_periodo),
      periodicidad: nulo(f.periodicidad),
      proximo_cobro: nulo(f.proximo_cobro),
      horas_contratadas: nulo(f.horas_contratadas),
      precio_hora: nulo(f.precio_hora),
      estado: f.estado,
      fecha_inicio: nulo(f.fecha_inicio),
      fecha_entrega_estimada: nulo(f.fecha_entrega_estimada),
      progreso: Number(f.progreso) || 0,
      responsable_id: f.responsable_id ? Number(f.responsable_id) : null,
      descripcion: nulo(f.descripcion),
      incluye: f.incluye.filter((t) => t.trim()),
      hitos: f.hitos
        .filter((h) => h.nombre.trim())
        .map((h) => ({
          ...(h.id ? { id: Number(h.id) } : {}),
          nombre: h.nombre,
          descripcion: nulo(h.descripcion),
          fecha_prevista: nulo(h.fecha_prevista),
          estado: h.estado,
          porcentaje_cobro: nulo(h.porcentaje_cobro),
          importe: nulo(h.importe),
        })),
    };
    if (edicion) body.fecha_entrega = nulo(f.fecha_entrega);
    try {
      await onGuardar(body);
    } catch (er) {
      setError(er.message);
      setErrores(erroresDe(er));
    } finally {
      setCargando(false);
    }
  };

  const recurrente = f.modelo_cobro === "recurrente";
  const horas = f.modelo_cobro === "horas";
  const errHitos = Object.entries(errores).filter(([k]) => k.startsWith("hitos")).map(([, v]) => v);

  return (
    <form className="auth-embed auth-form ficha-form" onSubmit={guardar} noValidate>
      <Alerta>{error}</Alerta>
      {children}

      <p className="eyebrow ficha-sub">Proyecto</p>
      <div className="solicitud-grid">
        <Campo id="p-nombre" label="Nombre del proyecto" value={f.nombre} onChange={set("nombre")} error={err("nombre")} required />
        {servicios.length > 0 && (
          <Selector id="p-servicio" label="Servicio del catálogo" value={String(f.servicio_id ?? "")} onChange={elegirServicio}
            opciones={Object.fromEntries(servicios.map((s) => [String(s.id), `${s.nombre}${s.precio_base != null ? ` · ${dinero(s.precio_base, s.moneda)}` : ""}`]))}
            vacio="Sin servicio (a medida)" error={err("servicio_id")} />
        )}
        <Selector id="p-tipo" label="Tipo de proyecto" value={f.tipo_proyecto} onChange={set("tipo_proyecto")}
          opciones={Object.fromEntries([...new Set([...TIPOS_PROYECTO, ...(f.tipo_proyecto ? [f.tipo_proyecto] : [])])].map((t) => [t, t]))}
          vacio="Sin indicar" error={err("tipo_proyecto")} />
        <Selector id="p-estado" label="Estado" value={f.estado} onChange={set("estado")} opciones={ESTADOS_PROYECTO} error={err("estado")} />
        <Selector id="p-resp" label="Responsable" value={String(f.responsable_id ?? "")} onChange={set("responsable_id")}
          opciones={Object.fromEntries(equipo.map((m) => [String(m.id), m.name]))} vacio="Sin asignar" error={err("responsable_id")} />
        <Campo id="p-progreso" label="Progreso (%)" tipo="number" min={0} max={100} value={f.progreso} onChange={set("progreso")} error={err("progreso")} />
        <Campo id="p-inicio" label="Fecha de inicio" tipo="date" value={f.fecha_inicio} onChange={set("fecha_inicio")} error={err("fecha_inicio")} />
        <Campo id="p-entrega-est" label="Entrega prevista" tipo="date" value={f.fecha_entrega_estimada} onChange={set("fecha_entrega_estimada")} error={err("fecha_entrega_estimada")} />
        {edicion && <Campo id="p-entrega" label="Fecha de entrega real" tipo="date" value={f.fecha_entrega} onChange={set("fecha_entrega")} error={err("fecha_entrega")} />}
      </div>

      <p className="eyebrow ficha-sub">Precio y modelo de cobro</p>
      <div className="solicitud-grid">
        <Selector id="p-modelo" label="Modelo de cobro" value={f.modelo_cobro} onChange={set("modelo_cobro")} opciones={MODELOS_COBRO} error={err("modelo_cobro")} />
        <Selector id="p-moneda" label="Moneda" value={f.moneda} onChange={set("moneda")} opciones={{ COP: "COP (pesos)", USD: "USD (dólares)" }} error={err("moneda")} />
        {recurrente ? (
          <>
            <Campo id="p-importe" label="Importe por periodo" tipo="number" min={0} step="1" value={f.importe_periodo} onChange={set("importe_periodo")} error={err("importe_periodo")}
              ayuda={f.importe_periodo ? dinero(f.importe_periodo, f.moneda) : undefined} />
            <Selector id="p-periodo" label="Periodicidad" value={f.periodicidad} onChange={set("periodicidad")} opciones={PERIODICIDADES} vacio="Elegir…" error={err("periodicidad")} />
            <Campo id="p-proximo" label="Próximo cobro" tipo="date" value={f.proximo_cobro} onChange={set("proximo_cobro")} error={err("proximo_cobro")} />
          </>
        ) : horas ? (
          <>
            <Campo id="p-horas" label="Horas contratadas" tipo="number" min={0} value={f.horas_contratadas} onChange={set("horas_contratadas")} error={err("horas_contratadas")} />
            <Campo id="p-precio-hora" label="Precio por hora" tipo="number" min={0} value={f.precio_hora} onChange={set("precio_hora")} error={err("precio_hora")}
              ayuda={f.precio_hora ? dinero(f.precio_hora, f.moneda) : undefined} />
          </>
        ) : (
          <Campo id="p-valor" label="Valor total" tipo="number" min={0} step="1" value={f.valor_total} onChange={set("valor_total")} error={err("valor_total")}
            ayuda={f.valor_total ? dinero(f.valor_total, f.moneda) : undefined} />
        )}
      </div>

      <p className="eyebrow ficha-sub">Hitos {f.hitos.length > 0 && <span style={{ color: pct > 100 ? "#ff6b81" : undefined }}>· {pct}% del cobro</span>}</p>
      <div className="hitos-editor">
        {f.hitos.map((h, i) => (
          <div className="hito-edit" key={h.id ?? `n${i}`}>
            <Campo id={`h-nombre-${i}`} label={`Hito ${i + 1}`} value={h.nombre} onChange={(e) => setHito(i, "nombre", e.target.value)} error={err(`hitos.${i}.nombre`)} />
            <Campo id={`h-fecha-${i}`} label="Fecha prevista" tipo="date" value={h.fecha_prevista} onChange={(e) => setHito(i, "fecha_prevista", e.target.value)} />
            <Campo id={`h-pct-${i}`} label="% cobro" tipo="number" min={0} max={100} value={h.porcentaje_cobro} onChange={(e) => setHito(i, "porcentaje_cobro", e.target.value)} />
            <Selector id={`h-estado-${i}`} label="Estado" value={h.estado} onChange={(e) => setHito(i, "estado", e.target.value)} opciones={ESTADOS_HITO} />
            <button type="button" className="icon-button" aria-label={`Quitar hito ${i + 1}`} onClick={() => setF((x) => ({ ...x, hitos: x.hitos.filter((_, j) => j !== i) }))}>
              <X aria-hidden="true" />
            </button>
          </div>
        ))}
        {errHitos.length > 0 && <p className="auth-field-error">{errHitos[0]}</p>}
        <button type="button" className="text-button" onClick={() => setF((x) => ({ ...x, hitos: [...x.hitos, vacioHito()] }))}>
          <Plus aria-hidden="true" /> Añadir hito
        </button>
      </div>

      <p className="eyebrow ficha-sub">Lo que incluye</p>
      <div className="incluye-editor">
        {f.incluye.map((t, i) => (
          <div className="incluye-fila" key={i}>
            <Campo id={`inc-${i}`} label={`Elemento ${i + 1}`} value={t} onChange={(e) => setIncluye(i, e.target.value)} />
            <button type="button" className="icon-button" aria-label={`Quitar elemento ${i + 1}`} onClick={() => setF((x) => ({ ...x, incluye: x.incluye.filter((_, j) => j !== i) }))}>
              <X aria-hidden="true" />
            </button>
          </div>
        ))}
        {err("incluye") && <p className="auth-field-error">{err("incluye")}</p>}
        <button type="button" className="text-button" onClick={() => setF((x) => ({ ...x, incluye: [...x.incluye, ""] }))}>
          <Plus aria-hidden="true" /> Añadir elemento
        </button>
      </div>

      <div className="auth-field">
        <label htmlFor="p-desc">Descripción (la ve el cliente)</label>
        <textarea id="p-desc" className="solicitud-textarea" rows={4} maxLength={5000} value={f.descripcion} onChange={set("descripcion")} />
      </div>

      <div className="auth-row">
        <Boton type="submit" cargando={cargando} disabled={f.nombre.trim().length < 2}>{textoGuardar}</Boton>
        {onCancelar && <button type="button" className="auth-text-button" onClick={onCancelar}>Cancelar</button>}
      </div>
    </form>
  );
}
