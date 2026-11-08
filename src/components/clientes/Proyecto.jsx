// Piezas de presentación de proyectos (área de cliente y /admin).
import { Check } from "lucide-react";
import { ESTADOS_CLIENTE, ESTADOS_HITO, ESTADOS_PROYECTO, MODELOS_COBRO, dinero, fecha, valorProyecto } from "@/lib/clientes";
import { haceCuanto } from "@/lib/solicitudes";

export const PillProyecto = ({ estado }) => (
  <span className={`pill proy-${estado}`}>{ESTADOS_PROYECTO[estado] ?? estado}</span>
);

export const PillCliente = ({ estado }) => (
  <span className={`pill cli-${estado}`}>{ESTADOS_CLIENTE[estado] ?? estado}</span>
);

export function Progreso({ valor = 0 }) {
  const v = Math.max(0, Math.min(100, Number(valor) || 0));
  return (
    <div className="progreso" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso">
      <div className="progreso-barra"><div style={{ width: `${v}%` }} /></div>
      <span>{v}%</span>
    </div>
  );
}

export function Hitos({ hitos, moneda }) {
  if (!hitos?.length) return <p className="admin-vacio">Sin hitos definidos.</p>;
  return (
    <ol className="hitos">
      {hitos.map((h) => (
        <li key={h.id} className={`hito ${h.estado}`}>
          <span className="hito-marca" aria-label={ESTADOS_HITO[h.estado]}>{h.estado === "completado" && <Check aria-hidden="true" />}</span>
          <div>
            <strong>{h.nombre}</strong>
            {h.descripcion && <small>{h.descripcion}</small>}
            <small>
              {h.estado === "completado" ? `Completado ${fecha(h.fecha_completado)}` : h.fecha_prevista ? `Previsto ${fecha(h.fecha_prevista)}` : ESTADOS_HITO[h.estado]}
            </small>
          </div>
          <div className="hito-lado">
            {h.porcentaje_cobro != null && <div>{Number(h.porcentaje_cobro)} %</div>}
            {h.importe != null && <div>{dinero(h.importe, moneda)}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Datos clave del proyecto en 4 casillas. */
export function MetaProyecto({ p }) {
  return (
    <div className="proyecto-meta">
      <div><span>Modelo</span><strong>{MODELOS_COBRO[p.modelo_cobro]}</strong></div>
      <div><span>Valor</span><strong>{valorProyecto(p)}</strong></div>
      <div><span>Inicio</span><strong>{fecha(p.fecha_inicio)}</strong></div>
      <div>
        <span>{p.fecha_entrega ? "Entregado" : "Entrega prevista"}</span>
        <strong>{fecha(p.fecha_entrega ?? p.fecha_entrega_estimada)}</strong>
      </div>
    </div>
  );
}

export function ListaActividad({ items, verAutor = false }) {
  if (!items?.length) return <p className="admin-vacio">Todavía no hay movimientos.</p>;
  return (
    <ul className="actividad-lista">
      {items.map((a) => (
        <li key={a.id}>
          <time dateTime={a.created_at} title={new Date(a.created_at).toLocaleString("es-CO")}>{haceCuanto(a.created_at)}</time>
          <span>
            {a.descripcion}
            {verAutor && !a.visible_cliente && <em>· solo equipo</em>}
          </span>
        </li>
      ))}
    </ul>
  );
}
