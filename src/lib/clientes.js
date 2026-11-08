// src/lib/clientes.js — constantes y formatos de clientes y proyectos (iguales que en el backend).
export const TIPOS_DOCUMENTO = { CC: "Cédula de ciudadanía", CE: "Cédula de extranjería", NIT: "NIT", PAS: "Pasaporte" };
export const ESTADOS_CLIENTE = { activo: "Activo", pausado: "Pausado", baja: "Baja" };
export const MODELOS_COBRO = { unico: "Precio único", hitos: "Por hitos", recurrente: "Recurrente", horas: "Bolsa de horas" };
export const PERIODICIDADES = { mensual: "Mensual", trimestral: "Trimestral", anual: "Anual" };
export const MONEDAS = ["COP", "USD"];
export const ESTADOS_PROYECTO = {
  propuesta: "Propuesta",
  en_curso: "En curso",
  pausado: "Pausado",
  entregado: "Entregado",
  mantenimiento: "Mantenimiento",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};
export const ESTADOS_HITO = { pendiente: "Pendiente", en_curso: "En curso", completado: "Completado" };
export const TIPOS_PROYECTO = ["Página web", "Aplicación web", "App móvil", "Software a medida", "Mantenimiento", "Otro"];

/** $ 4.800.000 (COP sin decimales) o US$ 1,200.00 */
export function dinero(valor, moneda = "COP") {
  if (valor === null || valor === undefined || valor === "") return "—";
  const n = Number(valor);
  if (moneda === "USD") return `US$ ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$ ${n.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}

/** 'YYYY-MM-DD' → '15 nov 2026' (sin desfase de zona horaria). */
export function fecha(iso) {
  if (!iso) return "—";
  const [a, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

/** Documento legible: CC 1.020.345.678 · NIT 901.234.567-1 */
export function documento(c) {
  if (!c?.numero_documento) return "";
  const num = /^\d+$/.test(c.numero_documento) ? Number(c.numero_documento).toLocaleString("es-CO") : c.numero_documento;
  return `${c.tipo_documento ?? ""} ${num}${c.dv ? `-${c.dv}` : ""}`.trim();
}

/** Resumen del valor de un proyecto según su modelo de cobro. */
export function valorProyecto(p) {
  if (p.modelo_cobro === "recurrente") {
    return p.importe_periodo != null ? `${dinero(p.importe_periodo, p.moneda)} / ${PERIODICIDADES[p.periodicidad]?.toLowerCase() ?? "periodo"}` : "—";
  }
  if (p.modelo_cobro === "horas") {
    return p.horas_contratadas ? `${p.horas_contratadas} h${p.precio_hora ? ` · ${dinero(p.precio_hora, p.moneda)}/h` : ""}` : dinero(p.valor_total, p.moneda);
  }
  return dinero(p.valor_total, p.moneda);
}

/** Errores de campo que devuelve la API ({ data: { errores } }). */
export const erroresDe = (err) => err?.data?.errores ?? {};
